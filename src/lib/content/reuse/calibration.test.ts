import { describe, expect, it } from "vitest";
import { calibrateReuseThreshold, thresholdEvidence, type ReuseCalibrationOutcome } from "./calibration";

const successful = (score: number): ReuseCalibrationOutcome => ({
  score,
  matchedTextChosen: true,
  completed: true,
  abandoned: false,
  successRate: .82,
});

describe("reuse calibration", () => {
  it("keeps shadow mode when outcome evidence is insufficient", () => {
    const result = calibrateReuseThreshold([successful(.9)], {
      minimumObservations: 10,
      minimumCompletionRate: .7,
      minimumAverageSuccess: .75,
    });
    expect(result.decision).toBe("keep_shadow");
    expect(result.recommendedThreshold).toBeNull();
  });

  it("selects the lowest threshold that meets outcome gates", () => {
    const outcomes = [
      ...Array.from({ length: 12 }, () => successful(.84)),
      ...Array.from({ length: 8 }, () => ({ ...successful(.73), completed: false, abandoned: true, successRate: null })),
    ];
    const result = calibrateReuseThreshold(outcomes, {
      minimumObservations: 10,
      minimumCompletionRate: .7,
      minimumAverageSuccess: .75,
      candidateThresholds: [.70, .78, .86],
    });
    expect(result).toMatchObject({ decision: "eligible_for_live_trial", recommendedThreshold: .78 });
  });

  it("measures outcomes only when the matcher recommendation was actually chosen", () => {
    const evidence = thresholdEvidence([
      successful(.9),
      { score: .9, matchedTextChosen: false, completed: false, abandoned: false, successRate: null },
    ], .8, {
      minimumObservations: 1,
      minimumCompletionRate: .7,
      minimumAverageSuccess: .75,
    });
    expect(evidence).toMatchObject({ observations: 2, chosen: 1, completed: 1, completionRate: 1 });
  });
});
