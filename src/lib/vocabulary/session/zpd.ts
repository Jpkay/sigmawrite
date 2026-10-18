/**
 * Zone of proximal development inside a word session (rule 1 of the
 * roadmap): above 90 % over the last 10 answers the next item gets harder;
 * below 60 % it gets easier and a hint appears first. Pure.
 */
export const ZPD_RULES = { window: 10, minAnswers: 4, harderAbove: 0.9, easierBelow: 0.6 } as const;

export type ZpdMode = "easier" | "steady" | "harder";

export function zpdMode(results: readonly boolean[]): ZpdMode {
  const recent = results.slice(-ZPD_RULES.window);
  if (recent.length < ZPD_RULES.minAnswers) return "steady";
  const rate = recent.filter(Boolean).length / recent.length;
  if (rate > ZPD_RULES.harderAbove) return "harder";
  if (rate < ZPD_RULES.easierBelow) return "easier";
  return "steady";
}
