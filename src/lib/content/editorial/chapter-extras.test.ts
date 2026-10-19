import { describe, expect, it, vi } from "vitest";
import { authorOutputSchema } from "./prompts";
import { extrasRow, gateBonusScene, gateChapterExtras, gateComprehension } from "./chapter-extras";

const BODY = `Le vestiaire sentait le camphre et la boue sèche. {{HEROS}} compta les crampons alignés sous le banc : vingt-deux, pas un de plus.

Gaspard entra, son carnet sous le bras, et posa sur la table un ballon dont le cuir avait viré au gris. « Celui-là a joué la finale », dit-il sans sourire.

Le gardien, un grand intrépide aux genoux couronnés, siffla entre ses dents.`;

const QUESTION = {
  questionText: "Que pose Gaspard sur la table ?",
  questionType: "literal",
  choices: ["Un ballon au cuir gris", "Un sifflet en argent", "Une paire de crampons neufs"],
  correctAnswer: "Un ballon au cuir gris",
  explanation: "Le texte dit qu'il pose un ballon dont le cuir a viré au gris.",
};

const SCENE = "Pendant ce temps, Gaspard rangea son carnet dans la poche de sa veste. Il caressa la couture du vieux ballon, comme on salue un ami. Dehors, la pluie redoublait sur la tôle, et {{HEROS}} entendit les crampons claquer dans le couloir.";

describe("comprehension question gate (H.3)", () => {
  it("keeps a well-formed question whose answer the chapter states", () => {
    const { question, reasons } = gateComprehension(QUESTION, BODY);
    expect(reasons).toEqual([]);
    expect(question).toMatchObject({ question: QUESTION.questionText, correctIndex: 0, options: QUESTION.choices, type: "literal" });
  });

  it("rejects options that are not distinct, a missing answer and an answer the chapter never states", () => {
    expect(gateComprehension({ ...QUESTION, choices: ["Un ballon au cuir gris", "un ballon au cuir gris.", "Un sifflet"] }, BODY).reasons).toContain("options_not_distinct");
    expect(gateComprehension({ ...QUESTION, correctAnswer: "Une coupe dorée" }, BODY).reasons).toContain("answer_not_in_options");
    expect(gateComprehension({ ...QUESTION, choices: ["Une coupe dorée", "Un sifflet en argent", "Un maillot rayé"], correctAnswer: "Une coupe dorée" }, BODY).reasons).toContain("answer_not_in_chapter");
  });

  it("enforces length limits, the question mark and three options", () => {
    expect(gateComprehension({ ...QUESTION, questionText: "Quoi ?" }, BODY).reasons).toContain("question_length");
    expect(gateComprehension({ ...QUESTION, questionText: "Que pose Gaspard sur la table." }, BODY).reasons).toContain("question_mark");
    expect(gateComprehension({ ...QUESTION, choices: QUESTION.choices.slice(0, 2) }, BODY).reasons).toContain("three_options");
    expect(gateComprehension({ ...QUESTION, explanation: "x".repeat(300) }, BODY).reasons).toContain("explanation_length");
    expect(gateComprehension(null, BODY).question).toBeNull();
  });

  it("never lets the student's name or unsafe content through", () => {
    expect(gateComprehension({ ...QUESTION, explanation: "Zéphyrine l'a bien vu." }, BODY, { forbiddenNames: ["Zéphyrine"] }).reasons).toContain("student_name");
    expect(gateComprehension({ ...QUESTION, explanation: "Il boit du whisky." }, BODY).reasons).toContain("safety_lexicon");
  });
});

describe("bonus scene gate (H.3)", () => {
  it("keeps a short extra moment with valid hero markers and known names", () => {
    expect(gateBonusScene(SCENE, BODY, { allowedNames: ["Gaspard"] })).toEqual({ scene: SCENE, reasons: [] });
  });

  it("rejects new named characters, AI tells, broken markers, too short scenes and the student's name", () => {
    expect(gateBonusScene(SCENE.replace("Gaspard rangea", "Bertrand rangea"), BODY).reasons).toContain("new_names");
    expect(gateBonusScene(`${SCENE} Soudain, une lueur d'espoir traversa le vestiaire, au cœur de la nuit.`, BODY).reasons).toContain("ai_tells");
    expect(gateBonusScene(SCENE.replace("{{HEROS}}", "{{HERO}}"), BODY).reasons).toContain("markers");
    expect(gateBonusScene("Il pleuvait.", BODY).reasons).toContain("length");
    expect(gateBonusScene(SCENE.replace("{{HEROS}}", "Zéphyrine"), BODY, { forbiddenNames: ["Zéphyrine"] }).reasons).toContain("student_name");
    expect(gateBonusScene("", BODY).scene).toBeNull();
  });
});

describe("chapter extras", () => {
  it("moderates what passed and drops everything when moderation refuses or fails (fail closed)", async () => {
    const ok = await gateChapterExtras({ body: BODY, questions: [QUESTION], bonusScene: SCENE }, { moderate: async () => ({ allowed: true, categories: [] }) });
    expect(ok.comprehension?.correctIndex).toBe(0);
    expect(ok.bonusScene).toBe(SCENE);
    const moderate = vi.fn(async () => ({ allowed: false, categories: ["violence"] }));
    const refused = await gateChapterExtras({ body: BODY, questions: [QUESTION], bonusScene: SCENE }, { moderate });
    expect(refused).toMatchObject({ comprehension: null, bonusScene: null });
    expect(String(moderate.mock.calls[0])).not.toContain("{{HEROS}}");
    const failing = await gateChapterExtras({ body: BODY, questions: [QUESTION], bonusScene: SCENE }, { moderate: async () => { throw new Error("down"); } });
    expect(failing).toMatchObject({ comprehension: null, bonusScene: null, reasons: expect.arrayContaining(["moderation:error"]) });
    expect(extrasRow("c", failing)).toBeNull();
  });

  it("keeps the question when only the bonus scene fails", async () => {
    const extras = await gateChapterExtras({ body: BODY, questions: [QUESTION], bonusScene: "Trop court." });
    expect(extras.comprehension).not.toBeNull();
    expect(extras.bonusScene).toBeNull();
    expect(extrasRow("c", extras)).toMatchObject({ chapter_id: "c", bonus_scene: null, gate_reasons: expect.arrayContaining(["bonus:length"]) });
  });

  it("parses author output with the new fields and stays compatible with older outputs", () => {
    const parsed = authorOutputSchema.parse({ title: "T", body: BODY, questions: [QUESTION], bonusScene: SCENE });
    expect(parsed.questions[0].explanation).toBe(QUESTION.explanation);
    expect(parsed.bonusScene).toBe(SCENE);
    const old = authorOutputSchema.parse({ title: "T", body: BODY, questions: [{ ...QUESTION, explanation: undefined }] });
    expect(old).toMatchObject({ bonusScene: "", questions: [{ explanation: "" }] });
  });
});
