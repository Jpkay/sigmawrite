import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getAdminReviewVersions } from "@/lib/db/reviews";
import { createClient } from "@/lib/supabase/server";
import { ReviewAdminNav } from "../reviews/review-nav";
import { BenchmarkManager } from "./benchmark-manager";

export default async function BenchmarksPage(){await requireRole(["platform_admin"]);const db=await createClient();const [versions,{data:benchmarks,error}]=await Promise.all([getAdminReviewVersions(db),db.from("content_benchmarks").select("id,benchmark_code,locked,locked_at,unlock_reason,review_version_id,text_version_id,content_review_versions(payload,agreement_classification,average_score)").order("benchmark_code")]);if(error)throw new Error(error.message);const eligible=versions.filter(v=>v.workflowStatus==="published"&&v.publishedTextVersionId);return <><PageHeader title="Références gold" description="Sélectionnez exactement six passages publiés et validés. Le verrouillage fige le texte et ses questions."/><ReviewAdminNav/><BenchmarkManager candidates={eligible.map(v=>({id:v.id,title:v.candidate.generated.title,band:v.candidate.input.targetReadingBand,topic:v.candidate.input.topic,textType:v.candidate.input.textType,competencies:v.candidate.input.targetSkills,averageScore:v.averageScore,agreement:v.agreement}))} locked={(benchmarks??[]) as unknown as Parameters<typeof BenchmarkManager>[0]["locked"]}/></>}
