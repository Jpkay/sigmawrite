/**
 * Cited-justification support for reading questions (roadmap 5.5). Picks the
 * sentence of the passage that best supports the correct answer by lexical
 * overlap with the explanation and the correct choice, and offers it among
 * distractor sentences. Deterministic, so the same text always asks the same.
 */
const STOP = new Set(["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "au", "aux", "en", "que", "qui", "dans", "sur", "pour", "par", "pas", "ne", "est", "sont", "ce", "cette", "ces", "se", "sa", "son", "ses", "il", "elle", "ils", "elles", "on", "nous", "vous", "plus", "avec", "comme", "mais", "donc", "car", "texte", "réponse", "correcte", "directement", "appuie", "premier", "paragraphe", "dit", "explique"]);

const words = (text: string) => (text.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/gu, "").match(/[a-z]{3,}/gu) ?? []).filter((w) => !STOP.has(w));

export function splitSentences(paragraphs: string[]): string[] {
  return paragraphs.flatMap((paragraph) => paragraph.split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ý«"])/u).map((s) => s.trim()).filter((s) => s.length >= 25));
}

export type EvidenceChallenge = { candidates: string[]; answerIndex: number } | null;

function hash(text: string): number { let h = 2166136261; for (const c of text) { h ^= c.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; } return h; }

export function buildEvidenceChallenge(paragraphs: string[], correctChoice: string, explanationFr: string, seed: string, count = 4): EvidenceChallenge {
  const sentences = splitSentences(paragraphs);
  if (sentences.length < 2) return null;
  const cue = new Set([...words(correctChoice), ...words(explanationFr)]);
  const scored = sentences.map((sentence, index) => ({ index, sentence, score: words(sentence).filter((w) => cue.has(w)).length }));
  const best = [...scored].sort((a, b) => b.score - a.score || a.index - b.index)[0];
  if (!best || best.score === 0) return null;
  const others = scored.filter((entry) => entry.index !== best.index).sort((a, b) => hash(`${seed}:${a.index}`) - hash(`${seed}:${b.index}`)).slice(0, Math.max(1, count - 1));
  const candidates = [best, ...others].sort((a, b) => a.index - b.index);
  return { candidates: candidates.map((entry) => entry.sentence), answerIndex: candidates.findIndex((entry) => entry.index === best.index) };
}
