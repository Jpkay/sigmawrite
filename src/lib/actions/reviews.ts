"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ISSUE_TAGS, REVIEW_CRITERIA } from "@/lib/review/types";
import { approveTextVersion } from "@/lib/actions/admin";

const uuid = z.string().uuid();
const inviteRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/set-password`;
const reviewInput = z.object({
  assignmentId: uuid,
  scores: z.object(Object.fromEntries(REVIEW_CRITERIA.map(([key]) => [key, z.number().int().min(1).max(4).optional()])) as Record<(typeof REVIEW_CRITERIA)[number][0], z.ZodOptional<z.ZodNumber>>),
  decision: z.enum(["approve", "approve_minor", "needs_revision", "reject"]).or(z.literal("")),
  generalComment: z.string().max(5000),
  issueTags: z.array(z.enum(ISSUE_TAGS)).max(14),
  questionReviews: z.array(z.object({
    questionIndex: z.number().int().min(0),
    outcome: z.enum(["correct_clear", "minor_issue", "ambiguous", "incorrect"]),
    comment: z.string().max(2000),
  })).max(30),
});

function refreshReviewPages() {
  revalidatePath("/review");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/reviews/disagreements");
  revalidatePath("/admin/benchmarks");
}

export async function acknowledgeReviewInstructions() {
  await requireActiveReviewer();
  const { error } = await (await createClient()).rpc("acknowledge_review_instructions");
  if (error) throw new Error(error.message);
  revalidatePath("/review");
  return { ok: true };
}

export async function saveReviewDraft(input: unknown) {
  await requireActiveReviewer();
  const data = reviewInput.parse(input);
  const { data: reviewId, error } = await (await createClient()).rpc("save_content_review", {
    p_assignment_id: data.assignmentId,
    p_scores: data.scores,
    p_decision: data.decision,
    p_general_comment: data.generalComment,
    p_issue_tags: data.issueTags,
    p_question_reviews: data.questionReviews,
    p_submit: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/review/${data.assignmentId}`);
  revalidatePath("/review");
  return { reviewId };
}

export async function submitReview(input: unknown) {
  await requireActiveReviewer();
  const data = reviewInput.parse(input);
  const { data: reviewId, error } = await (await createClient()).rpc("save_content_review", {
    p_assignment_id: data.assignmentId,
    p_scores: data.scores,
    p_decision: data.decision,
    p_general_comment: data.generalComment,
    p_issue_tags: data.issueTags,
    p_question_reviews: data.questionReviews,
    p_submit: true,
  });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { reviewId };
}

const inviteInput = z.object({ email: z.string().email().transform((value) => value.trim().toLowerCase()), displayName: z.string().trim().min(2).max(120) });

async function findAuthUserByEmail(email: string) {
  const service = createServiceClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 100) break;
  }
  return null;
}

export async function inviteContentReviewer(input: unknown) {
  const admin = await requireRole(["platform_admin"]);
  const data = inviteInput.parse(input);
  const service = createServiceClient();
  let user = await findAuthUserByEmail(data.email);
  let manualLink: string | null = null;
  let delivered = false;

  if (!user) {
    const invited = await service.auth.admin.inviteUserByEmail(data.email, {
      data: { role: "content_reviewer", display_name: data.displayName },
      redirectTo: inviteRedirectUrl,
    });
    if (!invited.error && invited.data.user) {
      user = invited.data.user;
      delivered = true;
    } else {
      const generated = await service.auth.admin.generateLink({
        type: "invite",
        email: data.email,
        options: { data: { role: "content_reviewer", display_name: data.displayName }, redirectTo: inviteRedirectUrl },
      });
      if (generated.error) throw new Error(generated.error.message);
      user = generated.data.user;
      manualLink = generated.data.properties.action_link;
    }
  }

  if (!user) throw new Error("Le compte n’a pas pu être préparé.");
  await service.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, role: "content_reviewer", display_name: data.displayName } });
  const { data: profile, error: profileError } = await service.from("profiles").update({ role: "content_reviewer", display_name: data.displayName, preferred_language: "fr" }).eq("auth_user_id", user.id).select("id").single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Profil introuvable.");
  const now = new Date().toISOString();
  const { error: accessError } = await service.from("content_reviewer_profiles").upsert({
    profile_id: profile.id, active: true, invite_status: delivered ? "invited" : "pending",
    invited_email: data.email, invited_by: admin.id, invited_at: now, deactivated_at: null,
  });
  if (accessError) throw new Error(accessError.message);
  await logAudit("review.reviewer_invited", { targetType: "profile", targetId: profile.id, metadata: { delivered } });
  revalidatePath("/admin/reviews/reviewers");
  revalidatePath("/admin/reviews/assign");
  return { profileId: profile.id as string, delivered, manualLink };
}

