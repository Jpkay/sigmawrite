import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CompetencyItemRow = {
  id: string; nodeId: string; nodeKey: string; nodeLabel: string; strand: string;
  promptFr: string; correctAnswer: string | null; responseType: string; validatorType: string;
  difficulty: number | null; reviewStatus: string; qcGates: Record<string, unknown>;
  reviewNote: string | null;
  psychometricFlags: unknown[]; generationModel: string | null; promptVersion: string | null;
  diagnostic: {
    sectionKey: string;
    evidenceExpectation: string;
    evidenceKey: string;
    observableActionFr: string;
    successCriteria: Record<string, unknown>;
    promptFamily: string;
    difficultyTier: string;
  } | null;
  choices: Array<{ id: string; text: string; correct: boolean; feedbackFr: string | null }>;
};

export async function getCompetencyItems(filters: { status?: string; node?: string; promptVersion?: string; section?: string; difficultyTier?: string; reviewerProfileId?: string; ids?: string[]; offset?: number; limit?: number } = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const membershipJoin = filters.section || filters.difficultyTier
    ? "diagnostic_item_bank_memberships!inner"
    : "diagnostic_item_bank_memberships";
  const limit = filters.limit ?? 500;
  const offset = Math.max(0, filters.offset ?? 0);
  const itemSelect: string = `id,primary_node_id,strand,prompt_fr,correct_answer,response_type,validator_type,difficulty,review_status,review_note,qc_gates,psychometric_flags,generation_model,prompt_version,competency_nodes!inner(key,label_fr),competency_item_choices(id,choice_text,is_correct,feedback_fr),${membershipJoin}(bank_release_id,mastery_evidence_id,section_key,evidence_expectation,prompt_family,difficulty_tier)${filters.reviewerProfileId ? ",competency_item_review_assignments!inner(reviewer_profile_id,status)" : ""}`;
  let query = supabase.from("competency_items").select(itemSelect).order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
  if (filters.status) query = query.eq("review_status", filters.status);
  if (filters.node) query = query.eq("competency_nodes.key", filters.node);
  if (filters.promptVersion) query = query.eq("prompt_version", filters.promptVersion);
  if (filters.ids) query = query.in("id", filters.ids);
  if (filters.section) query = query.eq("diagnostic_item_bank_memberships.section_key", filters.section);
  if (filters.difficultyTier) query = query.eq("diagnostic_item_bank_memberships.difficulty_tier", filters.difficultyTier);
  if (filters.reviewerProfileId) query = query
    .eq("competency_item_review_assignments.reviewer_profile_id", filters.reviewerProfileId)
    .eq("competency_item_review_assignments.status", "assigned");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  type DiagnosticMembership = {
    bank_release_id: string;
    mastery_evidence_id: string;
    section_key: string;
    evidence_expectation: string;
    prompt_family: string;
    difficulty_tier: string;
  };
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const diagnosticMemberships = rows.flatMap((row) =>
    (row.diagnostic_item_bank_memberships ?? []) as unknown as DiagnosticMembership[]
  );
  const bankReleaseIds = [...new Set(diagnosticMemberships.map((row) => row.bank_release_id))];
  const bankTaxonomyById = new Map<string, string>();
  const evidenceSnapshotByReleaseAndId = new Map<string, Record<string, unknown>>();
  if (bankReleaseIds.length) {
    const { data: bankRows, error: bankError } = await supabase.from("diagnostic_item_bank_releases")
      .select("id,taxonomy_release_id")
      .in("id", bankReleaseIds);
    if (bankError) throw new Error(bankError.message);
    for (const row of bankRows ?? []) bankTaxonomyById.set(row.id as string, row.taxonomy_release_id as string);
    const taxonomyReleaseIds = [...new Set(bankTaxonomyById.values())];
    const evidenceIds = [...new Set(diagnosticMemberships.map((row) => row.mastery_evidence_id))];
    const { data: snapshotRows, error: snapshotError } = await supabase.from("taxonomy_release_memberships")
      .select("release_id,record_id,record_snapshot")
      .in("release_id", taxonomyReleaseIds)
      .eq("record_type", "mastery_evidence")
      .in("record_id", evidenceIds);
    if (snapshotError) throw new Error(snapshotError.message);
    for (const row of snapshotRows ?? []) {
      evidenceSnapshotByReleaseAndId.set(
        `${row.release_id}:${row.record_id}`,
        row.record_snapshot as Record<string, unknown>,
      );
    }
  }
  return rows.map((row) => {
    const node = row.competency_nodes as unknown as { key: string; label_fr: string };
    const choices = row.competency_item_choices as unknown as Array<{ id: string; choice_text: string; is_correct: boolean; feedback_fr: string | null }>;
    const diagnostic = ((row.diagnostic_item_bank_memberships ?? []) as unknown as DiagnosticMembership[])[0];
    const taxonomyReleaseId = diagnostic ? bankTaxonomyById.get(diagnostic.bank_release_id) : null;
    const evidenceSnapshot = diagnostic && taxonomyReleaseId
      ? evidenceSnapshotByReleaseAndId.get(`${taxonomyReleaseId}:${diagnostic.mastery_evidence_id}`)
      : null;
    return {
      id: row.id as string, nodeId: row.primary_node_id as string, nodeKey: node.key, nodeLabel: node.label_fr,
      strand: row.strand as string, promptFr: row.prompt_fr as string, correctAnswer: row.correct_answer as string | null,
      responseType: row.response_type as string, validatorType: row.validator_type as string,
      difficulty: row.difficulty == null ? null : Number(row.difficulty), reviewStatus: row.review_status as string,
      reviewNote: row.review_note as string | null,
      qcGates: (row.qc_gates ?? {}) as Record<string, unknown>, psychometricFlags: (row.psychometric_flags ?? []) as unknown[],
      generationModel: row.generation_model as string | null, promptVersion: row.prompt_version as string | null,
      diagnostic: diagnostic ? {
        sectionKey: diagnostic.section_key,
        evidenceExpectation: typeof evidenceSnapshot?.expectation === "string"
          ? evidenceSnapshot.expectation
          : diagnostic.evidence_expectation,
        evidenceKey: typeof evidenceSnapshot?.key === "string" ? evidenceSnapshot.key : "—",
        observableActionFr: typeof evidenceSnapshot?.actionFr === "string"
          ? evidenceSnapshot.actionFr
          : "Action observable indisponible.",
        successCriteria: evidenceSnapshot?.successCriteria
          && typeof evidenceSnapshot.successCriteria === "object"
          ? evidenceSnapshot.successCriteria as Record<string, unknown>
          : {},
        promptFamily: diagnostic.prompt_family,
        difficultyTier: diagnostic.difficulty_tier,
      } : null,
      choices: choices.map((choice) => ({ id: choice.id, text: choice.choice_text, correct: choice.is_correct, feedbackFr: choice.feedback_fr })),
    } satisfies CompetencyItemRow;
  });
}

