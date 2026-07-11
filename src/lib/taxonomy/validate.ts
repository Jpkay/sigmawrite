import { createHash } from "node:crypto";
import { z } from "zod";

const levelRank = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 } as const;

const sourceSchema = z.object({
  key: z.string().min(1),
  version: z.string().min(1),
  rightsStatus: z.enum(["importable", "codes_only", "reference_only"]),
  checksum: z.string().min(1).optional(),
});

const evidenceSchema = z.object({
  key: z.string().min(1),
  actionFr: z.string().min(8),
  modality: z.enum(["reading", "writing", "listening", "speaking", "multimodal"]),
  expectation: z.enum(["receptive", "controlled_production", "independent_production"]),
  successCriteria: z.record(z.string(), z.unknown()),
});

const mappingSchema = z.object({
  learnerMode: z.enum([
    "french_first_language", "french_second_language", "heritage",
    "bilingual", "allophone", "immersion",
  ]),
  framework: z.enum(["native_grade", "cefr", "delf_dalf", "immersion", "local_curriculum"]),
  levelMin: z.string().min(1).optional(),
  levelMax: z.string().min(1).optional(),
  status: z.enum(["provisional", "reviewed", "disputed"]),
  sourceKey: z.string().min(1),
});

const nodeSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  strand: z.string().min(1),
  nodeType: z.enum(["conceptual", "procedural", "linguistic", "representational", "metacognitive"]),
  labelFr: z.string().min(3),
  descriptionFr: z.string().min(12),
  atomicityLevel: z.number().int().min(1).max(5),
  evidence: z.array(evidenceSchema).min(1),
  sourceKeys: z.array(z.string().min(1)).min(1),
  mappings: z.array(mappingSchema).default([]),
});

const edgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(["prerequisite", "encompasses", "misconception_related", "contrastive_transfer", "same_family", "remediates"]),
  prerequisiteClass: z.enum(["hard", "soft"]).optional(),
  rationale: z.string().min(8),
  sourceKey: z.string().min(1),
});

export const taxonomyCandidateSchema = z.object({
  release: z.object({
    key: z.string().min(1),
    version: z.string().min(1),
    ontologyVersion: z.string().min(1),
  }),
  sources: z.array(sourceSchema).min(1),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
});

export type TaxonomyCandidate = z.infer<typeof taxonomyCandidateSchema>;

export type TaxonomyIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  recordKeys: string[];
};

export type TaxonomyValidation = {
  valid: boolean;
  issues: TaxonomyIssue[];
  manifest: TaxonomyManifest;
};

