import { describe, expect, it } from "vitest";
import {
  bktUpdate,
  guessFromChoices,
  INITIAL_P_KNOWN,
  masteryUncertainty,
} from "./bkt";

describe("Bayesian Knowledge Tracing", () => {
  it("raises p(known) after a correct answer", () => {
    const after = bktUpdate(INITIAL_P_KNOWN, true);
    expect(after).toBeGreaterThan(INITIAL_P_KNOWN);
  });

  it("lowers (or barely moves) p(known) after a wrong answer, vs the learning bump", () => {
    const wrong = bktUpdate(0.6, false);
    const correct = bktUpdate(0.6, true);
    expect(wrong).toBeLessThan(correct);
  });

  it("converges toward mastery under a streak of correct answers", () => {
    let p = INITIAL_P_KNOWN;
    for (let i = 0; i < 6; i++) p = bktUpdate(p, true);
    expect(p).toBeGreaterThan(0.85);
  });

  it("a guess-heavy item (high guess) moves p(known) less on a correct answer", () => {
    const lowGuess = bktUpdate(0.3, true, {}, 0.1);
    const highGuess = bktUpdate(0.3, true, {}, 0.5);
    expect(lowGuess).toBeGreaterThan(highGuess);
  });

  it("stays within [0,1]", () => {
    expect(bktUpdate(0, false)).toBeGreaterThanOrEqual(0);
    expect(bktUpdate(1, true)).toBeLessThanOrEqual(1);
  });

  it("derives MCQ guess rate from choice count", () => {
    expect(guessFromChoices(4)).toBeCloseTo(0.25);
    expect(guessFromChoices(2)).toBeCloseTo(0.5);
  });
});

describe("mastery uncertainty", () => {
  it("shrinks as evidence accrues", () => {
    expect(masteryUncertainty(0.5, 0)).toBeGreaterThan(masteryUncertainty(0.5, 10));
  });

  it("is highest at mid mastery, lowest at the extremes", () => {
    const mid = masteryUncertainty(0.5, 3);
    const high = masteryUncertainty(0.95, 3);
    const low = masteryUncertainty(0.05, 3);
    expect(mid).toBeGreaterThan(high);
    expect(mid).toBeGreaterThan(low);
  });
});
