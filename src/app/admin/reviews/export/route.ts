import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewRowsToCsv } from "@/lib/review/csv";
import { oneToOne } from "@/lib/supabase/relations";

export async function GET() {
  await requireRole(["platform_admin"]);
  const db = await createClient();
  const { data, error } = await db.from("review_assignments").select(`
    id,status,reviewer_profile_id,submitted_at,started_at,
    profiles!review_assignments_reviewer_profile_id_fkey(display_name),
    content_review_versions!inner(id,version_number,workflow_status,agreement_classification,payload,published_text_version_id,editorial_resolutions(action,admin_note),content_benchmarks(benchmark_code,locked)),
    passage_reviews(naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score,overall_decision,general_comment,duration_seconds,passage_review_issue_tags(issue_tag),question_reviews(question_index,outcome,comment))
  `).order("submitted_at", { ascending: true });
  if (error) throw new Error(error.message);
  const headers = ["passage_id","version","passage_title","reviewer","review_status","naturalness","pedagogical_quality","engagement","difficulty_match","vocabulary","grammar","question_quality","cultural_age","overall_decision","issue_tags","question_feedback","general_comment","submitted_at","duration_seconds","agreement","final_resolution","benchmark_status"];
  const rows = (data ?? []).map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    const version = row.content_review_versions as Record<string, unknown>;
    const payload = version.payload as { generated?: { title?: string } };
    const review = oneToOne(row.passage_reviews as Record<string, unknown> | Array<Record<string, unknown>> | null) ?? {};
    const profile = row.profiles as { display_name?: string } | null;
    const resolutions = ((version.editorial_resolutions as Array<Record<string,unknown>>) ?? []);
    const benchmarks = ((version.content_benchmarks as Array<Record<string,unknown>>) ?? []);
    return [version.id,version.version_number,payload.generated?.title,profile?.display_name,row.status,review.naturalness_score,review.pedagogical_quality_score,review.engagement_score,review.difficulty_match_score,review.vocabulary_score,review.grammar_score,review.question_quality_score,review.cultural_age_score,review.overall_decision,review.passage_review_issue_tags,review.question_reviews,review.general_comment,row.submitted_at,review.duration_seconds,version.agreement_classification,resolutions.at(-1),benchmarks.filter((item)=>item.locked)];
  });
  const csv = reviewRowsToCsv([headers, ...rows]);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="sigmawrite-content-reviews-${new Date().toISOString().slice(0,10)}.csv"`, "cache-control": "no-store" } });
}
