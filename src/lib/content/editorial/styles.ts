import { z } from "zod";
import index from "../../../../content/styles/index.json";
import perrault from "../../../../content/styles/cards/perrault.json";
import lafontaine from "../../../../content/styles/cards/lafontaine.json";
import segur from "../../../../content/styles/cards/segur.json";
import malot from "../../../../content/styles/cards/malot.json";
import renard from "../../../../content/styles/cards/renard.json";
import daudet from "../../../../content/styles/cards/daudet.json";
import verne from "../../../../content/styles/cards/verne.json";
import dumas from "../../../../content/styles/cards/dumas.json";
import leblanc from "../../../../content/styles/cards/leblanc.json";
import leroux from "../../../../content/styles/cards/leroux.json";
import maupassant from "../../../../content/styles/cards/maupassant.json";
import hugo from "../../../../content/styles/cards/hugo.json";
import colette from "../../../../content/styles/cards/colette.json";
import alainFournier from "../../../../content/styles/cards/alain-fournier.json";
import pergaud from "../../../../content/styles/cards/pergaud.json";
import moderneHumour from "../../../../content/styles/cards/moderne-humour-famille.json";
import moderneAdo from "../../../../content/styles/cards/moderne-roman-ado.json";
import moderneEcolier from "../../../../content/styles/cards/moderne-ecolier-narrateur.json";
import type { AttributionBasis, MeasuredStyle } from "./stylometry";
import type { GradeBand } from "./types";

/**
 * Style library (roadmap H.7/H.8). The human half of each card lives in
 * content/styles/cards/*.json (written by people, in French); the measured
 * half comes from scripts/build-style-cards.mts (content/styles/index.json).
 */

const humanSchema = z.object({
  voix: z.string().min(20),
  humour: z.string().min(5),
  images: z.string().min(10),
  scenesTypiques: z.array(z.string()).min(1),
  rythme: z.string().min(10),
  procedes: z.array(z.string()).min(1),
  jamais: z.array(z.string()).min(1),
  adaptationJeunesse: z.string().min(10),
});

const cardSchema = z.object({
  key: z.string().regex(/^[a-z-]+$/u),
  displayName: z.string(),
  publicDisplayName: z.string().optional(),
  era: z.string(),
  ageBands: z.array(z.enum(["cm", "6e-5e", "4e-3e", "lycee"])).min(1),
  formats: z.array(z.enum(["chapter", "passage", "dictation"])).min(1),
  legal: z.object({
    status: z.enum(["public_domain_fr", "under_copyright"]),
    deathYear: z.number().int().optional(),
    basis: z.string().optional(),
    textInPrompts: z.boolean(),
    publicName: z.boolean(),
    legalCheck: z.string(),
  }),
  human: humanSchema,
  studentCard: z.string().min(20),
  studentExcerptIndex: z.number().int().min(0).optional(),
});
export type HumanStyleCard = z.infer<typeof cardSchema>;

export type StyleExcerpt = { text: string; source: string; gutenbergId: number };
export type StyleCard = HumanStyleCard & {
  measured: MeasuredStyle | null;
  excerpts: StyleExcerpt[];
  /** Name that may be shown to students (real name only after the legal check). */
  studentFacingName: string;
};

type IndexFile = { basis: AttributionBasis; cards: Record<string, { measured: MeasuredStyle; excerpts: StyleExcerpt[] }>; validation: { accuracy: number } };
const measuredIndex = index as unknown as IndexFile;

const RAW = [perrault, lafontaine, segur, malot, renard, daudet, verne, dumas, leblanc, leroux, maupassant, hugo, colette, alainFournier, pergaud, moderneHumour, moderneAdo, moderneEcolier];

export const STYLE_LIBRARY: readonly StyleCard[] = RAW.map((raw) => {
  const card = cardSchema.parse(raw);
  const measured = measuredIndex.cards[card.key];
  // Public-domain text is used only when the card allows it; modern authors never carry text.
  const excerpts = card.legal.textInPrompts && measured ? measured.excerpts : [];
  return {
    ...card,
    measured: card.legal.status === "public_domain_fr" ? measured?.measured ?? null : null,
    excerpts,
    studentFacingName: card.legal.publicName ? card.displayName : card.publicDisplayName ?? "un auteur d'aujourd'hui",
  };
});

export const ATTRIBUTION_BASIS = measuredIndex.basis;

export function getStyleCard(key: string): StyleCard {
  const card = STYLE_LIBRARY.find((entry) => entry.key === key);
  if (!card) throw new Error(`unknown_style:${key}`);
  return card;
}

export function stylesFor(band: GradeBand, format: "chapter" | "passage" | "dictation"): StyleCard[] {
  return STYLE_LIBRARY.filter((card) => card.ageBands.includes(band) && card.formats.includes(format));
}

/**
 * Rotates styles so a student meets several authors (H.6): picks the
 * eligible style read least recently / least often.
 */
export function pickStyle(band: GradeBand, format: "chapter" | "passage" | "dictation", history: string[], requested?: string | null): StyleCard {
  const eligible = stylesFor(band, format);
  if (requested) {
    const match = eligible.find((card) => card.key === requested);
    if (match) return match;
  }
  if (eligible.length === 0) throw new Error(`no_style_for:${band}:${format}`);
  const score = (key: string) => {
    const last = history.lastIndexOf(key);
    return (last < 0 ? -1000 : last) + history.filter((k) => k === key).length * 10;
  };
  return [...eligible].sort((a, b) => score(a.key) - score(b.key) || a.key.localeCompare(b.key))[0];
}

/** Excerpt suitable for the end-of-saga "Lis le vrai…" card (public domain only). */
export function studentExcerpt(card: StyleCard): StyleExcerpt | null {
  if (!card.legal.textInPrompts || card.excerpts.length === 0) return null;
  return card.excerpts[card.studentExcerptIndex ?? 0] ?? card.excerpts[0];
}
