import { describe, expect, it } from "vitest";
import { buildHintLadder } from "./hints";

const base = {
  nodeLabel: "Passé composé avec avoir",
  nodeDescription: "Former le passé composé des verbes qui se conjuguent avec avoir.",
  validatorType: "exact",
  validatorConfig: null,
  choiceCount: 0,
};

describe("buildHintLadder", () => {
  it("always returns an orientation prompt then a clue", () => {
    const hints = buildHintLadder(base);
    expect(hints).toHaveLength(2);
    expect(hints[0]).toContain("Passé composé avec avoir");
    expect(hints[0]).toContain(base.nodeDescription);
  });

  it("conjugator items get a tense/person decomposition clue", () => {
    const hints = buildHintLadder({
      ...base,
      validatorType: "conjugator",
      validatorConfig: { verb: "finir", tense: "imparfait", person: "1p" },
    });
    expect(hints[1]).toContain("« finir »");
    expect(hints[1]).toContain("imparfait");
    expect(hints[1]).toContain("« nous »");
    expect(hints[1]).toContain("nous » au présent");
  });

  it("new tenses have dedicated tips", () => {
    const futur = buildHintLadder({
      ...base,
      validatorType: "conjugator",
      validatorConfig: { verb: "parler", tense: "futur_simple", person: "1s" },
    });
    expect(futur[1]).toContain("futur simple");
    const imperatif = buildHintLadder({
      ...base,
      validatorType: "conjugator",
      validatorConfig: { verb: "aller", tense: "imperatif_present", person: "2s" },
    });
    expect(imperatif[1]).toContain("sans « s » final");
  });

  it("MCQ items get an elimination strategy", () => {
    const hints = buildHintLadder({ ...base, choiceCount: 3 });
    expect(hints[1]).toContain("Élimine");
  });

  it("never contains an actual conjugated answer", () => {
    const hints = buildHintLadder({
      ...base,
      validatorType: "conjugator",
      validatorConfig: { verb: "finir", tense: "imparfait", person: "1p" },
    });
    expect(hints.join(" ")).not.toContain("finissions");
  });

  it("handles a missing description", () => {
    const hints = buildHintLadder({ ...base, nodeDescription: null });
    expect(hints[0]).toContain("Relis la consigne");
  });
});
