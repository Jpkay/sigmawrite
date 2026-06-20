/**
 * Knowledge-graph domain types (Roadmap Phase 7).
 * Application-level shapes; DB rows live in supabase/migrations/0008+.
 * One shared graph; overlays (native / FSL / heritage) are tags on universal
 * nodes, and a goal is a scoping function over the graph.
 */

export const STRANDS = [
  "orthographe_lexicale",
  "orthographe_grammaticale",
  "grammaire_syntaxe",
  "conjugaison",
  "lexique",
  "comprehension_orale",
  "production_orale",
  "comprehension_ecrite",
  "expression_ecrite",
  "analyse",
] as const;
export type Strand = (typeof STRANDS)[number];

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** A1<A2<…<C2 as 1..6; null for unknown. Mirrors SQL public.cefr_rank(). */
export function cefrRank(level: CefrLevel | null | undefined): number | null {
  if (!level) return null;
  const i = CEFR_LEVELS.indexOf(level);
  return i < 0 ? null : i + 1;
}

export const EDGE_TYPES = [
  "prerequisite",
  "encompasses",
  "misconception_related",
  "contrastive_transfer",
  "same_family",
  "remediates",
] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

export const LEARNER_MODES = [
  "native",
  "fsl",
  "heritage",
  "allophone",
  "immersion",
  "shared",
] as const;
export type LearnerMode = (typeof LEARNER_MODES)[number];

export const MODALITIES = [
  "reading",
  "writing",
  "listening",
  "speaking",
  "grammar_analysis",
  "dictee",
] as const;
export type Modality = (typeof MODALITIES)[number];

export type CompetencyNode = {
  id: string;
  key: string;
  strand: Strand;
  labelFr: string;
  descriptionFr?: string;
  atomicityLevel: number; // 1 broad … 5 atomic
  nativeGradeMin?: number | null;
  nativeGradeMax?: number | null;
  cefrMin?: CefrLevel | null;
  cefrMax?: CefrLevel | null;
};

export type CompetencyEdge = {
  sourceNodeId: string; // prerequisite (source) → dependent (target)
  targetNodeId: string;
  edgeType: EdgeType;
  strength?: number;
};

/** Per-student, per-node mastery. Receptive vs productive is first-class. */
export type CompetencyEstimate = {
  nodeId: string;
  masteryProbability: number; // BKT p(known), 0–1
  uncertainty: number; // 0–1
  receptiveScore?: number | null;
  productiveScore?: number | null;
  evidenceCount: number;
};

/** A goal scopes the graph: which strands count, and the mastery bar. */
export type GoalScope = {
  strands?: Strand[];
  masteryThreshold: number; // default 0.85
};
