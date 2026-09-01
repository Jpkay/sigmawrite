import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { LanguageToggle } from "@/components/language-toggle";
import { requireRole } from "@/lib/auth";
import { getAdultLanguage } from "@/lib/i18n";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["supervisor"]);
  const language = await getAdultLanguage();
  const nav: NavItem[] = [{ href: "/supervisor", label: language === "en" ? "Student overview" : "Vue des élèves" }];
  return <DashboardShell language={language} area={language === "en" ? "Supervisor" : "Supervision"} nav={nav} user={{ name: session.displayName ?? (language === "en" ? "Supervisor" : "Superviseur"), role: session.role, analyticsId: session.id }} signOutLabel={language === "en" ? "Sign out" : "Se déconnecter"}><LanguageToggle language={language} />{children}</DashboardShell>;
}
