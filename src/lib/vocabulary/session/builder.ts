/**
 * Builds the items of one word burst (roadmap 2026-10 D.1–D.5). Pure: the
 * loader gathers cards, sentences, relations, neighbours and audio; this
 * decides the format of each item, its wrong options and its variants.
 *
 * Choices that follow the "Rules for every item":
 *  - context sentences come from the student's interests first (rule 2);
 *  - nearly forgotten words get the easiest recall format (hear and type,
 *    "is the word used correctly?"), well-known ones a harder one (rule 1);
 *  - the last item is the one the student is most likely to get right
 *    (rule 3); introductions are learning, not tests (D.1);
 *  - when both cards of a word are due, one "type it from its definition"
 *    item reviews both;
 *  - a missed word comes back in another format (`retry`), then in a
 *    recognition format that is very likely to succeed (`rescue`).
 */
import type { WordFacet, WordStatus } from "../types";
import { pickDistractors, seededShuffle, type DistractorTarget, type LexicalNeighbour, type Relation } from "./distractors";
import { misuseSentence, rankSentences, type ContextSentence } from "./sentences";
import type { ItemSecret, SessionFormat, SplitSentence, WordItemCore } from "./types";

export type SessionWord = {
  senseId: string;
  word: string;
  definition: string;
  /** Surface forms (lemma first) used to find the word in sentences. */
  forms: string[];
  partOfSpeech: string | null;
  domain: string | null;
  firstSeen: { sentence: string | null; interest: string | null };
  /** Example sentences (vetted), with their interest tag when known. */
  examples: Array<{ text: string; interest: string | null }>;
  relations: Relation[];
  audioUrl: string | null;
};

export type SessionReview = {
  senseId: string;
  /** Due facets of this sense today (one or both). */
  facets: WordFacet[];
  retrievability: number;
  lapses: number;
  status: WordStatus | null;
};

export type BuildWordSessionInput = {
  seed: string;
  interests: string[];
  reviews: SessionReview[];
  introductions: string[];
  words: Map<string, SessionWord>;
  /** Neighbours for wrong options (close in meaning and spelling). */
  pool: LexicalNeighbour[];
  explainEnabled: boolean;
  maxItems: number;
};

type ViewOf<T> = T extends unknown ? Omit<T, "token"> : never;
export type CoreView = ViewOf<WordItemCore>;
export type DraftCore = { view: CoreView; secret: ItemSecret; /** One secret per word of a mini-dictée, in order. */ parts?: Array<{ secret: ItemSecret; retry?: DraftCore }> };
export type DraftItem = DraftCore & { retry?: DraftCore; rescue?: DraftCore; harder?: DraftCore; easiness: number };

export const SESSION_RULES = {
  lowRetrievability: 0.6,
  highRetrievability: 0.9,
  miniDictationMin: 4,
  miniDictationMax: 6,
  /** An introduction comes at positions 0, 3, 6… */
  introductionSpacing: 3,
} as const;

const strip = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLocaleLowerCase("fr");

