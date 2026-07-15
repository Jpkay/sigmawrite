import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";
import { getStudentConsentGate } from "@/lib/db/lifecycle";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ConsentPending } from "@/components/consent-pending";
import { StudentAssessmentGate } from "@/components/student-assessment-gate";

const nav: NavItem[] = [
  { href: "/student", label: "Accueil" },
  { href: "/student/onboarding", label: "Découverte" },
  { href: "/student/diagnostic", label: "Diagnostic" },
  { href: "/student/vocabulary", label: "Vocabulaire" },
  { href: "/student/memory", label: "Mémoire" },
  { href: "/student/progress", label: "Progrès" },
  { href: "/student/frontier", label: "Frontière" },
  { href: "/student/settings", label: "Paramètres" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  const consent = session?.role === "student" && isSupabaseConfigured
    ? await getStudentConsentGate()
    : null;
  return (
    <DashboardShell
      area="Élève"
      nav={nav}
      user={{ name: session?.displayName ?? "Élève", role: session?.role ?? "student", analyticsId: session?.id }}
    >
      {consent && !consent.active
        ? <ConsentPending canSelfConsent={consent.canSelfConsent} />
        : <StudentAssessmentGate>{children}</StudentAssessmentGate>}
    </DashboardShell>
  );
}
