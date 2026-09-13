import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getTeacherClasses, getTeacherStudentRoster } from "@/lib/db/dashboard";
import { classSummary, recommendedGroups } from "@/lib/reports";
import { nowMs } from "@/lib/clock";
import { getAdultLanguage } from "@/lib/i18n";
import { getSessionProfile } from "@/lib/auth";
import { trackServer } from "@/lib/analytics-server";

export default async function TeacherHome() {
  const now = nowMs();
  const [classes, students, language, session] = await Promise.all([
    getTeacherClasses(),
    getTeacherStudentRoster(),
    getAdultLanguage(),
    getSessionProfile(),
  ]);
  if (session) await trackServer(session.id, "teacher_dashboard_viewed", { class_count: classes.length, student_count: students.length });
  const summary = classSummary(students, now);
  const groups = recommendedGroups(students).slice(0, 3);
  const directCount = students.filter((student) => student.access.direct).length;

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
    session?.role === "school_admin"
      ? { label: language === "en" ? "Low engagement" : "Faible engagement", value: String(summary.filter((student) => student.lowEngagement).length) }
      : { label: language === "en" ? "Direct assignments" : "Affectations directes", value: String(directCount) },
  ];

  return (
    <>
      <PageHeader
        eyebrow={language === "en" ? "Teaching workspace" : "Espace enseignant"}
        title={language === "en" ? "Class overview" : "Vue de classe"}
        description={language === "en" ? "Act on concrete competency gaps and suggested groups." : "Intervenez avec précision : lacunes de compétences et groupes recommandés."}
      />

      <Card className="mb-8 overflow-hidden border-border-strong bg-card-elevated">
        <CardContent className="p-0">
          <div className="border-b border-border bg-accent px-6 py-5">
          <h2 className="font-semibold">{language === "en" ? "Pilot setup checklist" : "Checklist de démarrage du pilote"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{language === "en" ? "Four steps from setup to evidence." : "Quatre étapes, de la classe aux preuves."}</p></div>
          <div className="grid text-sm sm:grid-cols-2">
            <Link href="/teacher/classes" className="border-b border-border p-5 transition-colors hover:bg-muted/50 sm:border-r"><span className={classes.length ? "text-success" : "text-primary"}>{classes.length ? "✓" : "01"}</span><span className="ml-3 font-medium">{language === "en" ? "Create a class" : "Créer une classe"}</span></Link>
            <Link href="/teacher/classes" className="border-b border-border p-5 transition-colors hover:bg-muted/50"><span className={students.length ? "text-success" : "text-primary"}>{students.length ? "✓" : "02"}</span><span className="ml-3 font-medium">{language === "en" ? "Enroll students" : "Inscrire les élèves"}</span></Link>
            <Link href="/teacher/assignments" className="border-b border-border p-5 transition-colors hover:bg-muted/50 sm:border-b-0 sm:border-r"><span className="text-primary">03</span><span className="ml-3 font-medium">{language === "en" ? "Assign a text or competency" : "Attribuer un texte ou une compétence"}</span></Link>
            <Link href="/teacher/reports" className="p-5 transition-colors hover:bg-muted/50"><span className="text-primary">04</span><span className="ml-3 font-medium">{language === "en" ? "Review the weekly evidence" : "Consulter les preuves hebdomadaires"}</span></Link>
          </div>
        </CardContent>
      </Card>

      <div className="mb-10 grid grid-cols-2 border-y border-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-b border-r border-border p-5 last:border-r-0 lg:border-b-0">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mb-10" aria-labelledby="teacher-roster">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="teacher-roster" className="text-lg font-semibold">{language === "en" ? "Students I can view" : "Élèves que je peux consulter"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{language === "en" ? "Each row shows the active grant: class, direct assignment, or school scope." : "Chaque ligne indique l’accès actif : classe, affectation directe ou périmètre établissement."}</p>
          </div>
          <Link href="/teacher/classes" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {language === "en" ? "Manage classes" : "Gérer les classes"}
          </Link>
        </div>
        {summary.length ? (
          <div className="divide-y divide-border border-y border-border">
            {summary.map((row) => {
              const student = students.find((candidate) => candidate.id === row.id)!;
              return (
                <Link key={row.id} href={`/teacher/students/${row.id}`} className="grid gap-3 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-3">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {student.access.classes.map((selectedClass) => <Badge key={selectedClass.id} variant="secondary">{selectedClass.name}</Badge>)}
                      {student.access.direct && <Badge variant="outline">{language === "en" ? "Direct assignment" : "Affectation directe"}</Badge>}
                      {student.access.schoolScope && student.access.classes.length === 0 && <Badge variant="outline">{language === "en" ? "School scope" : "Périmètre établissement"}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm tabular-nums text-muted-foreground">
                    <span>{row.textsThisWeek} {language === "en" ? "session(s) this week" : "session(s) cette semaine"}</span>
                    <span>{row.avgSuccess === null ? "—" : `${Math.round(row.avgSuccess * 100)}%`}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="border-y border-border py-5 text-sm text-muted-foreground">{language === "en" ? "No student is currently visible." : "Aucun élève n’est actuellement visible."}</p>
        )}
      </section>

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
