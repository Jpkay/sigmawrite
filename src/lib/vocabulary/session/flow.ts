/**
 * Order of play inside one word burst (client state, pure and serialisable):
 *  - planned items in order;
 *  - a missed word comes back 2–4 items later in another format until it is
 *    right once (C.4, relearning.ts), first its `retry` variant, then its
 *    `rescue` (recognition) variant;
 *  - zone of proximal development (rule 1): above 90 % the next item uses
 *    its `harder` variant, below 60 % typed items start with a first-letter
 *    hint;
 *  - the burst ends on a success (rule 3): if the last answer was wrong,
 *    the word comes back once more in its easiest form.
 */
import { emptyRelearningQueue, nextRelearningItem, recordSessionAttempt, type RelearningQueue } from "../relearning";
import type { WordActivityFormat, WordFacet } from "../types";
import type { WordItem, WordItemCore } from "./types";
import { zpdMode, type ZpdMode } from "./zpd";

export type FlowStage = "primary" | "harder" | "retry" | "rescue" | "victory";
export type FlowStep = { parentId: string; item: WordItemCore; stage: FlowStage; assist: boolean };

export type FlowState = {
  queue: string[];
  parents: Record<string, WordItem>;
  position: number;
  relearning: RelearningQueue;
  firstResults: boolean[];
  lastWrong: string | null;
  victoryUsed: boolean;
  /** Senses answered at least once (for the end screen). */
  worked: string[];
};

const SPELLING = new Set(["hear_and_type", "type_from_definition", "gap_fill_typed", "mini_dictation", "rebuild_letters"]);
export const facetOf = (item: WordItemCore): WordFacet => (SPELLING.has(item.format) ? "spelling" : "meaning");
export const isTyped = (item: WordItemCore) => ["hear_and_type", "type_from_definition", "gap_fill_typed"].includes(item.format);

export function initFlow(items: WordItem[]): FlowState {
  return {
    queue: items.map((item) => item.id),
    parents: Object.fromEntries(items.map((item) => [item.id, item])),
    position: 0,
    relearning: emptyRelearningQueue(),
    firstResults: [],
    lastWrong: null,
    victoryUsed: false,
    worked: [],
  };
}

function variants(parent: WordItem): WordItemCore[] {
  return [parent.retry, parent.rescue].filter((item): item is WordItemCore => !!item);
}

function relearningStep(state: FlowState, position: number): FlowStep | null {
  const next = nextRelearningItem(state.relearning, position, (entry) => {
    const parent = state.parents[entry.senseId];
    return parent ? variants(parent).map((item) => item.format as WordActivityFormat) : [];
  });
  if (!next) return null;
  const parent = state.parents[next.entry.senseId];
  const item = variants(parent).find((variant) => variant.format === next.format);
  if (!item) return null;
  return { parentId: parent.id, item, stage: item === parent.rescue ? "rescue" : "retry", assist: false };
}

export function currentMode(state: FlowState): ZpdMode {
  return zpdMode(state.firstResults);
}

/** The next step to show, or null when the burst is over. */
export function nextStep(state: FlowState): FlowStep | null {
  const due = relearningStep(state, state.position);
  if (due) return due;
  const nextId = state.queue[0];
  if (nextId) {
    const parent = state.parents[nextId];
    const mode = currentMode(state);
    if (mode === "harder" && parent.harder) return { parentId: parent.id, item: parent.harder, stage: "harder", assist: false };
    return { parentId: parent.id, item: parent, stage: "primary", assist: mode === "easier" && isTyped(parent) };
  }
  // Nothing planned is left: words still waiting come back now.
  const pending = relearningStep(state, Number.MAX_SAFE_INTEGER);
  if (pending) return pending;
  if (state.lastWrong && !state.victoryUsed) {
    const parent = state.parents[state.lastWrong];
    const easiest = parent?.rescue ?? parent?.retry;
    if (easiest) return { parentId: parent.id, item: easiest, stage: "victory", assist: false };
  }
  return null;
}

/**
 * Applies the answer to `step`. `missedWords` lists the words of a
 * mini-dictée that were wrong: each comes back on its own.
 */
export function applyResult(state: FlowState, step: FlowStep, correct: boolean, missedWords: WordItem[] = []): FlowState {
  const parents = { ...state.parents };
  let relearning = state.relearning;
  const queue = step.stage === "primary" || step.stage === "harder" ? state.queue.filter((id) => id !== step.parentId) : state.queue;
  const firstResults = (step.stage === "primary" || step.stage === "harder") && step.item.format !== "introduce" ? [...state.firstResults, correct] : state.firstResults;
  if (step.item.format !== "introduce" && step.item.format !== "mini_dictation" && step.stage !== "victory") {
    relearning = recordSessionAttempt(relearning, { senseId: step.parentId, facet: facetOf(step.item), format: step.item.format as WordActivityFormat, correct, position: state.position });
  }
  for (const word of missedWords) {
    parents[word.id] = word;
    relearning = recordSessionAttempt(relearning, { senseId: word.id, facet: "spelling", format: "mini_dictation", correct: false, position: state.position });
  }
  const worked = state.worked.includes(step.item.senseId) ? state.worked : [...state.worked, step.item.senseId];
  return {
    queue,
    parents,
    position: state.position + 1,
    relearning,
    firstResults,
    lastWrong: correct && !missedWords.length ? null : missedWords[missedWords.length - 1]?.id ?? step.parentId,
    victoryUsed: state.victoryUsed || step.stage === "victory",
    worked,
  };
}

/** A missed mini-dictée word as a stand-alone item that can come back. */
export function missedWordItem(word: { id: string; senseId: string; retry?: WordItemCore }): WordItem | null {
  if (!word.retry) return null;
  return { ...word.retry, id: `${word.id}:again`, retry: word.retry, rescue: undefined };
}
