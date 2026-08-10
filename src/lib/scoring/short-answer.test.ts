import { describe, expect, it } from "vitest";
import { evaluateConceptAnswer } from "./short-answer";

describe("concept-based short-answer scoring", () => {
  const criteria = [{ label: "Cause", conceptIds: ["opportunité économique", "salaires plus élevés"], points: 1 }, { label: "Effet", conceptIds: ["meilleures chances", "réussir"], points: 1 }];
  it("accepts a student formulation instead of exact model wording", () => {
    const result = evaluateConceptAnswer("Ils cherchent des salaires plus élevés pour avoir de meilleures chances de réussir.", ["opportunité économique", "salaires plus élevés", "meilleures chances", "réussir"], criteria);
    expect(result).toMatchObject({ pass: true, score: 1 });
  });
  it("gives partial credit for one accepted concept", () => {
    expect(evaluateConceptAnswer("Ils veulent des salaires plus élevés.", ["opportunité économique", "salaires plus élevés", "meilleures chances", "réussir"], criteria)).toMatchObject({ pass: false, score: 0.5 });
  });
});