export async function setReviewerActive(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ profileId: uuid, active: z.boolean() }).parse(input);
  const db = await createClient();
  const { error } = await db.from("content_reviewer_profiles").update({
    active: data.active,
    invite_status: data.active ? "active" : "deactivated",
    activated_at: data.active ? new Date().toISOString() : null,
    deactivated_at: data.active ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("profile_id", data.profileId);
  if (error) throw new Error(error.message);
  await logAudit(data.active ? "review.reviewer_activated" : "review.reviewer_deactivated", { targetType: "profile", targetId: data.profileId });
  revalidatePath("/admin/reviews/reviewers");
  return { ok: true };
}

export async function resendReviewerInvite(input: unknown) {
  await requireRole(["platform_admin"]);
  const { profileId } = z.object({ profileId: uuid }).parse(input);
  const service = createServiceClient();
  const { data: access, error } = await service.from("content_reviewer_profiles").select("invited_email").eq("profile_id", profileId).single();
  if (error || !access?.invited_email) throw new Error("Adresse d’invitation introuvable.");
  const invited = await service.auth.admin.inviteUserByEmail(access.invited_email, { redirectTo: inviteRedirectUrl });
  if (invited.error) {
    const generated = await service.auth.admin.generateLink({ type: "magiclink", email: access.invited_email, options: { redirectTo: inviteRedirectUrl } });
    if (generated.error) throw new Error(generated.error.message);
    return { delivered: false, manualLink: generated.data.properties.action_link };
  }
  return { delivered: true, manualLink: null };
}

export async function assignReviewVersions(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ versionIds: z.array(uuid).min(1).max(100), reviewerIds: z.array(uuid).min(2).max(3) }).parse(input);
  const { data: created, error } = await (await createClient()).rpc("assign_content_reviews", { p_review_version_ids: data.versionIds, p_reviewer_ids: data.reviewerIds });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { created: Number(created ?? 0) };
}

export async function reassignReview(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ assignmentId: uuid, reviewerId: uuid }).parse(input);
  const { error } = await (await createClient()).rpc("reassign_content_review", { p_assignment_id: data.assignmentId, p_new_reviewer_id: data.reviewerId });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { ok: true };
}

export async function requestAdditionalReview(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ versionId: uuid, reviewerId: uuid, note: z.string().trim().min(3).max(5000) }).parse(input);
  const { data: assignmentId, error } = await (await createClient()).rpc("request_additional_content_review", { p_review_version_id: data.versionId, p_reviewer_id: data.reviewerId, p_admin_note: data.note });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { assignmentId };
}

export async function resolveReviewDisagreement(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ versionId: uuid, action: z.enum(["approve","approve_with_edits","send_for_revision","reject","request_another_review"]), note: z.string().trim().min(3).max(5000) }).parse(input);
  const { data: resolutionId, error } = await (await createClient()).rpc("resolve_content_review", { p_review_version_id: data.versionId, p_action: data.action, p_admin_note: data.note });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { resolutionId };
}

export async function createReviewRevision(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ versionId: uuid, payload: z.record(z.string(), z.unknown()), reason: z.string().trim().min(3).max(5000) }).parse(input);
  const { data: versionId, error } = await (await createClient()).rpc("create_content_review_revision", { p_review_version_id: data.versionId, p_payload: data.payload, p_reason: data.reason });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { versionId };
}

export async function publishReviewedVersion(input: unknown) {
  await requireRole(["platform_admin"]);
  const { candidateId } = z.object({ candidateId: uuid }).parse(input);
  const result = await approveTextVersion({ id: candidateId });
  refreshReviewPages();
  return result;
}

export async function lockGoldBenchmark(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ versionId: uuid, code: z.enum(["GOLD-01","GOLD-02","GOLD-03","GOLD-04","GOLD-05","GOLD-06"]) }).parse(input);
  const { data: benchmarkId, error } = await (await createClient()).rpc("lock_content_benchmark", { p_review_version_id: data.versionId, p_benchmark_code: data.code });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { benchmarkId };
}

export async function unlockGoldBenchmark(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = z.object({ benchmarkId: uuid, reason: z.string().trim().min(3).max(2000) }).parse(input);
  const { error } = await (await createClient()).rpc("unlock_content_benchmark", { p_benchmark_id: data.benchmarkId, p_reason: data.reason });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { ok: true };
}

export async function lockInitialGoldSet(input: unknown) {
  await requireRole(["platform_admin"]);
  const { versionIds } = z.object({ versionIds: z.array(uuid).length(6).refine((values) => new Set(values).size === 6) }).parse(input);
  const { data: benchmarkIds, error } = await (await createClient()).rpc("lock_initial_benchmark_set", { p_review_version_ids: versionIds });
  if (error) throw new Error(error.message);
  refreshReviewPages();
  return { benchmarkIds };
}
