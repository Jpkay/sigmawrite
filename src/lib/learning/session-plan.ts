/**
 * Session scheduler (gap-analysis Phase 2) — turns the "map" (learning path +
 * due reviews) into an "itinerary": what should this student do right now?
 *
 * Math-Academy-style loop:
 *  1. Repetition compression — prefer tasks whose encompassing closure knocks
 *     out the most due reviews (one passé-composé exercise can refresh three
 *     due sub-skills at once).
 *  2. Explicit reviews for whatever no task encompasses, most overdue first.
 *  3. New learning from the path frontier, guaranteed ≥25% of the session
 *     (review load must never starve progress).
 *  4. Interference-aware interleaving — adjacent activities avoid the same
 *     strand and `same_family` pairs (confusable skills are spaced apart,
 *     which is where the discrimination benefit of interleaving comes from).
 *
 * Pure → unit-tested. The DB loader lives in actions/student.ts.
 */

import type { EncompassingEdge } from "@/lib/graph/fire";

export type DueNodeReview = { nodeId: string; overdueDays: number };
export type DueCardReview = { cardId: string; nodeId: string | null; overdueDays: number };
export type NewStep = { nodeId: string; position: number };

/** A due word card (roadmap 2026-10 D.2): one FSRS trace of one sense. */
export type DueWordReview = { cardId: string; senseId: string; facet: "spelling" | "meaning"; retrievability: number };

export type WordBurstCard = { cardId: string; senseId: string; facet: "spelling" | "meaning" };

export type SessionActivity =
  | { type: "practice"; nodeId: string; role: "compression" | "new" }
  | { type: "review_node"; nodeId: string }
  | { type: "review_card"; cardId: string; nodeId: string | null }
  /** A short "rappel éclair": a few words, woven between other activities. */
  | { type: "review_word"; cards: WordBurstCard[]; senses: number; newWords: number; seconds: number };

export type SessionPlanInput = {
  dueNodeReviews: DueNodeReview[];
  dueCards: DueCardReview[];
  /** Available path steps, already in path order. */
  newSteps: NewStep[];
  encompassingEdges: EncompassingEdge[];
  /** same_family edges: pairs of confusable nodes to keep apart. */
  familyPairs: Array<[string, string]>;
  strandByNode?: Map<string, string>;
  /** Mean mastery of the currently introduced, unfinished frontier. */
  progressMastery?: number;
  /** Total activities in the plan (default 6). */
  budget?: number;
  /** Optional wall-clock cap for the complete daily itinerary. */
  durationBudgetMinutes?: number;
  /** Per-node override for longer activities such as independent production. */
  minutesByNode?: ReadonlyMap<string, number>;
  /** Due word cards, already capped by the daily word plan (C.5). */
  dueWords?: DueWordReview[];
  /** Words the daily word plan allows to introduce today (D.1). */
  newWords?: number;
  /** Vocabulary time inside the session (default about 4 minutes, rule 3). */
  wordBudgetMinutes?: number;
};

const DEFAULT_BUDGET = 6;
const COMPRESSION_MIN_WEIGHT = 0.3;
const COMPRESSION_MAX_DEPTH = 3;

/** Nodes reachable down the encompassing graph with path weight ≥ cutoff. */
function encompassingClosure(
  start: string,
  edges: EncompassingEdge[]
): Set<string> {
  const bySource = new Map<string, EncompassingEdge[]>();
  for (const edge of edges) {
    const list = bySource.get(edge.sourceNodeId) ?? [];
    list.push(edge);
    bySource.set(edge.sourceNodeId, list);
  }
  const closure = new Set<string>();
  let layer = new Map<string, number>([[start, 1]]);
  for (let depth = 0; depth < COMPRESSION_MAX_DEPTH && layer.size; depth += 1) {
    const next = new Map<string, number>();
    for (const [node, weight] of layer) {
      for (const edge of bySource.get(node) ?? []) {
        const w = weight * edge.strength;
        if (w < COMPRESSION_MIN_WEIGHT || edge.targetNodeId === start) continue;
        if (!closure.has(edge.targetNodeId)) {
          closure.add(edge.targetNodeId);
          next.set(edge.targetNodeId, w);
        }
      }
    }
    layer = next;
  }
  return closure;
}

const nodeOf = (a: SessionActivity): string | null =>
  a.type === "review_word" ? null : a.nodeId;

