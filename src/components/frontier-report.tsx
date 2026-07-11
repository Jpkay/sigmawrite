import { Card, CardContent } from "@/components/ui/card";

type FrontierData = Awaited<ReturnType<typeof import("@/lib/diagnostic/live").frontierForStudent>>;

export function FrontierReportView({ data, audience = "student" }: { data: FrontierData; audience?: "student" | "parent" }) {
  const groups = [
    { key: "mastered" as const, title: audience === "parent" ? "Peut faire" : "Maîtrisé" },
    { key: "fragile" as const, title: audience === "parent" ? "En cours" : "À consolider" },
    { key: "missing" as const, title: audience === "parent" ? "À construire" : "À construire" },
    { key: "readyToLearn" as const, title: audience === "parent" ? "Prochaine étape accessible" : "Prêt à apprendre" },
  ];
  return <div className="grid gap-4 md:grid-cols-2">{groups.map((group) => <Card key={group.key}><CardContent className="pt-6"><h2 className="mb-3 font-semibold">{group.title}</h2>{data.report[group.key].length ? <ul className="space-y-2 text-sm text-muted-foreground">{data.report[group.key].map((id) => <li key={id}>{data.labels[id]?.label ?? id}{data.report.blockers.find((row) => row.nodeId === id)?.blockedBy.length ? <span className="block text-xs">Bloqué par : {data.report.blockers.find((row) => row.nodeId === id)?.blockedBy.map((blocker) => data.labels[blocker]?.label ?? blocker).join(", ")}</span> : null}</li>)}</ul> : <p className="text-sm text-muted-foreground">Aucun élément pour l’instant.</p>}</CardContent></Card>)}</div>;
}
