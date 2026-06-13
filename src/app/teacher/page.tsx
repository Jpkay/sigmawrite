import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getTeacherClasses, getViewableStudents } from "@/lib/db/dashboard";
import { classSummary, recommendedGroups } from "@/lib/reports";
import { nowMs } from "@/lib/clock";

export default async function TeacherHome() {
  const now = nowMs();
  const [classes, students] = await Promise.all([
    getTeacherClasses(),
    getViewableStudents(),
  ]);
  const summary = classSummary(students, now);
  const groups = recommendedGroups(students).slice(0, 3);

  const withSuccess = summary.filter((s) => s.avgSuccess !== null);
  const avg = withSuccess.length
    ? Math.round(
        (withSuccess.reduce((a, s) => a + (s.avgSuccess ?? 0), 0) / withSuccess.length) * 100
      )
    : null;

  const stats = [
    { label: "Classes", value: String(classes.length) },
    { label: "Élèves", value: String(students.length) },
    { label: "Réussite moyenne", value: avg !== null ? `${avg}%` : "—" },
    { label: "Faible engagement", value: String(summary.filter((s) => s.lowEngagement).length) },
  ];

  return (
    <>
      <PageHeader
        title="Vue de classe"
        description="Intervenez avec précision : lacunes de compétences et groupes recommandés."
      />

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

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groupes recommandés</h2>
        <Link href="/teacher/groups" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Tous les groupes
        </Link>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune lacune détectée pour l&apos;instant (les élèves doivent compléter des lectures).
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.skillKey}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{g.label}</p>
                  <p className="text-sm text-muted-foreground">{g.studentNames.join(", ")}</p>
                </div>
                <Badge variant="secondary">{g.studentNames.length} élève(s)</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/teacher/classes" className={buttonVariants()}>
          Voir mes classes
        </Link>
      </div>
    </>
  );
}
