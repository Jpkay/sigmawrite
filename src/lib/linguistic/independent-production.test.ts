import { describe, expect, it } from "vitest";
import { detectIndependentProduction, independentProductionPrompt, supportsIndependentProductionNode } from "./independent-production";

describe("independent production evidence", () => {
  it("requires two distinct target forms", () => {
    expect(detectIndependentProduction("employer_imparfait_en_contexte", "Quand j’étais petit, nous parlions souvent.").demonstrated).toBe(true);
    expect(detectIndependentProduction("employer_imparfait_en_contexte", "Quand j’étais petit.").demonstrated).toBe(false);
  });

  it("recognizes compound and recent-past constructions", () => {
    expect(detectIndependentProduction("employer_passe_compose_en_contexte", "Elle est allée au marché et nous avons fini le travail.").demonstrated).toBe(true);
    expect(detectIndependentProduction("employer_passe_recent_en_contexte", "Je viens de parler et ils viennent de finir.").demonstrated).toBe(true);
  });

  it("recognizes contextual object-pronoun diversity", () => {
    expect(detectIndependentProduction("employer_pronoms_complements_en_contexte", "Il lui a parlé, puis il leur a dit la vérité.").demonstrated).toBe(true);
    expect(detectIndependentProduction("employer_pronoms_complements_en_contexte", "Il lui a parlé.").demonstrated).toBe(false);
  });

  it("fails closed for nodes without a local production detector", () => {
    expect(detectIndependentProduction("unknown", "Un texte correct.")).toEqual({ demonstrated: false, matchedForms: [] });
  });

  it("only schedules supported independent nodes with a clear prompt", () => {
    expect(supportsIndependentProductionNode("employer_futur_simple_en_contexte")).toBe(true);
    expect(supportsIndependentProductionNode("unknown")).toBe(false);
    expect(independentProductionPrompt("employer_futur_simple_en_contexte", "Employer le futur simple en contexte")).toContain("50 à 100 mots");
  });
});
