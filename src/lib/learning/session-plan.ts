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

export type SessionActivity =
  | { type: "practice"; nodeId: string; role: "compression" | "new" }
  | { type: "review_node"; nodeId: string }
  | { type: "review_card"; cardId: string; nodeId: string | null };

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
  a.type === "review_card" ? a.nodeId : a.nodeId;

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

  // 4. Space confusable skills apart, then fit the actual daily time promise.
  const ordered = interleave(activities, input.familyPairs, input.strandByNode);
  return input.durationBudgetMinutes == null
    ? ordered
    : fitDurationBudget(ordered, newTarget, input.durationBudgetMinutes, input.minutesByNode);
}

export function activityMinutes(activity: SessionActivity, minutesByNode?: ReadonlyMap<string, number>): number {
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
