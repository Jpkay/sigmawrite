/**
 * Pure rules for story mode: the daily unlock (H.5) and the alternative
 * ending checks (H.4). Shared by the server actions and the client so the
 * student sees exactly the rule the server applies.
 */

// ---------------------------------------------------------------------------
// H.5 daily unlock: one chapter a day, a bonus one once the daily mission is
// done. Skipped days cost nothing: nothing piles up, nothing is lost.
// ---------------------------------------------------------------------------

export const FREE_CHAPTERS_PER_DAY = 1;

/** Start of the current day in UTC, the same day boundary as the XP and streak tables. */
export function dayStartIso(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export type ChapterUnlock = { locked: boolean; bonus: boolean };

export function chapterUnlock(input: { chapterIndex: number; alreadyRead: boolean; readsToday: number; goalCompletedToday: boolean }): ChapterUnlock {
  // The first chapter of a saga and any chapter already read are always open.
  if (input.chapterIndex <= 1 || input.alreadyRead) return { locked: false, bonus: false };
  const allowance = FREE_CHAPTERS_PER_DAY + (input.goalCompletedToday ? 1 : 0);
  if (input.readsToday >= allowance) return { locked: true, bonus: false };
  return { locked: false, bonus: input.readsToday >= FREE_CHAPTERS_PER_DAY };
}

// ---------------------------------------------------------------------------
// H.4 alternative ending.
// ---------------------------------------------------------------------------

export const ENDING_WORD_COUNT = 3;

const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLocaleLowerCase("fr");
const tokensOf = (text: string) => fold(text).replace(/[’`´]/gu, "'").split(/[^\p{L}'-]+/u)
  .map((token) => token.replace(/^(?:l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu)'/u, "").replace(/^-+|-+$/gu, ""))
  .filter(Boolean);

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter((token) => /\p{L}/u.test(token)).length;
}

/** Lenient match: exact form, or an inflection sharing the word's stem ("intrépide" → "intrépides", "explorer" → "explora"). */
export function endingWordUsed(text: string, word: string): boolean {
  const target = fold(word).replace(/^(?:se |s')/u, "");
  const tokens = tokensOf(text);
  if (tokens.includes(target)) return true;
  if (target.length < 5) return false;
  const stem = target.replace(/(?:er|ir|re|e|s|x)$/u, "");
  return stem.length >= 4 && tokens.some((token) => token.startsWith(stem) && token.length <= target.length + 4);
}

export type EndingCheck = { wordCount: number; wordsUsed: boolean[]; lengthOk: boolean; ready: boolean };

export function checkEnding(text: string, words: string[], bounds: { minimumWords: number; maximumWords: number }): EndingCheck {
  const wordCount = countWords(text);
  const wordsUsed = words.map((word) => endingWordUsed(text, word));
  const lengthOk = wordCount >= bounds.minimumWords && wordCount <= bounds.maximumWords;
  return { wordCount, wordsUsed, lengthOk, ready: lengthOk && wordsUsed.every(Boolean) };
}

const CONJUGATED = /(?:aient|ait|èrent|irent|urent|âmes|âtes|erai|erais|erait|eront|erons|iez|ions|issait|issaient)$/u;
const STOP = new Set(["maintenant", "toujours", "quelque", "quelques", "pendant", "derrière", "devant", "comme", "encore", "aussitôt", "beaucoup", "lorsque", "puisque", "pourtant", "cependant", "tellement", "longtemps", "personne", "quelqu'un", "vraiment", "simplement", "doucement", "brusquement", "soudain", "d'abord", "ensuite", "enfin", "chacun", "chacune", "jusqu'à", "au-dessus", "au-dessous", "elles-mêmes", "lui-même", "elle-même"]);

/**
 * Three target words for the ending: the saga's own target words first
 * (chapters' due and new words, words of the micro-tasks), then rich words
 * the student met in the chapters. Never a proper noun.
 */
export function pickEndingWords(preferred: string[], paragraphs: string[], count = ENDING_WORD_COUNT): string[] {
  const chosen: string[] = [];
  const seen = new Set<string>();
  const add = (word: string) => {
    const key = fold(word.trim());
    if (!key || seen.has(key) || chosen.length >= count) return;
    seen.add(key);
    chosen.push(word.trim());
  };
  for (const word of preferred) if (/^[\p{L}][\p{L}' -]{2,38}$/u.test(word.trim())) add(word);
  if (chosen.length < count) {
    const frequency = new Map<string, { word: string; count: number; first: number }>();
    let position = 0;
    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/u);
      words.forEach((raw, index) => {
        position += 1;
        const word = raw.replace(/^[«"(“]+|[.,;:!?»")”…]+$/gu, "").replace(/^(?:l|d|j|m|t|s|n|c|qu)['’]/iu, "");
        const previous = words[index - 1] ?? "";
        const sentenceStart = index === 0 || /[.!?…»]$/u.test(previous);
        if (word.length < 7 || !/^\p{L}+(?:-\p{L}+)?$/u.test(word) || STOP.has(word.toLocaleLowerCase("fr"))) return;
        if (CONJUGATED.test(word.toLocaleLowerCase("fr"))) return; // keep nouns and adjectives: easier to reuse
        if (/^\p{Lu}/u.test(word) && !sentenceStart) return; // proper noun
        if (/^\p{Lu}/u.test(word)) return; // sentence-initial words are often names too: skip them
        const key = word.toLocaleLowerCase("fr");
        const entry = frequency.get(key) ?? { word: key, count: 0, first: position };
        entry.count += 1;
        frequency.set(key, entry);
      });
    }
    [...frequency.values()].sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.first - b.first).forEach((entry) => add(entry.word));
  }
  return chosen;
}
