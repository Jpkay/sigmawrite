import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { getViewableStudents } from "@/lib/db/dashboard";
import { classSummary } from "@/lib/reports";
import { nowMs } from "@/lib/clock";

export default async function TeacherReportsPage() {
  const students = await getViewableStudents();
  const summary = classSummary(students, nowMs());

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Rapports" description="Synthèse exportable de vos élèves." />
        <PrintButton />
      </div>

      {summary.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun élève à rapporter.</p>
      ) : (
        <div className="space-y-2">
          {summary.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.band} · {s.textsThisWeek} texte(s) cette semaine
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.lowEngagement && <Badge variant="secondary">Faible engagement</Badge>}
                  <span className="text-sm tabular-nums">
                    {s.avgSuccess !== null ? `${Math.round(s.avgSuccess * 100)}%` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
