/**
 * Successive relearning inside one session (roadmap 2026-10 C.4).
 *
 * A missed word comes back 2–4 items later, in a different format, until
 * the student gets it right once. Retries are logged as evidence but never
 * update FSRS: only the first attempt of the day does (see
 * card-scheduler.countsForFsrs). Pure and serialisable, so the session
 * player can keep the queue in client state or in the session row.
 */
import type { WordActivityFormat, WordFacet } from "./types";

export const RELEARNING_RULES = {
  minGap: 2,
  maxGap: 4,
  /** Stop re-asking after this many misses in one session; the card is already rated Again. */
  maxRetries: 3,
} as const;

export type RelearningEntry = {
  senseId: string;
  facet: WordFacet;
  /** Formats already used for this word in the session, most recent last. */
  formatsUsed: WordActivityFormat[];
  misses: number;
  /** Session position (0-based item index) at which the word may come back. */
  dueAtPosition: number;
};

export type RelearningQueue = { entries: RelearningEntry[]; resolved: string[] };

export const emptyRelearningQueue = (): RelearningQueue => ({ entries: [], resolved: [] });

const keyOf = (senseId: string, facet: WordFacet) => `${senseId}:${facet}`;

function gapFor(senseId: string, misses: number): number {
  let hash = 2166136261;
  for (const char of `${senseId}:${misses}`) { hash ^= char.codePointAt(0)!; hash = Math.imul(hash, 16777619) >>> 0; }
  const span = RELEARNING_RULES.maxGap - RELEARNING_RULES.minGap + 1;
  return RELEARNING_RULES.minGap + (hash % span);
}

/**
 * Records an answer given at session `position`. A miss (re)queues the word
 * 2–4 items later; a success resolves it. Returns a new queue.
 */
export function recordSessionAttempt(queue: RelearningQueue, attempt: {
  senseId: string;
  facet: WordFacet;
  format: WordActivityFormat;
  correct: boolean;
  position: number;
}): RelearningQueue {
  const key = keyOf(attempt.senseId, attempt.facet);
  const existing = queue.entries.find((entry) => keyOf(entry.senseId, entry.facet) === key);
  const others = queue.entries.filter((entry) => entry !== existing);
  if (attempt.correct) {
    return { entries: others, resolved: existing ? [...queue.resolved, key] : queue.resolved };
  }
  const misses = (existing?.misses ?? 0) + 1;
  if (misses > RELEARNING_RULES.maxRetries) return { entries: others, resolved: queue.resolved };
  const entry: RelearningEntry = {
    senseId: attempt.senseId,
    facet: attempt.facet,
    formatsUsed: [...(existing?.formatsUsed ?? []), attempt.format],
    misses,
    dueAtPosition: attempt.position + gapFor(attempt.senseId, misses),
  };
  return { entries: [...others, entry], resolved: queue.resolved };
}

/**
 * The relearning item to insert at `position`, if one is due, with a format
 * the student has not just used for that word. `formatsFor` lists the
 * formats available for the word (Phase D decides what it can render).
 */
export function nextRelearningItem(
  queue: RelearningQueue,
  position: number,
  formatsFor: (entry: RelearningEntry) => WordActivityFormat[],
): { entry: RelearningEntry; format: WordActivityFormat } | null {
  const due = queue.entries
    .filter((entry) => entry.dueAtPosition <= position)
    .sort((a, b) => a.dueAtPosition - b.dueAtPosition || a.senseId.localeCompare(b.senseId));
  for (const entry of due) {
    const formats = formatsFor(entry);
    if (!formats.length) continue;
    const last = entry.formatsUsed[entry.formatsUsed.length - 1];
    const fresh = formats.filter((format) => !entry.formatsUsed.includes(format));
    const format = fresh[0] ?? formats.find((candidate) => candidate !== last) ?? formats[0];
    return { entry, format };
  }
  return null;
}

/** Words still waiting for their one correct answer when the session ends. */
export function unresolvedRelearning(queue: RelearningQueue): RelearningEntry[] {
  return [...queue.entries];
}
