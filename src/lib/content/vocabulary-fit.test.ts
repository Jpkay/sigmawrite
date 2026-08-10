import { describe, expect, it } from "vitest";
import { rankByInterestAndVocabulary } from "./vocabulary-fit";

describe("reading vocabulary fit", () => {
  const items = [
    { id: "hard", primaryInterest: "space" },
    { id: "fit", primaryInterest: "space" },
    { id: "other", primaryInterest: "music" },
  ];
  const targets = new Map([
    ["hard", ["a", "b"]],
    ["fit", ["a"]],
    ["other", []],
  ]);

  it("keeps interest primary and familiarity as a tie-breaker", () => {
    expect(
      rankByInterestAndVocabulary(items, ["space", "music"], targets, new Set(["a"]))
        .map((item) => item.id),
    ).toEqual(["fit", "hard", "other"]);
  });

  it("prefers an authored related text that contains a due reuse word", () => {
    expect(
      rankByInterestAndVocabulary(
        items,
        ["space", "music"],
        targets,
        new Set(),
        new Map([["hard", 1]]),
      ).map((item) => item.id),
    ).toEqual(["hard", "fit", "other"]);
  });

  it("does not let reuse override an unrelated higher-priority interest", () => {
    expect(
      rankByInterestAndVocabulary(
        items,
        ["space", "music"],
        targets,
        new Set(),
        new Map([["other", 3]]),
      ).map((item) => item.id),
    ).toEqual(["hard", "fit", "other"]);
  });
});
