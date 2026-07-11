import { describe, expect, it } from "vitest";
import { reviewRowsToCsv } from "./csv";

describe("review CSV export", () => {
  it("produces UTF-8 Excel-compatible CSV and escapes French comments", () => {
    const csv = reviewRowsToCsv([
      ["passage_id", "commentaire", "tags"],
      ["p-1", 'Clair, mais le mot "pérenniser" est difficile.', ["vocabulary_too_difficult"]],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Clair, mais le mot ""pérenniser"" est difficile."');
    expect(csv).toContain('"[""vocabulary_too_difficult""]"');
  });
});
