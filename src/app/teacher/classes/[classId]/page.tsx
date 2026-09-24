import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClassStudents } from "@/lib/db/dashboard";
import { classSummary, recommendedGroups } from "@/lib/reports";
import { nowMs } from "@/lib/clock";
import { getActiveJoinCode } from "@/lib/db/lifecycle";
import { JoinCodePanel } from "@/components/join-code-panel";
import { EnrollmentControl } from "@/components/enrollment-control";
import { buttonVariants } from "@/components/ui/button";
import { ClassStudentAccountForm } from "@/components/class-student-account-form";
import { ClassCredentialList } from "@/components/class-credential-list";
import { getClassManagedAccounts } from "@/lib/db/users";
import { requireRole } from "@/lib/auth";
import { ClassGoalControl } from "@/components/class-goal-control";
import { loadClassGoal, loadClassLeague } from "@/lib/actions/teacher";
import { ClassLeagueControl } from "@/components/class-league-control";
import { createClient } from "@/lib/supabase/server";
import { studentSchoolGradeLabel } from "@/lib/school-grade";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await requireRole(["teacher", "school_admin"]);
  const supabase = await createClient();
  const { data: accessibleClass, error: accessError } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .maybeSingle();
  if (accessError) throw new Error(accessError.message);
  if (!accessibleClass) notFound();

  const [classGoal, classLeague, students, joinCode, managedAccounts] = await Promise.all([
    loadClassGoal(classId),
    loadClassLeague(classId),
    getClassStudents(classId),
    getActiveJoinCode(classId),
    getClassManagedAccounts(classId),
  ]);
  const now = nowMs();
  const summary = classSummary(students, now);
  const groups = recommendedGroups(students);

  return (
    <>
      <PageHeader
        title="Classe"
        description="Bande de lecture, réussite et engagement par élève."
      />

      {session.role === "teacher" && <ClassStudentAccountForm classId={classId} />}
      <ClassGoalControl classId={classId} initial={classGoal} memberCount={students.length} />
      {classLeague && <ClassLeagueControl classId={classId} initial={classLeague} />}
      <JoinCodePanel classId={classId} initial={joinCode} />
      <div className="mb-5"><Link prefetch={false} href={`/api/teacher/classes/${classId}/export`} className={buttonVariants({ variant: "outline" })}>Télécharger le rapport CSV</Link></div>

      <h2 className="mb-3 text-lg font-semibold">Élèves</h2>
      {summary.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">Aucun élève inscrit.</p>
      ) : (
        <div className="mb-8 space-y-2">
          {summary.map((s) => {
            const student = students.find((row) => row.id === s.id);
            const gradeLabel = studentSchoolGradeLabel(student?.snap.grade, student?.snap.frenchBackground);
            return (
              <Card key={s.id} className="transition-colors hover:border-primary/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <Link className="font-medium hover:underline" href={`/teacher/students/${s.id}`}>{s.name}</Link>
                    {gradeLabel && <p className="mt-1 text-xs text-muted-foreground">{gradeLabel}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge>{s.band}</Badge>
                      {s.lowEngagement && <Badge variant="secondary">Faible engagement</Badge>}
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {s.avgSuccess !== null ? `${Math.round(s.avgSuccess * 100)}%` : "—"}
                  </span>
                  <EnrollmentControl classId={classId} studentId={s.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ClassCredentialList accounts={managedAccounts} />

      <h2 className="mb-3 text-lg font-semibold">Groupes d&apos;intervention recommandés</h2>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune lacune partagée détectée pour l&apos;instant.
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
    </>
  );
}
