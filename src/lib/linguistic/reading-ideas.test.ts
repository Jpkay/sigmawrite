import { describe, expect, it, vi } from "vitest";
import { assessReadingIdeas, READING_RETRY_MESSAGE } from "./reading-ideas";
import { validateAnswer } from "./validator";
import type { ValidationSpec } from "./types";

const answer = "Moins de voitures permet de respirer un air moins pollué.";
const spec: ValidationSpec = { validatorType: "exact", correctAnswer: "La rue piétonne améliore la qualité de l’air.", acceptableAnswers: ["La pollution diminue grâce à la limitation des voitures."], assessment: { promptFr: "Lis le texte. Le dioxyde d’azote baisse. Interprète cette preuve." }, config: { readingRubric: { version: 1, requiredIdeas: ["Relie la limitation des voitures à une meilleure qualité de l’air."] } } };
const good = { uncertain: false, ideas: [{ index: 0, met: true, evidence: answer }], contradiction: { present: false, evidence: "", explanationFr: "" } };

describe("reading comprehension meaning assessment", () => {
  it("accepts unlisted wording via the shared validator with the authored context", async () => {
    const judge = vi.fn().mockResolvedValue(good);
    expect((await validateAnswer(answer, spec, { readingJudge: judge })).pass).toBe(true);
    expect(judge.mock.calls[0][0]).toMatchObject({ answer, prompt: spec.assessment!.promptFr, requiredIdeas: ["Relie la limitation des voitures à une meilleure qualité de l’air."] });
  });
  it("accepts listed answers offline and leaves grammar exact matching strict", async () => {
    const judge = vi.fn().mockRejectedValue(new Error("offline"));
    for (const text of [spec.correctAnswer!, ...spec.acceptableAnswers!]) expect((await validateAnswer(text, spec, { readingJudge: judge })).pass).toBe(true);
    expect((await validateAnswer(answer, { ...spec, config: {} }, { readingJudge: judge })).pass).toBe(false);
    expect(judge).not.toHaveBeenCalled();
  });
  it("gives the missing idea instead of demanding the model sentence", async () => {
    const result = await assessReadingIdeas("Le dioxyde baisse de 22 %.", spec, async () => ({ ...good, ideas: [{ index: 0, met: false, evidence: "" }] }));
    expect(result.pass).toBe(false);
    expect(result.reason).toBe("À préciser : Relie la limitation des voitures à une meilleure qualité de l’air.");
  });
  it("does not accept a contradiction even when all expected ideas are mentioned", async () => {
    const result = await assessReadingIdeas(answer + " Les voitures ne polluent jamais.", spec, async () => ({ ...good, contradiction: { present: true, evidence: "Les voitures ne polluent jamais.", explanationFr: "Le texte relie la limitation des voitures à une baisse de pollution." } }));
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("Les voitures ne polluent jamais.");
  });
  it("explains a changed measurement before a missing rewording criterion", async () => {
    const text = "La facture d'électricité de l'école a diminué de 38% en un an";
    const explanationFr = "Le texte mesure la quantité d’électricité achetée, pas le montant de la facture.";
    const result = await assessReadingIdeas(text, spec, async () => ({ ...good, ideas: [{ index: 0, met: false, evidence: "" }], contradiction: { present: true, evidence: "La facture d'électricité", explanationFr } }));
    expect(result.pass).toBe(false);
    expect(result.reason).toContain(explanationFr);
    expect(result.reason).not.toContain("À préciser");
  });
  it.each([
    { ...good, uncertain: true },
    { ...good, contradiction: { present: true, evidence: answer, explanationFr: "" } },
    { ...good, ideas: [] },
    { ...good, ideas: [{ index: 2, met: true, evidence: answer }] },
    { ...good, ideas: [{ index: 0, met: true, evidence: "invented quote" }] },
    { ...good, contradiction: { present: true, evidence: "invented quote", explanationFr: "Une explication." } },
    { pass: true },
  ])("does not convert malformed or uncertain judgments into a recorded grade (%#)", async (judgment) => {
    await expect(assessReadingIdeas(answer, spec, async () => judgment)).rejects.toThrow(READING_RETRY_MESSAGE);
  });
  it("requires every idea exactly once and fails safely on provider/configuration errors", async () => {
    const twoIdeas = { ...spec, config: { readingRubric: { version: 1, requiredIdeas: ["Première idée requise.", "Deuxième idée requise."] } } };
    await expect(assessReadingIdeas(answer, twoIdeas, async () => ({ ...good, ideas: [good.ideas[0], good.ideas[0]] }))).rejects.toThrow(READING_RETRY_MESSAGE);
    await expect(assessReadingIdeas(answer, spec, async () => { throw new Error("timeout"); })).rejects.toThrow(READING_RETRY_MESSAGE);
    await expect(assessReadingIdeas(answer, { ...spec, assessment: undefined })).rejects.toThrow(READING_RETRY_MESSAGE);
  });
});
