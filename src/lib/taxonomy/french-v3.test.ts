import { describe, expect, it } from "vitest";
import { FRENCH_TAXONOMY_V3_CANDIDATE, FRENCH_TAXONOMY_V3_PRODUCTIVE_ROOTS } from "./french-v3";
import { validateInstructionalProgression, validateTaxonomy } from "./validate";

describe("immutable French taxonomy v3", () => {
  it("is structurally valid and has no instructional progression gaps", () => {
    expect(FRENCH_TAXONOMY_V3_CANDIDATE.release).toEqual({ key: "french-taxonomy-v3", version: "3.0.0", ontologyVersion: "1.0.0" });
    expect(validateTaxonomy(FRENCH_TAXONOMY_V3_CANDIDATE).valid).toBe(true);
    expect(validateInstructionalProgression(FRENCH_TAXONOMY_V3_CANDIDATE, { productiveRootKeys: FRENCH_TAXONOMY_V3_PRODUCTIVE_ROOTS })).toEqual([]);
  });

  it("models every pronoun stage as its own competency", () => {
    const keys = new Set(FRENCH_TAXONOMY_V3_CANDIDATE.nodes.map((node) => node.key));
    for (const key of ["identifier_complement_direct", "produire_pronom_cod", "produire_pronom_coi_personne", "distinguer_pronom_cod_coi", "produire_pronoms_y_en", "placer_pronom_complement", "accorder_participe_cod_antepose", "ordonner_doubles_pronoms", "employer_pronoms_complements_en_contexte"]) expect(keys.has(key)).toBe(true);
  });

  it("gives every tense a complete path to independent use", () => {
    const edges = new Set(FRENCH_TAXONOMY_V3_CANDIDATE.edges.filter((edge) => edge.type === "prerequisite").map((edge) => `${edge.source}->${edge.target}`));
    for (const [recognize, controlled, contextual, independent] of [
      ["reconnaitre_present_indicatif", "produire_present_indicatif", "interpreter_usages_present", "employer_present_indicatif_en_contexte"],
      ["reconnaitre_futur_proche", "produire_futur_proche", "interpreter_futur_proche", "employer_futur_proche_en_contexte"],
      ["reconnaitre_passe_recent", "produire_passe_recent", "interpreter_passe_recent", "employer_passe_recent_en_contexte"],
      ["reconnaitre_passe_compose", "produire_passe_compose", "interpreter_passe_compose", "employer_passe_compose_en_contexte"],
      ["reconnaitre_imparfait", "produire_imparfait", "interpreter_imparfait", "employer_imparfait_en_contexte"],
      ["reconnaitre_passe_simple", "produire_passe_simple", "interpreter_passe_simple", "employer_passe_simple_en_contexte"],
      ["reconnaitre_futur_simple", "produire_futur_simple", "interpreter_futur_simple", "employer_futur_simple_en_contexte"],
      ["reconnaitre_plus_que_parfait", "produire_plus_que_parfait", "interpreter_anteriorite_passee", "employer_plus_que_parfait_en_contexte"],
      ["reconnaitre_conditionnel_present", "produire_conditionnel_present", "interpreter_conditionnel_present", "employer_conditionnel_present_en_contexte"],
      ["reconnaitre_subjonctif_present", "produire_subjonctif_present_frequent", "interpreter_declencheur_subjonctif", "employer_subjonctif_present_en_contexte"],
      ["reconnaitre_imperatif", "produire_imperatif", "interpreter_valeur_imperatif", "employer_imperatif_en_contexte"],
    ]) {
      expect(edges.has(`${recognize}->${controlled}`)).toBe(true);
      expect(edges.has(`${controlled}->${contextual}`)).toBe(true);
      expect(edges.has(`${contextual}->${independent}`)).toBe(true);
    }
  });
});
