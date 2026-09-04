import { describe, expect, it } from "vitest";
import { buildEvidenceChallenge, splitSentences } from "./evidence";

const paragraphs = [
  "La migration désigne le déplacement de personnes d’un lieu vers un autre. Elle peut être choisie ou subie.",
  "Les footballeurs migrent souvent pour jouer dans un meilleur championnat. Leurs familles les suivent parfois.",
];

describe("evidence challenge", () => {
  it("splits sentences and finds the supporting one", () => {
    expect(splitSentences(paragraphs)).toHaveLength(4);
    const challenge = buildEvidenceChallenge(paragraphs, "Un déplacement de personnes", "Le premier paragraphe définit la migration comme un déplacement de personnes.", "q1");
    expect(challenge).not.toBeNull();
    expect(challenge!.candidates[challenge!.answerIndex]).toMatch(/déplacement de personnes/u);
    expect(challenge!.candidates.length).toBeGreaterThanOrEqual(2);
  });
  it("returns null when nothing overlaps", () => {
    expect(buildEvidenceChallenge(paragraphs, "zzz", "yyy", "q")).toBeNull();
  });
});
