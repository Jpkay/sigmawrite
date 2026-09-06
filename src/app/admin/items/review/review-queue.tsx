"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenText, CheckCircle2, ChevronLeft, ChevronRight, Languages, ListTree, Shuffle, SlidersHorizontal, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewExercise } from "@/components/review-exercise";
import type { CompetencyItemRow, ReviewerExerciseSectionProgress } from "@/lib/db/items";
import { reviewCompetencyItem } from "@/lib/actions/items";

type ReviewProgress = {
  total: number;
  needsReview: number;
  humanApproved: number;
  autoApproved: number;
  rejected: number;
  readyNodes?: number;
  totalNodes?: number;
};

type QueueProps = {
  scope: "diagnostic" | "practice-v3";
  initialItems: CompetencyItemRow[];
  progress: ReviewProgress;
  filters: { section: string; tier: string; plan?: boolean };
  pagination: { page: number; pageCount: number; filteredTotal: number };
  basePath?: string;
  showExport?: boolean;
  showScopeSwitch?: boolean;
  reviewerMode?: boolean;
  reviewMode?: "mixed" | "focus";
  sectionProgress?: ReviewerExerciseSectionProgress[];
};

export function ItemReviewQueue({ scope, initialItems, progress, filters, pagination, basePath = "/admin/items/review", showExport = true, showScopeSwitch = true, reviewerMode = false, reviewMode = "mixed", sectionProgress = [] }: QueueProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);
  const [navigationLocked, setNavigationLocked] = useState(false);
  const [cursorId, setCursorId] = useState("");
  const positionKey = `review-position:${basePath}:${scope}:${filters.section}:${filters.tier}:${filters.plan}:${pagination.page}`;
  const storedId = useSyncExternalStore(subscribePosition, () => readPosition(positionKey), () => "");
  const [batch] = useState(initialItems);
  const items = batch.filter((item) => !dismissed.includes(item.id)).map((item) => initialItems.find((fresh) => fresh.id === item.id) ?? item);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === (cursorId || storedId)));
  function setCursor(index: number) {
    const id = items[Math.max(0, Math.min(index, items.length - 1))]?.id ?? "";
    setCursorId(id);
    try { sessionStorage.setItem(positionKey, id); } catch { /* Storage may be disabled. */ }
    window.dispatchEvent(new Event("review-position"));
  }

  async function decide(item: CompetencyItemRow, decision: "human_approved" | "rejected", promptFr: string, correctAnswer: string, note = "") {
    setBusy(item.id);
    setError("");
    try {
      await reviewCompetencyItem({ id: item.id, decision, promptFr, correctAnswer: correctAnswer || null, note: note || undefined, assignmentMode: reviewerMode });
      setCursor(activeIndex + 1);
      if (reviewerMode) {
        setDismissed((ids) => [...ids, item.id]);
        setThanks(true);
        router.refresh();
        return;
      }
      setDismissed((ids) => [...ids, item.id]);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La décision n’a pas pu être enregistrée. Réessayez dans un instant.");
    } finally {
      setBusy(null);
    }
  }

  const selectionParams = { ...(scope === "practice-v3" ? { scope: "practice-v3" } : {}), ...(reviewerMode && reviewMode === "focus" ? { mode: "focus" } : {}), ...(filters.section ? { section: filters.section } : {}), ...(filters.tier ? { tier: filters.tier } : {}), ...(filters.plan ? { plan: "review-hour" } : {}) };
  const href = (page: number) => `${basePath}?${new URLSearchParams({ ...selectionParams, page: String(page) })}`;
  const exportHref = `/admin/items/review/export?${new URLSearchParams(selectionParams)}`;

  if (reviewerMode) {
    return <ReviewerWorkflow
      item={items[activeIndex]}
      items={items}
      activeIndex={activeIndex}
      itemPosition={activeIndex + 1}
      visibleCount={items.length}
      progress={progress}
      filters={filters}
      reviewMode={reviewMode}
      sectionProgress={sectionProgress}
      pagination={pagination}
      basePath={basePath}
      busy={busy}
      error={error}
      thanks={thanks}
      onPrevious={() => setCursor(activeIndex - 1)}
      onNext={() => setCursor(activeIndex + 1)}
      onSelect={(index) => { if (!navigationLocked) setCursor(index); }}
      onLockChange={setNavigationLocked}
      canPrevious={!busy && !navigationLocked && activeIndex > 0}
      canNext={!busy && !navigationLocked && activeIndex < items.length - 1}
      onDecide={decide}
    />;
  }

  return <div className="mx-auto max-w-3xl space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4 text-sm"><p><strong>{progress.humanApproved + progress.rejected}</strong> exercices examinés · {progress.needsReview} à relire</p><div className="flex gap-2"><Button variant="ghost" disabled={navigationLocked || busy !== null || activeIndex === 0} onClick={() => setCursor(activeIndex - 1)}>Précédent</Button><Button variant="ghost" disabled={navigationLocked || busy !== null || activeIndex >= items.length - 1} onClick={() => setCursor(activeIndex + 1)}>Passer</Button></div></div>
    <details className="border-b border-border pb-3"><summary className="cursor-pointer text-sm font-medium">Choisir les exercices</summary><div className="mt-4 space-y-4">
      {showScopeSwitch && <div className="flex gap-2"><Button asChild size="sm" variant={scope === "practice-v3" ? "default" : "outline"}><Link href={`${basePath}?scope=practice-v3`}>Entraînement</Link></Button><Button asChild size="sm" variant={scope === "diagnostic" ? "default" : "outline"}><Link href={basePath}>Diagnostic</Link></Button></div>}
      <QueueFilters scope={scope} filters={filters} />
      {scope === "diagnostic" && <Button asChild size="sm" variant="outline"><Link href={`${basePath}?${new URLSearchParams({ ...selectionParams, plan: "review-hour" })}`}>Exercices prioritaires</Link></Button>}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span>{pagination.filteredTotal} exercices dans la sélection</span>{showExport && scope === "diagnostic" && <Link href={exportHref}>Exporter la sélection</Link>}{pagination.page > 1 && <Link href={href(pagination.page - 1)}>Série précédente</Link>}{pagination.page < pagination.pageCount && <Link href={href(pagination.page + 1)}>Série suivante</Link>}</div>
    </div></details>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {items.length === 0 ? <div className="py-12 text-center"><p className="text-lg font-semibold">Cette série est terminée.</p><Button className="mt-4" onClick={() => router.push(`${href(1)}&batch=${Date.now()}`)}>Continuer la relecture</Button></div> : <ReviewExercise key={items[activeIndex].id} item={items[activeIndex]} technical onLockChange={setNavigationLocked} busy={busy === items[activeIndex].id} onDecide={decide} />}
  </div>;
}

