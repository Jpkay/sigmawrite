import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/admin", label: "Accueil" },
  { href: "/admin/content", label: "Contenu" },
  { href: "/admin/content/review", label: "Révision" },
  { href: "/admin/skills", label: "Compétences" },
  { href: "/admin/vocabulary", label: "Vocabulaire" },
  { href: "/admin/concepts", label: "Concepts" },
  { href: "/admin/ai-jobs", label: "Tâches IA" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/benchmarks", label: "Références" },
  { href: "/admin/schools", label: "Écoles" },
  { href: "/admin/audit", label: "Journal d'audit" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  return (
    <DashboardShell
      area="Administration"
      nav={nav}
      user={{ name: session?.displayName ?? "Admin", role: session?.role ?? "platform_admin" }}
    >
      {children}
    </DashboardShell>
  );
}
