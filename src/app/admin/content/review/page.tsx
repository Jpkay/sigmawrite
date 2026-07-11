import { requireRole } from "@/lib/auth";
import { getContentCandidates } from "@/lib/db/content";
import { ReviewClient } from "./review-client";

export default async function ReviewPage() {
  await requireRole(["platform_admin", "content_reviewer"]);
  const candidates = await getContentCandidates();
  const revision = candidates.map((candidate) => `${candidate.id}:${candidate.updatedAt}:${candidate.reviewStatus}`).join("|");
  return <ReviewClient key={revision} initialCandidates={candidates} />;
}
