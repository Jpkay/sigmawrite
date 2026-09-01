import Link from "next/link";
import { PageHeader } from "@/components/page";
import { WeeklyReportView } from "@/components/weekly-report";
import { FrontierReportView } from "@/components/frontier-report";
import { AdultCompetencyGraph } from "@/components/adult-competency-graph";
import { buttonVariants } from "@/components/ui/button";
import { nowMs } from "@/lib/clock";
import { getAdultLanguage } from "@/lib/i18n";
import { loadAdultStudentGraph } from "@/lib/graph/adult-access";

export default async function SupervisorStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const [bundle, language] = await Promise.all([loadAdultStudentGraph(studentId, "teacher"), getAdultLanguage()]);
  if (!bundle) return <><PageHeader title={language === "en" ? "Student not found" : "Élève introuvable"} /><Link href="/supervisor" className={buttonVariants({ variant: "outline" })}>{language === "en" ? "Back to overview" : "Retour à la vue d’ensemble"}</Link></>;
  const { student, frontier } = bundle;
  return <>
    <PageHeader title={student.name} description={language === "en" ? "Competency pathway, evidence, and weekly reading activity." : "Parcours de compétences, preuves et activité de lecture hebdomadaire."} />
    <AdultCompetencyGraph graph={frontier.graphView} audience="teacher" language={language} studentName={student.name} />
    <h2 className="mb-3 mt-9 text-lg font-semibold">{language === "en" ? "Weekly activity" : "Activité de la semaine"}</h2>
    <WeeklyReportView snap={student.snap} nowMs={nowMs()} />
    <section className="mt-9 border-t border-border pt-7"><h2 className="text-lg font-semibold">{language === "en" ? "Evidence by competency" : "Preuves par compétence"}</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">{language === "en" ? "Diagnostic evidence, prerequisite gaps, and expectations used to interpret the map." : "Preuves diagnostiques, écarts de prérequis et attentes utilisés pour interpréter la carte."}</p><FrontierReportView data={frontier} audience="teacher" language={language} /></section>
  </>;
}
