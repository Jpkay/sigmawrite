import type { DictationMode } from "./modes";

/**
 * Step-by-step mode (roadmap 2026-10, G.7): one sentence at a time, replay
 * as often as wanted (also slower), no replay counter, a short "noted" beat
 * between sentences. For CM1–CM2, and for older students who are struggling
 * (average accuracy below 60% over their last three dictées). Never for the
 * brevet format, which trains exam conditions.
 */
export function dictationStepByStep(input: { grade: number | null; kind: DictationMode; recentAccuracies: readonly number[] }): boolean {
  if (input.kind === "brevet") return false;
  if (input.grade !== null && input.grade <= 5) return true;
  const recent = input.recentAccuracies.filter((value) => Number.isFinite(value)).slice(0, 3);
  if (recent.length < 2) return false;
  return recent.reduce((sum, value) => sum + value, 0) / recent.length < 0.6;
}
