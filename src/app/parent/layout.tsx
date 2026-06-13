import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { getSessionProfile } from "@/lib/auth";

const nav: NavItem[] = [
  { href: "/parent", label: "Accueil" },
  { href: "/parent/settings", label: "Paramètres" },
  { href: "/parent/privacy", label: "Confidentialité" },
];

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  return (
    <DashboardShell
      area="Parent"
      nav={nav}
      user={{ name: session?.displayName ?? "Parent", role: session?.role ?? "parent" }}
    >
      {children}
    </DashboardShell>
  );
}
