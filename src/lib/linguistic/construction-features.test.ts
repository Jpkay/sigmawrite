import { describe, expect, it } from "vitest";
import { analyzeConstructions, constructionCount } from "./construction-features";

const fixtures = [
  {
    text: "Bien qu'il soit fatigué, Malik continue parce qu'il veut terminer. Il ne renonce jamais.",
    expected: ["construction_subordonnee_circonstancielle", "construction_negation_complexe", "relation_cause", "relation_concession"],
  },
  {
    text: "Amina lit le livre qui lui a été conseillé. Ensuite, elle le range, puis elle explique que l'histoire est utile.",
    expected: ["construction_subordonnee_relative", "construction_pronom_objet", "construction_voix_passive", "relation_chronologie", "construction_subordonnee_completive"],
  },
  {
    text: "Le projet demande une organisation précise. Par exemple, chacun prépare une tâche; de plus, le groupe vérifie la réalisation.",
    expected: ["construction_nominalisation", "relation_exemple_reformulation", "relation_addition"],
  },
];

describe("deterministic French construction features", () => {
  it.each(fixtures)("detects conservatively annotated constructions", ({ text, expected }) => {
    const keys = analyzeConstructions(text).features.map((feature) => feature.key);
    for (const key of expected) expect(keys, key).toContain(key);
  });

  it("returns explainable counts and bounded complexity", () => {
    const analysis = analyzeConstructions("D'abord il hésite, mais il avance parce qu'il comprend. Ensuite il répond.");
    expect(constructionCount(analysis, "relation_chronologie")).toBe(2);
    expect(constructionCount(analysis, "relation_cause")).toBe(1);
    expect(analysis.complexityScore).toBeGreaterThan(0);
    expect(analysis.complexityScore).toBeLessThanOrEqual(100);
    expect(analysis.features.every((feature) => feature.examples.length > 0)).toBe(true);
  });
});

