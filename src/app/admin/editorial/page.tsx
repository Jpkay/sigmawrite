import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadEditorialDashboard } from "@/lib/actions/editorial-admin";
import { EditorialLiveSwitch, MarkAuditRead } from "./live-switch";

const KIND_LABELS: Record<string, string> = { passage: "Textes de lecture", dictation: "Dictées", fallback_chapter: "Chapitres de secours" };

export default async function EditorialPage() {
  const data = await loadEditorialDashboard();
  const { settings, week } = data;
  const status = !settings.liveEnabled ? "Coupée par un administrateur" : settings.liveMode === "library_only" ? `Basculée automatiquement sur la bibliothèque (${settings.autoSwitchReason ?? "alerte qualité"})` : "Active";
  return (
    <>
      <PageHeader eyebrow="Contenu" title="Pipeline éditorial" description="Tous les textes sont écrits et vérifiés automatiquement. Les audits ont lieu après publication et ne bloquent jamais un texte." />
      <Card className="mb-6">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Génération en direct</h2>
            <Badge variant={settings.liveEnabled && settings.liveMode === "live" ? "default" : "secondary"}>{status}</Badge>
          </div>
          <EditorialLiveSwitch enabled={settings.liveEnabled} mode={settings.liveMode} />
        </CardContent>
      </Card>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Chapitres en direct (7 j)", String(week.liveChapters)],
          ["Chapitres de secours", `${week.fallbackChapters} (${(week.fallbackRate * 100).toFixed(1)} %)`],
          ["Note littéraire moyenne", week.meanRubric === null ? "—" : `${week.meanRubric} / 5`],
          ["Coût moyen par chapitre", week.meanCostUsd === null ? "—" : `${week.meanCostUsd.toFixed(3)} $`],
          ["Temps de génération (95e centile)", week.p95LatencyMs === null ? "—" : `${Math.round(week.p95LatencyMs / 1000)} s`],
          ["Signalements (7 j)", String(week.reports)],
          ...data.library.map((l) => [KIND_LABELS[l.kind] ?? l.kind, String(l.count)]),
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p></div>
        ))}
      </section>
      <h2 className="mb-3 text-lg font-semibold">Alertes</h2>
      {data.alerts.length === 0 ? <p className="mb-8 text-sm text-muted-foreground">Aucune alerte.</p> : (
        <ul className="mb-8 divide-y divide-border border-y border-border text-sm">
          {data.alerts.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{a.kind} : {a.value} (seuil {a.threshold}){a.switched ? " — bascule sur la bibliothèque" : ""}</span><span className="text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span></li>)}
        </ul>
      )}
      <h2 className="mb-3 text-lg font-semibold">Audits à lire cette semaine</h2>
      <p className="mb-3 text-sm text-muted-foreground">Chapitres les moins bien notés par l’auditeur et chapitres signalés. Ce que vous y trouvez sert à enrichir la liste des tics, les cartes de style et les prompts.</p>
      {data.flaggedAudits.length === 0 ? <p className="text-sm text-muted-foreground">Rien à lire.</p> : (
        <ul className="divide-y divide-border border-y border-border text-sm">
          {data.flaggedAudits.map((a) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{a.reason === "reported" ? "Signalé" : "Échantillon"} · chapitre {a.contentId.slice(0, 8)} · note {a.rubricMean ?? "—"} · tics {a.aiTells ?? "—"}</span><MarkAuditRead auditId={a.id} /></li>)}
        </ul>
      )}
    </>
  );
}
