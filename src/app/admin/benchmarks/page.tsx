"use client";

import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCandidates } from "@/lib/content-store";

export default function BenchmarksPage() {
  const benchmarks = useCandidates().filter(
    (c) => c.reviewStatus === "benchmark_locked"
  );

  return (
    <>
      <PageHeader
        title="Textes de référence"
        description="Passages verrouillés, fixes et versionnés, utilisés périodiquement pour la calibration (PRD §O)."
      />
      {benchmarks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun texte de référence. Approuve un texte puis « Verrouille comme
          référence » depuis la bibliothèque de contenu.
        </p>
      ) : (
        <div className="space-y-2">
          {benchmarks.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{c.generated.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.input.textType} · {c.difficulty.band} · difficulté{" "}
                    {c.difficulty.overall}
                  </p>
                </div>
                <Badge variant="success">Référence verrouillée</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
