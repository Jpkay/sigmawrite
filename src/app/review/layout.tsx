import type { Metadata } from "next";
import { ReviewerShell } from "@/components/reviewer-shell";
import { requireActiveReviewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Espace d’évaluation — SigmaWrite",
  description: "Évaluez les textes SigmaWrite simplement, depuis votre téléphone ou votre ordinateur.",
  manifest: "/review/manifest.webmanifest",
};

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const session = await requireActiveReviewer();
  return <ReviewerShell user={{ name: session.displayName ?? "Évaluateur", role: session.role, analyticsId: session.id }}>{children}</ReviewerShell>;
}