export async function getAssignedCompetencyItems(filters: {
  reviewerProfileId: string;
  section?: string;
  difficultyTier?: string;
  itemId?: string;
  includeSubmitted?: boolean;
  offset?: number;
  limit?: number;
}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, filters.limit ?? 24);
  let query = supabase.from("competency_item_review_assignments")
    .select("item_id,queue_position,competency_items!inner(review_status,prompt_version,diagnostic_item_bank_memberships!inner(section_key,difficulty_tier))")
    .eq("reviewer_profile_id", filters.reviewerProfileId)
    .eq("competency_items.prompt_version", "diagnostic-bank-v2")
    .order("queue_position", { ascending: true })
    .range(offset, offset + limit - 1);
  if (!filters.includeSubmitted) {
    query = query.eq("status", "assigned").eq("competency_items.review_status", "needs_human_review");
  }
  if (filters.itemId) query = query.eq("item_id", filters.itemId);
  if (filters.section) {
    query = query.eq("competency_items.diagnostic_item_bank_memberships.section_key", filters.section);
  }
  if (filters.difficultyTier) {
    query = query.eq("competency_items.diagnostic_item_bank_memberships.difficulty_tier", filters.difficultyTier);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const itemIds = (data ?? []).map((row) => row.item_id as string);
  if (!itemIds.length) return [];
  const items = await getCompetencyItems({ ids: itemIds, limit: itemIds.length }, supabase);
  const positionById = new Map(itemIds.map((id, index) => [id, index]));
  return items.sort((a, b) => (positionById.get(a.id) ?? 0) - (positionById.get(b.id) ?? 0));
}

