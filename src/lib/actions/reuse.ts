"use server";

import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import {
  getContentReuseCalibrationReport,
  type ReuseCalibrationReport,
} from "@/lib/content/reuse/runtime";
import { createServiceClient } from "@/lib/supabase/server";

const rollbackSchema = z.object({
  reason: z.string().trim().min(10).max(1000),
});

export async function loadContentReuseCalibration(): Promise<ReuseCalibrationReport> {
  await requireRole(["platform_admin"]);
  return getContentReuseCalibrationReport(createServiceClient());
}

/**
 * Advances exactly one rollout stage. Shadow may become a bounded trial, and
 * trial may become live, only when the current policy's own outcome evidence
 * satisfies its database-owned gates.
 */
export async function advanceContentReuseRollout() {
  const actor = await requireRole(["platform_admin"]);
  const service = createServiceClient();
  const report = await getContentReuseCalibrationReport(service);
  const targetMode = report.decision === "eligible_for_trial"
    ? "trial"
    : report.decision === "eligible_for_live" ? "live" : null;
  if (!targetMode || report.recommendedThreshold == null) {
    throw new Error("Les preuves actuelles ne permettent pas d’avancer le déploiement.");
  }
  const { data: policyId, error } = await service.rpc("transition_content_reuse_policy", {
    p_policy_id: report.policy.id,
    p_mode: targetMode,
    p_minimum_score: report.recommendedThreshold,
    p_evidence: report,
    p_actor_profile_id: actor.id,
  });
  if (error || !policyId) throw new Error(error?.message ?? "Transition non créée.");
  await logAudit(`content_reuse.${targetMode === "trial" ? "trial_started" : "promoted_live"}`, {
    targetType: "content_reuse_policy",
    targetId: policyId as string,
    metadata: {
      actorId: actor.id,
      previousPolicyId: report.policy.id,
      threshold: report.recommendedThreshold,
      evidence: report,
    },
  });
  return { policyId: policyId as string, mode: targetMode, threshold: report.recommendedThreshold };
}

export async function returnContentReuseToShadow(input: unknown) {
  const actor = await requireRole(["platform_admin"]);
  const { reason } = rollbackSchema.parse(input);
  const service = createServiceClient();
  const report = await getContentReuseCalibrationReport(service);
  if (report.policy.mode === "off" || report.policy.mode === "shadow") {
    throw new Error("Le réutilisateur n’est pas exposé aux élèves.");
  }
  const evidence = { ...report, decision: "manual_return_to_shadow", reason };
  const { data: policyId, error } = await service.rpc("transition_content_reuse_policy", {
    p_policy_id: report.policy.id,
    p_mode: "shadow",
    p_minimum_score: report.policy.minimumScore,
    p_evidence: evidence,
    p_actor_profile_id: actor.id,
  });
  if (error || !policyId) throw new Error(error?.message ?? "Retour en mode shadow impossible.");
  await logAudit("content_reuse.returned_to_shadow", {
    targetType: "content_reuse_policy",
    targetId: policyId as string,
    metadata: { actorId: actor.id, previousPolicyId: report.policy.id, reason, evidence: report },
  });
  return { policyId: policyId as string, mode: "shadow" as const };
}
