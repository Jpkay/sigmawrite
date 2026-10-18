import { describe, expect, it } from "vitest";
import { buildPanel, parsePanelSheet, scorePanel } from "./panel";

describe("blind panel (H.12)", () => {
  const sources = [
    { text: "Texte généré A avec {{HEROS}}.", isGenerated: true, origin: "run-1" },
    { text: "Texte généré B.", isGenerated: true, origin: "run-2" },
    { text: "Texte de référence C.", isGenerated: false, origin: "renard" },
    { text: "Texte de référence D.", isGenerated: false, origin: "colette" },
  ];
  it("anonymises and shuffles reproducibly", () => {
    const a = buildPanel(sources, "panel-1");
    expect(a).toEqual(buildPanel(sources, "panel-1"));
    expect(a.items.some((i) => i.text.includes("{{"))).toBe(false);
    expect(JSON.stringify(a.items)).not.toContain("renard");
  });
  it("scores the panel against the targets", () => {
    const { key } = buildPanel(sources, "panel-1");
    const gen = key.filter((k) => k.isGenerated).map((k) => k.code);
    const ref = key.filter((k) => !k.isGenerated).map((k) => k.code);
    const csv = ["code;rater;overall;guessed_generated", `${gen[0]};r1;4,5;non`, `${gen[1]};r1;4;oui`, `${ref[0]};r1;4,5;non`, `${ref[1]};r1;5;non`].join("\n");
    const result = scorePanel(parsePanelSheet(csv), key);
    expect(result.generatedMean).toBe(4.25);
    expect(result.detectionRate).toBe(0.5);
    expect(result.passed).toBe(true);
  });
});
