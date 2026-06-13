import { SEED_TEXTS } from "./texts";

/**
 * Picks the next text for a student (PRD §I recommendation). Phase 1: prefer
 * a text whose primary interest the student declared, else fall back to the
 * first seed text. Phase 3 layers in difficulty + skill-gap matching.
 */
export function recommendTextId(interests: string[]): string {
  const match = SEED_TEXTS.find((t) => interests.includes(t.primaryInterest));
  return (match ?? SEED_TEXTS[0]).id;
}
