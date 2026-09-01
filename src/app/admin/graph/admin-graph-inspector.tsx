"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GRAPH_STRAND_LABELS, layoutStudentGraphNodes } from "@/lib/graph/presentation";
import type { AdminGraphNode, AdminGraphView, AdminGraphWarning } from "@/lib/graph/admin-presentation";
import type { Strand } from "@/lib/graph/types";

const STRAND_COLORS: Partial<Record<Strand, string>> = {
  comprehension_ecrite: "#55c8f3", conjugaison: "#ff4f98", grammaire_syntaxe: "#a78bfa",
  orthographe_lexicale: "#58d6a3", orthographe_grammaticale: "#f5c044", lexique: "#2dd4bf",
  analyse: "#818cf8", comprehension_orale: "#38bdf8", production_orale: "#fb7185", expression_ecrite: "#c084fc",
};

const WARNING_LABELS: Record<AdminGraphWarning["code"], string> = {
  cycle: "Cycle", dangling_edge: "Référence absente", orphan_node: "Nœud isolé",
  missing_evidence: "Preuve manquante", unknown_prerequisite_class: "Classe inconnue",
};

type EdgeFilter = "hard" | "soft" | "unknown";

export function AdminGraphInspector({ graph }: { graph: AdminGraphView }) {
  const [query, setQuery] = useState("");
  const [strand, setStrand] = useState<Strand | "all">("all");
  const [warningOnly, setWarningOnly] = useState(false);
  const [edgeFilters, setEdgeFilters] = useState<Set<EdgeFilter>>(new Set(["hard", "soft", "unknown"]));
  const [selectedId, setSelectedId] = useState(graph.warnings[0]?.nodeIds[0] ?? graph.nodes[0]?.id ?? "");

  const positions = useMemo(() => layoutStudentGraphNodes(graph.nodes), [graph.nodes]);
  const warningNodeIds = useMemo(() => new Set(graph.warnings.flatMap((warning) => warning.nodeIds)), [graph.warnings]);
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const visibleNodes = graph.nodes.filter((node) => {
    if (strand !== "all" && node.strand !== strand) return false;
    if (warningOnly && !warningNodeIds.has(node.id)) return false;
    return !normalizedQuery || `${node.label} ${node.key}`.toLocaleLowerCase("fr").includes(normalizedQuery);
  });
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = graph.edges.filter((edge) => edge.sourceNodeId && edge.targetNodeId
    && edgeFilters.has(edge.prerequisiteClass)
    && visibleNodeIds.has(edge.sourceNodeId)
    && visibleNodeIds.has(edge.targetNodeId));
  const selectedNode = visibleNodes.find((node) => node.id === selectedId) ?? visibleNodes[0] ?? null;
  const selectedWarnings = selectedNode ? graph.warnings.filter((warning) => warning.nodeIds.includes(selectedNode.id)) : [];
  const selectedEdges = selectedNode ? graph.edges.filter((edge) => edge.sourceNodeId === selectedNode.id || edge.targetNodeId === selectedNode.id) : [];
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const strands = [...new Set(graph.nodes.map((node) => node.strand))].sort((a, b) => (GRAPH_STRAND_LABELS[a] ?? a).localeCompare(GRAPH_STRAND_LABELS[b] ?? b, "fr"));

  function toggleEdgeFilter(filter: EdgeFilter) {
    setEdgeFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) next.delete(filter); else next.add(filter);
      return next;
    });
  }

  function inspectWarning(warning: AdminGraphWarning) {
    const nodeId = warning.nodeIds[0];
    if (!nodeId) return;
    setWarningOnly(false);
    setStrand("all");
    setQuery("");
    setSelectedId(nodeId);
  }

  const releaseApproved = graph.release.status === "published";
  const releaseStatusLabel = graph.release.status === "published" ? "Version publiée"
    : graph.release.status === "withdrawn" ? "Version retirée"
      : graph.release.status === "validating" ? "Version candidate" : "Brouillon";
  return <section className="overflow-hidden rounded-xl border border-border-strong bg-card shadow-[0_24px_70px_rgba(13,17,33,0.08)]">
    <div className="flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full ${releaseApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
          {releaseApproved ? <ShieldCheck className="size-5" /> : <CircleDot className="size-5" />}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{graph.release.key}</h2><Badge variant={releaseApproved ? "success" : "secondary"}>{releaseStatusLabel}</Badge></div>
          <p className="mt-0.5 text-xs text-muted-foreground">Version {graph.release.version} · lecture seule · empreinte {shortChecksum(graph.release.checksum)}</p>
        </div>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">Les alertes décrivent la structure de cette version. Elles ne modifient ni les nœuds, ni les relations, ni leur statut de révision.</p>
    </div>

    <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
          <label className="relative min-w-52 flex-1 sm:max-w-xs"><span className="sr-only">Rechercher un nœud</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nœud" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label>
          <label><span className="sr-only">Filtrer par domaine</span><select value={strand} onChange={(event) => setStrand(event.target.value as Strand | "all")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">Tous les domaines</option>{strands.map((item) => <option key={item} value={item}>{GRAPH_STRAND_LABELS[item] ?? item}</option>)}</select></label>
          <button type="button" aria-pressed={warningOnly} onClick={() => setWarningOnly((value) => !value)} className={`h-10 rounded-lg border px-3 text-xs font-semibold ${warningOnly ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-input bg-background text-muted-foreground"}`}>Alertes uniquement</button>
          <div className="flex h-10 items-center rounded-lg border border-input bg-background p-1">
            {(["hard", "soft", "unknown"] as const).map((filter) => <button key={filter} type="button" aria-pressed={edgeFilters.has(filter)} onClick={() => toggleEdgeFilter(filter)} className={`h-8 rounded-md px-2.5 text-[11px] font-semibold ${edgeFilters.has(filter) ? "bg-foreground text-background" : "text-muted-foreground"}`}>{filter === "hard" ? "Nécessaire" : filter === "soft" ? "Aide" : "Inconnu"}</button>)}
          </div>
        </div>

        <div className="hidden bg-[#090d1a] sm:block">
          {visibleNodes.length ? <svg viewBox="0 0 1200 720" className="h-[36rem] w-full" role="group" aria-label={`${visibleNodes.length} nœuds visibles dans la version ${graph.release.version}`}>
            <defs><radialGradient id="admin-graph-bg" cx="50%" cy="42%" r="72%"><stop offset="0%" stopColor="#17203a" /><stop offset="72%" stopColor="#0d1324" /><stop offset="100%" stopColor="#080b15" /></radialGradient><filter id="admin-node-glow" x="-200%" y="-200%" width="400%" height="400%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <rect width="1200" height="720" fill="url(#admin-graph-bg)" />
            <g aria-hidden="true">{visibleEdges.map((edge) => { const source = positions[edge.sourceNodeId!]; const target = positions[edge.targetNodeId!]; if (!source || !target) return null; const active = selectedNode?.id === edge.sourceNodeId || selectedNode?.id === edge.targetNodeId; return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={active ? "#f2f5ff" : edge.prerequisiteClass === "unknown" ? "#f59e0b" : "#647193"} strokeWidth={active ? 1.8 : 1} strokeDasharray={edge.prerequisiteClass === "soft" ? "5 5" : edge.prerequisiteClass === "unknown" ? "2 5" : undefined} opacity={active ? .8 : .24} />; })}</g>
            {visibleNodes.map((node) => { const position = positions[node.id]; const selected = selectedNode?.id === node.id; const warned = warningNodeIds.has(node.id); const color = STRAND_COLORS[node.strand] ?? "#8b95ad"; return <g key={node.id} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${node.label}${warned ? ". Alerte structurelle." : ""}`} transform={`translate(${position.x} ${position.y})`} className="cursor-pointer outline-none" onClick={() => setSelectedId(node.id)} onFocus={() => setSelectedId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.id); } }}><title>{node.label}</title>{warned && <circle r={selected ? 17 : 13} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />}<circle r={selected ? 10 : 6} fill={color} stroke={selected ? "#fff" : color} strokeWidth={selected ? 2.5 : 1} opacity={selectedNode && !selected ? .67 : 1} filter={selected ? "url(#admin-node-glow)" : undefined} />{(selected || warned) && <text x={selected ? 18 : 14} y="4" fill="#f5f7ff" fontSize={selected ? 13 : 10.5} fontWeight={selected ? 700 : 600} paintOrder="stroke" stroke="#090d1a" strokeWidth="4">{truncate(node.label)}</text>}</g>; })}
          </svg> : <div className="flex h-[36rem] items-center justify-center px-8 text-sm text-[#9ba5c3]">Aucun nœud ne correspond à ces filtres.</div>}
        </div>

        <div className="max-h-[32rem] overflow-y-auto bg-[#090d1a] p-3 sm:hidden">{visibleNodes.length ? visibleNodes.map((node) => <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`mb-1.5 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selectedNode?.id === node.id ? "border-[#ff4f98] bg-[#171f35]" : "border-white/10"}`}><span className="size-2.5 rounded-full" style={{ backgroundColor: STRAND_COLORS[node.strand] }} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-white">{node.label}</span><span className="block truncate text-[11px] text-[#9ba5c3]">{node.key}</span></span>{warningNodeIds.has(node.id) && <AlertTriangle className="size-4 text-amber-400" />}</button>) : <p className="py-10 text-center text-sm text-[#9ba5c3]">Aucun nœud ne correspond à ces filtres.</p>}</div>

        <WarningRail warnings={graph.warnings} inspect={inspectWarning} />
      </div>

      <NodeInspector node={selectedNode} warnings={selectedWarnings} edges={selectedEdges} nodeById={nodeById} select={setSelectedId} />
    </div>
  </section>;
}

function WarningRail({ warnings, inspect }: { warnings: AdminGraphWarning[]; inspect: (warning: AdminGraphWarning) => void }) {
  return <div className="border-t border-border px-5 py-5"><div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold">Alertes structurelles</h3><span className="text-xs text-muted-foreground">{warnings.length || "Aucune"}</span></div>{warnings.length ? <div className="mt-3 grid gap-x-6 gap-y-1 md:grid-cols-2">{warnings.slice(0, 8).map((warning) => <button key={warning.id} type="button" onClick={() => inspect(warning)} className="flex items-start gap-2 border-b border-border/70 py-2 text-left text-xs leading-5 text-muted-foreground hover:text-foreground"><AlertTriangle className={`mt-0.5 size-3.5 shrink-0 ${warning.severity === "error" ? "text-destructive" : "text-amber-500"}`} /><span><strong className="font-semibold text-foreground">{WARNING_LABELS[warning.code]}</strong> · {warning.message}</span></button>)}</div> : <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> Aucun problème structurel détecté.</p>}</div>;
}

function NodeInspector({ node, warnings, edges, nodeById, select }: { node: AdminGraphNode | null; warnings: AdminGraphWarning[]; edges: AdminGraphView["edges"]; nodeById: Map<string, AdminGraphNode>; select: (id: string) => void }) {
  if (!node) return <aside className="flex min-h-72 items-center justify-center border-t border-border p-7 text-center text-sm text-muted-foreground lg:border-l lg:border-t-0">Sélectionnez un nœud.</aside>;
  const prerequisites = edges.filter((edge) => edge.targetNodeId === node.id && edge.sourceNodeId).map((edge) => ({ edge, node: nodeById.get(edge.sourceNodeId!) })).filter((item): item is { edge: AdminGraphView["edges"][number]; node: AdminGraphNode } => Boolean(item.node));
  const unlocks = edges.filter((edge) => edge.sourceNodeId === node.id && edge.targetNodeId).map((edge) => ({ edge, node: nodeById.get(edge.targetNodeId!) })).filter((item): item is { edge: AdminGraphView["edges"][number]; node: AdminGraphNode } => Boolean(item.node));
  return <aside aria-live="polite" className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0 lg:p-7"><div className="flex flex-wrap gap-2"><Badge variant={node.reviewStatus === "human_approved" ? "success" : "outline"}>Révision actuelle · {reviewLabel(node.reviewStatus)}</Badge>{warnings.length > 0 && <Badge variant="secondary">{warnings.length} alerte{warnings.length === 1 ? "" : "s"}</Badge>}</div><h3 className="mt-4 text-xl font-semibold leading-7">{node.label}</h3><p className="mt-1 break-all font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{node.key}</p>{node.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{node.description}</p>}
    <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center"><div className="px-2"><dt className="text-[10px] uppercase text-muted-foreground">Atomicité</dt><dd className="mt-1 text-lg font-semibold">{node.atomicityLevel ?? "—"}</dd></div><div className="px-2"><dt className="text-[10px] uppercase text-muted-foreground">Preuves</dt><dd className="mt-1 text-lg font-semibold">{node.evidenceCount}</dd></div><div className="px-2"><dt className="text-[10px] uppercase text-muted-foreground">Version</dt><dd className="mt-1 text-lg font-semibold">{node.recordVersion}</dd></div></dl>
    <Relationship title="Prérequis" items={prerequisites} select={select} /><Relationship title="Débloque" items={unlocks} select={select} />
    <div className="mt-6 border-t border-border pt-5"><h4 className="text-sm font-semibold">Provenance</h4><dl className="mt-3 space-y-2 text-xs leading-5"><div><dt className="text-muted-foreground">Sources</dt><dd>{node.sourceKeys.length ? node.sourceKeys.join(", ") : "Non renseignées dans l'instantané"}</dd></div><div><dt className="text-muted-foreground">Origine d'auteur</dt><dd>{node.generationType ?? "Indisponible"}</dd></div><div><dt className="text-muted-foreground">Empreinte du record</dt><dd className="font-mono">{shortChecksum(node.recordChecksum)}</dd></div></dl></div>
    {warnings.length > 0 && <div className="mt-6 border-t border-border pt-5"><h4 className="text-sm font-semibold">Alertes liées</h4><ul className="mt-2 space-y-2">{warnings.map((warning) => <li key={warning.id} className="flex gap-2 text-xs leading-5 text-muted-foreground"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />{warning.message}</li>)}</ul></div>}
  </aside>;
}

function Relationship({ title, items, select }: { title: string; items: Array<{ edge: AdminGraphView["edges"][number]; node: AdminGraphNode }>; select: (id: string) => void }) {
  return <div className="mt-6"><h4 className="text-sm font-semibold">{title}</h4>{items.length ? <ul className="mt-2 space-y-1.5">{items.slice(0, 6).map(({ edge, node }) => <li key={edge.id}><button type="button" onClick={() => select(node.id)} className="flex w-full items-start justify-between gap-3 text-left text-xs leading-5 text-muted-foreground hover:text-foreground"><span>{node.label}</span><span className="shrink-0 font-mono text-[9px] uppercase">{edge.prerequisiteClass}</span></button></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">Aucune relation directe.</p>}</div>;
}

function reviewLabel(status: string | null) { return status === "human_approved" ? "Approuvé humainement" : status === "auto_approved" ? "Approbation automatique" : status ?? "Statut indisponible"; }
function shortChecksum(value: string | null) { if (!value) return "non renseignée"; const body = value.replace(/^sha256:/, ""); return body.length > 16 ? `${body.slice(0, 8)}…${body.slice(-6)}` : body; }
function truncate(value: string) { return value.length > 32 ? `${value.slice(0, 29)}…` : value; }
