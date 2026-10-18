import { tokenize, type DictationError, type ErrorCategory } from "./classify";

/**
 * Per-word results of a scored dictée, ready for word evidence
 * (roadmap 2026-10, G.6 / A.4). The vocabulary stream maps `word` to a lemma
 * and sense and calls recordWordEvidence(…, "spelling", spellingCorrect, …).
 * Call site: `submitDictation` in src/lib/actions/student.ts, with the
 * expected segments and `classifyDictation(...).errors`.
 *
 * `spellingCorrect` ignores capital/punctuation-only errors (ideogrammique),
 * which say nothing about how the word itself is spelled. Extra words typed
 * by the student have no expected word and are not listed.
 */
export type DictationWordOutcome = {
  segment: number;
  position: number;
  /** Expected word without surrounding punctuation, as dictated (case kept). */
  word: string;
  correct: boolean;
  spellingCorrect: boolean;
  /** What the student wrote at this position (null when omitted). */
  actual: string | null;
  categories: ErrorCategory[];
};

const strip = (token: string) => token.replace(/^[«"(\[]+|[.,;:!?»")\]…]+$/gu, "");

export function dictationWordOutcomes(segments: readonly string[], errors: readonly DictationError[]): DictationWordOutcome[] {
  const byPosition = new Map<string, DictationError[]>();
  for (const error of errors) {
    if (!error.expected) continue;
    const key = `${error.segment}:${error.position}`;
    byPosition.set(key, [...(byPosition.get(key) ?? []), error]);
  }
  return segments.flatMap((segment, segmentIndex) => tokenize(segment).flatMap((token, position) => {
    const word = strip(token);
    if (!/\p{L}/u.test(word)) return [];
    const found = byPosition.get(`${segmentIndex}:${position}`) ?? [];
    return [{
      segment: segmentIndex, position, word,
      correct: found.length === 0,
      spellingCorrect: found.every((error) => error.category === "ideogrammique"),
      actual: found.length ? found[0].actual : token,
      categories: found.map((error) => error.category),
    }];
  }));
}
