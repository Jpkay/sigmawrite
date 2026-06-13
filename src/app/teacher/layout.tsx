import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/teacher", label: "Accueil" },
  { href: "/teacher/classes", label: "Classes" },
  { href: "/teacher/groups", label: "Groupes" },
  { href: "/teacher/assignments", label: "Devoirs" },
  { href: "/teacher/reports", label: "Rapports" },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  return (
    <DashboardShell
      area="Enseignant"
      nav={nav}
      user={{ name: session?.displayName ?? "Enseignant", role: session?.role ?? "teacher" }}
    >
      {children}
    </DashboardShell>
  );
}
