import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { getViewableStudents } from "@/lib/db/dashboard";
import { getAdultLanguage } from "@/lib/i18n";
import { classSummary } from "@/lib/reports";
import { nowMs } from "@/lib/clock";

export default async function SupervisorHome() {
  const [students, language] = await Promise.all([getViewableStudents(), getAdultLanguage()]);
  const summary = classSummary(students, nowMs());
  return <>
    <PageHeader eyebrow={language === "en" ? "Supervision workspace" : "Espace de supervision"} title={language === "en" ? "Student progress overview" : "Vue d’ensemble des élèves"} description={language === "en" ? "Review progress for every student in your authorized schools, plus any direct assignments." : "Consultez les progrès de tous les élèves de vos écoles autorisées, ainsi que vos affectations directes."} />
    <div className="mb-6 grid grid-cols-2 border-y border-border"><div className="border-r border-border p-5"><p className="text-sm text-muted-foreground">{language === "en" ? "Visible students" : "Élèves visibles"}</p><p className="mt-1 font-display text-3xl font-bold">{summary.length}</p></div><div className="p-5"><p className="text-sm text-muted-foreground">{language === "en" ? "Low engagement" : "Faible engagement"}</p><p className="mt-1 font-display text-3xl font-bold">{summary.filter((student) => student.lowEngagement).length}</p></div></div>
    {summary.length ? <div className="divide-y divide-border border-y border-border">{summary.map((student) => <Link key={student.id} href={`/supervisor/students/${student.id}`} className="group flex flex-wrap items-center justify-between gap-3 px-2 py-5 text-foreground hover:bg-muted/30 hover:text-foreground sm:px-4"><div><p className="font-medium">{student.name}</p><div className="mt-1 flex flex-wrap items-center gap-2"><Badge>{student.band}</Badge>{student.lowEngagement && <Badge variant="secondary">{language === "en" ? "Low engagement" : "Faible engagement"}</Badge>}<span className="text-sm text-muted-foreground">{student.avgSuccess == null ? "—" : `${Math.round(student.avgSuccess * 100)}%`}</span></div></div><span className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="size-4" /></span></Link>)}</div> : <p className="text-sm text-muted-foreground">{language === "en" ? "No student is visible in your current scope. Ask an administrator to assign a school, class, or student." : "Aucun élève n’est visible dans votre périmètre. Demandez à un administrateur d’attribuer une école, une classe ou un élève."}</p>}
  </>;
}
