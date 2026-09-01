"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight, LocateFixed, Network, Route, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GRAPH_STRAND_CENTERS,
  GRAPH_STRAND_LABELS,
  layoutStudentGraphNodes,
  selectPersonalizedNodeIds,
  type StudentGraphNode,
  type StudentGraphView,
} from "@/lib/graph/presentation";
import type { Strand } from "@/lib/graph/types";

const BASE_VIEW = { x: 0, y: 0, width: 1200, height: 720 };

const STRAND_COLORS: Partial<Record<Strand, string>> = {
  comprehension_ecrite: "#55c8f3",
  conjugaison: "#ff4f98",
  grammaire_syntaxe: "#a78bfa",
  orthographe_lexicale: "#58d6a3",
  orthographe_grammaticale: "#f5c044",
  lexique: "#2dd4bf",
  analyse: "#818cf8",
  comprehension_orale: "#38bdf8",
  production_orale: "#fb7185",
  expression_ecrite: "#c084fc",
};

const STATUS_META = {
  mastered: { label: "Maîtrisé", color: "#58d6a3", dash: undefined },
  fragile: { label: "À consolider", color: "#f5c044", dash: "3 2" },
  missing: { label: "À construire", color: "#ff7597", dash: "2 3" },
  unknown: { label: "Encore à vérifier", color: "#77809d", dash: "1 3" },
} as const;

const PATH_STAGE_LABEL = {
  remediation: "Réparer une base",
  consolidation: "Consolider",
  verification: "Vérifier",
} as const;

const PATH_STATUS_LABEL = {
  pending: "À venir",
  available: "Disponible",
  in_progress: "En cours",
  completed: "Terminé",
  skipped: "Passé",
} as const;

type ViewMode = "path" | "all";
type StrandFilter = Strand | "all";

