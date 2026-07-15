/**
 * Goal-conditioned adaptive diagnostic engine (Roadmap Phase 10).
 *
 * Locates a student's *frontier* on the competency graph in as few probes as
 * possible, by exploiting the prerequisite structure (Knowledge Space Theory):
 *   - probe high, high-uncertainty nodes first (a correct answer presumes the
 *     whole prerequisite subtree mastered — big information gain);
 *   - on a wrong answer, descend to the node's prerequisites to localize the gap.
 *
 * Estimates start at a 0.5 prior (maximum uncertainty), so with a reliable item
 * (low guess) a single probe is decisive — correct → ~0.9 (mastered), wrong →
 * ~0.23 (missing). That is the binary-search behaviour that makes diagnosis short.
 *
 * Pure functions over an in-memory PrereqGraph; the same estimates persist to
 * student_competency_estimates server-side.
 */

import { bktUpdate, masteryUncertainty } from "@/lib/scoring/bkt";
import type { PrereqGraph } from "@/lib/graph/traversal";
import type { CompetencyEstimate, GoalScope, Strand } from "@/lib/graph/types";

export type DiagnosticNodeClassification = "mastered" | "fragile" | "missing" | "unknown";

export type DiagEstimate = {
  masteryProbability: number;
  uncertainty: number;
  evidenceCount: number;
  /** True only when the direct probes cover every assessable evidence type
   * pinned for this node (for example recognition and production). */
  evidenceCoverageConfirmed?: boolean;
  /** Inferred from a downstream success rather than directly tested (KST). */
  presumed: boolean;
  /** Expectation-aware persisted classification. Aggregate probability alone
   * cannot reveal that (for example) production is weaker than recognition. */
  classification?: DiagnosticNodeClassification;
};

export function hasConfirmedDirectEvidence(
  estimate: Pick<DiagEstimate, "evidenceCount" | "evidenceCoverageConfirmed">,
) {
  return estimate.evidenceCoverageConfirmed ?? estimate.evidenceCount >= 2;
}

export const DIAGNOSTIC_PRIOR = 0.5;

export function initEstimate(): DiagEstimate {
  return { masteryProbability: DIAGNOSTIC_PRIOR, uncertainty: 1, evidenceCount: 0, presumed: false };
}

export type DiagState = {
  estimates: Map<string, DiagEstimate>;
  asked: Map<string, number>;
  /** Last node answered wrong — drives the descend-on-failure focus. */
  lastFailed?: string;
};

export function initDiagState(): DiagState {
  return { estimates: new Map(), asked: new Map(), lastFailed: undefined };
}

export type ProbeConfig = {
  masteryThreshold?: number; // default 0.85
  stopUncertainty?: number; // default 0.4 — below this a node is "resolved"
  maxPerNode?: number; // default 3
  guess?: number; // P(right | not known); short-answer ~0.1, MCQ ~1/choices
};

const DEFAULTS: Required<Omit<ProbeConfig, "guess">> = {
  masteryThreshold: 0.85,
  stopUncertainty: 0.4,
  maxPerNode: 3,
};

type GraphLike = Pick<
  PrereqGraph,
  "nodeIds" | "directPrerequisites" | "prerequisites"
>;

function inScope(
  nodeId: string,
  scope: GoalScope,
  strandOf: (id: string) => Strand | undefined
): boolean {
  if (!scope.strands) return true;
  const s = strandOf(nodeId);
  return s != null && scope.strands.includes(s);
}

