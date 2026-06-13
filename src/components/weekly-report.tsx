import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  weeklyReport,
  proofLayer,
  type StudentSnapshot,
} from "@/lib/reports";

/** Shared weekly-report view (PRD §M) used by parent and teacher dashboards. */
export function WeeklyReportView({
  snap,
  nowMs,
}: {
  snap: StudentSnapshot;
  nowMs: number;
}) {
  const r = weeklyReport(snap, nowMs);
  const proof = proofLayer(snap);

  const stats = [
    { label: "Textes complétés", value: String(r.textsCompleted) },
    { label: "Minutes lues", value: String(r.minutes) },
    {
      label: "Réussite moyenne",
      value: r.avgSuccess !== null ? `${Math.round(r.avgSuccess * 100)}%` : "—",
    },
    { label: "Mots de vocabulaire", value: String(r.vocabCount) },
  ];

  const buckets = [
    { title: "Lit avec aisance", items: proof.comfortable, variant: "success" as const },
    { title: "Lit avec soutien", items: proof.withSupport, variant: "default" as const },
    { title: "Trop difficile pour l'instant", items: proof.tooHard, variant: "secondary" as const },
  ];

  return (
    <>
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <span className="text-2xl font-semibold">{r.band}</span>
          <Badge variant="secondary">Confiance : {r.confidence}</Badge>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">Points forts</h3>
            {r.strengths.length ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {r.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">À construire.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">À travailler</h3>
            {r.needsWork.length ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {r.needsWork.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Rien d&apos;urgent.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Preuve de niveau</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {buckets.map((b) => (
          <Card key={b.title}>
            <CardContent className="pt-6">
              <Badge variant={b.variant}>{b.title}</Badge>
              {b.items.length ? (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {b.items.map((it, i) => (
                    <li key={i}>
                      {it.title} <span className="text-xs">· {it.success}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