export type ReviewerExerciseHistoryRow = {
  itemId: string;
  sectionKey: string;
  nodeLabel: string;
  decision: "human_approved" | "rejected";
  submittedAt: string;
};

export async function getReviewerExerciseHistory(reviewerProfileId: string, client?: SupabaseClient): Promise<ReviewerExerciseHistoryRow[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("competency_item_review_assignments")
    .select("item_id,decision,submitted_at,competency_items!inner(competency_nodes!inner(label_fr),diagnostic_item_bank_memberships!inner(section_key))")
    .eq("reviewer_profile_id", reviewerProfileId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const item = row.competency_items as unknown as { competency_nodes: { label_fr: string }; diagnostic_item_bank_memberships: Array<{ section_key: string }> };
    return {
      itemId: row.item_id as string,
      sectionKey: item.diagnostic_item_bank_memberships[0]?.section_key ?? "",
      nodeLabel: item.competency_nodes.label_fr,
      decision: row.decision as "human_approved" | "rejected",
      submittedAt: row.submitted_at as string,
    };
  });
}

export async function getDiagnosticItemReviewCount(filters: { section?: string; difficultyTier?: string; reviewerProfileId?: string } = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const assignmentJoin = filters.reviewerProfileId
    ? ",competency_item_review_assignments!inner(reviewer_profile_id,status)"
    : "";
  let query = supabase.from("competency_items")
    .select(`id,diagnostic_item_bank_memberships!inner(section_key,difficulty_tier)${assignmentJoin}`, { count: "exact", head: true })
    .eq("prompt_version", "diagnostic-bank-v2")
    .eq("review_status", "needs_human_review");
  if (filters.section) query = query.eq("diagnostic_item_bank_memberships.section_key", filters.section);
  if (filters.difficultyTier) query = query.eq("diagnostic_item_bank_memberships.difficulty_tier", filters.difficultyTier);
  if (filters.reviewerProfileId) query = query
    .eq("competency_item_review_assignments.reviewer_profile_id", filters.reviewerProfileId)
    .eq("competency_item_review_assignments.status", "assigned");
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getGenerationRuns(client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("generation_runs").select("*").order("started_at", { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDiagnosticItemReviewProgress(client?: SupabaseClient, reviewerProfileId?: string) {
  const supabase = client ?? await createClient();
  if (reviewerProfileId) {
    async function countAssignments(status: "assigned" | "submitted", decision?: "human_approved" | "rejected") {
      let query = supabase.from("competency_item_review_assignments").select("id", { count: "exact", head: true }).eq("reviewer_profile_id", reviewerProfileId);
      query = query.eq("status", status);
      if (decision) query = query.eq("decision", decision);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    }
    const [needsReview, humanApproved, rejected] = await Promise.all([
      countAssignments("assigned"),
      countAssignments("submitted", "human_approved"),
      countAssignments("submitted", "rejected"),
    ]);
    return {
      total: needsReview + humanApproved + rejected,
      needsReview,
      humanApproved,
      autoApproved: 0,
      rejected,
    };
  }
  const statuses = ["needs_human_review", "human_approved", "auto_approved", "rejected"] as const;
  const results = await Promise.all(statuses.map(async (status) => {
    const { count, error } = await supabase.from("competency_items")
      .select("id", { count: "exact", head: true })
      .eq("prompt_version", "diagnostic-bank-v2")
      .eq("review_status", status);
    if (error) throw new Error(error.message);
    return [status, count ?? 0] as const;
  }));
  const counts = Object.fromEntries(results) as Record<(typeof statuses)[number], number>;
  return {
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    needsReview: counts.needs_human_review,
    humanApproved: counts.human_approved,
    autoApproved: counts.auto_approved,
    rejected: counts.rejected,
  };
}

export async function getTaxonomyV3PracticeReviewData(filters: {
  section?: string;
  difficultyTier?: string;
  offset?: number;
  limit?: number;
} = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const { data: release, error: releaseError } = await supabase.from("taxonomy_releases")
    .select("id").eq("release_key", "french-taxonomy-v3").eq("status", "published").single();
  if (releaseError) throw new Error(releaseError.message);
  const { data: memberships, error: membershipError } = await supabase.from("taxonomy_release_memberships")
    .select("record_id,record_snapshot")
    .eq("release_id", release.id).eq("record_type", "competency_node");
  if (membershipError) throw new Error(membershipError.message);
  const controlledNodeIds = (memberships ?? []).flatMap((membership) => {
    const snapshot = membership.record_snapshot as { evidence?: Array<{ expectation?: string }> } | null;
    return snapshot?.evidence?.some((evidence) => evidence.expectation === "controlled_production")
      ? [membership.record_id as string]
      : [];
  });
  const [{ data: approvedRows, error: approvedError }, candidates] = await Promise.all([
    supabase.from("competency_items").select("id,primary_node_id,review_status")
      .in("primary_node_id", controlledNodeIds)
      .in("review_status", ["auto_approved", "human_approved"])
      .limit(2_000),
    getCompetencyItems({ status: "needs_human_review", offset: 0, limit: 1_000 }, supabase),
  ]);
  if (approvedError) throw new Error(approvedError.message);
  const approvedByNode = new Map<string, Array<{ id: string; status: string }>>();
  for (const row of approvedRows ?? []) {
    const nodeId = row.primary_node_id as string;
    const values = approvedByNode.get(nodeId) ?? [];
    values.push({ id: row.id as string, status: row.review_status as string });
    approvedByNode.set(nodeId, values);
  }
  const controlled = new Set(controlledNodeIds);
  const candidateByNode = new Map<string, CompetencyItemRow[]>();
  for (const item of candidates) {
    if (!controlled.has(item.nodeId)) continue;
    const values = candidateByNode.get(item.nodeId) ?? [];
    values.push(item);
    candidateByNode.set(item.nodeId, values);
  }
  const activationQueue: CompetencyItemRow[] = [];
  let readyNodes = 0;
  let approvedSlots = 0;
  for (const nodeId of controlledNodeIds) {
    const approved = approvedByNode.get(nodeId) ?? [];
    const covered = Math.min(3, approved.length);
    approvedSlots += covered;
    if (covered === 3) {
      readyNodes += 1;
      continue;
    }
    const needed = 3 - covered;
    const options = (candidateByNode.get(nodeId) ?? []).sort((a, b) =>
      (a.difficulty ?? 50) - (b.difficulty ?? 50) || a.id.localeCompare(b.id)
    );
    activationQueue.push(...options.slice(0, needed));
  }
  const filtered = activationQueue.filter((item) =>
    (!filters.section || item.diagnostic?.sectionKey === filters.section)
    && (!filters.difficultyTier || item.diagnostic?.difficultyTier === filters.difficultyTier)
  );
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.max(1, filters.limit ?? 24);
  return {
    items: filtered.slice(offset, offset + limit),
    filteredTotal: filtered.length,
    progress: {
      total: controlledNodeIds.length * 3,
      needsReview: controlledNodeIds.length * 3 - approvedSlots,
      humanApproved: approvedSlots,
      autoApproved: 0,
      rejected: 0,
      readyNodes,
      totalNodes: controlledNodeIds.length,
    },
  };
}
