export type ReuseCalibrationOutcome = {
  score: number;
  matchedTextChosen: boolean;
  completed: boolean;
  abandoned: boolean;
  successRate: number | null;
};

export type ReuseCalibrationRequirements = {
  minimumObservations: number;
  minimumCompletionRate: number;
  minimumAverageSuccess: number;
  candidateThresholds?: number[];
};

export type ThresholdEvidence = {
  threshold: number;
  observations: number;
  chosen: number;
  completed: number;
  completionRate: number;
  averageSuccess: number | null;
  abandonmentRate: number;
  eligible: boolean;
};

const mean = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : null;

export function thresholdEvidence(
  outcomes: ReuseCalibrationOutcome[],
  threshold: number,
  requirements: ReuseCalibrationRequirements,
): ThresholdEvidence {
  const observations = outcomes.filter((outcome) => outcome.score >= threshold);
  const chosen = observations.filter((outcome) => outcome.matchedTextChosen);
  const completed = chosen.filter((outcome) => outcome.completed && !outcome.abandoned);
  const completionRate = chosen.length ? completed.length / chosen.length : 0;
  const averageSuccess = mean(completed.flatMap((outcome) => outcome.successRate == null ? [] : [outcome.successRate]));
  const abandonmentRate = chosen.length
    ? chosen.filter((outcome) => outcome.abandoned).length / chosen.length
    : 0;
  return {
    threshold,
    observations: observations.length,
    chosen: chosen.length,
    completed: completed.length,
    completionRate,
    averageSuccess,
    abandonmentRate,
    eligible:
      completed.length >= requirements.minimumObservations &&
      completionRate >= requirements.minimumCompletionRate &&
      averageSuccess !== null && averageSuccess >= requirements.minimumAverageSuccess,
  };
}

export function calibrateReuseThreshold(
  outcomes: ReuseCalibrationOutcome[],
  requirements: ReuseCalibrationRequirements,
) {
  const thresholds = requirements.candidateThresholds ?? [.70, .74, .78, .82, .86, .90];
  const evidence = [...new Set(thresholds)]
    .filter((threshold) => threshold >= 0 && threshold <= 1)
    .sort((a, b) => a - b)
    .map((threshold) => thresholdEvidence(outcomes, threshold, requirements));
  const selected = evidence.find((row) => row.eligible) ?? null;
  return {
    decision: selected ? "eligible_for_live_trial" as const : "keep_shadow" as const,
    recommendedThreshold: selected?.threshold ?? null,
    evidence,
  };
}
