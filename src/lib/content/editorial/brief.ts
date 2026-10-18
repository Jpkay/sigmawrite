import { z } from "zod";
import { sanitizeStudentTopic } from "@/lib/safety/topic";
import { HERO_PLACEHOLDER, TENSES_BY_BAND, type EditorialKind, type GradeBand, type TenseKey } from "./types";

/**
 * Generation brief (roadmap F.1). Everything the editorial team receives about
 * a student is here, and nothing else: interests, learning targets, band and
 * readability. The hero is a placeholder — the student's name never reaches a
 * model and is inserted after generation (H.2, see hero.ts).
 */

const tenseKeys = ["present", "imparfait", "passe_compose", "futur_simple", "passe_simple", "conditionnel_present", "subjonctif_present", "imperatif_present", "plus_que_parfait"] as const;

export const targetLemmaSchema = z.object({
  lemma: z.string().trim().min(2).max(40).regex(/^[\p{L}' -]+$/u, "lemma must be a plain French word"),
  kind: z.enum(["new", "due"]),
  definition: z.string().max(240).optional(),
  partOfSpeech: z.enum(["nom", "verbe", "adjectif", "adverbe", "autre"]).optional(),
});

export const readabilityTargetSchema = z.object({
  maxAverageSentenceWords: z.number().min(6).max(30),
  maxSentenceWords: z.number().int().min(10).max(60),
  /** Target share of words outside the band's common vocabulary (rough guide for authors). */
  maxRareWordShare: z.number().min(0).max(0.3),
});

export const editorialBriefSchema = z.object({
  kind: z.enum(["chapter", "passage", "dictation"]),
  mode: z.enum(["live", "library"]),
  interests: z.array(z.string().trim().min(2).max(60)).min(1).max(3),
  gradeBand: z.enum(["cm", "6e-5e", "4e-3e"]),
  grade: z.number().int().min(4).max(9),
  targetLemmas: z.array(targetLemmaSchema).max(7),
  targetTenses: z.array(z.enum(tenseKeys)).min(1).max(2),
  readabilityTarget: readabilityTargetSchema,
  lengthWords: z.object({ min: z.number().int().min(10), max: z.number().int().max(600) }),
  styleKey: z.string().min(2),
  narration: z.enum(["tu", "il", "je"]),
  hero: z.object({ placeholder: z.literal(HERO_PLACEHOLDER), gender: z.enum(["f", "m", "n"]) }).nullable(),
}).superRefine((brief, ctx) => {
  const fresh = brief.targetLemmas.filter((l) => l.kind === "new").length;
  const due = brief.targetLemmas.filter((l) => l.kind === "due").length;
  if (fresh > 2) ctx.addIssue({ code: "custom", message: "at most 2 new target words", path: ["targetLemmas"] });
  if (due > 5) ctx.addIssue({ code: "custom", message: "at most 5 due target words", path: ["targetLemmas"] });
  for (const tense of brief.targetTenses) {
    if (!TENSES_BY_BAND[brief.gradeBand].includes(tense)) ctx.addIssue({ code: "custom", message: `tense ${tense} is not in the ${brief.gradeBand} curriculum`, path: ["targetTenses"] });
  }
  if (brief.lengthWords.max < brief.lengthWords.min) ctx.addIssue({ code: "custom", message: "invalid length range", path: ["lengthWords"] });
});
export type EditorialBrief = z.infer<typeof editorialBriefSchema>;

export const LENGTHS: Record<EditorialKind, Record<GradeBand, { min: number; max: number }>> = {
  chapter: { cm: { min: 150, max: 260 }, "6e-5e": { min: 200, max: 340 }, "4e-3e": { min: 250, max: 400 } },
  passage: { cm: { min: 180, max: 280 }, "6e-5e": { min: 230, max: 360 }, "4e-3e": { min: 280, max: 450 } },
  // G.7 / src/lib/dictation/gates.ts wordCountBand: 15–40 words for CM, ≤ 80 in 6e–5e, ≤ 100 in 4e–3e.
  dictation: { cm: { min: 15, max: 40 }, "6e-5e": { min: 40, max: 80 }, "4e-3e": { min: 60, max: 100 } },
};

export const READABILITY: Record<GradeBand, z.infer<typeof readabilityTargetSchema>> = {
  cm: { maxAverageSentenceWords: 13, maxSentenceWords: 26, maxRareWordShare: 0.06 },
  "6e-5e": { maxAverageSentenceWords: 17, maxSentenceWords: 34, maxRareWordShare: 0.09 },
  "4e-3e": { maxAverageSentenceWords: 21, maxSentenceWords: 42, maxRareWordShare: 0.12 },
};

export type BriefInput = {
  kind: EditorialKind;
  mode: "live" | "library";
  interests: string[];
  grade: number;
  gradeBand: GradeBand;
  newLemmas?: Array<z.infer<typeof targetLemmaSchema>>;
  dueLemmas?: Array<z.infer<typeof targetLemmaSchema>>;
  targetTenses: TenseKey[];
  styleKey: string;
  narration?: "tu" | "il" | "je";
  heroGender?: "f" | "m" | "n" | null;
};

/**
 * Builds a valid brief: keeps the 2 first new words and up to 5 due words
 * (the caller orders due words by lowest retrievability), drops tenses that
 * are outside the band, and sanitizes interests as untrusted topics.
 */
export function buildEditorialBrief(input: BriefInput): EditorialBrief {
  const interests = input.interests
    .map((interest) => sanitizeStudentTopic(interest))
    .filter((result) => result.allowed)
    .map((result) => result.value)
    .slice(0, 3);
  if (interests.length === 0) throw new Error("brief_requires_a_safe_interest");
  const allowedTenses = input.targetTenses.filter((tense) => TENSES_BY_BAND[input.gradeBand].includes(tense)).slice(0, 2);
  const narration = input.narration ?? (input.kind === "chapter" ? "tu" : "il");
  return editorialBriefSchema.parse({
    kind: input.kind,
    mode: input.mode,
    interests,
    gradeBand: input.gradeBand,
    grade: input.grade,
    targetLemmas: [
      ...(input.newLemmas ?? []).slice(0, 2).map((l) => ({ ...l, kind: "new" as const })),
      ...(input.dueLemmas ?? []).slice(0, 5).map((l) => ({ ...l, kind: "due" as const })),
    ],
    targetTenses: allowedTenses.length ? allowedTenses : [TENSES_BY_BAND[input.gradeBand][0]],
    readabilityTarget: READABILITY[input.gradeBand],
    lengthWords: LENGTHS[input.kind][input.gradeBand],
    styleKey: input.styleKey,
    narration,
    hero: input.kind === "chapter" && narration !== "je" ? { placeholder: HERO_PLACEHOLDER, gender: input.heroGender ?? "n" } : null,
  });
}

/** Guards every prompt payload: the student's real name or nickname must never be sent. */
export function assertNoPersonalData(payload: string, forbiddenNames: string[]): void {
  for (const name of forbiddenNames.map((n) => n.trim()).filter((n) => n.length >= 2)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    if (new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "iu").test(payload)) throw new Error("personal_data_in_prompt");
  }
}