export function StudentCompetencyGraph({ graph }: { graph: StudentGraphView }) {
  const [mode, setMode] = useState<ViewMode>("path");
  const [strand, setStrand] = useState<StrandFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => initialSelectedNodeId(graph));
  const [viewBox, setViewBox] = useState(BASE_VIEW);
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const personalizedIds = useMemo(() => selectPersonalizedNodeIds(graph), [graph]);
  const availableStrands = useMemo(() => [...new Set(graph.nodes.map((node) => node.strand))]
    .sort((a, b) => (GRAPH_STRAND_LABELS[a] ?? a).localeCompare(GRAPH_STRAND_LABELS[b] ?? b, "fr")), [graph.nodes]);

  const visibleNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    const scoped = graph.nodes.filter((node) => {
      if (mode === "path" && !personalizedIds.has(node.id)) return false;
      if (strand !== "all" && node.strand !== strand) return false;
      if (!normalizedQuery) return true;
      return `${node.label} ${node.key}`.toLocaleLowerCase("fr").includes(normalizedQuery);
    });
    return scoped.sort((a, b) => {
      const pathDifference = (a.path?.position ?? Infinity) - (b.path?.position ?? Infinity);
      return pathDifference || a.label.localeCompare(b.label, "fr");
    });
  }, [graph.nodes, mode, personalizedIds, query, strand]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(() => graph.edges.filter((edge) =>
    visibleIds.has(edge.sourceNodeId) && visibleIds.has(edge.targetNodeId)), [graph.edges, visibleIds]);
  const positions = useMemo(() => layoutStudentGraphNodes(visibleNodes), [visibleNodes]);
  const selectedNode = visibleNodes.find((node) => node.id === selectedId) ?? visibleNodes[0] ?? null;
  const selectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.sourceNodeId === selectedNode.id || edge.targetNodeId === selectedNode.id)
    : [];
  const prerequisiteIds = new Set(selectedEdges
    .filter((edge) => edge.targetNodeId === selectedNode?.id)
    .map((edge) => edge.sourceNodeId));
  const unlockedIds = new Set(selectedEdges
    .filter((edge) => edge.sourceNodeId === selectedNode?.id)
    .map((edge) => edge.targetNodeId));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  function chooseNode(nodeId: string) {
    const position = positions[nodeId];
    setSelectedId(nodeId);
    if (position) {
      setViewBox((current) => ({
        ...current,
        x: position.x - current.width / 2,
        y: position.y - current.height / 2,
      }));
      return;
    }
    setMode("all");
    setStrand("all");
    setQuery("");
    setViewBox(BASE_VIEW);
  }

  function zoom(factor: number) {
    setViewBox((current) => {
      const nextWidth = Math.max(340, Math.min(BASE_VIEW.width, current.width * factor));
      const nextHeight = nextWidth * (BASE_VIEW.height / BASE_VIEW.width);
      const center = selectedNode ? positions[selectedNode.id] : null;
      const centerX = center?.x ?? current.x + current.width / 2;
      const centerY = center?.y ?? current.y + current.height / 2;
      return {
        x: centerX - nextWidth / 2,
        y: centerY - nextHeight / 2,
        width: nextWidth,
        height: nextHeight,
      };
    });
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      originX: viewBox.x,
      originY: viewBox.y,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = (event.clientX - drag.current.clientX) * (viewBox.width / bounds.width);
    const deltaY = (event.clientY - drag.current.clientY) * (viewBox.height / bounds.height);
    setViewBox((current) => ({
      ...current,
      x: drag.current ? drag.current.originX - deltaX : current.x,
      y: drag.current ? drag.current.originY - deltaY : current.y,
    }));
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  return (
    <section aria-labelledby="mastery-map-title" className="overflow-hidden rounded-xl border border-border-strong bg-card shadow-[0_24px_70px_rgba(13,17,33,0.08)]">
      <div className="flex flex-col gap-5 border-b border-border px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-7">
        <div className="max-w-2xl">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">Parcours personnalisé</p>
          <h2 id="mastery-map-title" className="mt-2 text-2xl font-semibold tracking-tight">Ta carte de maîtrise</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Suis les liens pour voir les bases nécessaires, ce qui est prêt maintenant et ce que chaque étape débloque.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <span>{graph.meta.nodeCount} compétences</span>
          <span>{graph.meta.edgeCount} liens</span>
          <span>{graph.meta.readyCount} prête{graph.meta.readyCount === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-3">
            <div className="flex rounded-lg border border-border bg-background p-1" aria-label="Portée de la carte">
              <button
                type="button"
                aria-pressed={mode === "path"}
                onClick={() => { setMode("path"); setViewBox(BASE_VIEW); }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-display text-xs font-semibold transition-colors ${mode === "path" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Route className="size-3.5" /> Mon parcours
              </button>
              <button
                type="button"
                aria-pressed={mode === "all"}
                onClick={() => { setMode("all"); setViewBox(BASE_VIEW); }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-display text-xs font-semibold transition-colors ${mode === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Network className="size-3.5" /> Toute la carte
              </button>
            </div>

            <label className="relative min-w-48 flex-1 sm:max-w-xs">
              <span className="sr-only">Rechercher une compétence</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une compétence"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <label>
              <span className="sr-only">Filtrer par domaine</span>
              <select
                value={strand}
                onChange={(event) => setStrand(event.target.value as StrandFilter)}
                className="h-10 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">Tous les domaines</option>
                {availableStrands.map((item) => <option key={item} value={item}>{GRAPH_STRAND_LABELS[item] ?? item}</option>)}
              </select>
            </label>
          </div>

          <div className="relative hidden overflow-hidden bg-[#090d1a] sm:block">
            <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-lg border border-white/10 bg-[#11182b]/90 p-1 backdrop-blur">
              <Button type="button" variant="ghost" size="icon" onClick={() => zoom(0.78)} aria-label="Agrandir la carte" className="text-white hover:bg-white/10 hover:text-white">
                <ZoomIn />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => zoom(1.28)} aria-label="Réduire la carte" className="text-white hover:bg-white/10 hover:text-white">
                <ZoomOut />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setViewBox(BASE_VIEW)} aria-label="Recentrer la carte" className="text-white hover:bg-white/10 hover:text-white">
                <LocateFixed />
              </Button>
            </div>

            {visibleNodes.length ? (
              <svg
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                className="h-[31rem] w-full touch-none cursor-grab active:cursor-grabbing"
                role="group"
                aria-label={`${visibleNodes.length} compétences visibles. Faites glisser pour déplacer la carte.`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <defs>
                  <radialGradient id="graph-background" cx="50%" cy="42%" r="70%">
                    <stop offset="0%" stopColor="#17203a" />
                    <stop offset="68%" stopColor="#0d1324" />
                    <stop offset="100%" stopColor="#080b15" />
                  </radialGradient>
                  <filter id="node-glow" x="-200%" y="-200%" width="400%" height="400%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <marker id="edge-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#7180a4" />
                  </marker>
                </defs>
                <rect x="-2000" y="-2000" width="5200" height="4700" fill="url(#graph-background)" />

                {availableStrands.map((item) => {
                  const center = GRAPH_STRAND_CENTERS[item];
                  if (!center || !visibleNodes.some((node) => node.strand === item)) return null;
                  return <circle key={item} cx={center.x} cy={center.y} r="155" fill={STRAND_COLORS[item] ?? "#8892aa"} opacity="0.045" />;
                })}

                <g aria-hidden="true">
                  {visibleEdges.map((edge) => {
                    const source = positions[edge.sourceNodeId];
                    const target = positions[edge.targetNodeId];
                    if (!source || !target) return null;
                    const connected = selectedNode?.id === edge.sourceNodeId || selectedNode?.id === edge.targetNodeId;
                    return (
                      <line
                        key={edge.id}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={connected ? "#d8deef" : "#516080"}
                        strokeWidth={connected ? 1.8 : edge.prerequisiteClass === "soft" ? 0.7 : 1}
                        strokeDasharray={edge.prerequisiteClass === "soft" ? "5 5" : undefined}
                        opacity={connected ? 0.78 : 0.22}
                        markerEnd={connected ? "url(#edge-arrow)" : undefined}
                      />
                    );
                  })}
                </g>

                {visibleNodes.map((node) => {
                  const position = positions[node.id];
                  const status = STATUS_META[node.classification];
                  const selected = selectedNode?.id === node.id;
                  const connected = prerequisiteIds.has(node.id) || unlockedIds.has(node.id);
                  const pathActive = node.path?.status === "available" || node.path?.status === "in_progress";
                  const radius = selected ? 11 : pathActive || node.isReadyToLearn ? 8 : node.path ? 6.5 : 5;
                  const color = STRAND_COLORS[node.strand] ?? status.color;
                  const showLabel = selected || pathActive || (node.isReadyToLearn && visibleNodes.length <= 32);
                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      aria-label={`${node.label}. ${status.label}${node.isReadyToLearn ? ". Prêt à apprendre" : ""}.`}
                      transform={`translate(${position.x} ${position.y})`}
                      className="cursor-pointer outline-none"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => chooseNode(node.id)}
                      onFocus={() => setSelectedId(node.id)}
                      onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          chooseNode(node.id);
                        }
                      }}
                    >
                      <title>{`${node.label} — ${status.label}`}</title>
                      {node.isReadyToLearn && <circle r={radius + 7} fill="none" stroke="#ff4f98" strokeWidth="2" opacity="0.85" />}
                      {node.path && <circle r={radius + 3.5} fill="none" stroke="#ffffff" strokeWidth="1" opacity={pathActive ? 0.8 : 0.28} />}
                      <circle
                        r={radius}
                        fill={node.classification === "unknown" ? "#202a44" : color}
                        stroke={selected ? "#ffffff" : status.color}
                        strokeWidth={selected ? 2.5 : connected ? 2 : 1.2}
                        strokeDasharray={status.dash}
                        opacity={!selectedNode || selected || connected ? 1 : 0.62}
                        filter={selected || node.isReadyToLearn ? "url(#node-glow)" : undefined}
                      />
                      {showLabel && (
                        <text
                          x={radius + 8}
                          y="4"
                          fill="#f5f7ff"
                          fontSize={selected ? 13 : 10.5}
                          fontWeight={selected ? 700 : 600}
                          paintOrder="stroke"
                          stroke="#090d1a"
                          strokeWidth="4"
                          strokeLinejoin="round"
                        >
                          {truncateLabel(node.label)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex h-[31rem] items-center justify-center px-8 text-center text-sm text-[#9ba5c3]">
                Aucune compétence ne correspond à ces filtres.
              </div>
            )}

            <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#9ba5c3]">
              <span>Cercle rose · prêt à apprendre</span>
              <span>Trait plein · nécessaire avant</span>
              <span>Trait discontinu · aide à réussir</span>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto bg-[#090d1a] p-3 sm:hidden">
            <p className="mb-3 px-1 text-xs leading-5 text-[#9ba5c3]">Vue mobile : choisis une compétence pour consulter son parcours.</p>
            <div className="space-y-1.5">
              {visibleNodes.length ? visibleNodes.map((node) => {
                const selected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedId(node.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${selected ? "border-[#ff4f98] bg-[#171f35]" : "border-white/8 bg-white/[0.025]"}`}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: STRAND_COLORS[node.strand] ?? STATUS_META[node.classification].color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{node.label}</span>
                      <span className="mt-0.5 block text-[11px] text-[#9ba5c3]">{STATUS_META[node.classification].label}{node.isReadyToLearn ? " · Prêt à apprendre" : ""}</span>
                    </span>
                    {node.path && <span className="font-mono text-[10px] text-[#9ba5c3]">{node.path.position}</span>}
                  </button>
                );
              }) : <p className="px-3 py-10 text-center text-sm text-[#9ba5c3]">Aucune compétence ne correspond à ces filtres.</p>}
            </div>
          </div>
        </div>

        <NodeInspector
          node={selectedNode}
          prerequisites={[...prerequisiteIds].map((id) => nodeById.get(id)).filter((node): node is StudentGraphNode => Boolean(node))}
          unlocks={[...unlockedIds].map((id) => nodeById.get(id)).filter((node): node is StudentGraphNode => Boolean(node))}
          chooseNode={chooseNode}
        />
      </div>
    </section>
  );
}

function NodeInspector({
  node,
  prerequisites,
  unlocks,
  chooseNode,
}: {
  node: StudentGraphNode | null;
  prerequisites: StudentGraphNode[];
  unlocks: StudentGraphNode[];
  chooseNode: (nodeId: string) => void;
}) {
  if (!node) {
    return <aside className="flex min-h-64 items-center justify-center border-t border-border p-7 text-center text-sm text-muted-foreground lg:border-l lg:border-t-0">Choisis une compétence pour voir son parcours.</aside>;
  }
  const status = STATUS_META[node.classification];
  return (
    <aside aria-live="polite" className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0 lg:p-7">
      <div className="flex flex-wrap gap-2">
        <Badge variant={node.classification === "mastered" ? "success" : node.classification === "fragile" ? "secondary" : "outline"}>{status.label}</Badge>
        {node.isReadyToLearn && <Badge>Prêt à apprendre</Badge>}
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-7">{node.label}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">{GRAPH_STRAND_LABELS[node.strand] ?? node.strand}</p>

      {node.path && (
        <div className="mt-5 border-l-2 border-primary pl-3">
          <p className="font-display text-xs font-semibold">Étape {node.path.position} · {PATH_STAGE_LABEL[node.path.stage]}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{node.path.rationaleFr}</p>
          <p className="mt-1 text-xs text-primary">{PATH_STATUS_LABEL[node.path.status]}</p>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center">
        <div className="px-2"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Maîtrise</dt><dd className="mt-1 font-display text-lg font-semibold">{Math.round(node.masteryProbability * 100)}%</dd></div>
        <div className="px-2"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Incertitude</dt><dd className="mt-1 font-display text-lg font-semibold">{Math.round(node.uncertainty * 100)}%</dd></div>
        <div className="px-2"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Preuves</dt><dd className="mt-1 font-display text-lg font-semibold">{node.evidenceCount}</dd></div>
      </dl>

      <RelationshipList title="Bases nécessaires" empty="Aucune base directe dans cette vue." nodes={prerequisites} chooseNode={chooseNode} />
      <RelationshipList title="Ce que cela débloque" empty="Aucune étape suivante directe dans cette vue." nodes={unlocks} chooseNode={chooseNode} />

      {node.classification !== "mastered" && (
        <Button asChild className="mt-6 w-full">
          <Link href={`/student/practice/${node.id}`}>Travailler cette compétence <ArrowRight /></Link>
        </Button>
      )}
    </aside>
  );
}

function RelationshipList({ title, empty, nodes, chooseNode }: {
  title: string;
  empty: string;
  nodes: StudentGraphNode[];
  chooseNode: (nodeId: string) => void;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold">{title}</h4>
      {nodes.length ? (
        <ul className="mt-2 space-y-1.5">
          {nodes.slice(0, 5).map((node) => (
            <li key={node.id}>
              <button type="button" onClick={() => chooseNode(node.id)} className="group flex w-full items-start justify-between gap-3 text-left text-sm leading-5 text-muted-foreground hover:text-foreground">
                <span>{node.label}</span><ArrowRight className="mt-1 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-xs leading-5 text-muted-foreground">{empty}</p>}
    </div>
  );
}

function initialSelectedNodeId(graph: StudentGraphView) {
  return graph.nodes
    .filter((node) => node.path && (node.path.status === "available" || node.path.status === "in_progress"))
    .sort((a, b) => (a.path?.position ?? Infinity) - (b.path?.position ?? Infinity))[0]?.id
    ?? graph.nodes.find((node) => node.isReadyToLearn)?.id
    ?? graph.nodes[0]?.id
    ?? "";
}

function truncateLabel(label: string) {
  return label.length > 34 ? `${label.slice(0, 31)}…` : label;
}