function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) { h ^= char.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

export function shuffleLetters(word: string, seed: string): string[] {
  const letters = [...word];
  if (letters.length < 2) return letters;
  for (let attempt = 0; attempt < 5; attempt++) {
    const shuffled = seededShuffle(letters, `${seed}:${attempt}`, (letter) => letter);
    if (shuffled.join("") !== word) return shuffled;
  }
  return [...letters.slice(1), letters[0]];
}

type Ctx = {
  input: BuildWordSessionInput;
  word: SessionWord;
  seed: string;
  sentences: ContextSentence[];
  rescueWorthy: boolean;
};

const secretOf = (ctx: Ctx, format: SessionFormat, facets: WordFacet[], extra: Partial<ItemSecret> = {}): ItemSecret => ({
  senseId: ctx.word.senseId, format, facets, novelContext: false, rescue: ctx.rescueWorthy, word: ctx.word.word, ...extra,
});

function targetOf(word: SessionWord): DistractorTarget {
  return { senseId: word.senseId, word: word.word, partOfSpeech: word.partOfSpeech, domain: word.domain, relations: word.relations };
}

function contextSentences(word: SessionWord): ContextSentence[] {
  const out: ContextSentence[] = [];
  if (word.firstSeen.sentence) out.push({ text: word.firstSeen.sentence, interest: word.firstSeen.interest, source: "first_seen" });
  for (const example of word.examples) out.push({ text: example.text, interest: example.interest, source: "example" });
  return out;
}

function bestSentence(ctx: Ctx, options: { novel?: boolean } = {}): { split: SplitSentence; interest: string | null; novel: boolean } | null {
  const ranked = rankSentences(ctx.sentences, ctx.input.interests, ctx.word.forms, { avoid: options.novel ? ctx.word.firstSeen.sentence : null });
  const first = ranked[0];
  if (!first) return null;
  return { split: first.split, interest: first.interest, novel: first.source !== "first_seen" };
}

// --- format builders --------------------------------------------------------

function hearItem(ctx: Ctx): DraftCore | null {
  if (!ctx.word.audioUrl) return null; // fail closed: no audio → another format
  return {
    view: { id: `${ctx.seed}:hear`, senseId: ctx.word.senseId, interest: null, format: "hear_and_type", audioUrl: ctx.word.audioUrl, length: [...ctx.word.word].length, firstLetter: [...ctx.word.word][0] ?? "" },
    secret: secretOf(ctx, "hear_and_type", ["spelling"], { expected: ctx.word.word }),
  };
}

function definitionItem(ctx: Ctx, facets: WordFacet[]): DraftCore {
  return {
    view: { id: `${ctx.seed}:def:${facets.join("+")}`, senseId: ctx.word.senseId, interest: null, format: "type_from_definition", definition: ctx.word.definition, length: [...ctx.word.word].length, firstLetter: [...ctx.word.word][0] ?? "" },
    secret: secretOf(ctx, "type_from_definition", facets, { expected: ctx.word.word }),
  };
}

function gapItem(ctx: Ctx): DraftCore | null {
  const sentence = bestSentence(ctx);
  if (!sentence) return null;
  const expected = sentence.split.word;
  return {
    view: { id: `${ctx.seed}:gap`, senseId: ctx.word.senseId, interest: sentence.interest, format: "gap_fill_typed", sentence: { ...sentence.split, word: "" }, definition: ctx.word.definition, length: [...expected].length, firstLetter: [...expected][0]?.toLocaleLowerCase("fr") ?? "" },
    secret: secretOf(ctx, "gap_fill_typed", ["spelling"], { expected }),
  };
}

function judgeItem(ctx: Ctx): DraftCore | null {
  const right = bestSentence(ctx, { novel: true }) ?? bestSentence(ctx);
  if (!right) return null;
  const candidates = pickDistractors(targetOf(ctx.word), ctx.input.pool.filter((neighbour) => neighbour.sentences.length > 0), 6);
  let wrong: string | null = null;
  for (const neighbour of candidates) {
    for (const sentence of neighbour.sentences) {
      const misuse = misuseSentence(sentence, [neighbour.word], ctx.word.word);
      if (misuse && strip(misuse) !== strip(`${right.split.before}${right.split.word}${right.split.after}`)) { wrong = misuse; break; }
    }
    if (wrong) break;
  }
  if (!wrong) return null;
  const options = seededShuffle([
    { id: "a", label: `${right.split.before}${right.split.word}${right.split.after}` },
    { id: "b", label: wrong },
  ], ctx.seed, (option) => option.id);
  return {
    view: { id: `${ctx.seed}:judge`, senseId: ctx.word.senseId, interest: right.interest, format: "judge_usage", word: ctx.word.word, options },
    secret: secretOf(ctx, "judge_usage", ["meaning"], { correct: "a", novelContext: right.novel }),
  };
}

function relationItem(ctx: Ctx): DraftCore | null {
  const byId = new Map(ctx.input.pool.map((neighbour) => [neighbour.senseId, neighbour]));
  const relation = [...ctx.word.relations]
    .filter((entry) => (entry.type === "synonym" || entry.type === "antonym") && byId.has(entry.senseId))
    .sort((a, b) => b.strength - a.strength)[0];
  if (!relation) return null;
  const answer = byId.get(relation.senseId)!;
  const answerTarget: DistractorTarget = { senseId: answer.senseId, word: answer.word, partOfSpeech: answer.partOfSpeech, domain: answer.domain, relations: [] };
  const related = new Set(ctx.word.relations.filter((entry) => entry.type === "synonym" || entry.type === "antonym").map((entry) => entry.senseId));
  const wrong = pickDistractors(answerTarget, ctx.input.pool, 3, { exclude: [ctx.word.senseId, ...related] });
  if (wrong.length < 2) return null;
  const sentence = bestSentence(ctx, { novel: true });
  const options = seededShuffle([{ id: "a", label: answer.word }, ...wrong.map((neighbour, index) => ({ id: `w${index}`, label: neighbour.word }))], ctx.seed, (option) => option.id);
  return {
    view: { id: `${ctx.seed}:rel`, senseId: ctx.word.senseId, interest: sentence?.interest ?? null, format: "synonym_antonym", word: ctx.word.word, relation: relation.type as "synonym" | "antonym", sentence: sentence?.split ?? null, options },
    secret: secretOf(ctx, "synonym_antonym", ["meaning"], { correct: "a", novelContext: true }),
  };
}

function oddItem(ctx: Ctx): DraftCore | null {
  const byId = new Map(ctx.input.pool.map((neighbour) => [neighbour.senseId, neighbour]));
  const synonyms = ctx.word.relations.filter((entry) => entry.type === "synonym" && byId.has(entry.senseId)).sort((a, b) => b.strength - a.strength).slice(0, 2).map((entry) => byId.get(entry.senseId)!);
  if (synonyms.length < 2) return null;
  // The intruder looks like the target (spelling) but means something else.
  const intruder = pickDistractors(targetOf(ctx.word), ctx.input.pool, 1, { exclude: synonyms.map((entry) => entry.senseId) })[0];
  if (!intruder) return null;
  const options = seededShuffle([
    { id: "t", label: ctx.word.word }, { id: "s0", label: synonyms[0].word }, { id: "s1", label: synonyms[1].word }, { id: "x", label: intruder.word },
  ], ctx.seed, (option) => option.id);
  return {
    view: { id: `${ctx.seed}:odd`, senseId: ctx.word.senseId, interest: null, format: "odd_one_out", options },
    secret: secretOf(ctx, "odd_one_out", ["meaning"], { correct: "x" }),
  };
}

function explainItem(ctx: Ctx): DraftCore | null {
  if (!ctx.input.explainEnabled) return null;
  const sentence = bestSentence(ctx, { novel: true });
  return {
    view: { id: `${ctx.seed}:explain`, senseId: ctx.word.senseId, interest: sentence?.interest ?? null, format: "explain_own_words", word: ctx.word.word, sentence: sentence?.split ?? null },
    secret: secretOf(ctx, "explain_own_words", ["meaning"], { novelContext: sentence?.novel ?? false }),
  };
}

export function pickDefinitionItem(ctx: Pick<Ctx, "input" | "word" | "seed" | "rescueWorthy">): DraftCore | null {
  const wrong = pickDistractors(targetOf(ctx.word), ctx.input.pool, 3, { needsDefinition: true, targetDefinition: ctx.word.definition });
  if (wrong.length < 2) return null;
  const options = seededShuffle([
    { id: "a", label: ctx.word.definition }, ...wrong.map((neighbour, index) => ({ id: `w${index}`, label: neighbour.definition! })),
  ], ctx.seed, (option) => option.id);
  return {
    view: { id: `${ctx.seed}:pick`, senseId: ctx.word.senseId, interest: null, format: "pick_definition", word: ctx.word.word, options },
    secret: { senseId: ctx.word.senseId, format: "pick_definition", facets: ["meaning"], novelContext: false, rescue: ctx.rescueWorthy, word: ctx.word.word, correct: "a" },
  };
}

function rebuildItem(ctx: Ctx): DraftCore {
  return {
    view: { id: `${ctx.seed}:rebuild`, senseId: ctx.word.senseId, interest: null, format: "rebuild_letters", letters: shuffleLetters(ctx.word.word, ctx.seed), definition: ctx.word.definition },
    secret: secretOf(ctx, "rebuild_letters", ["spelling"], { expected: ctx.word.word }),
  };
}

function introduceItem(ctx: Ctx): DraftCore {
  const met = ctx.word.firstSeen.sentence ? rankSentences([{ text: ctx.word.firstSeen.sentence, interest: ctx.word.firstSeen.interest, source: "first_seen" }], ctx.input.interests, ctx.word.forms)[0] : null;
  const fromExamples = rankSentences(ctx.word.examples.map((example) => ({ ...example, source: "example" as const })), ctx.input.interests, ctx.word.forms);
  const context = met ?? fromExamples[0] ?? null;
  const example = fromExamples.find((entry) => entry.text !== context?.text) ?? null;
  return {
    view: {
      id: `${ctx.seed}:intro`, senseId: ctx.word.senseId, interest: context?.interest ?? null, format: "introduce",
      word: ctx.word.word, definition: ctx.word.definition, context: context?.split ?? null,
      example: example ? { text: example.text, interest: example.interest } : null,
      letters: shuffleLetters(ctx.word.word, ctx.seed),
    },
    secret: secretOf(ctx, "introduce", [], { expected: ctx.word.word, context: { sentence: context?.text ?? null, interest: context?.interest ?? null } }),
  };
}

// --- choosing ---------------------------------------------------------------

function rotate<T>(options: T[], seed: string): T[] {
  if (options.length < 2) return options;
  const start = hash(seed) % options.length;
  return [...options.slice(start), ...options.slice(0, start)];
}

function itemForReview(input: BuildWordSessionInput, review: SessionReview, word: SessionWord, seed: string): DraftItem | null {
  const low = review.retrievability < SESSION_RULES.lowRetrievability || review.lapses > 0 || review.status === "a_revoir";
  const high = review.retrievability >= SESSION_RULES.highRetrievability && review.lapses === 0;
  const ctx: Ctx = { input, word, seed, sentences: contextSentences(word), rescueWorthy: low };
  const spelling = review.facets.includes("spelling");
  const meaning = review.facets.includes("meaning");
  let primary: DraftCore | null = null;
  const others: DraftCore[] = [];
  if (spelling && meaning) {
    primary = definitionItem(ctx, ["spelling", "meaning"]);
    others.push(...[hearItem(ctx), gapItem(ctx), judgeItem(ctx)].filter((item): item is DraftCore => !!item));
  } else if (spelling) {
    const choices = [hearItem(ctx), gapItem(ctx), definitionItem(ctx, ["spelling"])].filter((item): item is DraftCore => !!item);
    const ordered = low ? choices : rotate(choices, seed);
    primary = ordered[0];
    others.push(...ordered.slice(1));
  } else {
    const recall = [judgeItem(ctx), relationItem(ctx), oddItem(ctx), definitionItem(ctx, ["meaning"])].filter((item): item is DraftCore => !!item);
    const explain = high ? explainItem(ctx) : null;
    const ordered = explain ? [explain, ...recall] : low ? recall : rotate(recall, seed);
    primary = ordered[0];
    others.push(...ordered.slice(1).filter((item) => item.view.format !== "explain_own_words"));
  }
  if (!primary) return null;
  const retry = others.find((item) => item.view.format !== primary!.view.format);
  const rescue = spelling ? rebuildItem(ctx) : pickDefinitionItem(ctx) ?? undefined;
  const harder = meaning && primary.view.format !== "explain_own_words" ? explainItem(ctx) ?? undefined : undefined;
  const easiness = review.retrievability - (review.lapses > 0 ? 0.2 : 0) + (primary.view.format === "judge_usage" ? 0.1 : 0);
  return { ...primary, retry, rescue, harder, easiness };
}

function miniDictation(input: BuildWordSessionInput, picks: Array<{ review: SessionReview; word: SessionWord }>, seed: string): DraftItem {
  const parts = picks.map(({ review, word }, index) => {
    const ctx: Ctx = { input, word, seed: `${seed}:${index}`, sentences: contextSentences(word), rescueWorthy: review.lapses > 0 || review.retrievability < SESSION_RULES.lowRetrievability };
    return { secret: secretOf(ctx, "mini_dictation", ["spelling"], { expected: word.word }), retry: definitionItem(ctx, ["spelling"]) };
  });
  return {
    view: {
      id: `${seed}:mini`, senseId: picks[0].word.senseId, interest: null, format: "mini_dictation",
      words: picks.map(({ word }, index) => ({ id: `${seed}:mini:${index}`, token: "", senseId: word.senseId, audioUrl: word.audioUrl!, length: [...word.word].length })),
    },
    secret: { senseId: picks[0].word.senseId, format: "mini_dictation", facets: ["spelling"], novelContext: false, rescue: false, word: picks[0].word.word },
    parts,
    easiness: Math.min(...picks.map(({ review }) => review.retrievability)),
  };
}

/**
 * The items of one burst, in order. Reviews come lowest retrievability
 * first (the planner's order), introductions are spread out, and the
 * easiest review closes the burst.
 */
export function buildWordSession(input: BuildWordSessionInput): DraftItem[] {
  const reviews: DraftItem[] = [];
  const spellingWithAudio = input.reviews.filter((review) => review.facets.length === 1 && review.facets[0] === "spelling" && input.words.get(review.senseId)?.audioUrl);
  const grouped = new Set<string>();
  if (spellingWithAudio.length >= SESSION_RULES.miniDictationMin) {
    const picks = spellingWithAudio.slice(0, SESSION_RULES.miniDictationMax).map((review) => ({ review, word: input.words.get(review.senseId)! }));
    picks.forEach(({ review }) => grouped.add(review.senseId));
    reviews.push(miniDictation(input, picks, `${input.seed}:m`));
  }
  for (const review of input.reviews) {
    if (grouped.has(review.senseId)) continue;
    const word = input.words.get(review.senseId);
    if (!word) continue;
    const item = itemForReview(input, review, word, `${input.seed}:${review.senseId}`);
    if (item) reviews.push(item);
  }
  const intros: DraftItem[] = input.introductions.flatMap((senseId) => {
    const word = input.words.get(senseId);
    if (!word) return [];
    const ctx: Ctx = { input, word, seed: `${input.seed}:${senseId}`, sentences: contextSentences(word), rescueWorthy: false };
    return [{ ...introduceItem(ctx), easiness: 1 }];
  });
  // A mini-dictée counts as two items of time.
  const cost = (item: DraftItem) => (item.view.format === "mini_dictation" ? 2 : 1);
  const kept: DraftItem[] = [];
  let used = 0;
  for (const item of reviews) {
    if (used + cost(item) > input.maxItems) continue;
    kept.push(item);
    used += cost(item);
  }
  const keptIntros = intros.slice(0, Math.max(0, input.maxItems - used));
  // Easiest review last: the burst ends on a success (rule 3).
  if (kept.length > 1) {
    let easiest = 0;
    kept.forEach((item, index) => { if (item.view.format !== "mini_dictation" && item.easiness > kept[easiest].easiness) easiest = index; });
    kept.push(...kept.splice(easiest, 1));
  }
  const ordered = [...kept];
  keptIntros.forEach((intro, index) => ordered.splice(Math.min(index * SESSION_RULES.introductionSpacing, Math.max(0, ordered.length - (kept.length ? 1 : 0))), 0, intro));
  return ordered;
}
