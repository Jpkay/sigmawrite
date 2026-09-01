import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FrontierData = Awaited<ReturnType<typeof import("@/lib/diagnostic/live").frontierForStudent>>;

const EVIDENCE_STATUS = {
  mastered: "Preuve confirmée",
  fragile: "Preuve partielle",
  missing: "À reprendre",
  unknown: "Non testée",
  deferred: "Production autonome à vérifier",
} as const;

const EXPECTATION_LABEL = {
  receptive: "Reconnaissance",
  controlled_production: "Production guidée",
  independent_production: "Production autonome",
} as const;

export function FrontierReportView({ data, audience = "student", language = "fr" }: { data: FrontierData; audience?: "student" | "parent" | "teacher"; language?: "fr" | "en" }) {
  const english = language === "en";
  const groups = [
    { key: "mastered" as const, title: english ? (audience === "parent" ? "Can do" : "Mastered") : audience === "parent" ? "Peut faire" : "Maîtrisé" },
    { key: "fragile" as const, title: english ? (audience === "teacher" ? "Fragile" : "Consolidating") : audience === "parent" ? "En consolidation" : audience === "teacher" ? "Fragile" : "À consolider" },
    { key: "missing" as const, title: english ? "To build" : "À construire" },
    { key: "unknown" as const, title: english ? "Still to check" : "Encore à vérifier" },
    { key: "readyToLearn" as const, title: english ? "Accessible next step" : audience === "parent" ? "Prochaine étape accessible" : "Prêt à apprendre" },
  ];
  return <div className="grid gap-4 md:grid-cols-2">{groups.map((group) => <Card key={group.key}><CardContent className="pt-6"><h2 className="mb-3 font-semibold">{group.title}</h2>{data.report[group.key].length ? <ul className="divide-y divide-border text-sm text-muted-foreground">{data.report[group.key].map((id) => {
    const evidence = data.evidenceProfile.filter((row) => row.nodeId === id);
    const blockers = data.report.blockers.find((row) => row.nodeId === id)?.blockedBy ?? [];
    const blockerLabel = english ? (audience === "teacher" ? "Unconfirmed prerequisites" : "Foundation to consolidate") : audience === "teacher" ? "Prérequis non confirmés" : audience === "parent" ? "Base à consolider" : "Bloqué par";
    return <li key={id} className="py-2.5 first:pt-0 last:pb-0"><details><summary className="cursor-pointer font-medium text-foreground marker:text-muted-foreground">{data.labels[id]?.label ?? id}</summary>{blockers.length ? <span className="mt-1 block text-xs">{blockerLabel} : {blockers.map((blocker) => data.labels[blocker]?.label ?? blocker).join(", ")}</span> : null}{evidence.length ? <ul className="mt-3 space-y-3 border-l border-border pl-3">{evidence.map((row) => <li key={row.evidenceId}><div className="flex flex-wrap items-center gap-1.5"><Badge variant={row.classification === "mastered" ? "success" : "secondary"}>{english ? evidenceStatusEn(row.classification) : EVIDENCE_STATUS[row.classification]}</Badge><span className="text-xs">{english ? expectationLabelEn(row.expectation) : EXPECTATION_LABEL[row.expectation]}</span></div><p className="mt-1 leading-5">{row.actionFr}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide">{row.distinctItemCount}/{row.requiredDistinctItems} items · {row.occasionCount}/{row.requiredOccasions} {english ? "occasions" : "occasions"}{row.observedAccuracy == null ? "" : ` · ${Math.round(row.observedAccuracy * 100)}% ${english ? "accurate" : "exact"}`}{row.distinctItemCount ? ` · ${english ? "mastery" : "maîtrise"} ${Math.round(row.masteryProbability * 100)}%` : ""}</p></li>)}</ul> : <p className="mt-2 text-xs">{english ? "Detailed evidence will appear after the v2 diagnostic." : "Les preuves détaillées seront disponibles après le diagnostic v2."}</p>}</details></li>;
  })}</ul> : <p className="text-sm text-muted-foreground">{english ? "Nothing here yet." : "Aucun élément pour l’instant."}</p>}</CardContent></Card>)}</div>;
}

function evidenceStatusEn(status: keyof typeof EVIDENCE_STATUS) {
  return ({ mastered: "Confirmed evidence", fragile: "Partial evidence", missing: "Needs review", unknown: "Not tested", deferred: "Independent production to verify" } as const)[status];
}

function expectationLabelEn(expectation: keyof typeof EXPECTATION_LABEL) {
  return ({ receptive: "Recognition", controlled_production: "Guided production", independent_production: "Independent production" } as const)[expectation];
}
