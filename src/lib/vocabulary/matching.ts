/**
 * Deterministic word matching for evidence capture (roadmap 2026-10 A.3, A.4).
 * No model is involved: spelling outcomes come from alignment and exact
 * comparison only.
 */
import { alignWords, tokenize } from "@/lib/dictation/classify";
import { gradeSpelling } from "./grading";

const PUNCTUATION = /[.,;:!?«»"()[\]…–—\-]/gu;
const ELISION = /^(?:l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu)['’]/u;

/** Lower-case, NFC, straight apostrophes, no surrounding punctuation, no elided article. */
export function normalizeWord(token: string): string {
  return token.normalize("NFC").replace(/[’`´]/gu, "'").toLocaleLowerCase("fr").replace(PUNCTUATION, "").replace(ELISION, "").trim();
}

/** Word tokens of a text, normalised, in order. */
export function wordTokens(text: string): string[] {
  return tokenize(text).map(normalizeWord).filter((token) => token.length > 0 && /\p{L}/u.test(token));
}

/** Sentences of a text, trimmed. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/u).map((sentence) => sentence.trim()).filter(Boolean);
}

/** The first sentence that contains one of the forms (normalised). Used for "where I first met it" (B.3). */
export function sentenceContaining(paragraphs: string[], forms: Set<string>): string | null {
  for (const paragraph of paragraphs) {
    for (const sentence of sentences(paragraph)) {
      if (wordTokens(sentence).some((token) => forms.has(token))) return sentence.slice(0, 400);
    }
  }
  return null;
}

export type ProducedWordOutcome = "exact" | "accent" | "misspelled" | "missing";
export type ProducedWord = { expected: string; normalized: string; actual: string | null; outcome: ProducedWordOutcome };

/**
 * Aligns what the student wrote against the expected text and labels every
 * expected word: exact, accent slip, misspelled (any other difference) or
 * missing. Case is ignored (capitals are a punctuation matter, not the word).
 */
export function alignProduction(expectedText: string, producedText: string): ProducedWord[] {
  const pairs = alignWords(tokenize(expectedText), tokenize(producedText));
  const out: ProducedWord[] = [];
  for (const pair of pairs) {
    if (pair.expected == null) continue;
    const normalized = normalizeWord(pair.expected);
    if (!normalized || !/\p{L}/u.test(normalized)) continue;
    if (pair.actual == null || !normalizeWord(pair.actual)) {
      out.push({ expected: pair.expected, normalized, actual: null, outcome: "missing" });
      continue;
    }
    const grade = gradeSpelling(normalizeWord(pair.actual), normalized);
    out.push({ expected: pair.expected, normalized, actual: pair.actual, outcome: grade === "exact" ? "exact" : grade === "accent" ? "accent" : "misspelled" });
  }
  return out;
}

/** Dictée: every segment aligned against the learner's line. */
export function dictationWordOutcomes(segments: string[], answers: string[]): Array<ProducedWord & { segment: number }> {
  return segments.flatMap((segment, index) => alignProduction(segment, answers[index] ?? "").map((word) => ({ ...word, segment: index })));
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let prior = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prior + (a[i - 1] === b[j - 1] ? 0 : 1));
      prior = old;
    }
  }
  return row[b.length];
}

export type FreeWritingUse = { form: string; token: string; outcome: "exact" | "accent" | "misspelled" };

/**
 * Free writing: correct uses of tracked words, and likely misspellings of
 * them. A token counts as a misspelling only when it is NOT itself a known
 * French form (so "porte" is never a misspelling of "porté"), is at least
 * five letters long, and is one edit (or only accents) away from a tracked
 * form with the same first letter. Conservative on purpose: a false
 * "misspelled" would punish a correct sentence.
 */
export function freeWritingUses(text: string, trackedForms: Set<string>, knownForms: Set<string>): FreeWritingUse[] {
  const uses: FreeWritingUse[] = [];
  for (const token of wordTokens(text)) {
    if (trackedForms.has(token)) { uses.push({ form: token, token, outcome: "exact" }); continue; }
    if (knownForms.has(token) || token.length < 5) continue;
    for (const form of trackedForms) {
      if (form.length < 5 || form[0] !== token[0]) continue;
      const grade = gradeSpelling(token, form);
      if (grade === "accent") { uses.push({ form, token, outcome: "accent" }); break; }
      if (editDistance(token, form) === 1) { uses.push({ form, token, outcome: "misspelled" }); break; }
    }
  }
  return uses;
}
