import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { CONJUGATION_TEACHING, CONJUGATION_TEACHING_CASES } from "./conjugation-teaching";
import { adaptV3ForAssessment } from "./v3-adapter";
import { applyFacetTargets } from "./facet-adapter";
import { buildV3Facets } from "./facets";
import { validateTeachingTargets } from "./teaching-content";
import { teachingMaterialKeys } from "./material-annotations";

it("maps every draft to its exact present target and anchors exposure without publishing", () => {
  const artifact = JSON.parse(readFileSync("generated/french-taxonomy-v3.json", "utf8"));
  const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json", "utf8"));
  const assessment = applyFacetTargets(adaptV3ForAssessment({ artifact, bank }), buildV3Facets(artifact.taxonomy), bank).assessment;
  expect(() => validateTeachingTargets(assessment, CONJUGATION_TEACHING)).not.toThrow();
  expect(new Set(CONJUGATION_TEACHING.map(lesson => lesson.facetKey)).size).toBe(18);
  for (const lesson of CONJUGATION_TEACHING) {
    expect(lesson.status).toBe("draft_requires_review");
    expect(lesson.mode).toBe("production");
    expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(lesson.practice.length);
  }
});
it("checks all guided forms including irregular subjects and spelling contrasts", () => {
  const expected: Record<string, string[]> = {
    "pattern:regular_er": ["dessine", "colles", "porte", "écoutons", "visitez", "filment"],
    "pattern:regular_ir": ["nourris", "remplis", "ralentit", "réfléchissons", "obéissez", "applaudissent"],
    "pattern:spelling_ger": ["nage", "manges", "voyage", "bougeons", "mélangeons", "partageons", "rangez", "chargent"],
    "pattern:spelling_cer": ["avance", "lances", "commence", "plaçons", "annonçons", "remplaçons", "effacez", "tracent"],
    "verb:aller": ["vais", "vas", "va", "allons", "allez", "vont"],
    "verb:être": ["suis", "es", "est", "sommes", "êtes", "sont"],
    "verb:avoir": ["ai", "as", "a", "avons", "avez", "ont"],
    "verb:prendre": ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
    "verb:venir": ["viens", "viens", "vient", "venons", "venez", "viennent"],
    "verb:partir": ["pars", "pars", "part", "partons", "partez", "partent"],
    "verb:sortir": ["sors", "sors", "sort", "sortons", "sortez", "sortent"],
    "verb:dire": ["dis", "dis", "dit", "disons", "dites", "disent"],
    "verb:voir": ["vois", "vois", "voit", "voyons", "voyez", "voient"],
    "verb:pouvoir": ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
    "verb:vouloir": ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
    "verb:savoir": ["sais", "sais", "sait", "savons", "savez", "savent"],
    "verb:devoir": ["dois", "dois", "doit", "devons", "devez", "doivent"],
    "verb:faire": ["fais", "fais", "fait", "faisons", "faites", "font"],
  };
  for (const draft of CONJUGATION_TEACHING_CASES) {
    const lesson = CONJUGATION_TEACHING.find(lesson => lesson.facetKey?.endsWith(`::${draft.key}`))!;
    expect(lesson.practice.map(exercise => exercise.answerFr), draft.key).toEqual(expected[draft.key]);
    expect(new Set(draft.cases.map(item => item.person)).size).toBe(6);
    if (draft.key.includes("spelling_")) expect(new Set(draft.cases.filter(item => item.person === "1p").map(item => item.verb)).size).toBe(3);
    for (const exercise of lesson.practice) {
      expect(exercise.promptFr.match(/___/g)).toHaveLength(1);
      expect(exercise.explanationFr).toContain(exercise.answerFr);
    }
  }
});
