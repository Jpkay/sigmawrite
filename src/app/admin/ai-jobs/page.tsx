import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAIJobs } from "@/lib/db/ai";

const statusVariant = (status: string): "success" | "default" | "secondary" => status === "completed" ? "success" : status === "failed" ? "default" : "secondary";

export default async function AIJobsPage() {
  await requireRole(["platform_admin", "content_reviewer"]);
  const jobs = await getAIJobs();
  return <>
    <PageHeader title="Tâches IA" description="Modèle, prompt, durée et résultats des contrôles pour chaque génération." />
    {jobs.length === 0 ? <p className="text-sm text-muted-foreground">Aucune tâche enregistrée.</p> : <div className="space-y-3">
      {jobs.map((job) => <Card key={job.id}><CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-medium">{job.jobType}</h2><p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString("fr-FR")} · {job.provider ?? "—"} / {job.modelId ?? "—"}</p></div>
          <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Prompt :</span> {job.promptKey ?? "—"}{job.promptVersion == null ? "" : ` v${job.promptVersion}`}</p><p><span className="text-muted-foreground">Durée :</span> {job.durationMs == null ? "—" : `${job.durationMs} ms`}</p><p><span className="text-muted-foreground">Fin :</span> {job.completedAt ? new Date(job.completedAt).toLocaleString("fr-FR") : "en cours"}</p></div>
        {Object.keys(job.gateOutcomes).length > 0 && <div className="flex flex-wrap gap-2">{Object.entries(job.gateOutcomes).map(([key, value]) => <Badge key={key} variant={value === true ? "success" : value === false ? "outline" : "secondary"}>{key}: {String(value)}</Badge>)}</div>}
        {job.errorMessage && <p className="text-sm text-destructive">{job.errorMessage}</p>}
      </CardContent></Card>)}
    </div>}
  </>;
}
