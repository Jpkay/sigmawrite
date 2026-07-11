import { describe, expect, it } from "vitest";
import { validateTaxonomy } from "../validate";
import {
  CONJUGATION_ASSESSMENT_TEMPLATES,
  CONJUGATION_FOUNDATION_CANDIDATE,
  CONJUGATION_FOUNDATION_NODES,
  CONJUGATION_MISCONCEPTIONS,
} from "./conjugation-foundation";

describe("French conjugation foundation v1", () => {
  it("is structurally valid and evidence-bearing", () => {
    const result = validateTaxonomy(CONJUGATION_FOUNDATION_CANDIDATE);
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(CONJUGATION_FOUNDATION_NODES.length).toBeGreaterThanOrEqual(45);
    expect(CONJUGATION_FOUNDATION_NODES.every((node) => node.evidence.length > 0)).toBe(true);
    expect(CONJUGATION_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "native_grade"))).toBe(true);
    expect(CONJUGATION_FOUNDATION_NODES.every((node) => node.mappings.some((mapping) => mapping.framework === "cefr"))).toBe(true);
  });

  it("represents the complete initial tense set", () => {
    const keys = new Set(CONJUGATION_FOUNDATION_NODES.map((node) => node.key));
    for (const key of [
      "reconnaitre_present_indicatif", "reconnaitre_futur_proche", "reconnaitre_passe_recent",
      "reconnaitre_passe_compose", "reconnaitre_imparfait", "contraster_pc_imparfait",
      "reconnaitre_passe_simple", "reconnaitre_futur_simple", "reconnaitre_plus_que_parfait",
      "reconnaitre_conditionnel_present", "reconnaitre_subjonctif_present", "reconnaitre_imperatif",
      "distinguer_infinitif_participe", "interpreter_sequence_temporelle",
    ]) expect(keys.has(key), key).toBe(true);
  });

  it("separates form, meaning, and connected discourse evidence", () => {
    const keys = new Set(CONJUGATION_FOUNDATION_NODES.map((node) => node.key));
    expect(keys.has("reconnaitre_imparfait")).toBe(true);
    expect(keys.has("produire_imparfait")).toBe(true);
    expect(keys.has("interpreter_imparfait")).toBe(true);
    expect(keys.has("contraster_pc_imparfait")).toBe(true);
    expect(keys.has("produire_contraste_pc_imparfait")).toBe(true);
    expect(keys.has("produire_sequence_temporelle")).toBe(true);
  });

  it("provides misconception links and varied assessment templates", () => {
    expect(CONJUGATION_MISCONCEPTIONS.length).toBeGreaterThanOrEqual(7);
    expect(new Set(CONJUGATION_ASSESSMENT_TEMPLATES.map((template) => template.expectation))).toEqual(
      new Set(["receptive", "controlled_production", "independent_production"]),
    );
  });
});
