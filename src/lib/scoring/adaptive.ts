import type { NextAction, DifficultyBand } from "@/lib/types";
import { DIFFICULTY_BANDS } from "@/lib/types";
import { SEED_TEXTS } from "@/lib/content/texts";
import { MICRO_LESSONS } from "@/lib/content/micro-lessons";
import type { SkillEstimate } from "./skill-estimate";

/**
 * Adaptive engine v1 — turns a next-action (PRD §J) into a concrete next step:
 * a foundation-repair micro-lesson, or the next text at an adjusted difficulty
 * (the "one-step-harder" rule, §G). Pure and unit-tested.
 */

const bandIndex = (band: string) =>
  Math.max(0, DIFFICULTY_BANDS.indexOf(band as DifficultyBand));

/** One-step difficulty adjustment per the next-action (PRD §G one-step rule). */
export function nextBand(current: string, action: NextAction): DifficultyBand {
  const i = bandIndex(current);
  const delta =
    action === "increase_difficulty"
      ? 1
      : action === "reduce_difficulty"
        ? -1
        : 0;
  const j = Math.max(0, Math.min(DIFFICULTY_BANDS.length - 1, i + delta));
  return DIFFICULTY_BANDS[j];
}

/**
 * The weakest skill that (a) is below the repair threshold, (b) has enough
 * evidence to trust, and (c) has a micro-lesson. Returns null if none.
 */
export function detectFoundationRepair(
  skills: Record<string, SkillEstimate>,
  threshold = 50
): string | null {
  let worst: { key: string; ability: number } | null = null;
  for (const [key, est] of Object.entries(skills)) {
    if (!MICRO_LESSONS[key]) continue;
    if (est.evidenceCount < 1) continue;
    if (est.ability >= threshold) continue;
    if (!worst || est.ability < worst.ability) worst = { key, ability: est.ability };
  }
  return worst?.key ?? null;
}

export type NextStep =
  | { type: "repair"; skillKey: string }
  | { type: "read"; textId: string; band: DifficultyBand };

function pickText(
  interests: string[],
  targetBand: string,
  excludeInterest?: string
): string {
  const target = bandIndex(targetBand);
  const pool = SEED_TEXTS.filter((t) =>
    excludeInterest
      ? t.primaryInterest !== excludeInterest
      : interests.length === 0 || interests.includes(t.primaryInterest)
  );
  const candidates = pool.length ? pool : SEED_TEXTS;
  // Closest band to the target.
  return [...candidates].sort(
    (a, b) =>
      Math.abs(bandIndex(a.difficultyBand) - target) -
      Math.abs(bandIndex(b.difficultyBand) - target)
  )[0].id;
}

export function selectNextStep(opts: {
  interests: string[];
  currentBand: string;
  action: NextAction;
  currentInterest?: string;
  skills: Record<string, SkillEstimate>;
}): NextStep {
  if (opts.action === "foundation_repair") {
    const skillKey = detectFoundationRepair(opts.skills);
    if (skillKey) return { type: "repair", skillKey };
    // No repairable skill identified → drop difficulty instead.
    const band = nextBand(opts.currentBand, "reduce_difficulty");
    return { type: "read", textId: pickText(opts.interests, band), band };
  }

  const band = nextBand(opts.currentBand, opts.action);
  const textId =
    opts.action === "change_topic"
      ? pickText(opts.interests, band, opts.currentInterest)
      : pickText(opts.interests, band);
  return { type: "read", textId, band };
}