function ReviewerWorkflow({ item, items, activeIndex, visibleCount, progress, filters, reviewMode, sectionProgress, basePath, busy, error, thanks, onPrevious, onNext, onSelect, canPrevious, canNext, onDecide, onLockChange }: {
  item?: CompetencyItemRow;
  items: CompetencyItemRow[];
  activeIndex: number;
  itemPosition: number;
  visibleCount: number;
  progress: ReviewProgress;
  filters: { section: string; tier: string };
  reviewMode: "mixed" | "focus";
  sectionProgress: ReviewerExerciseSectionProgress[];
  pagination: QueueProps["pagination"];
  basePath: string;
  busy: string | null;
  error: string;
  thanks: boolean;
  onLockChange: (locked: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  canPrevious: boolean;
  canNext: boolean;
  onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string, note?: string) => void;
}) {
  const router = useRouter();
  const completed = progress.humanApproved + progress.rejected;
  const completion = progress.total ? Math.round(completed / progress.total * 100) : 0;
  const nextPageParams = new URLSearchParams({
    ...(reviewMode === "focus" ? { mode: "focus" } : {}),
    ...(filters.section ? { section: filters.section } : {}),
    ...(filters.tier ? { tier: filters.tier } : {}),
    page: "1",
  });
  return <div className="mx-auto max-w-4xl">
    <details className="mb-4 border-b border-border pb-3"><summary className="cursor-pointer text-sm font-medium">Choisir le parcours et la catégorie</summary><div className="mt-4"><ReviewerModePicker mode={reviewMode} selectedSection={filters.section} sections={sectionProgress} /></div></details>
    <section aria-label="Progression de la revue" className="border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div><p className="text-sm font-semibold text-foreground">{progress.needsReview} exercices à examiner</p><p className="mt-0.5 text-xs text-muted-foreground">{completed} terminé{completed === 1 ? "" : "s"} sur votre lot de {progress.total}</p></div>
        <p className="font-display text-sm font-semibold text-primary">{completion}% terminé</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${completion}%` }} /></div>
    </section>
    {thanks && <div role="status" className="animate-in fade-in slide-in-from-top-2 mt-5 flex gap-3 border-l-2 border-[color:var(--success)] bg-[color:var(--success)]/8 px-4 py-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--success)]" /><div><p className="text-sm font-semibold">Avis enregistré. Merci.</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">L’exercice suivant est prêt : votre contribution améliore directement le français proposé aux enfants.</p></div></div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{visibleCount} exercices restants dans cette série</p>
      <div className="flex items-center gap-1"><Button type="button" size="sm" variant="ghost" disabled={!canPrevious} onClick={onPrevious}><ChevronLeft />Précédent</Button><Button type="button" size="sm" variant="ghost" disabled={!canNext} onClick={onNext}>Passer<ChevronRight /></Button></div>
    </div>
    <details className="group mt-3 border-b border-border pb-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm font-medium text-muted-foreground marker:content-none hover:text-foreground"><SlidersHorizontal className="size-4" /> Affiner par difficulté<span className="ml-auto text-xs font-normal group-open:hidden">Afficher</span><span className="ml-auto hidden text-xs font-normal group-open:inline">Masquer</span></summary>
      <QueueFilters scope="diagnostic" filters={filters} compact reviewerMode />
    </details>
    {reviewMode === "focus" && item && <DifficultyComparison items={items} activeIndex={activeIndex} onSelect={onSelect} />}
    {error && <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
    {!item ? <div className="py-20 text-center"><CheckCircle2 className="mx-auto size-10 text-[color:var(--success)]" /><h2 className="mt-4 text-2xl font-semibold">Cette page est terminée</h2><p className="mt-2 text-sm text-muted-foreground">Vos décisions ont bien été enregistrées.</p><Button className="mt-6" onClick={() => router.push(`${basePath}?${nextPageParams}&batch=${Date.now()}`)}>Continuer la relecture</Button></div> : <ReviewExercise key={item.id} item={item} onLockChange={onLockChange} busy={busy === item.id} onDecide={onDecide} />}
  </div>;
}

const sectionLabels: Record<string, string> = { reading_comprehension: "Compréhension écrite", grammar: "Grammaire", spelling: "Orthographe", conjugation: "Conjugaison" };
const tierLabels: Record<string, string> = { foundation: "Fondation", core: "Intermédiaire", stretch: "Avancé" };
const sectionIcons = { reading_comprehension: BookOpenText, grammar: ListTree, spelling: SpellCheck, conjugation: Languages };

function ReviewerModePicker({ mode, selectedSection, sections }: { mode: "mixed" | "focus"; selectedSection: string; sections: ReviewerExerciseSectionProgress[] }) {
  const firstAvailable = sections.find((section) => section.remaining > 0)?.sectionKey ?? "reading_comprehension";
  return <section className="mb-6" aria-labelledby="review-mode-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p id="review-mode-title" className="text-sm font-semibold">Comment souhaitez-vous avancer aujourd’hui ?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Changez de mode à tout moment. Votre progression est conservée.</p></div><Link href="/review/history" className="text-xs font-medium text-primary hover:underline">Comparer avec mon historique</Link></div>
    <div className="mt-4 grid grid-cols-2 border-y border-border">
      <Link href="/review/exercises" className={`flex min-h-16 items-center gap-3 border-r border-border px-3 py-3 transition-colors sm:px-5 ${mode === "mixed" ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}><Shuffle className="size-5 shrink-0" /><span><span className="block text-sm font-semibold">Parcours varié</span><span className="mt-0.5 block text-[11px] leading-4">Les quatre catégories alternent</span></span></Link>
      <Link href={`/review/exercises?mode=focus&section=${firstAvailable}`} className={`flex min-h-16 items-center gap-3 px-3 py-3 transition-colors sm:px-5 ${mode === "focus" ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}><ListTree className="size-5 shrink-0" /><span><span className="block text-sm font-semibold">Par catégorie</span><span className="mt-0.5 block text-[11px] leading-4">Comparer une même famille</span></span></Link>
    </div>
    <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
      {sections.map((section, index) => {
        const Icon = sectionIcons[section.sectionKey as keyof typeof sectionIcons] ?? ListTree;
        const selected = mode === "focus" && selectedSection === section.sectionKey;
        const percentage = section.total ? Math.round(section.completed / section.total * 100) : 0;
        return <Link key={section.sectionKey} href={`/review/exercises?mode=focus&section=${section.sectionKey}`} aria-current={selected ? "page" : undefined} className={`group px-3 py-4 transition-colors sm:px-4 ${index < 3 ? "sm:border-r sm:border-border" : ""} ${index % 2 === 0 ? "border-r border-border" : ""} ${index < 2 ? "border-b border-border sm:border-b-0" : ""} ${selected ? "bg-primary/8" : "hover:bg-muted/50"}`}>
          <span className="flex items-center gap-2"><Icon className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`} /><span className={`truncate text-xs font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{sectionLabels[section.sectionKey] ?? section.sectionKey}</span></span>
          <span className="mt-3 flex items-baseline justify-between gap-2"><span className="text-lg font-semibold">{section.remaining}</span><span className="text-[10px] text-muted-foreground">à revoir</span></span>
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percentage}%` }} /></span>
          <span className="mt-1.5 block text-[10px] text-muted-foreground">{section.completed}/{section.total} terminés</span>
        </Link>;
      })}
    </div>
    {mode === "focus" && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="inline-block size-1.5 rounded-full bg-primary" />Les exercices sont classés du plus accessible au plus exigeant pour faciliter la comparaison.</p>}
  </section>;
}

