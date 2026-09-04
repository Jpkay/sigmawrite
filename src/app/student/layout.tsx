import { DashboardShell, type NavItem, type TabItem } from "@/components/dashboard-shell";
import { getSessionProfile, requireRole } from "@/lib/auth";
import { getStudentAccessGate } from "@/lib/db/lifecycle";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { StudentAccessPending } from "@/components/student-access-pending";
import { StudentAssessmentGate } from "@/components/student-assessment-gate";

const nav: NavItem[] = [
  { href: "/student", label: "Accueil" },
  { href: "/student/onboarding", label: "Découverte" },
  { href: "/student/diagnostic", label: "Diagnostic" },
  { href: "/student/vocabulary", label: "Vocabulaire" },
  { href: "/student/memory", label: "Mémoire" },
  { href: "/student/progress", label: "Progrès" },
  { href: "/student/frontier", label: "Frontière" },
  { href: "/student/inbox", label: "Messages" },
  { href: "/student/reference/verbe", label: "Référence", matchPrefixes: ["/student/reference"] },
  { href: "/student/settings", label: "Paramètres" },
];

const tabs: TabItem[] = [
  { href: "/student", label: "Accueil", icon: "home" },
  { href: "/student/vocabulary", label: "Mots", icon: "book" },
  { href: "/student/memory", label: "Mémoire", icon: "brain" },
  { href: "/student/progress", label: "Progrès", icon: "progress" },
  { href: "/student/inbox", label: "Messages", icon: "inbox" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = isSupabaseConfigured
    ? await requireRole(["student"])
    : await getSessionProfile();
  const access = session?.role === "student" && isSupabaseConfigured
    ? await getStudentAccessGate()
    : null;
  return (
    <DashboardShell
      area="Élève"
      nav={nav}
      tabs={tabs}
      user={{ name: session?.displayName ?? "Élève", role: session?.role ?? "student", analyticsId: session?.id }}
    >
      {access && !access.authorized
        ? <StudentAccessPending />
        : <StudentAssessmentGate ownerKey={session?.authUserId}>{children}</StudentAssessmentGate>}
    </DashboardShell>
  );
}
