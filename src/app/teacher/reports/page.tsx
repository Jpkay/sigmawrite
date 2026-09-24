import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { getViewableStudents } from "@/lib/db/dashboard";
import { classSummary } from "@/lib/reports";
import { nowMs } from "@/lib/clock";
import { getAdultLanguage } from "@/lib/i18n";
import { studentSchoolGradeLabel } from "@/lib/school-grade";

export default async function TeacherReportsPage() {
  const [students, language] = await Promise.all([getViewableStudents(), getAdultLanguage()]);
  const summary = classSummary(students, nowMs());

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title={language === "en" ? "Reports" : "Rapports"} description={language === "en" ? "Exportable student summary." : "Synthèse exportable de vos élèves."} />
        <PrintButton label={language === "en" ? "Export / print" : "Exporter / imprimer"} />
      </div>

      {summary.length === 0 ? (
        <p className="text-sm text-muted-foreground">{language === "en" ? "No student to report yet." : "Aucun élève à rapporter."}</p>
      ) : (
        <div className="space-y-2">
          {summary.map((s) => {
            const student = students.find((row) => row.id === s.id);
            const gradeLabel = studentSchoolGradeLabel(student?.snap.grade, student?.snap.frenchBackground, language);
            return (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {gradeLabel && <p className="mt-1 text-xs text-muted-foreground">{gradeLabel}</p>}
                  <p className="text-sm text-muted-foreground">
                    {s.band} · {s.textsThisWeek} {language === "en" ? "text(s) this week" : "texte(s) cette semaine"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.lowEngagement && <Badge variant="secondary">{language === "en" ? "Low engagement" : "Faible engagement"}</Badge>}
                  <span className="text-sm tabular-nums">
                    {s.avgSuccess !== null ? `${Math.round(s.avgSuccess * 100)}%` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