function DifficultyComparison({ items, activeIndex, onSelect }: { items: CompetencyItemRow[]; activeIndex: number; onSelect: (index: number) => void }) {
  const start = Math.max(0, Math.min(activeIndex - 2, Math.max(0, items.length - 5)));
  const nearby = items.slice(start, start + 5);
  return <section className="border-b border-border py-5" aria-labelledby="difficulty-comparison-title">
    <div className="flex items-end justify-between gap-4"><div><h3 id="difficulty-comparison-title" className="text-sm font-semibold">Repères dans cette catégorie</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Ouvrez un exercice voisin pour comparer le niveau avant de décider.</p></div><span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Accessible → exigeant</span></div>
    <div className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
      {nearby.map((candidate, offset) => {
        const index = start + offset;
        const active = index === activeIndex;
        return <button key={candidate.id} type="button" onClick={() => onSelect(index)} aria-current={active ? "true" : undefined} className={`min-w-40 snap-start border-l-2 px-3 py-2 text-left transition-colors sm:min-w-0 ${active ? "border-primary bg-primary/8" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${active ? "text-primary" : "text-muted-foreground"}`}>{tierLabels[candidate.diagnostic?.difficultyTier ?? ""] ?? "Niveau à préciser"}</span>
          <span className="mt-1 line-clamp-2 block text-xs font-medium leading-4">{candidate.nodeLabel}</span>
        </button>;
      })}
    </div>
  </section>;
}

