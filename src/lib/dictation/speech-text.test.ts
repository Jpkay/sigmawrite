import { describe, expect, it } from "vitest";
import { speakableFullText, speakableSegment } from "./speech-text";

describe("speakableSegment", () => {
  it("announces punctuation the way a teacher dictates", () => {
    expect(speakableSegment("L’eau est froide, mais personne ne se plaint.")).toBe("L’eau est froide, virgule, mais personne ne se plaint, point.");
    expect(speakableSegment("Où vas-tu ?")).toBe("Où vas-tu, point d’interrogation,");
    expect(speakableSegment("Il dit : « Viens ! »")).toBe("Il dit, deux-points, ouvrez les guillemets, Viens, point d’exclamation, fermez les guillemets,");
  });
  it("keeps the whole-text listening natural", () => {
    expect(speakableFullText(["Un.", "Deux, trois."])).toBe("Un. Deux, trois.");
  });
});
