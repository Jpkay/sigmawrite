import Link from "next/link";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { nowMs } from "@/lib/clock";
import { FrontierReportView } from "@/components/frontier-report";
import { AdultCompetencyGraph } from "@/components/adult-competency-graph";
import { getAdultLanguage } from "@/lib/i18n";
import { loadAdultStudentGraph } from "@/lib/graph/adult-access";
import { TeacherCommentPanel } from "@/components/teacher-comment-panel";
import { CurriculumCoverage } from "@/components/curriculum-coverage";
import { curriculumCoverage } from "@/lib/curriculum/tags";
import { createClient } from "@/lib/supabase/server";
import { loadStudentWritingSamples, loadTeacherComments } from "@/lib/actions/teacher";
import { TeacherStudentReport } from "@/components/teacher-student-report";
import { loadTeacherGranularReport } from "@/lib/db/teacher-supervision";
import { getTeacherStudentAccess } from "@/lib/db/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function TeacherStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const bundle = await loadAdultStudentGraph(studentId, "teacher");
  const language = await getAdultLanguage();

  if (!bundle) {
    return (
      <>
        <PageHeader title={language === "en" ? "Student not found" : "Élève introuvable"} />
        <Link href="/teacher" className={buttonVariants({ variant: "outline" })}>
          {language === "en" ? "Back" : "Retour"}
        </Link>
      </>
    );
  }
  const { student, frontier } = bundle;
  const [samples, comments, coverage, granular, access] = await Promise.all([
    loadStudentWritingSamples(studentId).catch(() => []),
    loadTeacherComments(studentId).catch(() => []),
    createClient().then((db) => curriculumCoverage(db, studentId)).catch(() => []),
    loadTeacherGranularReport(studentId),
    getTeacherStudentAccess(studentId),
  ]);

  return (
    <>
      <PageHeader title={student.name} description={language === "en" ? "Competency pathway, evidence, and weekly reading activity." : "Parcours de compétences, preuves et activité de lecture hebdomadaire."} />
      {access && (
        <div className="mb-7 flex flex-wrap items-center gap-2 border-y border-border py-3 text-sm">
          <span className="text-muted-foreground">{language === "en" ? "Active access:" : "Accès actif :"}</span>
          {access.classes.map((selectedClass) => <Badge key={selectedClass.id} variant="secondary">{selectedClass.name}</Badge>)}
          {access.direct && <Badge variant="outline">{language === "en" ? "Direct assignment" : "Affectation directe"}</Badge>}
          {access.schoolScope && access.classes.length === 0 && <Badge variant="outline">{language === "en" ? "School scope" : "Périmètre établissement"}</Badge>}
        </div>
      )}
      <TeacherStudentReport snap={student.snap} granular={granular} nowMs={nowMs()} language={language} />
      <section className="mt-10 border-t border-border pt-7">
        <h2 className="mb-4 text-lg font-semibold">{language === "en" ? "Competency pathway" : "Parcours de compétences"}</h2>
      <AdultCompetencyGraph graph={frontier.graphView} audience="teacher" language={language} studentName={student.name} />
      </section>
      <CurriculumCoverage rows={coverage} language={language} />
      <TeacherCommentPanel studentId={studentId} samples={samples} comments={comments} language={language} />
      <section className="mt-9 border-t border-border pt-7">
        <h2 className="text-lg font-semibold">{language === "en" ? "Longitudinal competency evidence" : "Preuves longitudinales par compétence"}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">{language === "en" ? "Confirmed evidence, prerequisite gaps, and expectations used by the ongoing pathway." : "Preuves confirmées, écarts de prérequis et attentes utilisés par le parcours continu."}</p>
        <FrontierReportView data={frontier} audience="teacher" language={language} />
      </section>
    </>
  );
}
