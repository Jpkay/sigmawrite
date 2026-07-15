"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { AlertCircle, CheckCircle2, Network, Route, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  adultGraphConfidenceLabel,
  adultGraphStatusLabel,
  adultGraphSummary,
  type AdultGraphAudience,
  type AdultGraphLanguage,
} from "@/lib/graph/adult-presentation";
import {
  GRAPH_STRAND_LABELS,
  layoutStudentGraphNodes,
  selectPersonalizedNodeIds,
  type StudentGraphNode,
  type StudentGraphView,
} from "@/lib/graph/presentation";
import type { Strand } from "@/lib/graph/types";

const STRAND_COLORS: Partial<Record<Strand, string>> = {
  comprehension_ecrite: "#55c8f3", conjugaison: "#ff4f98", grammaire_syntaxe: "#a78bfa",
  orthographe_lexicale: "#58d6a3", orthographe_grammaticale: "#f5c044", lexique: "#2dd4bf",
  analyse: "#818cf8", comprehension_orale: "#38bdf8", production_orale: "#fb7185", expression_ecrite: "#c084fc",
};

const STATUS_STROKE = { mastered: "#58d6a3", fragile: "#f5c044", missing: "#ff7597", unknown: "#77809d" } as const;
const STRAND_LABELS_EN: Partial<Record<Strand, string>> = {
  comprehension_ecrite: "Reading comprehension", conjugaison: "Verb forms", grammaire_syntaxe: "Grammar and syntax",
  orthographe_lexicale: "Word spelling", orthographe_grammaticale: "Grammar and spelling", lexique: "Vocabulary",
  analyse: "Analysis", comprehension_orale: "Listening comprehension", production_orale: "Speaking", expression_ecrite: "Writing",
};

type Scope = "path" | "all";

