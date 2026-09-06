import { describe, expect, it } from "vitest";
import { buildSpeechPlan, guardLiaisons, planToText, renderForSpeech, speakableFullText, speakableSegment } from "./speech-text";

describe("speakableSegment", () => {
  it("announces punctuation the way a teacher dictates", () => {
    expect(speakableSegment("L’eau est froide, mais personne ne se plaint.")).toBe("L’eau est froide, virgule, mais personne ne se plaint, point.");
    expect(speakableSegment("Où vas-tu ?")).toBe("Où vas-tu, point d’interrogation,");
    expect(speakableSegment("Il dit : « Viens ! »")).toBe("Il dit, deux-points, ouvrez les guillemets, Viens, point d’exclamation, fermez les guillemets,");
  });
  it("keeps the whole-text listening natural", () => {
    expect(speakableFullText(["Un.", "Deux, trois."])).toBe("Un. Deux, trois.");
  });
});

describe("guardLiaisons", () => {
  it("keeps mandatory liaisons after contracted clitics and prenominal plural adjectives", () => {
    expect(guardLiaisons("Ils disent qu’ils ont vu les grands enfants et cet homme.")).toBe("Ils disent qu’ils ont vu les grands enfants, et cet homme.");
    expect(guardLiaisons("Elle n’est pas encore là.")).toBe("Elle n’est pas, encore là.");
  });
  it("blocks the liaison before an h-aspiré word even after a determiner", () => {
    expect(guardLiaisons("Les haricots et les héros sont hauts.")).toBe("Les, haricots, et les, héros sont, hauts.");
    expect(guardLiaisons("Les hommes arrivent.")).toBe("Les hommes, arrivent.");
  });
  it("leaves words that already end a clause or carry a pause tag alone", () => {
    expect(guardLiaisons("Chacun, a compris. [pause:0.5s] Alors")).toBe("Chacun, a compris. [pause:0.5s] Alors");
  });
});

describe("renderForSpeech", () => {
  it("blocks optional liaisons with a comma but keeps mandatory ones", () => {
    const out = renderForSpeech("Chacun a écouté et les élèves avaient compris.");
    expect(out).toContain("Chacun, a écouté");
    expect(out).toContain("les élèves, avaient compris");
    expect(out).not.toContain("les, élèves");
  });
  it("pauses around announced punctuation", () => {
    const out = renderForSpeech(speakableSegment("L’eau est froide, mais personne ne se plaint."));
    expect(out).toContain("froide [pause:0.5s] virgule [pause:0.3s] mais");
    expect(out.endsWith("plaint [pause:0.5s] point [pause:0.3s].")).toBe(true);
  });
});

describe("buildSpeechPlan", () => {
  it("frames each punctuation word with silences and spells it in phonemes", () => {
    const plan = buildSpeechPlan(speakableSegment("L’eau est froide, mais personne ne se plaint.", { final: true }));
    expect(plan.map((p) => p.kind)).toEqual(["text", "silence", "phonemes", "silence", "text", "silence", "phonemes", "silence", "text", "silence"]);
    expect(plan[0]).toEqual({ kind: "text", text: "L’eau est froide" });
    expect(plan[1]).toEqual({ kind: "silence", seconds: 0.5 });
    expect(plan[2]).toMatchObject({ kind: "phonemes", text: "virgule" });
    expect(plan[6]).toMatchObject({ kind: "phonemes", text: "point" });
    expect(plan[7]).toEqual({ kind: "silence", seconds: 0.35 });
    expect(plan[8]).toEqual({ kind: "text", text: "Point final. La dictée est terminée." });
  });
  it("keeps the liaison guard inside text chunks and degrades to text", () => {
    const plan = buildSpeechPlan(speakableSegment("Chacun a écouté, et les élèves avaient compris."));
    expect(plan[0]).toEqual({ kind: "text", text: "Chacun, a écouté" });
    expect(planToText(plan)).toBe("Chacun, a écouté… virgule, et les élèves, avaient compris… point,");
  });
});
