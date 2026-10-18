import { z } from "zod";

/**
 * Interest-aware block of the generation contract (roadmap F.1). Shared by the
 * on-demand contract and the editorial pipeline (src/lib/content/editorial/brief.ts).
 * The student's first name is deliberately absent: story mode uses the
 * {{HEROS}} placeholder and inserts the name server-side after generation.
 */
export const editorialContractSchema = z.object({
  interests: z.array(z.string().min(1)).min(1).max(3),
  /** Interest group (src/lib/content/interests.ts), e.g. manga → manga_bd, for coverage accounting. */
  interestGroup: z.string().min(1).optional(),
  targetLemmas: z.object({
    new: z.array(z.string().min(1)).max(2),
    due: z.array(z.string().min(1)).max(5),
  }),
  targetTenses: z.array(z.string().min(1)).min(1).max(2),
  gradeBand: z.enum(["cm", "6e-5e", "4e-3e"]),
  readabilityTarget: z.object({ maxAverageSentenceWords: z.number().min(6).max(30), maxSentenceWords: z.number().int().min(10).max(60) }),
  mode: z.enum(["live", "library"]),
  heroPlaceholder: z.literal("{{HEROS}}").nullable(),
}).strict();
export type EditorialContract = z.infer<typeof editorialContractSchema>;

/** System-prompt clause: interests go into the instructions, not only the JSON input (F.1). */
export function interestsSystemClause(interests: readonly string[]): string {
  const list = interests.map((i) => i.trim()).filter(Boolean).slice(0, 3);
  if (list.length === 0) return "";
  return `Centres d'intérêt de l'élève : ${list.join(", ")}. Le texte part de cet univers et le traite avec précision, comme un passionné le reconnaîtrait, sans personnes réelles ni marques.`;
}
