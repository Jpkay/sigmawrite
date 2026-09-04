import { describe, expect, it } from "vitest";
import { wordDiff } from "./diff";

describe("wordDiff", () => {
  it("marks replaced words and keeps the rest", () => {
    const parts = wordDiff("Les enfant joue dehors.", "Les enfants jouent dehors.");
    expect(parts.filter((p) => p.kind === "removed").map((p) => p.text.trim())).toEqual(["enfant", "joue"]);
    expect(parts.filter((p) => p.kind === "added").map((p) => p.text.trim())).toEqual(["enfants", "jouent"]);
    expect(parts.map((p) => (p.kind === "removed" ? "" : p.text)).join("")).toBe("Les enfants jouent dehors.");
  });
  it("returns one same part for identical text", () => {
    expect(wordDiff("a b", "a b")).toEqual([{ kind: "same", text: "a b" }]);
  });
});
