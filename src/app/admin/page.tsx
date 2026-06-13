"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { isApproved, useCandidates } from "@/lib/content-store";

export default function AdminHome() {
  const candidates = useCandidates();
  const pending = candidates.filter(
    (c) => c.reviewStatus === "needs_human_review" || c.reviewStatus === "draft"
  ).length;
  const flagged = candidates.filter((c) => !c.flags.moderationPassed).length;
  const approved = candidates.filter((c) => isApproved(c.reviewStatus)).length;
  const benchmarks = candidates.filter(
    (c) => c.reviewStatus === "benchmark_locked"
  ).length;

  const queues = [
    { label: "Candidats à réviser", value: pending, href: "/admin/content/review" },
    { label: "Signalements de modération", value: flagged, href: "/admin/content/review" },
    { label: "Textes approuvés", value: approved, href: "/admin/content" },
    { label: "Textes de référence", value: benchmarks, href: "/admin/content" },
  ];

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
        Pipeline : génération → validation Zod → scoring de difficulté →
        modération → révision. Démo locale via le fournisseur d&apos;IA simulé ; en
        production, les actions serveur (§23) appellent OpenAI + Supabase.
      </p>
    </>
  );
}
