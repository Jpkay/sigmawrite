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
  vocabularyWord?: string;
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

  for (const vocabulary of text.targetVocabulary) {
    cards.push({
      conceptLabel: vocabulary.word,
      vocabularyWord: vocabulary.word,
      promptFr: `Sans regarder l’aide, explique « ${vocabulary.word} » avec tes mots et écris une phrase où ce mot convient.`,
      keywords: vocabulary.definitionFr.split(/\s+/).filter((word) => word.length > 5).slice(0, 4),
      sourceTextId: text.id,
    });
  }

  return cards;
}
