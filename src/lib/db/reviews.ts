import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentCandidate } from "@/lib/ai/pipeline";
import type { ReviewDecision, ReviewDraft, ReviewQueueItem, ReviewScores } from "@/lib/review/types";
import { createClient } from "@/lib/supabase/server";
import { oneToOne } from "@/lib/supabase/relations";

type AssignmentRow = {
  id: string;
  status: ReviewQueueItem["status"];
  assigned_at: string;
  started_at: string | null;
  submitted_at: string | null;
  content_review_versions: {
    id: string;
    version_number: number;
    workflow_status: string;
    payload: ContentCandidate;
  };
  passage_reviews: Array<{
    id: string;
    naturalness_score: number | null;
    pedagogical_quality_score: number | null;
    engagement_score: number | null;
    difficulty_match_score: number | null;
    vocabulary_score: number | null;
    grammar_score: number | null;
    question_quality_score: number | null;
    cultural_age_score: number | null;
    overall_decision: ReviewDecision | null;
    general_comment: string | null;
    duration_seconds: number | null;
    passage_review_issue_tags: Array<{ issue_tag: string }>;
    question_reviews: Array<{ question_index: number; outcome: ReviewDraft["questionReviews"][number]["outcome"]; comment: string | null }>;
  }>;
};

const assignmentSelect = `
  id,status,assigned_at,started_at,submitted_at,
  content_review_versions!inner(id,version_number,workflow_status,payload),
  passage_reviews(
    id,naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,
    vocabulary_score,grammar_score,question_quality_score,cultural_age_score,
    overall_decision,general_comment,duration_seconds,
    passage_review_issue_tags(issue_tag),question_reviews(question_index,outcome,comment)
  )`;

function mapAssignment(row: AssignmentRow): ReviewQueueItem {
  const review = oneToOne(row.passage_reviews as unknown as AssignmentRow["passage_reviews"][number] | AssignmentRow["passage_reviews"] | null) ?? undefined;
  const scores: ReviewScores = review ? {
    naturalness: review.naturalness_score ?? undefined,
    pedagogical_quality: review.pedagogical_quality_score ?? undefined,
    engagement: review.engagement_score ?? undefined,
    difficulty_match: review.difficulty_match_score ?? undefined,
    vocabulary: review.vocabulary_score ?? undefined,
    grammar: review.grammar_score ?? undefined,
    question_quality: review.question_quality_score ?? undefined,
    cultural_age: review.cultural_age_score ?? undefined,
  } : {};
  return {
    assignmentId: row.id,
    reviewVersionId: row.content_review_versions.id,
    status: row.status,
    assignedAt: row.assigned_at,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    versionNumber: row.content_review_versions.version_number,
    workflowStatus: row.content_review_versions.workflow_status,
    candidate: row.content_review_versions.payload,
    review: review ? {
      id: review.id,
      scores,
      decision: review.overall_decision ?? "",
      generalComment: review.general_comment ?? "",
      issueTags: review.passage_review_issue_tags.map((item) => item.issue_tag),
      questionReviews: review.question_reviews
        .sort((a, b) => a.question_index - b.question_index)
        .map((item) => ({ questionIndex: item.question_index, outcome: item.outcome, comment: item.comment ?? "" })),
      durationSeconds: review.duration_seconds,
    } : null,
  };
}

