import Link from "next/link";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { WeeklyReportView } from "@/components/weekly-report";
import { nowMs } from "@/lib/clock";
import { FrontierReportView } from "@/components/frontier-report";
import { AdultCompetencyGraph } from "@/components/adult-competency-graph";
import { getAdultLanguage } from "@/lib/i18n";
import { loadAdultStudentGraph } from "@/lib/graph/adult-access";

export default async function ParentStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const bundle = await loadAdultStudentGraph(studentId, "parent");
  const language = await getAdultLanguage();

  if (!bundle) {
    return (
      <>
        <PageHeader title={language === "en" ? "Child not found" : "Enfant introuvable"} />
        <Link href="/parent" className={buttonVariants({ variant: "outline" })}>
          {language === "en" ? "Back" : "Retour"}
        </Link>
      </>
    );
  }
  const { student: child, frontier } = bundle;

  return (
    <>
      <PageHeader
        title={child.name}
        description={language === "en" ? "Learning pathway and weekly evidence." : "Parcours d'apprentissage et preuves hebdomadaires."}
      />
      <AdultCompetencyGraph graph={frontier.graphView} audience="parent" language={language} studentName={child.name} />
      <h2 className="mb-3 mt-9 text-lg font-semibold">{language === "en" ? "Weekly activity" : "Activité de la semaine"}</h2>
      <WeeklyReportView snap={child.snap} nowMs={nowMs()} />
      <details className="mt-9 border-y border-border py-4">
        <summary className="cursor-pointer text-sm font-semibold">{language === "en" ? "Detailed competency evidence" : "Détail des preuves par compétence"}</summary>
        <p className="mb-4 mt-3 text-sm text-muted-foreground">{language === "en" ? "Observed evidence behind the map, including foundations still being consolidated." : "Les preuves observées derrière la carte, y compris les bases encore en consolidation."}</p>
        <FrontierReportView data={frontier} audience="parent" language={language} />
      </details>
    </>
  );
}