/** Greedy reorder so neighbours avoid same strand / same_family pairs. */
function interleave(
  activities: SessionActivity[],
  familyPairs: Array<[string, string]>,
  strandByNode?: Map<string, string>
): SessionActivity[] {
  const family = new Set(familyPairs.flatMap(([a, b]) => [`${a}:${b}`, `${b}:${a}`]));
  const clashes = (a: SessionActivity, b: SessionActivity): boolean => {
    const na = nodeOf(a);
    const nb = nodeOf(b);
    if (!na || !nb) return false;
    if (family.has(`${na}:${nb}`)) return true;
    const sa = strandByNode?.get(na);
    return sa !== undefined && sa === strandByNode?.get(nb);
  };
  const pool = [...activities];
  const ordered: SessionActivity[] = [];
  while (pool.length) {
    const prev = ordered[ordered.length - 1];
    const index = prev ? pool.findIndex((candidate) => !clashes(prev, candidate)) : 0;
    ordered.push(...pool.splice(index === -1 ? 0 : index, 1));
  }
  return ordered;
}

export function buildSessionPlan(input: SessionPlanInput): SessionActivity[] {
  const budget = input.budget ?? DEFAULT_BUDGET;
  const newTarget = Math.min(
    input.newSteps.length,
    newLearningSlots(input.progressMastery ?? 0.5, budget),
  );
  // With only one unique frontier step, showing at most three reviews keeps
  // the visible itinerary honest about the 25% new-learning promise. When no
  // frontier exists, all slots remain available for due review.
  const totalTarget = newTarget === 0 ? budget : Math.min(budget, newTarget * 4);
  const reviewBudget = totalTarget - newTarget;

  const dueNodes = new Set(input.dueNodeReviews.map((review) => review.nodeId));
  for (const card of input.dueCards) if (card.nodeId) dueNodes.add(card.nodeId);

  const activities: SessionActivity[] = [];
  const planned = new Set<string>();
  let plannedNew = 0;
  let plannedReviews = 0;

  // 1. Repetition compression: greedy max-cover over due nodes. Candidates
  //    are frontier steps and the due nodes themselves (an advanced due skill
  //    can clear its own due sub-skills).
  const candidates = [
    ...input.newSteps.map((step) => ({ nodeId: step.nodeId, isNew: true })),
    ...input.dueNodeReviews.map((review) => ({ nodeId: review.nodeId, isNew: false })),
  ];
  while (activities.length < totalTarget) {
    let best: { nodeId: string; isNew: boolean; covers: Set<string> } | null = null;
    for (const candidate of candidates) {
      if (planned.has(candidate.nodeId)) continue;
      if (candidate.isNew ? plannedNew >= newTarget : plannedReviews >= reviewBudget) continue;
      const closure = encompassingClosure(candidate.nodeId, input.encompassingEdges);
      const covers = new Set([...closure].filter((node) => dueNodes.has(node)));
      if (dueNodes.has(candidate.nodeId)) covers.add(candidate.nodeId);
      if (covers.size >= 2 && (best === null || covers.size > best.covers.size)) {
        best = { ...candidate, covers };
      }
    }
    if (!best) break;
    planned.add(best.nodeId);
    activities.push(
      best.isNew
        // It may also compress several reviews, but it still introduces a
        // frontier skill and therefore counts toward the new-learning promise.
        ? { type: "practice", nodeId: best.nodeId, role: "new" }
        : { type: "review_node", nodeId: best.nodeId }
    );
    if (best.isNew) plannedNew += 1;
    else plannedReviews += 1;
    for (const node of best.covers) dueNodes.delete(node);
    dueNodes.delete(best.nodeId);
  }

  // 2. Explicit reviews, most overdue first.
  const explicit: Array<{ activity: SessionActivity; overdueDays: number }> = [
    ...input.dueNodeReviews
      .filter((review) => dueNodes.has(review.nodeId))
      .map((review) => ({
        activity: { type: "review_node", nodeId: review.nodeId } as SessionActivity,
        overdueDays: review.overdueDays,
      })),
    ...input.dueCards
      .filter((card) => !card.nodeId || dueNodes.has(card.nodeId))
      .map((card) => ({
        activity: { type: "review_card", cardId: card.cardId, nodeId: card.nodeId } as SessionActivity,
        overdueDays: card.overdueDays,
      })),
  ].sort((a, b) => b.overdueDays - a.overdueDays);
  for (const { activity } of explicit) {
    if (plannedReviews >= reviewBudget) break;
    const node = nodeOf(activity);
    if (node && planned.has(node)) continue;
    if (node) planned.add(node);
    activities.push(activity);
    plannedReviews += 1;
  }

  // 3. New learning fills the rest (≥ the floor by construction).
  for (const step of input.newSteps) {
    if (plannedNew >= newTarget || activities.length >= totalTarget) break;
    if (planned.has(step.nodeId)) continue;
    planned.add(step.nodeId);
    activities.push({ type: "practice", nodeId: step.nodeId, role: "new" });
    plannedNew += 1;
  }

  // 4. Space confusable skills apart, then fit the actual daily time promise
  //    (minus the vocabulary time), then weave the word bursts in.
  const ordered = interleave(activities, input.familyPairs, input.strandByNode);
  const bursts = planWordBursts(input.dueWords ?? [], input.newWords ?? 0, input.wordBudgetMinutes ?? WORD_SESSION.budgetMinutes);
  const wordMinutes = Math.ceil(bursts.reduce((total, burst) => total + burst.seconds, 0) / 60);
  const fitted = input.durationBudgetMinutes == null
    ? ordered
    : fitDurationBudget(ordered, newTarget, Math.max(1, input.durationBudgetMinutes - wordMinutes), input.minutesByNode);
  return weaveWordBursts(fitted, bursts);
}

