import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth";
import { getContentDashboardCounts } from "@/lib/db/content";
import { jobNameLabel, statusLabel } from "@/lib/presentation/french-labels";
import { createClient } from "@/lib/supabase/server";
import { nowMs } from "@/lib/clock";

export default async function AdminHome() {
  await requireRole(["platform_admin","content_reviewer"]); const db=await createClient();
  const since=new Date(nowMs()-7*86_400_000).toISOString();
  const [counts,jobsResult,generationResult,diagnosticResult,activeResult]=await Promise.all([
    getContentDashboardCounts(db),db.from("job_runs").select("id,job_name,status,started_at,error_message,processed_count").order("started_at",{ascending:false}).limit(8),db.from("generation_runs").select("yield_report").order("started_at",{ascending:false}).limit(1).maybeSingle(),db.from("diagnostic_runs").select("id,status").gte("started_at",since),db.from("reading_sessions").select("student_id").gte("started_at",since)
  ]);
  const queues=[{label:"Candidats à réviser",value:counts.pending,href:"/admin/content/review"},{label:"Signalements de modération",value:counts.flagged,href:"/admin/content/review"},{label:"Textes approuvés",value:counts.approved,href:"/admin/content"},{label:"Textes de référence",value:counts.benchmarks,href:"/admin/benchmarks"}];
  const diagnostics=diagnosticResult.data??[];const generation=(generationResult.data?.yield_report??{}) as Record<string,unknown>;const ops=[{label:"Rendement du dernier lot",value:generation.yieldRate==null?"—":`${Math.round(Number(generation.yieldRate)*100)}%`},{label:"Diagnostics démarrés (7 j)",value:String(diagnostics.length)},{label:"Diagnostics terminés (7 j)",value:String(diagnostics.filter(row=>row.status==="completed").length)},{label:"Élèves actifs (7 j)",value:String(new Set((activeResult.data??[]).map(row=>row.student_id)).size)}];
  return <><PageHeader title="Administration & opérations" description="Contenu, qualité adaptative et santé des tâches planifiées."/><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{queues.map(queue=><Link key={queue.label} href={queue.href}><Card className="transition-colors hover:border-primary/50"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{queue.label}</p><p className="mt-1 text-2xl font-semibold">{queue.value}</p></CardContent></Card></Link>)}</div><h2 className="mb-3 mt-8 text-lg font-semibold">Pilotage</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{ops.map(item=><Card key={item.label}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-semibold">{item.value}</p></CardContent></Card>)}</div><h2 className="mb-3 mt-8 text-lg font-semibold">Dernières tâches planifiées</h2>{jobsResult.data?.length?<div className="space-y-2">{jobsResult.data.map(job=><Card key={job.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{jobNameLabel(job.job_name)}</p><p className="text-xs text-muted-foreground">{new Date(job.started_at).toLocaleString("fr-FR")} · {job.processed_count} traité(s){job.error_message?` · ${job.error_message}`:""}</p></div><Badge variant={job.status==="completed"?"success":job.status==="failed"?"default":"secondary"}>{statusLabel(job.status)}</Badge></CardContent></Card>)}</div>:<p className="text-sm text-muted-foreground">Aucune exécution pour l’instant.</p>}</>;
}
