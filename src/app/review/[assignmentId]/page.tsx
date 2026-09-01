import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewAssignment, getReviewerAccess, getReviewerQueue } from "@/lib/db/reviews";
import { hasReviewablePassageBody } from "@/lib/review/types";
import { ReviewWorkspace } from "./review-workspace";

export default async function ReviewAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireActiveReviewer();
  const { assignmentId } = await params;
  const [assignment, access, queue] = await Promise.all([getReviewAssignment(assignmentId, session.id), getReviewerAccess(session.id), getReviewerQueue(session.id)]);
  if (!access?.acknowledgedAt) redirect("/review/instructions");
  if (!assignment) notFound();
  if (!hasReviewablePassageBody(assignment.candidate)) {
    return <section className="mx-auto max-w-2xl py-12 sm:py-20">
      <div className="border-l-2 border-primary pl-5 sm:pl-7">
        <TriangleAlert className="size-7 text-primary" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Texte indisponible</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cette évaluation est temporairement suspendue.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Le passage source est incomplet. Les questions restent masquées afin que vous ne puissiez pas les évaluer sans avoir lu le texte. Votre brouillon est conservé.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><a href={`/review/${assignment.assignmentId}`}>Recharger le texte</a></Button>
          <Button asChild variant="outline"><Link href="/review">Retour à ma mission</Link></Button>
        </div>
      </div>
    </section>;
  }
  const completed = queue.filter((item) => item.status === "submitted").length;
  return <ReviewWorkspace
    assignment={assignment}
    reviewerName={session.displayName ?? "Évaluateur"}
    progress={{ current: Math.min(queue.length, completed + 1), total: queue.length, completed }}
  />;
}