/**
 * Vocabulary inside the daily session (roadmap 2026-10 D.2, rules 3–4):
 * about 4 minutes, a few words at a time, never one block of word drills.
 */
export const WORD_SESSION = {
  budgetMinutes: 4,
  /** One trace of one word (about 12 s); both traces of a word share one item. */
  secondsPerCard: 12,
  secondsPerBothTraces: 16,
  secondsPerNewWord: 30,
  /** Backlog cap: never more cards than this in one session, whatever is due. */
  maxCards: 16,
  burstMin: 3,
  burstMax: 6,
} as const;

/**
 * Picks the word work that fits the vocabulary budget and cuts it into
 * bursts. Due cards are taken lowest retrievability first (the most at risk
 * of being forgotten), both traces of one word count as one item, and new
 * words only take the time reviews leave. Pure.
 */
export function planWordBursts(dueWords: DueWordReview[], newWords: number, budgetMinutes: number = WORD_SESSION.budgetMinutes): Array<Extract<SessionActivity, { type: "review_word" }>> {
  const budget = Math.max(0, budgetMinutes) * 60;
  const bySense = new Map<string, { cards: WordBurstCard[]; retrievability: number }>();
  for (const card of [...dueWords].sort((a, b) => a.retrievability - b.retrievability || a.cardId.localeCompare(b.cardId))) {
    const entry = bySense.get(card.senseId) ?? { cards: [], retrievability: card.retrievability };
    if (!entry.cards.some((existing) => existing.cardId === card.cardId)) entry.cards.push({ cardId: card.cardId, senseId: card.senseId, facet: card.facet });
    entry.retrievability = Math.min(entry.retrievability, card.retrievability);
    bySense.set(card.senseId, entry);
  }
  type Unit = { cards: WordBurstCard[]; newWord: boolean; seconds: number };
  const units: Unit[] = [];
  let used = 0;
  let cards = 0;
  for (const entry of bySense.values()) {
    const seconds = entry.cards.length > 1 ? WORD_SESSION.secondsPerBothTraces : WORD_SESSION.secondsPerCard;
    if (used + seconds > budget || cards + entry.cards.length > WORD_SESSION.maxCards) break;
    units.push({ cards: entry.cards, newWord: false, seconds });
    used += seconds;
    cards += entry.cards.length;
  }
  for (let index = 0; index < Math.max(0, Math.floor(newWords)); index++) {
    if (used + WORD_SESSION.secondsPerNewWord > budget) break;
    units.push({ cards: [], newWord: true, seconds: WORD_SESSION.secondsPerNewWord });
    used += WORD_SESSION.secondsPerNewWord;
  }
  if (!units.length) return [];
  // Small bursts (3–5 words); weaveWordBursts merges them when gaps are few.
  const burstCount = Math.max(1, Math.floor(units.length / WORD_SESSION.burstMin));
  const size = Math.ceil(units.length / burstCount);
  const bursts: Array<Extract<SessionActivity, { type: "review_word" }>> = [];
  for (let start = 0; start < units.length; start += size) {
    const slice = units.slice(start, start + size);
    bursts.push({
      type: "review_word",
      cards: slice.flatMap((unit) => unit.cards),
      senses: slice.filter((unit) => !unit.newWord).length,
      newWords: slice.filter((unit) => unit.newWord).length,
      seconds: slice.reduce((total, unit) => total + unit.seconds, 0),
    });
  }
  return bursts;
}

