import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { getCatchUpPlan } from "@/lib/db/practice";
import { requireStudentLearningUnlocked } from "@/lib/diagnostic/access";

export default async function StudentLessonsPage() {
  const session = await requireRole(["student"]);
  const db = await createClient();
  const studentId = await getCurrentStudentId(db);
  await requireStudentLearningUnlocked(db, studentId);
  const steps = await getCatchUpPlan(studentId, db);
  const available = steps.filter(step => step.status !== "pending");
  return <>
    <PageHeader title="Mes leçons" description="Voici les prochaines étapes de ton parcours, à partir de tes réponses au diagnostic. Choisis une leçon pour commencer." />
    <div className="mb-6 flex flex-wrap gap-3">
      <Link href="/student/diagnostic" className={buttonVariants({variant:"outline"})}>Voir mes résultats</Link>
      {session.authUserId === "921b350e-61dc-4f0d-a8b7-a2717e94f902" && <Link href="/student/diagnostic/demo-review" className={buttonVariants({variant:"outline"})}>Revoir mes réponses au diagnostic</Link>}
    </div>
    {available.length ? <div className="grid gap-4 md:grid-cols-2">{available.map(step => <article key={step.nodeId} className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{step.label}</h2>
      <p className="mb-5 mt-2 text-sm text-muted-foreground">Une explication, des exemples, puis des exercices pour t’entraîner.</p>
      <Link href={`/student/practice/${step.nodeId}`} className={buttonVariants()}>{step.status === "in_progress" ? "Continuer la leçon" : "Commencer la leçon"} <ArrowRight /></Link>
    </article>)}</div> : <p>Les prochaines leçons de ton parcours ne sont pas encore disponibles. Tu peux consulter tes résultats en attendant.</p>}
  </>;
}
