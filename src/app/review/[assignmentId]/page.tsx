import { notFound, redirect } from "next/navigation";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewAssignment, getReviewerAccess } from "@/lib/db/reviews";
import { ReviewWorkspace } from "./review-workspace";

export default async function ReviewAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireActiveReviewer();
  const { assignmentId } = await params;
  const [assignment, access] = await Promise.all([getReviewAssignment(assignmentId), getReviewerAccess(session.id)]);
  if (!access?.acknowledgedAt) redirect("/review/instructions");
  if (!assignment) notFound();
  return <ReviewWorkspace assignment={assignment} />;
}
