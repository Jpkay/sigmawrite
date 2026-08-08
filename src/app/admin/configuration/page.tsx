import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";

const groups = [
  { title: "Contenu pédagogique", links: [["Textes approuvés", "/admin/content"], ["Banque d’exercices", "/admin/items"], ["Références", "/admin/benchmarks"]] },
  { title: "Modèle pédagogique", links: [["Compétences", "/admin/skills"], ["Vocabulaire", "/admin/vocabulary"], ["Concepts", "/admin/concepts"], ["Graphe", "/admin/graph"]] },
  { title: "Automatisation", links: [["Tâches d’intelligence artificielle", "/admin/ai-jobs"], ["Prompts", "/admin/prompts"], ["Essais diagnostiques", "/admin/diagnostic-pilot"]] },
  { title: "Organisation", links: [["Écoles", "/admin/schools"], ["Journal d’audit", "/admin/audit"]] },
] as const;

export default async function ConfigurationPage() {
  await requireRole(["platform_admin"]);
  return <>
    <PageHeader title="Configuration" description="Outils de structure, d’automatisation et d’administration rarement nécessaires au travail quotidien." />
    <div className="grid gap-x-12 gap-y-10 border-t border-border pt-7 md:grid-cols-2">
      {groups.map((group) => <section key={group.title}>
        <h2 className="text-lg font-semibold">{group.title}</h2>
        <div className="mt-3 divide-y divide-border border-y border-border">{group.links.map(([label, href]) => <Link key={href} href={href} className="flex items-center justify-between gap-3 py-3 text-sm font-medium text-foreground hover:text-primary">{label}<ArrowRight className="size-4" /></Link>)}</div>
      </section>)}
    </div>
  </>;
}
