import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getContentDashboardCounts } from "@/lib/db/content";
import { getReviewerQueue } from "@/lib/db/reviews";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/clock";

export default async function AdminHome() {
  const session = await requireRole(["platform_admin"]);
  const db = await createClient();
  const since = new Date(nowMs() - 7 * 86_400_000).toISOString();
  const [counts, queue, decisions, policy, diagnostics, readings] = await Promise.all([
    getContentDashboardCounts(db),
    getReviewerQueue(session.id, db),
    db.from("content_review_versions").select("id", { count: "exact", head: true }).eq("workflow_status", "review_complete"),
    db.from("passage_automation_policy").select("enabled,sample_percent").eq("id", true).maybeSingle(),
    db.from("diagnostic_runs").select("id", { count: "exact", head: true }).eq("status", "completed").gte("started_at", since),
    db.from("reading_sessions").select("student_id").gte("started_at", since),
  ]);
  const pending = queue.filter(item => item.status !== "submitted" && !["retired", "rejected", "needs_revision"].includes(item.workflowStatus))
    .sort((a, b) => b.versionNumber - a.versionNumber || b.assignedAt.localeCompare(a.assignedAt));
  const next = pending.slice(0, 3);
  const completed = queue.filter(item => item.status === "submitted").length;
  const decisionCount = decisions.error ? null : decisions.count ?? 0;
  const activeStudents = readings.error ? null : new Set((readings.data ?? []).map(row => row.student_id)).size;
  const firstName = session.displayName?.split(" ")[0] ?? "";
  const actions = [
    { title: "Décisions de publication", value: decisionCount, description: decisionCount === null ? "Le nombre de décisions est momentanément indisponible." : decisionCount > 0 ? "Ces passages ont reçu le nombre d’avis requis. Examinez les retours et prenez la décision éditoriale." : "Aucun passage n’attend de décision éditoriale.", href: "/admin/reviews", label: "Ouvrir les évaluations" },
    { title: "Textes disponibles", value: counts.approved, description: "Textes approuvés dans la bibliothèque, disponibles pour les activités de lecture.", href: "/admin/content", label: "Voir la bibliothèque" },
  ];

  return <>
    <PageHeader title={firstName ? "Bonjour " + firstName : "Accueil"} description="Vos prochaines actions et l’activité de Plume." />
    <section aria-labelledby="my-reviews">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="my-reviews" className="text-xl font-semibold">Vos prochains textes à évaluer</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Un avis favorable suffit pour la décision éditoriale. Les autres évaluateurs peuvent continuer en parallèle.</p>
        </div>
        <Button asChild variant="outline"><Link href="/review">Mes évaluations <ArrowRight aria-hidden className="size-4" /></Link></Button>
      </div>
      {next.length > 0 ? <div className="mt-5 divide-y divide-border border-y border-border">
        {next.map((item, index) => <Link key={item.assignmentId} href={"/review/" + item.assignmentId} className="group flex items-center gap-4 py-5 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary sm:gap-6">
          <span aria-hidden className="w-7 shrink-0 font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium group-hover:text-primary">{item.candidate.generated.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.status === "draft" ? "Évaluation commencée" : "À lire et à évaluer"}{item.versionNumber > 1 ? " · Version corrigée" : ""}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary"><span className="hidden sm:inline">{item.status === "draft" ? "Reprendre" : "Évaluer"}</span><ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></span>
        </Link>)}
      </div> : <p className="mt-5 border-y border-border py-6 text-sm text-muted-foreground">Vous n’avez aucun texte en attente dans votre file.</p>}
      <p className="mt-3 text-sm text-muted-foreground">{completed} évaluation{completed !== 1 ? "s" : ""} déjà remise{completed !== 1 ? "s" : ""}. Vos avis restent enregistrés.</p>
    </section>

    <section aria-label="Publication des textes" className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
      {actions.map(action => <div key={action.title} className="border-t border-border pt-5">
        <h2 className="text-base font-semibold">{action.title}</h2>
        <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{action.value ?? "—"}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{action.description}</p>
        <Link href={action.href} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">{action.label}<ArrowRight aria-hidden className="size-4" /></Link>
      </div>)}
    </section>

    <section className="mt-9 border-y border-border py-5" aria-labelledby="automatic-publication">
      <h2 id="automatic-publication" className="font-semibold">Publication automatique : {policy.error || !policy.data ? "statut indisponible" : policy.data.enabled ? "activée" : "désactivée"}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{policy.error || !policy.data ? "Le statut n’a pas pu être chargé. Réessayez dans quelques instants." : policy.data.enabled ? "Les textes qui passent les contrôles peuvent être publiés automatiquement. Les exceptions et un échantillon de " + policy.data.sample_percent + " % font l’objet d’une évaluation humaine." : "Les textes générés ne sont pas encore publiés automatiquement. La prochaine étape est de valider les textes de référence, puis de vérifier les contrôles automatiques. Vous n’avez pas à relire tous les textes générés."}</p>
    </section>

    <section className="mt-8" aria-labelledby="student-activity">
      <h2 id="student-activity" className="font-semibold">Activité des élèves · 7 derniers jours</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeStudents === null || diagnostics.error ? "L’activité est momentanément indisponible." : activeStudents === 0 && diagnostics.count === 0 ? "Aucune lecture ni aucun diagnostic terminé sur cette période." : activeStudents + " élève(s) ont ouvert une lecture · " + (diagnostics.count ?? 0) + " diagnostic(s) terminé(s)."}</p>
      <Link href="/admin/users" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Gérer les comptes et les accès<ArrowRight aria-hidden className="size-4" /></Link>
    </section>
  </>;
}