/** Choose the next node to probe, or null when the frontier is resolved. */
export function selectNextProbe(
  graph: GraphLike,
  state: DiagState,
  scope: GoalScope,
  strandOf: (id: string) => Strand | undefined,
  cfg: ProbeConfig = {}
): string | null {
  const { stopUncertainty, maxPerNode } = { ...DEFAULTS, ...cfg };
  const est = (id: string) => state.estimates.get(id) ?? initEstimate();

  const candidates = [...graph.nodeIds].filter((id) => {
    if (!inScope(id, scope, strandOf)) return false;
    const e = est(id);
    return (
      !e.presumed &&
      e.uncertainty > stopUncertainty &&
      (state.asked.get(id) ?? 0) < maxPerNode
    );
  });
  if (candidates.length === 0) return null;

  // Descend on failure: prefer the failed node's still-open prerequisites.
  if (state.lastFailed) {
    const foci = graph
      .directPrerequisites(state.lastFailed)
      .filter((id) => candidates.includes(id));
    if (foci.length) return argmax(foci, (id) => est(id).uncertainty);
  }

  // Otherwise prefer high-uncertainty, high-prune nodes (many prerequisites →
  // a correct answer prunes the most via presumption).
  return argmax(candidates, (id) => {
    const pruneWeight = 1 + Math.log(1 + graph.prerequisites(id).size);
    return est(id).uncertainty * pruneWeight;
  });
}

/** Fold one observation into the state (returns a new state; pure). */
export function applyEvidence(
  graph: GraphLike,
  state: DiagState,
  nodeId: string,
  correct: boolean,
  cfg: ProbeConfig = {}
): DiagState {
  const guess = cfg.guess ?? 0.1;
  const estimates = new Map(state.estimates);
  const asked = new Map(state.asked);

  const prev = estimates.get(nodeId) ?? initEstimate();
  const p = bktUpdate(prev.masteryProbability, correct, {}, guess);
  const evidenceCount = prev.evidenceCount + 1;
  estimates.set(nodeId, {
    masteryProbability: p,
    evidenceCount,
    evidenceCoverageConfirmed: evidenceCount >= 2,
    uncertainty: masteryUncertainty(p, evidenceCount),
    presumed: false,
  });
  asked.set(nodeId, (asked.get(nodeId) ?? 0) + 1);

  let lastFailed: string | undefined;
  if (correct) {
    // Presume the whole prerequisite subtree known (untested nodes only).
    for (const pre of graph.prerequisites(nodeId).keys()) {
      const pe = estimates.get(pre) ?? initEstimate();
      if (pe.evidenceCount === 0 && pe.masteryProbability < p) {
        estimates.set(pre, {
          masteryProbability: Math.min(p, 0.9),
          uncertainty: 0.35,
          evidenceCount: 0,
          presumed: true,
        });
      }
    }
  } else {
    // Descend: re-open any presumed direct prerequisites so they get tested.
    for (const pre of graph.directPrerequisites(nodeId)) {
      const pe = estimates.get(pre);
      if (pe?.presumed) estimates.set(pre, { ...pe, presumed: false, uncertainty: 1 });
    }
    lastFailed = nodeId;
  }

  return { estimates, asked, lastFailed };
}

/** Project diagnostic estimates onto the CompetencyEstimate shape the graph
 *  traversal helpers (readyToLearn / catchUpPath) expect. */
export function toMasteryMap(
  estimates: Map<string, DiagEstimate>,
  masteryThreshold = 0.85,
): Map<string, CompetencyEstimate> {
  const out = new Map<string, CompetencyEstimate>();
  for (const [nodeId, e] of estimates) {
    const unresolvedByClassification = e.classification !== undefined
      && e.classification !== "mastered";
    out.set(nodeId, {
      nodeId,
      masteryProbability: unresolvedByClassification
        || (!e.presumed && !hasConfirmedDirectEvidence(e))
        ? Math.min(e.masteryProbability, Math.max(0, masteryThreshold - 0.01))
        : e.masteryProbability,
      uncertainty: e.uncertainty,
      evidenceCount: e.evidenceCount,
    });
  }
  return out;
}

function argmax<T>(items: T[], score: (t: T) => number): T {
  let best = items[0];
  let bestScore = score(best);
  for (const it of items.slice(1)) {
    const s = score(it);
    if (s > bestScore) {
      best = it;
      bestScore = s;
    }
  }
  return best;
}
