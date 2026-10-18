import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn((error: unknown) => { throw error; }) }));
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeDb, type FakeSense } from "./fake-db.test-helper";
import { captureDictationEvidence, captureFreeWritingEvidence, captureReadingExposure } from "./capture";
import { getDueWordCards, introduceWord, recordWordReviewAttempt } from "./server";

const STUDENT = "10000000-0000-4000-8000-000000000001";
const SENSES: FakeSense[] = [
  { id: "s-intrepide", lemmaId: "l-intrepide", itemId: "i-intrepide", word: "intrépide", definition: "Qui n’a peur de rien.", forms: ["intrépide", "intrépides"] },
  { id: "s-courir", lemmaId: "l-courir", itemId: "i-courir", word: "courir", definition: "Aller très vite à pied.", forms: ["courir", "courait", "court"] },
  { id: "s-bureau-meuble", lemmaId: "l-bureau", itemId: "i-bureau", word: "bureau", definition: "Table de travail.", forms: ["bureau"] },
  { id: "s-bureau-lieu", lemmaId: "l-bureau", itemId: "i-bureau", word: "bureau", definition: "Pièce où l’on travaille.", forms: ["bureau"] },
];
const asDb = (db: unknown) => db as SupabaseClient;

describe("A.1 reading never raises mastery", () => {
  it("a student who reads the word 10 times still has mastery 0", async () => {
    const { db, tables } = createFakeDb(SENSES);
    tables.text_vocabulary.push({ text_version_id: "tv1", vocabulary_item_id: "i-intrepide", lexical_sense_id: null });
    const paragraph = Array.from({ length: 10 }, () => "Le capitaine intrépide avance.").join(" ");
    for (let session = 0; session < 10; session++) {
      await captureReadingExposure(asDb(db), { studentId: STUDENT, sessionId: `r${session}`, textVersionId: "tv1", paragraphs: [paragraph], interest: "manga", at: `2026-10-0${(session % 9) + 1}T10:00:00Z` });
    }
    const row = tables.student_word_mastery.find((entry) => entry.vocabulary_item_id === "i-intrepide")!;
    expect(row.exposures).toBe(10);
    expect(row.mastery).toBe(0);
    expect(row.word_status).toBe("decouvert");
    expect(row.to_introduce).toBe(true);
    expect(row.first_seen_sentence).toBe("Le capitaine intrépide avance.");
    expect(tables.vocabulary_learning_evidence.every((entry) => entry.evidence_kind === "exposure")).toBe(true);
    expect(tables.learning_retrieval_schedules).toHaveLength(0); // C.2: exposure creates no card
  });

  it("matches by lemma: 'courait' counts for 'courir' once the student tracks it", async () => {
    const { db, tables } = createFakeDb(SENSES);
    tables.student_word_mastery.push({ student_id: STUDENT, vocabulary_item_id: "i-courir", mastery: 0, exposures: 0, word_status: "decouvert" });
    await captureReadingExposure(asDb(db), { studentId: STUDENT, sessionId: "r1", textVersionId: "none", paragraphs: ["Il courait dans la cour."], interest: null, at: "2026-10-05T10:00:00Z" });
    expect(tables.student_word_mastery.find((entry) => entry.vocabulary_item_id === "i-courir")!.exposures).toBe(1);
  });

  it("keeps the two senses of 'bureau' apart unless the text pins one", async () => {
    const { db, tables } = createFakeDb(SENSES);
    tables.text_vocabulary.push({ text_version_id: "tv2", vocabulary_item_id: "i-bureau", lexical_sense_id: "s-bureau-lieu" });
    await captureReadingExposure(asDb(db), { studentId: STUDENT, sessionId: "r2", textVersionId: "tv2", paragraphs: ["Papa est au bureau."], interest: null, at: "2026-10-05T10:00:00Z" });
    expect(tables.vocabulary_learning_evidence[0].lexical_sense_id).toBe("s-bureau-lieu");
  });
});

describe("A.4 dictée evidence", () => {
  it("a word misspelled in a dictée is recorded as correct_spelling: false", async () => {
    const { db, tables } = createFakeDb(SENSES);
    await captureDictationEvidence(asDb(db), { studentId: STUDENT, attemptId: "d1", segments: ["Le chevalier intrépide courait vers le château."], answers: ["Le chevalier intrépid courait vers le chateau."], at: "2026-10-05T10:00:00Z" });
    const intrepide = tables.vocabulary_learning_evidence.find((entry) => entry.vocabulary_item_id === "i-intrepide")!;
    expect(intrepide).toMatchObject({ evidence_kind: "correct_spelling", successful: false, facet: "spelling", source: "dictation" });
    const courir = tables.vocabulary_learning_evidence.find((entry) => entry.vocabulary_item_id === "i-courir")!;
    expect(courir).toMatchObject({ evidence_kind: "correct_spelling", successful: true });
  });

  it("an accent slip is stored as not correct, accent only", async () => {
    const { db, tables } = createFakeDb(SENSES);
    await captureDictationEvidence(asDb(db), { studentId: STUDENT, attemptId: "d2", segments: ["Il est intrépide."], answers: ["Il est intrepide."], at: "2026-10-05T10:00:00Z" });
    expect(tables.vocabulary_learning_evidence[0]).toMatchObject({ successful: false, accent_only: true });
  });

  it("is idempotent per attempt", async () => {
    const { db, tables } = createFakeDb(SENSES);
    const input = { studentId: STUDENT, attemptId: "d3", segments: ["Il est intrépide."], answers: ["Il est intrépide."], at: "2026-10-05T10:00:00Z" };
    await captureDictationEvidence(asDb(db), input);
    await captureDictationEvidence(asDb(db), input);
    expect(tables.vocabulary_learning_evidence).toHaveLength(1);
  });
});

