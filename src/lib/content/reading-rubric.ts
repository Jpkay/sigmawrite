import { z } from "zod";

/** Authored by reviewers, never supplied by the learner. All ideas are required. */
export const readingRubricSchema = z.object({
  version: z.literal(1),
  requiredIdeas: z.array(z.string().trim().min(10).max(600)).min(1).max(8),
});
export type ReadingRubric = z.infer<typeof readingRubricSchema>;
