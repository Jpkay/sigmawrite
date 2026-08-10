import { describe, expect, it } from "vitest";
import { validateVocabularyDefinition } from "./contract";

describe("Feynman vocabulary definition contract", () => {
  it("flags a circular definition", () => {
    const issues = validateVocabularyDefinition({ word: "migration", definitionFr: "Une migration de personnes vers une autre région.", examplesFr: ["Une famille part vivre en ville pour travailler.", "Un joueur quitte son pays pour rejoindre un club."] });
    expect(issues.map((issue) => issue.code)).toContain("circular_definition");
  });

  it("flags unfamiliar difficult words unless they are concretely explained", () => {
    const entry = { word: "biais", definitionFr: "Une inclination qui déforme le jugement.", examplesFr: ["Une application montre toujours le même avis.", "Un sondage interroge seulement un groupe."] };
    const unsupported = validateVocabularyDefinition(entry, { supportedVocabulary: ["une", "qui", "le"] });
    expect(unsupported).toContainEqual(expect.objectContaining({ code: "unfamiliar_definition_word", word: "inclination" }));
    const explained = validateVocabularyDefinition(entry, { supportedVocabulary: ["une", "qui", "le", "deforme", "jugement"], concretelyExplainedWords: ["inclination"] });
    expect(explained).toEqual([]);
  });

  it("requires two tangible examples", () => {
    expect(validateVocabularyDefinition({ word: "biais", definitionFr: "Une façon de penser qui cache une partie de la réalité.", examplesFr: ["Une application ne montre qu’un seul avis."] })).toContainEqual(expect.objectContaining({ code: "too_few_examples" }));
  });
});
