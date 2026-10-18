/**
 * Distractors for meaning items (roadmap 2026-10 D.4). Wrong options are
 * words close in meaning *and* in spelling, so the student cannot answer by
 * elimination. Synonyms of the target are never used as wrong options for a
 * definition or usage question (they would also be right). Pure.
 */
export type LexicalNeighbour = {
  senseId: string;
  word: string;
  definition: string | null;
  partOfSpeech: string | null;
  domain: string | null;
  /** Sentences that use this word (to build a misuse for "judge usage"). */
  sentences: string[];
};

export type Relation = { senseId: string; type: "synonym" | "antonym" | "commonly_confused_with" | "broader_than" | "narrower_than" | "simpler_than"; strength: number };

export type DistractorTarget = {
  senseId: string;
  word: string;
  partOfSpeech: string | null;
  domain: string | null;
  relations: Relation[];
};

const strip = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLocaleLowerCase("fr").trim();

function levenshtein(a: string, b: string) {
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

/** 0–1: 1 = same letters. Shared prefix and suffix weigh in (in-/-ible look-alikes). */
export function orthographicSimilarity(a: string, b: string): number {
  const x = strip(a), y = strip(b);
  if (!x || !y) return 0;
  const edit = 1 - levenshtein(x, y) / Math.max(x.length, y.length);
  let prefix = 0;
  while (prefix < Math.min(x.length, y.length) && x[prefix] === y[prefix]) prefix++;
  let suffix = 0;
  while (suffix < Math.min(x.length, y.length) && x[x.length - 1 - suffix] === y[y.length - 1 - suffix]) suffix++;
  return Math.min(1, edit * 0.6 + Math.min(1, prefix / 3) * 0.25 + Math.min(1, suffix / 3) * 0.15);
}

export function closenessScore(target: DistractorTarget, candidate: LexicalNeighbour): number {
  const relation = target.relations.find((entry) => entry.senseId === candidate.senseId);
  let score = 0;
  if (relation?.type === "commonly_confused_with") score += 3 * relation.strength;
  else if (relation && relation.type !== "synonym" && relation.type !== "antonym") score += 1.5 * relation.strength;
  if (target.partOfSpeech && candidate.partOfSpeech === target.partOfSpeech) score += 1;
  if (target.domain && candidate.domain === target.domain) score += 1;
  score += 2 * orthographicSimilarity(target.word, candidate.word);
  return score;
}

/** Senses that would also be a right answer for a definition or usage question. */
export function equivalentSenses(target: DistractorTarget): Set<string> {
  return new Set([target.senseId, ...target.relations.filter((entry) => entry.type === "synonym").map((entry) => entry.senseId)]);
}

/**
 * The `count` closest neighbours that are not equivalent to the target, not
 * the same spelling, and (when `needsDefinition`) have a definition that
 * differs from the target's. Deterministic: ties break on the word.
 */
export function pickDistractors(target: DistractorTarget, pool: LexicalNeighbour[], count: number, options: { exclude?: Iterable<string>; needsDefinition?: boolean; targetDefinition?: string | null } = {}): LexicalNeighbour[] {
  const banned = equivalentSenses(target);
  for (const id of options.exclude ?? []) banned.add(id);
  const seenWords = new Set([strip(target.word)]);
  const seenDefinitions = new Set(options.targetDefinition ? [strip(options.targetDefinition)] : []);
  const ranked = pool
    .filter((candidate) => !banned.has(candidate.senseId))
    .filter((candidate) => !options.needsDefinition || !!candidate.definition?.trim())
    .map((candidate) => ({ candidate, score: closenessScore(target, candidate) }))
    .sort((a, b) => b.score - a.score || a.candidate.word.localeCompare(b.candidate.word, "fr"));
  const out: LexicalNeighbour[] = [];
  for (const { candidate } of ranked) {
    const word = strip(candidate.word);
    const definition = candidate.definition ? strip(candidate.definition) : "";
    if (seenWords.has(word) || (options.needsDefinition && seenDefinitions.has(definition))) continue;
    seenWords.add(word);
    if (definition) seenDefinitions.add(definition);
    out.push(candidate);
    if (out.length >= count) break;
  }
  return out;
}

/** Deterministic shuffle (FNV hash of seed + label), so a reload shows the same order. */
export function seededShuffle<T>(values: readonly T[], seed: string, key: (value: T) => string = (value) => String(value)): T[] {
  const hash = (text: string) => {
    let h = 2166136261;
    for (const char of text) { h ^= char.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
    return h;
  };
  return values.map((value, index) => ({ value, rank: hash(`${seed}:${key(value)}:${index}`) })).sort((a, b) => a.rank - b.rank).map((entry) => entry.value);
}
