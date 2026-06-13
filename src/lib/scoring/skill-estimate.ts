import type { SeedText } from "@/lib/content/types";

/**
 * Adaptive skill-estimate engine v1 (PRD §J). A lightweight evidence-weighted
 * update: ability moves toward each observation, the learning rate decays as
 * evidence accrues, and uncertainty shrinks. Deliberately simple and pure —
 * the PRD says not to overbuild IRT/BKT before real student data (§J). Phase 3
 * persists these to `student_skill_estimates`; for now they live in the store.
 */
export type SkillEstimate = {
  ability: number; // 0–100
  uncertainty: number; // 0–100
  evidenceCount: number;
};

export const INITIAL_SKILL: SkillEstimate = {
  ability: 50,
  uncertainty: 100,
  evidenceCount: 0,
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function updateSkillEstimate(
  prev: SkillEstimate | undefined,
  correct: boolean
): SkillEstimate {
  const p = prev ?? INITIAL_SKILL;
  const lr = 0.4 / (1 + p.evidenceCount * 0.15);
  const target = correct ? 100 : 0;
  return {
    ability: Math.round(clamp(p.ability + (target - p.ability) * lr)),
    uncertainty: Math.round(clamp(100 / (1 + p.evidenceCount + 1), 5, 100)),
    evidenceCount: p.evidenceCount + 1,
  };
}

/**
 * Applies a completed session's per-question evidence to skill estimates,
 * keyed by the question's `skillKey`. Returns a new map (does not mutate).
 */
export function updateSkillsFromSession(
  prev: Record<string, SkillEstimate>,
  text: SeedText,
  answers: Record<string, number>
): Record<string, SkillEstimate> {
  const next = { ...prev };
  for (const q of text.questions) {
    const correct = answers[q.id] === q.correctIndex;
    next[q.skillKey] = updateSkillEstimate(next[q.skillKey], correct);
  }
  return next;
}
