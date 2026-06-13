import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/student", label: "Accueil" },
  { href: "/student/onboarding", label: "Découverte" },
  { href: "/student/diagnostic", label: "Diagnostic" },
  { href: "/student/vocabulary", label: "Vocabulaire" },
  { href: "/student/memory", label: "Mémoire" },
  { href: "/student/progress", label: "Progrès" },
  { href: "/student/settings", label: "Paramètres" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  return (
    <DashboardShell
      area="Élève"
      nav={nav}
      user={{ name: session?.displayName ?? "Élève", role: session?.role ?? "student" }}
    >
      {children}
    </DashboardShell>
  );
}
