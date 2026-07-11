import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getTeacherClasses, getViewableStudents } from "@/lib/db/dashboard";
import { classSummary, recommendedGroups } from "@/lib/reports";
import { nowMs } from "@/lib/clock";
import { getAdultLanguage } from "@/lib/i18n";
import { getSessionProfile } from "@/lib/auth";
import { trackServer } from "@/lib/analytics-server";

export default async function TeacherHome() {
  const now = nowMs();
  const [classes, students, language, session] = await Promise.all([
    getTeacherClasses(),
    getViewableStudents(),
    getAdultLanguage(),
    getSessionProfile(),
  ]);
  if (session) await trackServer(session.id, "teacher_dashboard_viewed", { class_count: classes.length, student_count: students.length });
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
    { label: language === "en" ? "Students" : "Élèves", value: String(students.length) },
    { label: language === "en" ? "Average success" : "Réussite moyenne", value: avg !== null ? `${avg}%` : "—" },
    { label: language === "en" ? "Low engagement" : "Faible engagement", value: String(summary.filter((s) => s.lowEngagement).length) },
  ];

  return (
    <>
      <PageHeader
        title={language === "en" ? "Class overview" : "Vue de classe"}
        description={language === "en" ? "Act on concrete competency gaps and suggested groups." : "Intervenez avec précision : lacunes de compétences et groupes recommandés."}
      />

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="font-semibold">{language === "en" ? "Pilot setup checklist" : "Checklist de démarrage du pilote"}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Link href="/teacher/classes" className="rounded-md border p-3 hover:border-primary">{classes.length ? "✓ " : "1. "}{language === "en" ? "Create a class" : "Créer une classe"}</Link>
            <Link href="/teacher/classes" className="rounded-md border p-3 hover:border-primary">{students.length ? "✓ " : "2. "}{language === "en" ? "Enroll students" : "Inscrire les élèves"}</Link>
            <Link href="/teacher/assignments" className="rounded-md border p-3 hover:border-primary">3. {language === "en" ? "Assign a text or competency" : "Attribuer un texte ou une compétence"}</Link>
            <Link href="/teacher/reports" className="rounded-md border p-3 hover:border-primary">4. {language === "en" ? "Review the weekly evidence" : "Consulter les preuves hebdomadaires"}</Link>
          </div>
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

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{language === "en" ? "Suggested groups" : "Groupes recommandés"}</h2>
        <Link href="/teacher/groups" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {language === "en" ? "All groups" : "Tous les groupes"}
        </Link>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {language === "en" ? "No gap detected yet (students first need to complete readings)." : "Aucune lacune détectée pour l’instant (les élèves doivent compléter des lectures)."}
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
                <Badge variant="secondary">{g.studentNames.length} {language === "en" ? "student(s)" : "élève(s)"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/teacher/classes" className={buttonVariants()}>
          {language === "en" ? "View my classes" : "Voir mes classes"}
        </Link>
      </div>
    </>
  );
}
