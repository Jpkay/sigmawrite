import type { SeedText } from "./types";

/**
 * Builds retrieval cards from a completed reading (PRD §L). Phase 4 seeds one
 * "definition/why" card per concept plus the text's own retrieval prompt. The
 * keywords drive auto-grading; the source text lets the UI link back.
 */
export type RetrievalCardSeed = {
  conceptLabel: string;
  promptFr: string;
  keywords: string[];
  sourceTextId: string;
};

export function buildRetrievalCards(text: SeedText): RetrievalCardSeed[] {
  const cards: RetrievalCardSeed[] = text.concepts.map((concept) => ({
    conceptLabel: concept,
    promptFr: `Explique avec tes mots : « ${concept} » (vu dans « ${text.title} »).`,
    keywords: concept.split(/\s+/).filter((w) => w.length > 3),
    sourceTextId: text.id,
  }));

  // Plus the text's authored retrieval prompt, keyed to the first concept.
  cards.push({
    conceptLabel: text.concepts[0] ?? text.primaryInterest,
    promptFr: text.retrievalPrompt,
    keywords: (text.concepts[0] ?? "").split(/\s+/).filter((w) => w.length > 3),
    sourceTextId: text.id,
  });

  return cards;
}
