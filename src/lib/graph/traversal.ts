/**
 * Pure in-memory graph traversal (Roadmap Phase 7, Stream B).
 *
 * This mirrors the SQL functions in migration 0010 and is the reference
 * implementation used by (a) unit tests, (b) Gate-1 authoring-time validation
 * (cycle detection, monotonicity), and (c) offline reasoning before content is
 * persisted. The DB versions serve the live, per-student hot path; these serve
 * correctness and authoring. Both must agree.
 *
 * Edge direction (prerequisite): source → target means "source must be mastered
 * before target". Prerequisites of X = sources of edges whose target is X.
 */

import type { CompetencyEdge, CompetencyEstimate, GoalScope, Strand } from "./types";

/** Adjacency over prerequisite edges only, both directions, built once. */
export class PrereqGraph {
  /** node → its direct prerequisites (upstream). */
  private readonly prereqsOf = new Map<string, Set<string>>();
  /** node → nodes it directly unlocks (downstream). */
  private readonly unlocks = new Map<string, Set<string>>();
  readonly nodeIds: Set<string>;

  constructor(nodeIds: Iterable<string>, edges: CompetencyEdge[]) {
    this.nodeIds = new Set(nodeIds);
    for (const e of edges) {
      if (e.edgeType !== "prerequisite") continue;
      add(this.prereqsOf, e.targetNodeId, e.sourceNodeId);
      add(this.unlocks, e.sourceNodeId, e.targetNodeId);
    }
  }

  directPrerequisites(nodeId: string): string[] {
    return [...(this.prereqsOf.get(nodeId) ?? [])];
  }

  directDependents(nodeId: string): string[] {
    return [...(this.unlocks.get(nodeId) ?? [])];
  }

  /** All transitive prerequisites with shortest hop depth (depth guard 50). */
  prerequisites(nodeId: string): Map<string, number> {
    return bfs(nodeId, (n) => this.prereqsOf.get(n));
  }

  /** All transitive dependents with shortest hop depth. */
  dependents(nodeId: string): Map<string, number> {
    return bfs(nodeId, (n) => this.unlocks.get(n));
  }

  /**
   * Ready-to-learn frontier (KST fringe): nodes not yet mastered whose direct
   * prerequisites are all mastered. Optionally scoped to a goal's strands.
   */
  readyToLearn(
    estimates: Map<string, CompetencyEstimate>,
    scope: GoalScope,
    strandOf: (nodeId: string) => Strand | undefined
  ): string[] {
    const threshold = scope.masteryThreshold;
    const mastered = (id: string) =>
      (estimates.get(id)?.masteryProbability ?? 0) >= threshold;
    const out: string[] = [];
    for (const id of this.nodeIds) {
      if (scope.strands && !scope.strands.includes(strandOf(id) as Strand)) continue;
      if (mastered(id)) continue;
      if (this.directPrerequisites(id).every(mastered)) out.push(id);
    }
    return out;
  }

  /**
   * Catch-up path to a target: every unmastered transitive prerequisite plus
   * the target, ordered deepest-foundation-first (a valid topological order).
   */
  catchUpPath(
    targetNodeId: string,
    estimates: Map<string, CompetencyEstimate>,
    threshold = 0.85
  ): { nodeId: string; depth: number; mastery: number }[] {
    const mastery = (id: string) => estimates.get(id)?.masteryProbability ?? 0;
    const rows = [...this.prerequisites(targetNodeId)]
      .map(([nodeId, depth]) => ({ nodeId, depth, mastery: mastery(nodeId) }))
      .filter((r) => r.mastery < threshold);
    rows.push({ nodeId: targetNodeId, depth: 0, mastery: mastery(targetNodeId) });
    return rows.sort(
      (a, b) => b.depth - a.depth || a.nodeId.localeCompare(b.nodeId)
    );
  }

  /**
   * Cycle detection for Gate-1 validation. Returns one example cycle (node ids)
   * if the prerequisite graph is not a DAG, else null.
   */
  findCycle(): string[] | null {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    const stack: string[] = [];
    for (const id of this.nodeIds) color.set(id, WHITE);

    const visit = (n: string): string[] | null => {
      color.set(n, GRAY);
      stack.push(n);
      for (const m of this.unlocks.get(n) ?? []) {
        if (color.get(m) === GRAY) {
          // found a back-edge; slice the stack from m to close the cycle
          return [...stack.slice(stack.indexOf(m)), m];
        }
        if (color.get(m) === WHITE) {
          const c = visit(m);
          if (c) return c;
        }
      }
      stack.pop();
      color.set(n, BLACK);
      return null;
    };

    for (const id of this.nodeIds) {
      if (color.get(id) === WHITE) {
        const c = visit(id);
        if (c) return c;
      }
    }
    return null;
  }

  /** Topological order (deepest prerequisites first). Throws on a cycle. */
  topoOrder(): string[] {
    const indeg = new Map<string, number>();
    for (const id of this.nodeIds) indeg.set(id, this.directPrerequisites(id).length);
    const queue = [...this.nodeIds].filter((id) => (indeg.get(id) ?? 0) === 0).sort();
    const order: string[] = [];
    while (queue.length) {
      const n = queue.shift() as string;
      order.push(n);
      for (const m of this.directDependents(n).sort()) {
        const d = (indeg.get(m) ?? 0) - 1;
        indeg.set(m, d);
        if (d === 0) queue.push(m);
      }
    }
    if (order.length !== this.nodeIds.size) {
      throw new Error("topoOrder: graph is not a DAG");
    }
    return order;
  }
}

function add(m: Map<string, Set<string>>, k: string, v: string) {
  let s = m.get(k);
  if (!s) m.set(k, (s = new Set()));
  s.add(v);
}

/** Breadth-first with shortest-depth bookkeeping and a cycle depth guard. */
function bfs(
  start: string,
  neighbors: (n: string) => Set<string> | undefined
): Map<string, number> {
  const seen = new Map<string, number>();
  let frontier = [...(neighbors(start) ?? [])];
  let depth = 1;
  while (frontier.length && depth < 50) {
    const next: string[] = [];
    for (const n of frontier) {
      if (!seen.has(n)) {
        seen.set(n, depth);
        next.push(n);
      }
    }
    frontier = next.flatMap((n) => [...(neighbors(n) ?? [])]);
    depth++;
  }
  return seen;
}
