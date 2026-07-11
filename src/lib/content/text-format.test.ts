import { describe, expect, it } from "vitest";
import { paragraphsFromText } from "./text-format";

describe("paragraphsFromText", () => {
  it("splits real paragraph breaks", () => {
    expect(paragraphsFromText("Premier paragraphe.\n\nDeuxième paragraphe.")).toEqual([
      "Premier paragraphe.",
      "Deuxième paragraphe.",
    ]);
  });

  it("normalizes escaped generation markers", () => {
    expect(paragraphsFromText("Premier paragraphe.\\n\\nDeuxième paragraphe.")).toEqual([
      "Premier paragraphe.",
      "Deuxième paragraphe.",
    ]);
  });

  it("trims empty paragraphs", () => {
    expect(paragraphsFromText("  Premier.  \n\n\n  Deuxième. ")).toEqual(["Premier.", "Deuxième."]);
  });
});
