import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CompetencyItemRow = {
  id: string; nodeId: string; nodeKey: string; nodeLabel: string; strand: string;
  promptFr: string; correctAnswer: string | null; responseType: string; validatorType: string;
  difficulty: number | null; reviewStatus: string; qcGates: Record<string, unknown>;
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

export async function getCompetencyItems(filters: { status?: string; node?: string; promptVersion?: string; section?: string; difficultyTier?: string; offset?: number; limit?: number } = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const membershipJoin = filters.section || filters.difficultyTier
    ? "diagnostic_item_bank_memberships!inner"
    : "diagnostic_item_bank_memberships";
  const limit = filters.limit ?? 500;
  const offset = Math.max(0, filters.offset ?? 0);
  let query = supabase.from("competency_items").select(`id,primary_node_id,strand,prompt_fr,correct_answer,response_type,validator_type,difficulty,review_status,qc_gates,psychometric_flags,generation_model,prompt_version,competency_nodes!inner(key,label_fr),competency_item_choices(id,choice_text,is_correct,feedback_fr),${membershipJoin}(bank_release_id,mastery_evidence_id,section_key,evidence_expectation,prompt_family,difficulty_tier)`).order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
  if (filters.status) query = query.eq("review_status", filters.status);
  if (filters.node) query = query.eq("competency_nodes.key", filters.node);
  if (filters.promptVersion) query = query.eq("prompt_version", filters.promptVersion);
  if (filters.section) query = query.eq("diagnostic_item_bank_memberships.section_key", filters.section);
  if (filters.difficultyTier) query = query.eq("diagnostic_item_bank_memberships.difficulty_tier", filters.difficultyTier);
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
  const diagnosticMemberships = (data ?? []).flatMap((row) =>
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
  return (data ?? []).map((row) => {
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

export async function getDiagnosticItemReviewCount(filters: { section?: string; difficultyTier?: string } = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  let query = supabase.from("competency_items")
    .select("id,diagnostic_item_bank_memberships!inner(section_key,difficulty_tier)", { count: "exact", head: true })
    .eq("prompt_version", "diagnostic-bank-v2")
    .eq("review_status", "needs_human_review");
  if (filters.section) query = query.eq("diagnostic_item_bank_memberships.section_key", filters.section);
  if (filters.difficultyTier) query = query.eq("diagnostic_item_bank_memberships.difficulty_tier", filters.difficultyTier);
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

export async function getDiagnosticItemReviewProgress(client?: SupabaseClient) {
  const supabase = client ?? await createClient();
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
