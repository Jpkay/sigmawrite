import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { SupabaseAssessmentStore } from "@/lib/diagnostic/granular/store";
import { publicAssessmentView } from "@/lib/diagnostic/granular/service";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { getCatchUpPlan } from "@/lib/db/practice";
import { requireStudentLearningUnlocked } from "@/lib/diagnostic/access";

export default async function StudentLessonsPage() {
  const session = await requireRole(["student"]);
  const db = await createClient();
  const studentId = await getCurrentStudentId(db);
  await requireStudentLearningUnlocked(db, studentId);
  const granular = process.env.GRANULAR_DIAGNOSTIC_ENABLED === "true"
    ? await new SupabaseAssessmentStore(createServiceClient()).latestLearning(studentId) : null;
  const available = granular
    ? publicAssessmentView(granular.session, granular.bundle).learningActivities.map(activity => ({
      id: activity.activityId, label: activity.titleFr, href: activity.href,
      description: activity.action === "verify" ? "Une nouvelle question pour préciser ce que tu sais faire sans aide." : "Une explication, des exemples, puis des exercices pour t’entraîner.",
      button: activity.action === "verify" ? "Vérifier ce point" : "Commencer la leçon",
    }))
    : (await getCatchUpPlan(studentId, db)).filter(step => step.status !== "pending").map(step => ({
      id: step.nodeId, label: step.label, href: `/student/practice/${step.nodeId}`,
      description: "Une explication, des exemples, puis des exercices pour t’entraîner.",
      button: step.status === "in_progress" ? "Continuer la leçon" : "Commencer la leçon",
    }));
  return <>
    <PageHeader title="Mes leçons" description="Voici les prochaines étapes de ton parcours, à partir de tes réponses au diagnostic. Choisis une leçon pour commencer." />
    <div className="mb-6 flex flex-wrap gap-3">
      <Link href="/student/diagnostic" className={buttonVariants({variant:"outline"})}>Voir mes résultats</Link>
      {session.authUserId === "921b350e-61dc-4f0d-a8b7-a2717e94f902" && <Link href="/student/diagnostic/demo-review" className={buttonVariants({variant:"outline"})}>Revoir mes réponses au diagnostic</Link>}
    </div>
    {available.length ? <div className="grid gap-4 md:grid-cols-2">{available.map(step => <article key={step.id} className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">{step.label}</h2>
      <p className="mb-5 mt-2 text-sm text-muted-foreground">{step.description}</p>
      <Link href={step.href} className={buttonVariants()}>{step.button} <ArrowRight /></Link>
    </article>)}</div> : <p>Les prochaines leçons de ton parcours ne sont pas encore disponibles. Tu peux consulter tes résultats en attendant.</p>}
  </>;
}