export type TaxonomyManifest = {
  schemaVersion: 1;
  release: TaxonomyCandidate["release"];
  counts: { sources: number; nodes: number; edges: number; evidence: number; mappings: number };
  checksums: { sources: string; nodes: string; edges: string; content: string };
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function checksum(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableJson(value)).digest("hex")}`;
}

function sorted<T>(values: T[], key: (value: T) => string): T[] {
  return [...values].sort((left, right) => key(left).localeCompare(key(right)));
}

export function buildTaxonomyManifest(candidate: TaxonomyCandidate): TaxonomyManifest {
  const sources = sorted(candidate.sources, (source) => `${source.key}:${source.version}`);
  const nodes = sorted(candidate.nodes, (node) => node.key).map((node) => ({
    ...node,
    evidence: sorted(node.evidence, (evidence) => evidence.key),
    mappings: sorted(node.mappings, (mapping) => `${mapping.learnerMode}:${mapping.framework}:${mapping.levelMin ?? ""}`),
    sourceKeys: [...node.sourceKeys].sort(),
  }));
  const edges = sorted(candidate.edges, (edge) => `${edge.source}:${edge.target}:${edge.type}`);
  return {
    schemaVersion: 1,
    release: candidate.release,
    counts: {
      sources: sources.length,
      nodes: nodes.length,
      edges: edges.length,
      evidence: nodes.reduce((sum, node) => sum + node.evidence.length, 0),
      mappings: nodes.reduce((sum, node) => sum + node.mappings.length, 0),
    },
    checksums: {
      sources: checksum(sources),
      nodes: checksum(nodes),
      edges: checksum(edges),
      content: checksum({ release: candidate.release, sources, nodes, edges }),
    },
  };
}

function findPrerequisiteCycle(candidate: TaxonomyCandidate): string[] | null {
  const adjacency = new Map(candidate.nodes.map((node) => [node.key, [] as string[]]));
  for (const edge of candidate.edges) {
    if (edge.type === "prerequisite" && adjacency.has(edge.source)) {
      adjacency.get(edge.source)!.push(edge.target);
    }
  }
  for (const targets of adjacency.values()) targets.sort();
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const visit = (key: string): string[] | null => {
    if (active.has(key)) return [...stack.slice(stack.indexOf(key)), key];
    if (visited.has(key)) return null;
    active.add(key);
    stack.push(key);
    for (const target of adjacency.get(key) ?? []) {
      const cycle = visit(target);
      if (cycle) return cycle;
    }
    stack.pop();
    active.delete(key);
    visited.add(key);
    return null;
  };
  for (const key of [...adjacency.keys()].sort()) {
    const cycle = visit(key);
    if (cycle) return cycle;
  }
  return null;
}

function parseCandidate(input: unknown): { candidate?: TaxonomyCandidate; issues: TaxonomyIssue[] } {
  const parsed = taxonomyCandidateSchema.safeParse(input);
  if (parsed.success) return { candidate: parsed.data, issues: [] };
  return {
    issues: parsed.error.issues.map((issue) => ({
      severity: "error",
      code: "schema_invalid",
      message: `${issue.path.join(".") || "root"}: ${issue.message}`,
      recordKeys: issue.path.map(String),
    })),
  };
}

export function validateTaxonomy(input: unknown): TaxonomyValidation {
  const parsed = parseCandidate(input);
  if (!parsed.candidate) {
    const empty = { release: { key: "invalid", version: "invalid", ontologyVersion: "invalid" }, sources: [], nodes: [], edges: [] } as unknown as TaxonomyCandidate;
    return { valid: false, issues: parsed.issues, manifest: buildTaxonomyManifest(empty) };
  }
  const candidate = parsed.candidate;
  const issues: TaxonomyIssue[] = [];
  const add = (severity: TaxonomyIssue["severity"], code: string, message: string, recordKeys: string[]) =>
    issues.push({ severity, code, message, recordKeys });
  const sourceKeys = new Set(candidate.sources.map((source) => source.key));
  const nodeKeys = new Set(candidate.nodes.map((node) => node.key));

  for (const [kind, keys] of [
    ["source", candidate.sources.map((source) => source.key)],
    ["node", candidate.nodes.map((node) => node.key)],
    ["edge", candidate.edges.map((edge) => `${edge.source}:${edge.target}:${edge.type}`)],
  ] as const) {
    const seen = new Set<string>();
    for (const key of keys) {
      if (seen.has(key)) add("error", `duplicate_${kind}`, `Duplicate ${kind} key: ${key}`, [key]);
      seen.add(key);
    }
  }

  for (const node of candidate.nodes) {
    for (const sourceKey of node.sourceKeys) {
      if (!sourceKeys.has(sourceKey)) add("error", "missing_provenance", `Node ${node.key} references unknown source ${sourceKey}`, [node.key, sourceKey]);
    }
    for (const mapping of node.mappings) {
      if (!sourceKeys.has(mapping.sourceKey)) add("error", "missing_mapping_source", `Mapping on ${node.key} references unknown source ${mapping.sourceKey}`, [node.key, mapping.sourceKey]);
      if (mapping.framework === "cefr" && mapping.levelMin && mapping.levelMax) {
        const min = levelRank[mapping.levelMin as keyof typeof levelRank];
        const max = levelRank[mapping.levelMax as keyof typeof levelRank];
        if (!min || !max) add("error", "invalid_cefr", `Invalid CEFR range on ${node.key}`, [node.key]);
        else if (min > max) add("error", "reversed_cefr", `Reversed CEFR range on ${node.key}`, [node.key]);
      }
    }
    if (node.evidence.length === 0) add("error", "missing_evidence", `Node ${node.key} has no mastery evidence`, [node.key]);
    if (node.atomicityLevel < 3 || /\bet\b/i.test(node.labelFr)) {
      add("warning", "atomicity_review", `Node ${node.key} may combine independently teachable actions`, [node.key]);
    }
  }

  for (const edge of candidate.edges) {
    if (!nodeKeys.has(edge.source) || !nodeKeys.has(edge.target)) add("error", "dangling_edge", `Dangling edge ${edge.source} → ${edge.target}`, [edge.source, edge.target]);
    if (edge.source === edge.target) add("error", "self_loop", `Self-loop on ${edge.source}`, [edge.source]);
    if (!sourceKeys.has(edge.sourceKey)) add("error", "missing_edge_source", `Edge ${edge.source} → ${edge.target} has unknown provenance`, [edge.source, edge.target, edge.sourceKey]);
    if (edge.type === "prerequisite" && !edge.prerequisiteClass) add("error", "missing_prerequisite_class", `Prerequisite ${edge.source} → ${edge.target} is not hard or soft`, [edge.source, edge.target]);
    if (edge.type !== "prerequisite" && edge.prerequisiteClass) add("error", "unexpected_prerequisite_class", `Non-prerequisite edge ${edge.source} → ${edge.target} has a prerequisite class`, [edge.source, edge.target]);
    if (edge.type === "prerequisite" && nodeKeys.has(edge.source) && nodeKeys.has(edge.target)) {
      const source = candidate.nodes.find((node) => node.key === edge.source)!;
      const target = candidate.nodes.find((node) => node.key === edge.target)!;
      const sourceCefr = source.mappings.find((mapping) => mapping.framework === "cefr")?.levelMin;
      const targetCefr = target.mappings.find((mapping) => mapping.framework === "cefr")?.levelMin;
      if (sourceCefr && targetCefr && levelRank[sourceCefr as keyof typeof levelRank] > levelRank[targetCefr as keyof typeof levelRank]) {
        add("warning", "cefr_monotonicity", `Prerequisite ${source.key} starts after ${target.key} in CEFR mapping`, [source.key, target.key]);
      }
    }
  }
  const cycle = findPrerequisiteCycle(candidate);
  if (cycle) add("error", "prerequisite_cycle", `Prerequisite cycle: ${cycle.join(" → ")}`, cycle);

  issues.sort((left, right) => `${left.severity}:${left.code}:${left.recordKeys.join(":")}`.localeCompare(`${right.severity}:${right.code}:${right.recordKeys.join(":")}`));
  return { valid: !issues.some((issue) => issue.severity === "error"), issues, manifest: buildTaxonomyManifest(candidate) };
}