export function AdultCompetencyGraph({
  graph,
  audience,
  language,
  studentName,
}: {
  graph: StudentGraphView;
  audience: AdultGraphAudience;
  language: AdultGraphLanguage;
  studentName: string;
}) {
  const [scope, setScope] = useState<Scope>("path");
  const [strand, setStrand] = useState<Strand | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => initialSelection(graph));
  const personalizedIds = useMemo(() => selectPersonalizedNodeIds(graph), [graph]);
  const summary = useMemo(() => adultGraphSummary(graph), [graph]);
  const availableStrands = useMemo(() => [...new Set(graph.nodes.map((node) => node.strand))]
    .sort((a, b) => strandLabel(a, language).localeCompare(strandLabel(b, language), language)), [graph.nodes, language]);

  const visibleNodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    return graph.nodes.filter((node) => {
      if (scope === "path" && !personalizedIds.has(node.id)) return false;
      if (strand !== "all" && node.strand !== strand) return false;
      return !normalized || `${node.label} ${node.key}`.toLocaleLowerCase(language).includes(normalized);
    });
  }, [graph.nodes, language, personalizedIds, query, scope, strand]);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graph.edges.filter((edge) => visibleIds.has(edge.sourceNodeId) && visibleIds.has(edge.targetNodeId));
  const positions = useMemo(() => layoutStudentGraphNodes(visibleNodes), [visibleNodes]);
  const selectedNode = visibleNodes.find((node) => node.id === selectedId) ?? visibleNodes[0] ?? null;
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relatedEdges = selectedNode ? graph.edges.filter((edge) => edge.sourceNodeId === selectedNode.id || edge.targetNodeId === selectedNode.id) : [];
  const prerequisites = relatedEdges.filter((edge) => edge.targetNodeId === selectedNode?.id).map((edge) => ({ edge, node: nodeById.get(edge.sourceNodeId) })).filter((item): item is { edge: StudentGraphView["edges"][number]; node: StudentGraphNode } => Boolean(item.node));
  const unlocks = relatedEdges.filter((edge) => edge.sourceNodeId === selectedNode?.id).map((edge) => ({ edge, node: nodeById.get(edge.targetNodeId) })).filter((item): item is { edge: StudentGraphView["edges"][number]; node: StudentGraphNode } => Boolean(item.node));
  const copy = adultCopy(audience, language, studentName);

  function selectNode(nodeId: string) {
    if (!visibleIds.has(nodeId)) {
      setScope("all");
      setStrand("all");
      setQuery("");
    }
    setSelectedId(nodeId);
  }

  return <section aria-labelledby="adult-graph-title" className="overflow-hidden rounded-xl border border-border-strong bg-card shadow-[0_24px_70px_rgba(13,17,33,0.08)]">
    <header className="flex flex-col gap-5 border-b border-border px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-7">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{copy.eyebrow}</p><h2 id="adult-graph-title" className="mt-2 text-2xl font-semibold tracking-tight">{copy.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{copy.description}</p></div>
      <div className="grid grid-cols-3 divide-x divide-border border-y border-border text-center sm:min-w-[22rem]">
        <SummaryMetric value={summary.strengths} label={copy.strengths} />
        <SummaryMetric value={summary.consolidating} label={copy.consolidating} />
        <SummaryMetric value={summary.ready} label={copy.ready} />
      </div>
    </header>

    <div className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
          <div className="flex rounded-lg border border-input bg-background p-1" aria-label={copy.scopeLabel}>
            <ScopeButton active={scope === "path"} onClick={() => setScope("path")} icon={<Route className="size-3.5" />} label={copy.pathScope} />
            <ScopeButton active={scope === "all"} onClick={() => setScope("all")} icon={<Network className="size-3.5" />} label={copy.allScope} />
          </div>
          {audience === "teacher" && <label className="relative min-w-48 flex-1 sm:max-w-xs"><span className="sr-only">{copy.search}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label>}
          <label><span className="sr-only">{copy.domain}</span><select value={strand} onChange={(event) => setStrand(event.target.value as Strand | "all")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">{copy.allDomains}</option>{availableStrands.map((item) => <option key={item} value={item}>{strandLabel(item, language)}</option>)}</select></label>
        </div>

        <div className="hidden bg-[#090d1a] sm:block">
          {visibleNodes.length ? <svg viewBox="0 0 1200 720" className="h-[32rem] w-full" role="group" aria-label={copy.graphLabel(visibleNodes.length)}>
            <defs><radialGradient id={`adult-graph-bg-${audience}`} cx="50%" cy="42%" r="72%"><stop offset="0%" stopColor="#17203a" /><stop offset="72%" stopColor="#0d1324" /><stop offset="100%" stopColor="#080b15" /></radialGradient><filter id={`adult-graph-glow-${audience}`} x="-200%" y="-200%" width="400%" height="400%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <rect width="1200" height="720" fill={`url(#adult-graph-bg-${audience})`} />
            <g aria-hidden="true">{visibleEdges.map((edge) => { const source = positions[edge.sourceNodeId]; const target = positions[edge.targetNodeId]; if (!source || !target) return null; const active = selectedNode?.id === edge.sourceNodeId || selectedNode?.id === edge.targetNodeId; return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={active ? "#edf2ff" : "#596887"} strokeWidth={active ? 1.8 : 1} strokeDasharray={edge.prerequisiteClass === "soft" ? "5 5" : undefined} opacity={active ? .82 : .25} />; })}</g>
            {visibleNodes.map((node) => { const position = positions[node.id]; const selected = selectedNode?.id === node.id; const activePath = node.path && !["completed", "skipped"].includes(node.path.status); const color = STRAND_COLORS[node.strand] ?? "#8791ab"; return <g key={node.id} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${node.label}. ${adultGraphStatusLabel(node.classification, audience, language)}.`} transform={`translate(${position.x} ${position.y})`} className="cursor-pointer outline-none" onClick={() => setSelectedId(node.id)} onFocus={() => setSelectedId(node.id)} onKeyDown={(event: KeyboardEvent<SVGGElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.id); } }}><title>{node.label}</title>{node.isReadyToLearn && <circle r={selected ? 18 : 14} fill="none" stroke="#ff4f98" strokeWidth="2" />}{activePath && <circle r={selected ? 14 : 11} fill="none" stroke="#fff" strokeWidth="1" opacity=".65" />}<circle r={selected ? 9 : 6} fill={node.classification === "unknown" ? "#26304a" : color} stroke={selected ? "#fff" : STATUS_STROKE[node.classification]} strokeWidth={selected ? 2.5 : 1.5} strokeDasharray={node.classification === "fragile" ? "3 2" : node.classification === "missing" ? "2 3" : undefined} filter={selected ? `url(#adult-graph-glow-${audience})` : undefined} />{(selected || activePath || node.isReadyToLearn) && <text x={selected ? 17 : 14} y="4" fill="#f5f7ff" fontSize={selected ? 13 : 10.5} fontWeight={selected ? 700 : 600} paintOrder="stroke" stroke="#090d1a" strokeWidth="4">{truncate(node.label)}</text>}</g>; })}
          </svg> : <EmptyGraph message={copy.empty} />}
        </div>

        <div className="max-h-[28rem] overflow-y-auto bg-[#090d1a] p-3 sm:hidden">{visibleNodes.length ? visibleNodes.sort(compareNodes).map((node) => <button key={node.id} type="button" aria-pressed={selectedNode?.id === node.id} onClick={() => setSelectedId(node.id)} className={`mb-1.5 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selectedNode?.id === node.id ? "border-[#ff4f98] bg-[#171f35]" : "border-white/10"}`}><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: STRAND_COLORS[node.strand] }} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">{node.label}</span><span className="block text-[11px] text-[#9ba5c3]">{adultGraphStatusLabel(node.classification, audience, language)}{node.isReadyToLearn ? ` · ${copy.readyNow}` : ""}</span></span>{node.path && <span className="font-mono text-[10px] text-[#9ba5c3]">{node.path.position}</span>}</button>) : <p className="py-10 text-center text-sm text-[#9ba5c3]">{copy.empty}</p>}</div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border px-5 py-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-400" />{copy.legendSecure}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" />{copy.legendConsolidate}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-400" />{copy.legendBuild}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full ring-2 ring-[#ff4f98]" />{copy.legendReady}</span></div>
      </div>

      <AdultInspector node={selectedNode} audience={audience} language={language} copy={copy} prerequisites={prerequisites} unlocks={unlocks} selectNode={selectNode} />
    </div>
  </section>;
}

function AdultInspector({ node, audience, language, copy, prerequisites, unlocks, selectNode }: { node: StudentGraphNode | null; audience: AdultGraphAudience; language: AdultGraphLanguage; copy: ReturnType<typeof adultCopy>; prerequisites: Array<{ edge: StudentGraphView["edges"][number]; node: StudentGraphNode }>; unlocks: Array<{ edge: StudentGraphView["edges"][number]; node: StudentGraphNode }>; selectNode: (id: string) => void }) {
  if (!node) return <aside className="flex min-h-64 items-center justify-center border-t border-border p-7 text-center text-sm text-muted-foreground lg:border-l lg:border-t-0">{copy.choose}</aside>;
  return <aside aria-live="polite" className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0 lg:p-7"><div className="flex flex-wrap gap-2"><Badge variant={node.classification === "mastered" ? "success" : node.classification === "fragile" ? "secondary" : "outline"}>{adultGraphStatusLabel(node.classification, audience, language)}</Badge>{node.isReadyToLearn && <Badge>{copy.readyNow}</Badge>}</div><h3 className="mt-4 text-xl font-semibold leading-7">{node.label}</h3><p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{strandLabel(node.strand, language)}</p>
    {node.path && <div className="mt-5 border-l-2 border-primary pl-3"><p className="text-xs font-semibold">{copy.pathStep(node.path.position)}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{language === "en" ? copy.pathRationale : node.path.rationaleFr}</p></div>}
    {audience === "teacher" ? <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center"><Metric label={copy.mastery} value={`${Math.round(node.masteryProbability * 100)}%`} /><Metric label={copy.uncertainty} value={`${Math.round(node.uncertainty * 100)}%`} /><Metric label={copy.evidence} value={String(node.evidenceCount)} /></dl> : <div className="mt-6 border-y border-border py-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.evidence}</p><p className="mt-1 font-semibold">{adultGraphConfidenceLabel(node.uncertainty, language)}</p><p className="mt-1 text-xs text-muted-foreground">{copy.observations(node.evidenceCount)}</p></div>}
    <RelationshipList title={copy.prerequisites} empty={copy.noPrerequisites} items={prerequisites} selectNode={selectNode} language={language} />
    <RelationshipList title={copy.unlocks} empty={copy.noUnlocks} items={unlocks} selectNode={selectNode} language={language} />
    {node.classification === "unknown" && <p className="mt-6 flex gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0" />{copy.unknownNote}</p>}
    {node.classification === "mastered" && <p className="mt-6 flex gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{copy.masteredNote}</p>}
  </aside>;
}

function RelationshipList({ title, empty, items, selectNode, language }: { title: string; empty: string; items: Array<{ edge: StudentGraphView["edges"][number]; node: StudentGraphNode }>; selectNode: (id: string) => void; language: AdultGraphLanguage }) {
  return <div className="mt-6"><h4 className="text-sm font-semibold">{title}</h4>{items.length ? <ul className="mt-2 space-y-1.5">{items.slice(0, 5).map(({ edge, node }) => <li key={edge.id}><button type="button" onClick={() => selectNode(node.id)} className="flex w-full items-start justify-between gap-3 text-left text-xs leading-5 text-muted-foreground hover:text-foreground"><span>{node.label}</span><span className="shrink-0 font-mono text-[9px] uppercase">{edge.prerequisiteClass === "hard" ? (language === "en" ? "required" : "nécessaire") : edge.prerequisiteClass === "soft" ? (language === "en" ? "helpful" : "utile") : "—"}</span></button></li>)}</ul> : <p className="mt-2 text-xs leading-5 text-muted-foreground">{empty}</p>}</div>;
}

function ScopeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold ${active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{icon}{label}</button>; }
function SummaryMetric({ value, label }: { value: number; label: string }) { return <div className="px-3 py-3"><p className="text-xl font-semibold">{value}</p><p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="px-2"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>; }
function EmptyGraph({ message }: { message: string }) { return <div className="flex h-[32rem] items-center justify-center px-8 text-center text-sm text-[#9ba5c3]">{message}</div>; }
function initialSelection(graph: StudentGraphView) { return graph.nodes.filter((node) => node.path && ["available", "in_progress"].includes(node.path.status)).sort(compareNodes)[0]?.id ?? graph.nodes.find((node) => node.isReadyToLearn)?.id ?? graph.nodes[0]?.id ?? ""; }
function compareNodes(a: StudentGraphNode, b: StudentGraphNode) { return (a.path?.position ?? Infinity) - (b.path?.position ?? Infinity) || a.label.localeCompare(b.label); }
function truncate(value: string) { return value.length > 34 ? `${value.slice(0, 31)}…` : value; }
function strandLabel(strand: Strand, language: AdultGraphLanguage) { return language === "en" ? STRAND_LABELS_EN[strand] ?? strand : GRAPH_STRAND_LABELS[strand] ?? strand; }

function adultCopy(audience: AdultGraphAudience, language: AdultGraphLanguage, studentName: string) {
  const teacher = audience === "teacher";
  if (language === "en") return {
    eyebrow: teacher ? "Competency evidence" : "Learning pathway", title: teacher ? `${studentName}'s competency map` : `${studentName}'s learning map`,
    description: teacher ? "Inspect the active path, prerequisite evidence, and near-term unlocks." : "See secure strengths, foundations being built, and the next accessible steps.",
    strengths: "Secure", consolidating: "Consolidating", ready: "Ready now", scopeLabel: "Map scope", pathScope: "Current path", allScope: "Full map", search: "Search a competency", domain: "Filter by domain", allDomains: "All domains", empty: "No competency matches these filters.", choose: "Choose a competency to see its context.", readyNow: "Ready now", mastery: "Mastery", uncertainty: "Uncertainty", evidence: teacher ? "Evidence" : "Evidence confidence", prerequisites: teacher ? "Direct prerequisites" : "Helpful foundations", unlocks: teacher ? "Competencies unlocked" : "What this opens next", noPrerequisites: "No direct foundation in this view.", noUnlocks: "No direct next step in this view.", unknownNote: "This competency has not yet been verified with enough evidence.", masteredNote: "Current evidence supports this strength; later spaced review still matters.", legendSecure: "Secure", legendConsolidate: "Consolidating", legendBuild: "To build", legendReady: "Ready now", pathStep: (position: number) => `Path step ${position}`, pathRationale: "This step was selected from the learner's current evidence and prerequisite path.", observations: (count: number) => `${count} observation${count === 1 ? "" : "s"} currently inform this estimate.`, graphLabel: (count: number) => `${count} visible competencies for ${studentName}`,
  };
  return {
    eyebrow: teacher ? "Preuves de compétence" : "Parcours d'apprentissage", title: teacher ? `Carte de compétences de ${studentName}` : `Carte d'apprentissage de ${studentName}`,
    description: teacher ? "Inspectez le parcours actif, les prérequis et les compétences bientôt accessibles." : "Repérez les acquis solides, les bases en construction et les prochaines étapes accessibles.",
    strengths: "Acquis", consolidating: "À consolider", ready: "Prêtes", scopeLabel: "Portée de la carte", pathScope: "Parcours actuel", allScope: "Carte complète", search: "Rechercher une compétence", domain: "Filtrer par domaine", allDomains: "Tous les domaines", empty: "Aucune compétence ne correspond à ces filtres.", choose: "Choisissez une compétence pour voir son contexte.", readyNow: "Accessible maintenant", mastery: "Maîtrise", uncertainty: "Incertitude", evidence: teacher ? "Preuves" : "Confiance des preuves", prerequisites: teacher ? "Prérequis directs" : "Bases utiles", unlocks: teacher ? "Compétences débloquées" : "Ce que cela ouvre ensuite", noPrerequisites: "Aucune base directe dans cette vue.", noUnlocks: "Aucune étape suivante directe dans cette vue.", unknownNote: "Cette compétence n'a pas encore été vérifiée avec suffisamment de preuves.", masteredNote: "Les preuves actuelles soutiennent cet acquis; une révision espacée reste utile.", legendSecure: "Acquis", legendConsolidate: "À consolider", legendBuild: "À construire", legendReady: "Accessible", pathStep: (position: number) => `Étape ${position} du parcours`, pathRationale: "Cette étape est proposée à partir des preuves actuelles et du parcours de prérequis.", observations: (count: number) => `${count} observation${count === 1 ? "" : "s"} contribue${count === 1 ? "" : "nt"} actuellement à cette estimation.`, graphLabel: (count: number) => `${count} compétences visibles pour ${studentName}`,
  };
}
