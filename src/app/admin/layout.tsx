import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { AdminReviewerSwitch } from "@/components/admin-reviewer-switch";
import { requireRole } from "@/lib/auth";
import { getReviewerAccess } from "@/lib/db/reviews";

const nav: NavItem[] = [
  { href: "/admin", label: "Accueil" },
  { href: "/admin/content/review", label: "Textes", matchPrefixes: ["/admin/content", "/admin/texts"] },
  { href: "/admin/reviews", label: "Évaluations", matchPrefixes: ["/admin/benchmarks"] },
  { href: "/admin/items/review", label: "Qualité", matchPrefixes: ["/admin/items"] },
  { href: "/admin/configuration", label: "Configuration", matchPrefixes: ["/admin/skills", "/admin/vocabulary", "/admin/concepts", "/admin/graph", "/admin/ai-jobs", "/admin/prompts", "/admin/reuse", "/admin/diagnostic-pilot", "/admin/users", "/admin/schools", "/admin/audit"] },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["platform_admin"]);
  const reviewerAccess = await getReviewerAccess(session.id);
  return (
    <DashboardShell
      area="Administration"
      nav={nav}
      user={{ name: session.displayName ?? "Admin", role: session.role, analyticsId: session.id }}
      modeSwitch={<AdminReviewerSwitch reviewerActive={Boolean(reviewerAccess?.active)} />}
    >
      {children}
    </DashboardShell>
  );
}