/**
 * Places word bursts between other activities: after the first one (the
 * session opens on content, rule 2), never two bursts side by side. Extra
 * bursts are merged into their neighbour when there are too few gaps, so the
 * words never form one long block in the middle of the plan.
 */
export function weaveWordBursts(activities: SessionActivity[], bursts: Array<Extract<SessionActivity, { type: "review_word" }>>): SessionActivity[] {
  if (!bursts.length) return activities;
  const others = activities.filter((activity) => activity.type !== "review_word");
  if (!others.length) return [mergeBursts(bursts)];
  const gaps = others.length; // after each other activity
  const groups: Array<Array<Extract<SessionActivity, { type: "review_word" }>>> = Array.from({ length: Math.min(gaps, bursts.length) }, () => []);
  bursts.forEach((burst, index) => groups[Math.floor((index * groups.length) / bursts.length)].push(burst));
  const placed = groups.map(mergeBursts);
  // Spread the bursts evenly over the gaps.
  const at = new Map<number, Extract<SessionActivity, { type: "review_word" }>>();
  placed.forEach((burst, index) => at.set(Math.min(gaps - 1, Math.floor((index * gaps) / placed.length)), burst));
  const out: SessionActivity[] = [];
  others.forEach((activity, index) => {
    out.push(activity);
    const burst = at.get(index);
    if (burst) out.push(burst);
  });
  return out;
}

function mergeBursts(bursts: Array<Extract<SessionActivity, { type: "review_word" }>>): Extract<SessionActivity, { type: "review_word" }> {
  return {
    type: "review_word",
    cards: bursts.flatMap((burst) => burst.cards),
    senses: bursts.reduce((total, burst) => total + burst.senses, 0),
    newWords: bursts.reduce((total, burst) => total + burst.newWords, 0),
    seconds: bursts.reduce((total, burst) => total + burst.seconds, 0),
  };
}

export function activityMinutes(activity: SessionActivity, minutesByNode?: ReadonlyMap<string, number>): number {
  if (activity.type === "review_word") return Math.max(1, Math.ceil(activity.seconds / 60));
  const nodeId = nodeOf(activity);
  if (nodeId && minutesByNode?.has(nodeId)) return minutesByNode.get(nodeId) as number;
  return activity.type === "review_card" ? 3 : 7;
}

function fitDurationBudget(
  activities: SessionActivity[],
  newFloor: number,
  durationBudgetMinutes: number,
  minutesByNode?: ReadonlyMap<string, number>,
): SessionActivity[] {
  const budget = Math.max(1, Math.floor(durationBudgetMinutes));
  const requiredNew = activities
    .filter((activity) => activity.type === "practice" && activity.role === "new")
    .slice(0, newFloor);
  const selected = new Set<SessionActivity>();
  let used = 0;
  let selectedNew = 0;
  for (const activity of requiredNew) {
    const minutes = activityMinutes(activity, minutesByNode);
    if (used + minutes <= budget) {
      selected.add(activity);
      used += minutes;
      selectedNew += 1;
    }
  }
  for (const activity of activities) {
    if (selected.has(activity)) continue;
    const minutes = activityMinutes(activity, minutesByNode);
    if (used + minutes > budget) continue;
    const activityIsNew = activity.type === "practice" && activity.role === "new";
    const nextNew = selectedNew + Number(activityIsNew);
    const newCandidatesExist = activities.some((candidate) => candidate.type === "practice" && candidate.role === "new");
    // A wall-clock cap can reduce the original activity count, so enforce the
    // 25% contract against the itinerary that will actually be shown.
    if (newCandidatesExist && nextNew < Math.ceil((selected.size + 1) * 0.25)) continue;
    selected.add(activity);
    used += minutes;
    selectedNew = nextNew;
  }
  return activities.filter((activity) => selected.has(activity));
}

/** A weak frontier is review-heavy but never frozen; a strong frontier moves
 * faster but always retains at least one review slot while unfinished skills
 * remain due. */
export function newLearningSlots(progressMastery: number, budget = DEFAULT_BUDGET): number {
  const mastery = Math.max(0, Math.min(1, progressMastery));
  const share = mastery < 0.45 ? 0.17 : mastery < 0.65 ? 0.34 : mastery < 0.85 ? 0.5 : 0.67;
  const documentedFloor = Math.ceil(budget * 0.25);
  return Math.max(documentedFloor, Math.min(Math.max(1, budget - 1), Math.round(budget * share)));
}
