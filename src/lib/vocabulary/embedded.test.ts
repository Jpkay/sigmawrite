import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn((error: unknown) => { throw error; }) }));
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeDb, type FakeSense } from "./fake-db.test-helper";
import { captureDictationEvidence, captureReadingVocabularyAnswers, captureTypedAnswerEvidence } from "./capture";
import { getDueWordCards, introduceWord } from "./server";

const STUDENT = "10000000-0000-4000-8000-000000000002";
const SENSES: FakeSense[] = [
  { id: "s-intrepide", lemmaId: "l-intrepide", itemId: "i-intrepide", word: "intrépide", definition: "Qui n’a peur de rien.", forms: ["intrépide", "intrépides"] },
  { id: "s-biais", lemmaId: "l-biais", itemId: "i-biais", word: "biais", definition: "Ce qui déforme le jugement.", forms: ["biais"] },
];
const asDb = (db: unknown) => db as SupabaseClient;

async function withDueCards() {
  const fake = createFakeDb(SENSES);
  await introduceWord(asDb(fake.db), { studentId: STUDENT, senseId: "s-intrepide", at: "2026-10-01T15:00:00Z" });
  await introduceWord(asDb(fake.db), { studentId: STUDENT, senseId: "s-biais", at: "2026-10-01T15:00:00Z" });
  return fake;
}

describe("D.6 reviews woven into other activities", () => {
  it("a due word spelled correctly in today's dictée counts as its review (embedded) and leaves the review queue", async () => {
    const { db, tables } = await withDueCards();
    const before = await getDueWordCards(asDb(db), STUDENT, { now: "2026-10-05T16:00:00Z" });
    expect(before.reviews.filter((review) => review.senseId === "s-intrepide").map((review) => review.facet).sort()).toEqual(["meaning", "spelling"]);
    await captureDictationEvidence(asDb(db), { studentId: STUDENT, attemptId: "d1", segments: ["Le chevalier intrépide avance."], answers: ["Le chevalier intrépide avance."], at: "2026-10-05T16:05:00Z" });
    const log = tables.word_review_log.find((row) => row.lexical_sense_id === "s-intrepide")!;
    expect(log).toMatchObject({ source: "embedded", counts_for_fsrs: true, facet: "spelling" });
    const after = await getDueWordCards(asDb(db), STUDENT, { now: "2026-10-05T16:10:00Z" });
    expect(after.reviews.filter((review) => review.senseId === "s-intrepide").map((review) => review.facet)).toEqual(["meaning"]);
  });

  it("a misspelling in a dictée keeps its dictée source (not embedded)", async () => {
    const { db, tables } = await withDueCards();
    await captureDictationEvidence(asDb(db), { studentId: STUDENT, attemptId: "d2", segments: ["Il est intrépide."], answers: ["Il est intrepide."], at: "2026-10-05T16:05:00Z" });
    expect(tables.word_review_log[0]).toMatchObject({ source: "dictation" });
  });

  it("a word that is not due yet stays a normal dictée observation", async () => {
    const { db, tables } = await withDueCards();
    await captureDictationEvidence(asDb(db), { studentId: STUDENT, attemptId: "d3", segments: ["Il est intrépide."], answers: ["Il est intrépide."], at: "2026-10-01T18:00:00Z" });
    expect(tables.word_review_log[0]).toMatchObject({ source: "dictation" });
  });

  it("a due word answered correctly in the passage's vocabulary question reviews its meaning card (embedded)", async () => {
    const { db, tables } = await withDueCards();
    await captureReadingVocabularyAnswers(asDb(db), {
      studentId: STUDENT, sessionId: "r1", at: "2026-10-05T16:05:00Z",
      questions: [
        { id: "q3", type: "vocabulary_in_context", prompt: "Dans le texte, un « biais » est…", correctIndex: 1 },
        { id: "q4", type: "vocabulary_in_context", prompt: "Dans le texte, « intrépide » veut dire…", correctIndex: 0 },
      ],
      answers: { q3: 1, q4: 2 },
    });
    expect(tables.word_review_log).toHaveLength(1);
    expect(tables.word_review_log[0]).toMatchObject({ source: "embedded", facet: "meaning", lexical_sense_id: "s-biais", activity_format: "pick_definition" });
  });

  it("story chapters mark due words as embedded", async () => {
    const { db, tables } = await withDueCards();
    await captureTypedAnswerEvidence(asDb(db), { studentId: STUDENT, expected: "Le pirate intrépide", produced: "Le pirate intrépide", source: "story", occurrenceKey: "story:1", at: "2026-10-05T16:05:00Z" });
    expect(tables.word_review_log[0]).toMatchObject({ source: "embedded" });
  });
});
