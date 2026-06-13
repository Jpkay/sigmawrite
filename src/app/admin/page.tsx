import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";

const queues = [
  { label: "Candidats à réviser", value: "—", href: "/admin/content/review" },
  { label: "Tâches IA en cours", value: "—", href: "/admin/ai-jobs" },
  { label: "Signalements de modération", value: "—", href: "/admin/content/review" },
  { label: "Textes de référence", value: "—", href: "/admin/benchmarks" },
];

export default function AdminHome() {
  return (
    <>
      <PageHeader
        title="Administration & révision du contenu"
        description="Empêcher le produit de devenir un générateur d'IA aléatoire (PRD §O)."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {queues.map((q) => (
          <Link key={q.label} href={q.href}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{q.label}</p>
                <p className="mt-1 text-2xl font-semibold">{q.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Le pipeline de contenu (génération → validation Zod → scoring → modération
        → révision) sera implémenté en Phase 2.
      </p>
    </>
  );
}