export async function getReviewerQueue(reviewerProfileId: string, client?: SupabaseClient): Promise<ReviewQueueItem[]> {
  const db = client ?? await createClient();
  const { data, error } = await db.from("review_assignments").select(assignmentSelect)
    .eq("reviewer_profile_id", reviewerProfileId)
    .order("assigned_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as AssignmentRow[]).map(mapAssignment);
}

export async function getReviewAssignment(assignmentId: string, reviewerProfileId: string, client?: SupabaseClient): Promise<ReviewQueueItem | null> {
  const db = client ?? await createClient();
  const { data, error } = await db.from("review_assignments").select(assignmentSelect)
    .eq("id", assignmentId)
    .eq("reviewer_profile_id", reviewerProfileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAssignment(data as unknown as AssignmentRow) : null;
}

export type ReviewerAccess = {
  profileId: string;
  active: boolean;
  inviteStatus: string;
  email: string | null;
  lastActivityAt: string | null;
  acknowledgedAt: string | null;
  instructionsVersion: string | null;
};

export async function getReviewerAccess(profileId: string, client?: SupabaseClient): Promise<ReviewerAccess | null> {
  const db = client ?? await createClient();
  const { data, error } = await db.from("content_reviewer_profiles")
    .select("profile_id,active,invite_status,invited_email,last_activity_at,instructions_acknowledged_at,instructions_version")
    .eq("profile_id", profileId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? {
    profileId: data.profile_id as string,
    active: data.active as boolean,
    inviteStatus: data.invite_status as string,
    email: data.invited_email as string | null,
    lastActivityAt: data.last_activity_at as string | null,
    acknowledgedAt: data.instructions_acknowledged_at as string | null,
    instructionsVersion: data.instructions_version as string | null,
  } : null;
}

export async function getReviewNotifications(client?: SupabaseClient) {
  const db = client ?? await createClient();
  const { data, error } = await db.from("review_notifications")
    .select("id,notification_type,title,body,review_version_id,read_at,created_at")
    .is("read_at", null).order("created_at", { ascending: false }).limit(5);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type AdminReviewVersion = {
  id: string;
  candidateId: string;
  versionNumber: number;
  workflowStatus: string;
  agreement: string | null;
  averageScore: number | null;
  ratingSpread: number | null;
  requiredReviewers: number;
  publishedTextVersionId: string | null;
  createdAt: string;
  candidate: ContentCandidate;
  assignments: Array<{ id: string; reviewerProfileId: string; status: string; submittedAt: string | null }>;
};

export async function getAdminReviewVersions(client?: SupabaseClient): Promise<AdminReviewVersion[]> {
  const db = client ?? await createClient();
  const { data, error } = await db.from("content_review_versions").select(`
    id,candidate_id,version_number,workflow_status,agreement_classification,average_score,rating_spread,
    required_reviewers,published_text_version_id,payload,created_at,
    review_assignments(id,reviewer_profile_id,status,submitted_at)
  `).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Array<{
    id:string;candidate_id:string;version_number:number;workflow_status:string;agreement_classification:string|null;
    average_score:number|string|null;rating_spread:number|null;required_reviewers:number;published_text_version_id:string|null;created_at:string;
    payload:ContentCandidate;review_assignments:Array<{id:string;reviewer_profile_id:string;status:string;submitted_at:string|null}>;
  }>).map((row) => ({
    id: row.id, candidateId: row.candidate_id, versionNumber: row.version_number,
    workflowStatus: row.workflow_status, agreement: row.agreement_classification,
    averageScore: row.average_score == null ? null : Number(row.average_score), ratingSpread: row.rating_spread,
    requiredReviewers: row.required_reviewers, publishedTextVersionId: row.published_text_version_id,
    createdAt: row.created_at,
    candidate: row.payload,
    assignments: row.review_assignments.map((item) => ({ id:item.id, reviewerProfileId:item.reviewer_profile_id, status:item.status, submittedAt:item.submitted_at })),
  }));
}

export async function getAdminReviewDetail(versionId: string, client?: SupabaseClient) {
  const db = client ?? await createClient();
  const { data: version, error } = await db.from("content_review_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!version) return null;
  const { data: assignments, error: assignmentError } = await db.from("review_assignments").select(`
    id,status,reviewer_profile_id,assigned_at,started_at,submitted_at,
    profiles!review_assignments_reviewer_profile_id_fkey(display_name),
    passage_reviews(*,passage_review_issue_tags(issue_tag),question_reviews(question_index,outcome,comment))
  `).eq("review_version_id", versionId).order("assigned_at");
  if (assignmentError) throw new Error(assignmentError.message);
  return {
    version,
    assignments: (assignments ?? []).map((assignment) => ({
      ...assignment,
      passage_reviews: oneToOne(assignment.passage_reviews),
    })),
  };
}

export type AdminReviewReportRow = {
  assignmentStatus: string;
  reviewerProfileId: string;
  reviewerName: string;
  reviewVersionId: string;
  band: string;
  topic: string;
  durationSeconds: number | null;
  decision: string | null;
  scores: number[];
  issueTags: string[];
};

export async function getAdminReviewReport(client?: SupabaseClient): Promise<AdminReviewReportRow[]> {
  const db = client ?? await createClient();
  const { data, error } = await db.from("review_assignments").select(`
    status,reviewer_profile_id,
    profiles!review_assignments_reviewer_profile_id_fkey(display_name),
    content_review_versions!inner(id,payload),
    passage_reviews(duration_seconds,overall_decision,naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score,passage_review_issue_tags(issue_tag))
  `);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Array<Record<string,unknown>>).map((row) => {
    const profile = row.profiles as {display_name:string|null}|null;
    const version = row.content_review_versions as {id:string;payload:ContentCandidate};
    const review = oneToOne(row.passage_reviews as Record<string,unknown> | Array<Record<string,unknown>> | null);
    return {
      assignmentStatus: row.status as string,
      reviewerProfileId: row.reviewer_profile_id as string,
      reviewerName: profile?.display_name ?? "Évaluateur",
      reviewVersionId: version.id,
      band: version.payload.input.targetReadingBand,
      topic: version.payload.input.topic,
      durationSeconds: review?.duration_seconds as number|null ?? null,
      decision: review?.overall_decision as string|null ?? null,
      scores: review ? [review.naturalness_score,review.pedagogical_quality_score,review.engagement_score,review.difficulty_match_score,review.vocabulary_score,review.grammar_score,review.question_quality_score,review.cultural_age_score].filter((value): value is number => typeof value === "number") : [],
      issueTags: review ? ((review.passage_review_issue_tags as Array<{issue_tag:string}>) ?? []).map((item)=>item.issue_tag) : [],
    };
  });
}