function QueueFilters({ scope, filters, compact = false, reviewerMode = false }: { scope: "diagnostic" | "practice-v3"; filters: { section: string; tier: string; plan?: boolean }; compact?: boolean; reviewerMode?: boolean }) {
  return <form className={`grid gap-3 ${reviewerMode ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"} ${compact ? "py-3" : "rounded-md border border-border p-4"}`}>{scope === "practice-v3" && <input type="hidden" name="scope" value="practice-v3" />}{reviewerMode && <input type="hidden" name="mode" value={filters.section ? "focus" : "mixed"} />}{filters.plan && <input type="hidden" name="plan" value="review-hour" />}{reviewerMode && filters.section && <input type="hidden" name="section" value={filters.section} />}{!reviewerMode && <label className="text-sm">Section<select name="section" defaultValue={filters.section} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Toutes</option><option value="reading_comprehension">Compréhension écrite</option><option value="grammar">Grammaire</option><option value="spelling">Orthographe</option><option value="conjugation">Conjugaison</option></select></label>}<label className="text-sm">Difficulté de l’exercice<select name="tier" defaultValue={filters.tier} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Toutes les difficultés</option><option value="foundation">Fondation</option><option value="core">Intermédiaire</option><option value="stretch">Avancé</option></select></label><Button type="submit" variant="outline" className="self-end">Appliquer</Button></form>;
}


function subscribePosition(notify: () => void) {
  window.addEventListener("review-position", notify);
  return () => window.removeEventListener("review-position", notify);
}
function readPosition(key: string) {
  try { return sessionStorage.getItem(key) ?? ""; } catch { return ""; }
}
