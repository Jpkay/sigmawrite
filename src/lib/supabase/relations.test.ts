import { describe, expect, it } from "vitest";
import { oneToOne } from "./relations";

describe("oneToOne", () => {
  it("normalizes PostgREST one-to-one objects", () => {
    const review = { id: "review-1", score: 4 };
    expect(oneToOne(review)).toEqual(review);
  });

  it("keeps compatibility with array-shaped relationship results", () => {
    const review = { id: "review-1", score: 4 };
    expect(oneToOne([review])).toEqual(review);
    expect(oneToOne([])).toBeNull();
  });

  it("normalizes missing relationships", () => {
    expect(oneToOne(null)).toBeNull();
    expect(oneToOne(undefined)).toBeNull();
  });
});
