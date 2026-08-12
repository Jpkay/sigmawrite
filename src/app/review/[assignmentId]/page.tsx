import { notFound, redirect } from "next/navigation";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewAssignment, getReviewerAccess, getReviewerQueue } from "@/lib/db/reviews";
import { ReviewWorkspace } from "./review-workspace";

export default async function ReviewAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireActiveReviewer();
  const { assignmentId } = await params;
  const [assignment, access, queue] = await Promise.all([getReviewAssignment(assignmentId, session.id), getReviewerAccess(session.id), getReviewerQueue(session.id)]);
  if (!access?.acknowledgedAt) redirect("/review/instructions");
  if (!assignment) notFound();
  const completed = queue.filter((item) => item.status === "submitted").length;
  return <ReviewWorkspace
    assignment={assignment}
    reviewerName={session.displayName ?? "Évaluateur"}
    progress={{ current: Math.min(queue.length, completed + 1), total: queue.length, completed }}
  />;
}
