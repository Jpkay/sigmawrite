import { SEED_TEXTS } from "./texts";
import { pickClosestByInterest } from "./interest-matching";

/**
 * Picks the next seed text for a student (PRD §I recommendation): the closest
 * text to their interests (exact, then same group, then neighbour group —
 * roadmap E.5), else the first seed text.
 */
export function recommendTextId(interests: string[]): string {
  return (pickClosestByInterest(SEED_TEXTS, interests).item ?? SEED_TEXTS[0]).id;
}

export type InterestSignal = {
  interestKey: string; declaredStrength: number; inferredStrength: number;
  completionRate: number; avgSuccess: number; avgTimeOnTask: number; abandonCount: number;
};

export type InterestDecision = {
  interestKey: string; score: number; difficultyAdjustment: -1 | 0 | 1;
  reason: "explore_new_topic" | "keep_topic_lower_complexity" | "increase_complexity" | "balanced";
};

/** PRD Layer-2 rules: engagement and performance are separate signals. */
export function rankInterestSignals(signals: InterestSignal[]): InterestDecision[] {
  return signals.map((signal) => {
    const engagement = Math.max(0, Math.min(1, signal.inferredStrength * 0.6 + signal.completionRate * 0.4 - Math.min(0.5, signal.abandonCount * 0.15)));
    const performance = signal.avgSuccess;
    if (performance >= 0.8 && engagement < 0.35) return { interestKey: signal.interestKey, score: 0.2 + signal.declaredStrength * 0.1, difficultyAdjustment: 0 as const, reason: "explore_new_topic" as const };
    if (engagement >= 0.55 && performance < 0.7) return { interestKey: signal.interestKey, score: 0.75 + signal.declaredStrength * 0.1, difficultyAdjustment: -1 as const, reason: "keep_topic_lower_complexity" as const };
    if (engagement >= 0.55 && performance > 0.9) return { interestKey: signal.interestKey, score: 0.9 + signal.declaredStrength * 0.1, difficultyAdjustment: 1 as const, reason: "increase_complexity" as const };
    return { interestKey: signal.interestKey, score: engagement * 0.6 + performance * 0.25 + signal.declaredStrength * 0.15, difficultyAdjustment: 0 as const, reason: "balanced" as const };
  }).sort((a,b) => b.score-a.score);
}