describe("free writing", () => {
  it("records correct uses and near-miss misspellings of tracked words only", async () => {
    const { db, tables } = createFakeDb(SENSES);
    tables.student_word_mastery.push({ student_id: STUDENT, vocabulary_item_id: "i-intrepide", mastery: 0, exposures: 1, word_status: "en_route" });
    await captureFreeWritingEvidence(asDb(db), { studentId: STUDENT, text: "Mon héros est intrépid et il court.", source: "writing", occurrenceKey: "p1", at: "2026-10-05T10:00:00Z" });
    expect(tables.vocabulary_learning_evidence).toHaveLength(1);
    expect(tables.vocabulary_learning_evidence[0]).toMatchObject({ vocabulary_item_id: "i-intrepide", evidence_kind: "contextual_use", successful: false });
  });
});

describe("Phase D interface", () => {
  it("introduces a word with two cards due tomorrow, then reviews with the first-attempt-of-the-day rule", async () => {
    const { db, tables } = createFakeDb(SENSES);
    const cards = await introduceWord(asDb(db), { studentId: STUDENT, senseId: "s-intrepide", at: "2026-10-05T15:00:00Z", context: { sentence: "Le capitaine intrépide avance.", interest: "manga" } });
    expect(cards.map((card) => card.facet).sort()).toEqual(["meaning", "spelling"]);
    expect(cards.every((card) => card.dueAt.startsWith("2026-10-06"))).toBe(true);

    // Same day as the introduction: logged, FSRS untouched.
    const sameDay = await recordWordReviewAttempt(asDb(db), { studentId: STUDENT, senseId: "s-intrepide", format: "hear_and_type", correct: true, occurrenceKey: "rv1", at: "2026-10-05T15:05:00Z" });
    expect(sameDay.outcomes[0]).toMatchObject({ facet: "spelling", reviewed: true, countedForFsrs: false });

    const nextDay = await recordWordReviewAttempt(asDb(db), { studentId: STUDENT, senseId: "s-intrepide", format: "type_from_definition", correct: true, occurrenceKey: "rv2", at: "2026-10-06T16:00:00Z" });
    expect(nextDay.outcomes.map((outcome) => [outcome.facet, outcome.countedForFsrs, outcome.rating])).toEqual([["spelling", true, 3], ["meaning", true, 3]]);
    // Retry the same day: no second FSRS update.
    const retry = await recordWordReviewAttempt(asDb(db), { studentId: STUDENT, senseId: "s-intrepide", format: "hear_and_type", correct: false, occurrenceKey: "rv3", at: "2026-10-06T16:02:00Z" });
    expect(retry.outcomes[0].countedForFsrs).toBe(false);
    expect(tables.word_review_log).toHaveLength(4);
    expect(tables.word_review_log.filter((row) => row.counts_for_fsrs)).toHaveLength(2);
    const spelling = tables.learning_retrieval_schedules.find((card) => card.facet === "spelling")!;
    expect((spelling.fsrs_state as { stability: number }).stability).toBeGreaterThan(0);
    expect(nextDay.status).toBe("en_route");
    // Hint caps the grade (B.4).
    const hinted = await recordWordReviewAttempt(asDb(db), { studentId: STUDENT, senseId: "s-intrepide", format: "hear_and_type", correct: true, hintLevel: 2, occurrenceKey: "rv4", at: "2026-10-09T16:00:00Z" });
    expect(hinted.outcomes[0].rating).toBe(2);
  });

  it("plans today's reviews and words to introduce", async () => {
    const { db, tables } = createFakeDb(SENSES);
    await captureReadingExposure(asDb(db), { studentId: STUDENT, sessionId: "r1", textVersionId: "tv1", paragraphs: ["Le capitaine intrépide avance."], interest: "manga", at: "2026-10-05T10:00:00Z" });
    tables.text_vocabulary.push({ text_version_id: "tv3", vocabulary_item_id: "i-intrepide", lexical_sense_id: null });
    await captureReadingExposure(asDb(db), { studentId: STUDENT, sessionId: "r3", textVersionId: "tv3", paragraphs: ["Le capitaine intrépide avance."], interest: "manga", at: "2026-10-05T10:00:00Z" });
    await introduceWord(asDb(db), { studentId: STUDENT, senseId: "s-courir", at: "2026-10-01T15:00:00Z" });
    const plan = await getDueWordCards(asDb(db), STUDENT, { now: "2026-10-05T16:00:00Z" });
    expect(plan.reviews.map((review) => review.facet).sort()).toEqual(["meaning", "spelling"]);
    expect(plan.reviews[0].word).toBe("courir");
    expect(plan.toIntroduce.map((word) => word.senseId)).toEqual(["s-intrepide"]);
    expect(plan.toIntroduce[0].firstSeenSentence).toBe("Le capitaine intrépide avance.");
  });
});
