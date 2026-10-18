import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { attributionDistance, measureStyle } from "./stylometry";
import { ATTRIBUTION_BASIS, STYLE_LIBRARY } from "./styles";

const corpusDir = join(process.cwd(), "content/styles/corpus");
const samples = readdirSync(corpusDir).filter((f) => f.endsWith(".txt")).flatMap((file) => {
  const author = file.replace(/\.txt$/u, "");
  return readFileSync(join(corpusDir, file), "utf8").split("\n\n=====\n\n").map((text, index) => ({ author, index, text }));
});
const cards = STYLE_LIBRARY.filter((c) => c.measured);

describe("stylometry and style cards (H.8)", () => {
  it("has a measured card for every public-domain author and none for modern authors", () => {
    expect(cards.length).toBe(15);
    for (const card of STYLE_LIBRARY.filter((c) => c.legal.status === "under_copyright")) {
      expect(card.measured).toBeNull();
      expect(card.excerpts).toEqual([]);
      expect(card.legal.publicName).toBe(false);
    }
  });

  it("is deterministic", () => {
    expect(measureStyle(samples[0].text)).toEqual(measureStyle(samples[0].text));
  });

  it("puts each held-out sample closest to its own author's card", () => {
    let correct = 0;
    for (const sample of samples) {
      const profile = measureStyle(sample.text);
      const nearest = [...cards].sort((a, b) => attributionDistance(profile, a.measured!, ATTRIBUTION_BASIS) - attributionDistance(profile, b.measured!, ATTRIBUTION_BASIS))[0];
      if (nearest.key === sample.author) correct += 1;
    }
    expect(samples.length).toBe(30);
    expect(correct / samples.length).toBeGreaterThanOrEqual(0.9);
  });

  it("gives stable profiles: two samples of the same author are closer to each other than to most others", () => {
    const renard = samples.filter((s) => s.author === "renard").map((s) => measureStyle(s.text));
    const others = samples.filter((s) => s.author !== "renard").map((s) => measureStyle(s.text));
    const own = attributionDistance(renard[0], renard[1], ATTRIBUTION_BASIS);
    const closer = others.filter((o) => attributionDistance(renard[0], o, ATTRIBUTION_BASIS) < own).length;
    expect(closer / others.length).toBeLessThan(0.15);
  });
});
