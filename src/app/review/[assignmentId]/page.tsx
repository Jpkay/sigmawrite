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
  const unfinished = queue.filter((item) => item.status !== "submitted");
  const position = Math.max(0, unfinished.findIndex((item) => item.assignmentId === assignmentId));
  const nextAssignment = unfinished.find((item, index) => index > position && item.assignmentId !== assignmentId)
    ?? unfinished.find((item) => item.assignmentId !== assignmentId);
  const completed = queue.filter((item) => item.status === "submitted").length;
  return <ReviewWorkspace
    assignment={assignment}
    reviewerName={session.displayName ?? "Évaluateur"}
    progress={{ current: Math.min(queue.length, completed + 1), total: queue.length, completed }}
    nextAssignmentId={nextAssignment?.assignmentId ?? null}
  />;
}
