import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { requireActiveReviewer } from "@/lib/auth";

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const session = await requireActiveReviewer();
  const nav: NavItem[] = [
    { href: "/review", label: "Mes textes" },
    { href: "/review/instructions", label: "Consignes" },
    ...(session.role === "platform_admin" ? [{ href: "/admin/reviews", label: "Administration" }] : []),
  ];
  return <DashboardShell area="Évaluation des textes" nav={nav} signOutLabel="Se déconnecter" user={{ name: session.displayName ?? "Évaluateur", role: session.role, analyticsId: session.id }}>{children}</DashboardShell>;
}
