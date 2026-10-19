import { z } from "zod";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import type { Tense } from "@/lib/linguistic/conjugation";

/**
 * Dictée tags (roadmap 2026-10, G.1) and publication statuses (G.2).
 * Mirrors the checks in migrations 20261018120000/20261018120100.
 */

/** Statuses a student may see (with audio ready). */
export const STUDENT_VISIBLE_DICTATION_STATUSES = ["human_approved", "auto_approved"] as const;
export type DictationReviewStatus = "needs_human_review" | "human_approved" | "auto_approved" | "rejected" | "taken_down";
export const isStudentVisibleDictationStatus = (status: string) =>
  (STUDENT_VISIBLE_DICTATION_STATUSES as readonly string[]).includes(status);

export const DICTATION_TENSES = [
  "present", "imparfait", "passe_compose", "futur_simple", "futur_proche", "passe_recent",
  "passe_simple", "conditionnel_present", "subjonctif_present", "imperatif_present", "plus_que_parfait",
] as const satisfies readonly Tense[];
export type DictationTense = (typeof DICTATION_TENSES)[number];

/** Grammar node trained by using a tense in context. */
export const TENSE_NODE_KEYS: Record<DictationTense, string> = {
  present: "employer_present_indicatif_en_contexte",
  imparfait: "employer_imparfait_en_contexte",
  passe_compose: "employer_passe_compose_en_contexte",
  futur_simple: "employer_futur_simple_en_contexte",
  futur_proche: "employer_futur_proche_en_contexte",
  passe_recent: "employer_passe_recent_en_contexte",
  passe_simple: "employer_passe_simple_en_contexte",
  conditionnel_present: "employer_conditionnel_present_en_contexte",
  subjonctif_present: "employer_subjonctif_present_en_contexte",
  imperatif_present: "employer_imperatif_en_contexte",
  plus_que_parfait: "employer_plus_que_parfait_en_contexte",
};

/**
 * Curriculum order of tenses (G.4): the first grade at which a tense is
 * expected in a dictée. Used as an advisory gate, never to hide content.
 */
export const TENSE_FIRST_GRADE: Record<DictationTense, number> = {
  present: 4, passe_compose: 4, imparfait: 4, futur_simple: 4, futur_proche: 4, passe_recent: 4,
  passe_simple: 6, conditionnel_present: 6, imperatif_present: 6,
  plus_que_parfait: 8, subjonctif_present: 8,
};

export const CEFR_BANDS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type CefrBand = (typeof CEFR_BANDS)[number];

export const THEME_PATTERN = /^[\p{Ll}][\p{Ll}\p{M}' -]{0,31}$/u;

export const dictationTagsSchema = z.object({
  themes: z.array(z.string().regex(THEME_PATTERN)).max(8),
  interests: z.array(z.string().refine((key) => key in INTEREST_BY_KEY, "unknown interest")).max(8),
  tenses: z.array(z.enum(DICTATION_TENSES)).max(11),
  target_lemmas: z.array(z.string().min(1).max(40)).max(24),
  grammar_node_keys: z.array(z.string().regex(/^[a-z0-9_]+$/u)).max(24),
  cefr_band: z.enum(CEFR_BANDS).nullable(),
});
export type DictationTags = z.infer<typeof dictationTagsSchema>;

export const EMPTY_DICTATION_TAGS: DictationTags = { themes: [], interests: [], tenses: [], target_lemmas: [], grammar_node_keys: [], cefr_band: null };

/** Normalizes a lemma for matching: lowercase NFC, curly apostrophes, trimmed. Accents are kept (« pécher » ≠ « pêcher »). */
export function normalizeLemma(lemma: string): string {
  return lemma.normalize("NFC").replace(/[’`]/gu, "'").trim().toLocaleLowerCase("fr");
}

/** Student-facing chip label for a theme word. */
export function themeLabel(theme: string): string {
  const clean = theme.replace(/[-_]+/gu, " ").trim();
  return clean.charAt(0).toLocaleUpperCase("fr") + clean.slice(1);
}

/** Chips shown on a dictée card: interests first (with their emoji), then themes, without duplicates. */
export function dictationChips(tags: { interests: readonly string[]; themes: readonly string[] }, limit = 3): string[] {
  const chips: string[] = [];
  for (const key of tags.interests) {
    const interest = INTEREST_BY_KEY[key];
    if (interest) chips.push(`${interest.emoji} ${interest.labelFr}`);
  }
  for (const theme of tags.themes) {
    const label = themeLabel(theme);
    if (!chips.some((chip) => chip.toLocaleLowerCase("fr").endsWith(label.toLocaleLowerCase("fr")))) chips.push(label);
  }
  return chips.slice(0, limit);
}

/** All node keys a dictée exercises: spelling targets, then grammar nodes. */
export function dictationNodeKeys(row: { target_node_keys: readonly string[]; grammar_node_keys?: readonly string[] | null }): string[] {
  return [...new Set([...row.target_node_keys, ...(row.grammar_node_keys ?? [])])];
}
