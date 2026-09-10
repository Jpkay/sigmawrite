import { requireRole } from "@/lib/auth";
import { getContentCandidates } from "@/lib/db/content";
import { getReviewerQueue } from "@/lib/db/reviews";
import { createClient } from "@/lib/supabase/server";
import { ReviewClient, type ReviewNextStep } from "./review-client";

export default async function ReviewPage() {
  const session = await requireRole(["platform_admin", "content_reviewer"]);
  const db = await createClient();
  const [candidates, assignments, versions] = await Promise.all([
    getContentCandidates(db),
    getReviewerQueue(session.id, db),
    db.from("content_review_versions").select("id,candidate_id,workflow_status,version_number")
      .neq("workflow_status", "retired").order("version_number", { ascending: false }),
  ]);
  if (versions.error) throw new Error("Le suivi des évaluations est indisponible.");
  const nextSteps: Record<string, ReviewNextStep> = {};
  for (const candidate of candidates) {
    const version = versions.data?.find(row => row.candidate_id === candidate.id);
    const assignment = assignments.find(row => row.reviewVersionId === version?.id && row.status !== "submitted");
    const editorial = version && ["review_complete", "approved"].includes(version.workflow_status);
    nextSteps[candidate.id] = {
      canPublish: session.role === "platform_admin" && version?.workflow_status === "approved",
      href: editorial && session.role === "platform_admin" ? "/admin/reviews/" + version.id
        : assignment ? "/review/" + assignment.assignmentId
        : session.role === "platform_admin" ? version ? "/admin/reviews/" + version.id : "/admin/reviews/assign" : "/review",
      label: editorial && session.role === "platform_admin" ? "Ouvrir la décision éditoriale"
        : assignment ? "Évaluer ce texte" : "Ouvrir le suivi des évaluations",
      explanation: editorial ? "Les avis requis sont enregistrés. La décision éditoriale précède la publication."
        : "Pour enregistrer votre avis, utilisez le formulaire d’évaluation. Un avis favorable suffit avant la décision éditoriale.",
    };
  }
  const revision = candidates.map(candidate => candidate.id + ":" + candidate.updatedAt + ":" + candidate.reviewStatus).join("|") + JSON.stringify(nextSteps);
  return <ReviewClient key={revision} initialCandidates={candidates} nextSteps={nextSteps} />;
}
