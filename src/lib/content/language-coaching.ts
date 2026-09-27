import { z } from "zod";

export const languageTipSchema = z.object({
  kind: z.enum(["spelling", "grammar", "clarity"]),
  before: z.string().min(1).max(200),
  after: z.string().min(1).max(240),
  explanationFr: z.string().min(1).max(350),
  recurring: z.boolean(),
});
export type LanguageTip = z.infer<typeof languageTipSchema>;
export type CoachingResult = { tip: LanguageTip | null; available: boolean };
/** Count distinct correct exercises, not retries. Optional help is never throttled. */
export function shouldOfferLanguageTip(correctExerciseCount: number): boolean {
  return correctExerciseCount > 0 && correctExerciseCount % 4 === 0;
}
