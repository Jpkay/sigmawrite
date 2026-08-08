import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getCompetencyItems, getGenerationRuns } from "@/lib/db/items";
import { responseTypeLabel, reviewStatusLabel, validatorTypeLabel } from "@/lib/presentation/french-labels";

export default async function ItemBankPage({ searchParams }: { searchParams: Promise<{ status?: string; node?: string }> }) {
  await requireRole(["platform_admin", "content_reviewer"]);
  const filters = await searchParams;
  const [items, runs] = await Promise.all([getCompetencyItems(filters), getGenerationRuns()]);
  const nodeOptions = [...new Map(items.map((item) => [item.nodeKey, item.nodeLabel])).entries()].sort();
  return <>
    <PageHeader title="Banque d’items" description={`${items.length} items visibles. Filtre par nœud, statut de contrôle ou signal psychométrique.`} />
    <form className="mb-5 grid gap-3 rounded-md border border-border p-4 sm:grid-cols-3">
      <label className="text-sm">Statut<select name="status" defaultValue={filters.status ?? ""} className="mt-1 h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10"><option className="bg-zinc-950" value="">Tous</option>{["draft","auto_approved","needs_human_review","human_approved","rejected","retired"].map((status) => <option className="bg-zinc-950" key={status} value={status}>{reviewStatusLabel(status)}</option>)}</select></label>
      <label className="text-sm">Nœud<select name="node" defaultValue={filters.node ?? ""} className="mt-1 h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10"><option className="bg-zinc-950" value="">Tous</option>{nodeOptions.map(([key,label]) => <option className="bg-zinc-950" key={key} value={key}>{label}</option>)}</select></label>
      <div className="flex items-end gap-2"><Button type="submit">Filtrer</Button><Link className="text-sm text-muted-foreground hover:underline" href="/admin/items">Effacer</Link></div>
    </form>
    {runs[0] && <Card className="mb-5"><CardContent className="pt-6 text-sm"><p className="font-medium">Dernier lot : {String(runs[0].slice_key)}</p><p className="text-muted-foreground">{String(runs[0].provider)} / {String(runs[0].model_id)} · {String(runs[0].generated_count)} générés</p></CardContent></Card>}
    <div className="space-y-2">{items.map((item) => <Card key={item.id}><CardContent className="flex flex-wrap items-start justify-between gap-3 pt-6"><div className="max-w-3xl"><p className="font-medium">{item.promptFr}</p><p className="mt-1 text-xs text-muted-foreground">{item.nodeLabel} · {responseTypeLabel(item.responseType)} · {validatorTypeLabel(item.validatorType)} · difficulté {item.difficulty ?? "—"}</p></div><div className="flex flex-wrap gap-2"><Badge variant={item.reviewStatus.includes("approved") ? "success" : "secondary"}>{reviewStatusLabel(item.reviewStatus)}</Badge>{item.psychometricFlags.length > 0 && <Badge>{item.psychometricFlags.length} signal(s)</Badge>}</div></CardContent></Card>)}</div>
  </>;
}
