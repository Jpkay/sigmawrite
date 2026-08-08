import { ReviewerShell } from "@/components/reviewer-shell";
import { requireActiveReviewer } from "@/lib/auth";

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const session = await requireActiveReviewer();
  return <ReviewerShell user={{ name: session.displayName ?? "Évaluateur", role: session.role, analyticsId: session.id }}>{children}</ReviewerShell>;
}
