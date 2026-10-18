/**
 * Context sentences for word items: find the word (any of its forms) in a
 * sentence, split around it, and pick the sentence that matches the
 * student's interests. Pure.
 */
import type { SplitSentence } from "./types";

export type ContextSentence = { text: string; interest: string | null; source: "first_seen" | "example" | "generic" };

const strip = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLocaleLowerCase("fr");
const lower = (value: string) => value.normalize("NFC").toLocaleLowerCase("fr");
const WORD = /[\p{L}\p{M}]+(?:[-’'][\p{L}\p{M}]+)*/gu;

/**
 * Splits `sentence` around the first token equal to one of `forms`
 * (case-insensitive, exact accents). An elided article stays outside the
 * word ("l’" + "intrépide"). Null when no form occurs.
 */
export function splitAroundWord(sentence: string, forms: readonly string[]): SplitSentence | null {
  const wanted = new Set(forms.map(lower).filter(Boolean));
  if (!wanted.size) return null;
  for (const match of sentence.matchAll(WORD)) {
    let token = match[0];
    let offset = match.index ?? 0;
    const elision = /^(?:l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu)['’]/iu.exec(token);
    if (elision) { offset += elision[0].length; token = token.slice(elision[0].length); }
    if (wanted.has(lower(token))) {
      return { before: sentence.slice(0, offset), word: sentence.slice(offset, offset + token.length), after: sentence.slice(offset + token.length) };
    }
  }
  return null;
}

/** Same word ignoring accents and case (used only to detect, never to grade). */
export function containsLoosely(sentence: string, form: string): boolean {
  const target = strip(form);
  return [...sentence.matchAll(WORD)].some((match) => strip(match[0].replace(/^(?:l|d|j|m|t|s|n|c|qu)['’]/iu, "")) === target);
}

/** vocabulary_items.examples_fr is loosely typed jsonb: strings or {text|sentence|fr, interest}. */
export function parseExamples(raw: unknown): Array<{ text: string; interest: string | null }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ text: string; interest: string | null }> = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) out.push({ text: entry.trim(), interest: null });
    else if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const text = [record.text, record.sentence, record.fr, record.example].find((value) => typeof value === "string" && value.trim()) as string | undefined;
      const interest = [record.interest, record.interest_key, record.interestKey].find((value) => typeof value === "string") as string | undefined;
      if (text) out.push({ text: text.trim(), interest: interest ?? null });
    }
  }
  return out;
}

/**
 * Orders candidate sentences: the student's interests first (in the order
 * they listed them), then sentences tagged with another interest, then
 * generic ones. `avoid` drops a sentence (to get a context that is new to
 * the student, B.2 meaning rule).
 */
export function rankSentences(candidates: ContextSentence[], interests: readonly string[], forms: readonly string[], options: { avoid?: string | null } = {}): Array<ContextSentence & { split: SplitSentence }> {
  const avoid = options.avoid ? lower(options.avoid.trim()) : null;
  const rank = (sentence: ContextSentence) => {
    const index = sentence.interest ? interests.indexOf(sentence.interest) : -1;
    if (index >= 0) return index;
    return sentence.interest ? 100 : 200;
  };
  const seen = new Set<string>();
  return candidates
    .filter((sentence) => sentence.text.length <= 220)
    .filter((sentence) => !avoid || lower(sentence.text.trim()) !== avoid)
    .flatMap((sentence) => {
      const key = lower(sentence.text.trim());
      if (seen.has(key)) return [];
      seen.add(key);
      const split = splitAroundWord(sentence.text, forms);
      return split ? [{ ...sentence, split }] : [];
    })
    .sort((a, b) => rank(a) - rank(b));
}

/**
 * A misuse of `word` for "is the word used correctly?": a sentence written
 * for another word with that word replaced by the target. Keeps the
 * capital letter when the replaced word started the sentence.
 */
export function misuseSentence(sentence: string, otherForms: readonly string[], word: string): string | null {
  const split = splitAroundWord(sentence, otherForms);
  if (!split) return null;
  const replacement = split.before.trim() === "" && /^\p{Lu}/u.test(split.word) ? word.charAt(0).toLocaleUpperCase("fr") + word.slice(1) : word;
  const before = /(?:^|\s)(?:l|d|j|m|t|s|n|c|qu)['’]$/iu.test(split.before) && !/^[aeiouyhâàéèêëîïôûù]/iu.test(word)
    ? split.before.replace(/(l|d|j|m|t|s|n|c|qu)['’]$/iu, (_, letter: string) => (letter.toLowerCase() === "l" ? "le " : `${letter}e `))
    : split.before;
  return `${before}${replacement}${split.after}`;
}
