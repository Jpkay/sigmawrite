"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, CircleX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetencyItemRow } from "@/lib/db/items";
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
  filters: { section: string; tier: string };
  pagination: { page: number; pageCount: number; filteredTotal: number };
  basePath?: string;
  showExport?: boolean;
  showScopeSwitch?: boolean;
  reviewerMode?: boolean;
};

export function ItemReviewQueue({ scope, initialItems, progress, filters, pagination, basePath = "/admin/items/review", showExport = true, showScopeSwitch = true, reviewerMode = false }: QueueProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(0);
  const items = initialItems.filter((item) => !dismissed.includes(item.id));
  const activeIndex = Math.min(cursor, Math.max(0, items.length - 1));

  async function decide(item: CompetencyItemRow, decision: "human_approved" | "rejected", promptFr: string, correctAnswer: string, note = "") {
    setBusy(item.id);
    setError("");
    try {
      await reviewCompetencyItem({ id: item.id, decision, promptFr, correctAnswer: correctAnswer || null, note: note || undefined, assignmentMode: reviewerMode });
      setDismissed((ids) => [...ids, item.id]);
      router.refresh();
    } catch {
      setError("La décision n’a pas pu être enregistrée. Réessayez dans un instant.");
    } finally {
      setBusy(null);
    }
  }

  const reviewed = progress.humanApproved + progress.autoApproved + progress.rejected;
  const selectionParams = { ...(scope === "practice-v3" ? { scope: "practice-v3" } : {}), ...(filters.section ? { section: filters.section } : {}), ...(filters.tier ? { tier: filters.tier } : {}) };
  const href = (page: number) => `${basePath}?${new URLSearchParams({ ...selectionParams, page: String(page) })}`;
  const exportHref = `/admin/items/review/export?${new URLSearchParams(selectionParams)}`;

  if (reviewerMode) {
    return <ReviewerWorkflow
      item={items[activeIndex]}
      itemPosition={activeIndex + 1}
      visibleCount={items.length}
      progress={progress}
      filters={filters}
      pagination={pagination}
      basePath={basePath}
      busy={busy}
      error={error}
      onPrevious={() => setCursor((value) => Math.max(0, value - 1))}
      onNext={() => setCursor((value) => Math.min(items.length - 1, value + 1))}
      canPrevious={activeIndex > 0}
      canNext={activeIndex < items.length - 1}
      onDecide={decide}
    />;
  }

  return <div className="space-y-5">
    {showScopeSwitch && <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant={scope === "practice-v3" ? "default" : "outline"}><Link href={`${basePath}?scope=practice-v3`}>Pratique v3</Link></Button>
      <Button asChild size="sm" variant={scope === "diagnostic" ? "default" : "outline"}><Link href={basePath}>Diagnostic v2</Link></Button>
    </div>}
    <div className="grid border-y border-border sm:grid-cols-4">
      <ReviewMetric label={scope === "practice-v3" ? "Validations restantes" : "À examiner"} value={progress.needsReview} />
      <ReviewMetric label={scope === "practice-v3" ? "Places validées" : "Approuvés humainement"} value={progress.humanApproved} />
      <ReviewMetric label={scope === "practice-v3" ? "Compétences prêtes" : "Calculés automatiquement"} value={scope === "practice-v3" ? `${progress.readyNodes ?? 0}/${progress.totalNodes ?? 0}` : progress.autoApproved} />
      <ReviewMetric label="Progression" value={progress.total ? `${Math.round(reviewed / progress.total * 100)}%` : "—"} />
    </div>
    <QueueFilters scope={scope} filters={filters} />
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{pagination.filteredTotal} item{pagination.filteredTotal === 1 ? "" : "s"} dans cette sélection · page {pagination.page}/{pagination.pageCount}</span><div className="flex gap-2">{showExport && scope === "diagnostic" && <Button asChild size="sm" variant="outline"><Link href={exportHref}>Exporter la sélection</Link></Button>}{pagination.page > 1 && <Button asChild size="sm" variant="outline"><Link href={href(pagination.page - 1)}>Précédente</Link></Button>}{pagination.page < pagination.pageCount && <Button asChild size="sm" variant="outline"><Link href={href(pagination.page + 1)}>Suivante</Link></Button>}</div></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {items.length === 0 ? <p className="text-sm text-muted-foreground">Aucun item en attente dans cette sélection.</p> : items.map((item) => <ReviewCard key={item.id} item={item} busy={busy === item.id} onDecide={decide} />)}
  </div>;
}

function ReviewerWorkflow({ item, itemPosition, visibleCount, progress, filters, pagination, basePath, busy, error, onPrevious, onNext, canPrevious, canNext, onDecide }: {
  item?: CompetencyItemRow;
  itemPosition: number;
  visibleCount: number;
  progress: ReviewProgress;
  filters: { section: string; tier: string };
  pagination: QueueProps["pagination"];
  basePath: string;
  busy: string | null;
  error: string;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string, note?: string) => void;
}) {
  const completed = progress.humanApproved + progress.rejected;
  const completion = progress.total ? Math.round(completed / progress.total * 100) : 0;
  return <div className="mx-auto max-w-4xl">
    <section aria-label="Progression de la revue" className="border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div><p className="text-sm font-semibold text-foreground">{progress.needsReview} exercices à examiner</p><p className="mt-0.5 text-xs text-muted-foreground">{completed} terminé{completed === 1 ? "" : "s"} sur votre lot de {progress.total}</p></div>
        <p className="font-display text-sm font-semibold text-primary">{completion}% terminé</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${completion}%` }} /></div>
    </section>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Exercice {itemPosition} sur {visibleCount} affichés · page {pagination.page}/{pagination.pageCount}</p>
      <div className="flex items-center gap-1"><Button type="button" size="sm" variant="ghost" disabled={!canPrevious} onClick={onPrevious}><ChevronLeft />Précédent</Button><Button type="button" size="sm" variant="ghost" disabled={!canNext} onClick={onNext}>Passer<ChevronRight /></Button></div>
    </div>
    <details className="group mt-3 border-b border-border pb-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm font-medium text-muted-foreground marker:content-none hover:text-foreground"><SlidersHorizontal className="size-4" /> Filtrer les exercices<span className="ml-auto text-xs font-normal group-open:hidden">Afficher</span><span className="ml-auto hidden text-xs font-normal group-open:inline">Masquer</span></summary>
      <QueueFilters scope="diagnostic" filters={filters} compact />
    </details>
    {error && <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
    {!item ? <div className="py-20 text-center"><CheckCircle2 className="mx-auto size-10 text-[color:var(--success)]" /><h2 className="mt-4 text-2xl font-semibold">Cette page est terminée</h2><p className="mt-2 text-sm text-muted-foreground">Vos décisions ont bien été enregistrées.</p>{pagination.page < pagination.pageCount && <Button asChild className="mt-6"><Link href={`${basePath}?page=${pagination.page + 1}`}>Continuer</Link></Button>}</div> : <ReviewerExercise key={item.id} item={item} busy={busy === item.id} onDecide={onDecide} />}
  </div>;
}

const sectionLabels: Record<string, string> = { reading_comprehension: "Compréhension écrite", grammar: "Grammaire", spelling: "Orthographe", conjugation: "Conjugaison" };
const tierLabels: Record<string, string> = { foundation: "Fondation", core: "Intermédiaire", stretch: "Avancé" };

function ReviewerExercise({ item, busy, onDecide }: { item: CompetencyItemRow; busy: boolean; onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string, note?: string) => void }) {
  const [prompt, setPrompt] = useState(item.promptFr);
  const [answer, setAnswer] = useState(item.correctAnswer ?? "");
  const [note, setNote] = useState("");
  const section = sectionLabels[item.diagnostic?.sectionKey ?? ""] ?? "Exercice de français";
  const tier = tierLabels[item.diagnostic?.difficultyTier ?? ""] ?? item.diagnostic?.difficultyTier;
  const promptRows = Math.min(18, Math.max(6, Math.ceil(prompt.length / 105)));
  return <article className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    <header className="pb-6 pt-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><p className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-primary">{section}</p>{tier && <><span className="text-border">/</span><p className="text-xs font-medium text-muted-foreground">Niveau {tier}{item.difficulty == null ? "" : ` · ${item.difficulty}/100`}</p></>}</div>
      <h2 className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">{item.nodeLabel}</h2>
      {item.diagnostic?.observableActionFr && <div className="mt-5 border-l-2 border-primary pl-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Objectif évalué</p><p className="mt-1 text-sm leading-6 text-foreground">{item.diagnostic.observableActionFr}</p></div>}
    </header>
    <section className="border-y border-border py-6">
      <label htmlFor={`prompt-${item.id}`} className="text-sm font-semibold">Contenu présenté à l’élève</label><p className="mt-1 text-xs text-muted-foreground">Vous pouvez corriger directement une coquille avant d’approuver.</p>
      <textarea id={`prompt-${item.id}`} value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={promptRows} className="mt-4 w-full resize-y rounded-md border border-input bg-card px-4 py-3 text-[15px] leading-7 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </section>
    <section className="py-6">
      <h3 className="text-sm font-semibold">Réponse attendue</h3>
      {item.choices.length > 0 ? <ol className="mt-3 space-y-2">{item.choices.map((choice) => <li key={choice.id} className={`flex gap-3 rounded-md border px-4 py-3 text-sm leading-6 ${choice.correct ? "border-[color:var(--success)]/35 bg-[color:var(--success)]/5 text-foreground" : "border-border text-muted-foreground"}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${choice.correct ? "bg-[color:var(--success)] text-white" : "bg-muted"}`}>{choice.correct ? <Check className="size-3.5" /> : <span className="text-[10px]">—</span>}</span><span><span className={choice.correct ? "font-medium" : ""}>{choice.text}</span>{choice.feedbackFr && <span className="mt-1 block text-xs text-muted-foreground">{choice.feedbackFr}</span>}</span></li>)}</ol> : <input aria-label="Réponse correcte" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Réponse correcte attendue" className="mt-3 h-11 w-full rounded-md border border-input bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />}
    </section>
    <section className="border-y border-border py-6">
      <h3 className="text-sm font-semibold">Trois vérifications avant de décider</h3>
      <ul className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-3">{["La consigne est claire et naturelle.", "La bonne réponse est exacte et sans ambiguïté.", "Le niveau convient à l’objectif évalué."].map((label) => <li key={label} className="flex gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /><span>{label}</span></li>)}</ul>
    </section>
    <details className="group border-b border-border py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium marker:content-none">Contrôles techniques <span className="text-xs font-normal text-muted-foreground group-open:hidden">Afficher</span><span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Masquer</span></summary>
      <div className="mt-4 space-y-4 text-xs text-muted-foreground"><dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]"><dt>Famille d’exercice</dt><dd className="text-foreground">{item.diagnostic?.promptFamily ?? "—"}</dd><dt>Version</dt><dd className="text-foreground">{item.promptVersion ?? "—"}</dd><dt>Modèle</dt><dd className="text-foreground">{item.generationModel ?? "—"}</dd></dl>{item.diagnostic && <div><p className="font-medium text-foreground">Critères automatiques</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-[11px] leading-5">{JSON.stringify(item.diagnostic.successCriteria, null, 2)}</pre></div>}{Object.keys(item.qcGates).length > 0 && <div><p className="font-medium text-foreground">Résultats des contrôles</p><ul className="mt-2 space-y-1.5">{Object.entries(item.qcGates).map(([key, value]) => <li key={key} className="flex gap-2"><span className={value === true ? "text-[color:var(--success)]" : "text-muted-foreground"}>{value === true ? "✓" : "•"}</span><span><span className="font-mono text-foreground">{key}</span> · {typeof value === "object" ? JSON.stringify(value) : String(value)}</span></li>)}</ul></div>}</div>
    </details>
    <div className="py-6"><label htmlFor={`note-${item.id}`} className="text-sm font-semibold">Commentaire de revue <span className="font-normal text-muted-foreground">· facultatif</span></label><textarea id={`note-${item.id}`} value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} placeholder="Précisez le problème si vous rejetez l’exercice…" className="mt-3 w-full resize-y rounded-md border border-input bg-card px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></div>
    <footer className="sticky bottom-3 z-20 mb-8 flex flex-col-reverse gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-[0_14px_40px_rgba(40,31,20,0.14)] backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-between sm:border-x-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:shadow-none"><p className="hidden max-w-xs text-xs leading-5 text-muted-foreground sm:block">Votre décision sera enregistrée à votre nom et l’exercice suivant s’affichera.</p><div className="flex gap-2 sm:ml-auto"><Button className="flex-1 sm:flex-none" type="button" variant="outline" disabled={busy} onClick={() => onDecide(item, "rejected", prompt, answer, note)}><CircleX />Rejeter</Button><Button className="flex-[1.4] sm:flex-none" type="button" disabled={busy} onClick={() => onDecide(item, "human_approved", prompt, answer, note)}><CheckCircle2 />{busy ? "Enregistrement…" : "Approuver et continuer"}</Button></div></footer>
  </article>;
}

function QueueFilters({ scope, filters, compact = false }: { scope: "diagnostic" | "practice-v3"; filters: { section: string; tier: string }; compact?: boolean }) {
  return <form className={`grid gap-3 sm:grid-cols-[1fr_1fr_auto] ${compact ? "py-3" : "rounded-md border border-border p-4"}`}>{scope === "practice-v3" && <input type="hidden" name="scope" value="practice-v3" />}<label className="text-sm">Section<select name="section" defaultValue={filters.section} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Toutes</option><option value="reading_comprehension">Compréhension écrite</option><option value="grammar">Grammaire</option><option value="spelling">Orthographe</option><option value="conjugation">Conjugaison</option></select></label><label className="text-sm">Niveau de difficulté<select name="tier" defaultValue={filters.tier} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Tous</option><option value="foundation">Fondation</option><option value="core">Central</option><option value="stretch">Avancé</option></select></label><Button type="submit" variant="outline" className="self-end">Appliquer</Button></form>;
}

function ReviewMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="border-b border-r border-border p-4 last:border-r-0 sm:border-b-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p></div>;
}

function ReviewCard({ item, busy, onDecide }: { item: CompetencyItemRow; busy: boolean; onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string, note?: string) => void }) {
  const [prompt, setPrompt] = useState(item.promptFr);
  const [answer, setAnswer] = useState(item.correctAnswer ?? "");
  return <Card><CardContent className="space-y-4 pt-6"><div><p className="font-medium">{item.nodeLabel}</p><p className="text-xs text-muted-foreground">{item.generationModel ?? "modèle inconnu"} · prompt {item.promptVersion ?? "—"}</p>{item.diagnostic && <><div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="secondary">{item.diagnostic.sectionKey}</Badge><Badge variant="secondary">{item.diagnostic.evidenceExpectation}</Badge><Badge variant="secondary">{item.diagnostic.evidenceKey}</Badge><Badge variant="secondary">{item.diagnostic.promptFamily}</Badge><Badge variant="secondary">{item.diagnostic.difficultyTier} · {item.difficulty ?? "—"}</Badge></div><div className="mt-3 rounded-md border border-border/70 bg-muted/30 p-3 text-sm"><p><span className="font-medium">Action observable :</span> {item.diagnostic.observableActionFr}</p><p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-foreground">Critères :</span> {JSON.stringify(item.diagnostic.successCriteria)}</p></div></>}</div><textarea aria-label="Énoncé" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" /><input aria-label="Réponse correcte" value={answer} onChange={(event) => setAnswer(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /><div className="flex flex-wrap gap-2">{Object.entries(item.qcGates).map(([key,value]) => <Badge key={key} variant={value === true ? "success" : "secondary"}>{key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}</Badge>)}</div>{item.choices.length > 0 && <ul className="text-sm text-muted-foreground">{item.choices.map((choice) => <li key={choice.id}>{choice.correct ? "✓" : "×"} {choice.text}{choice.feedbackFr ? ` — ${choice.feedbackFr}` : ""}</li>)}</ul>}<div className="flex gap-2"><Button disabled={busy} onClick={() => onDecide(item, "human_approved", prompt, answer)}>Approuver</Button><Button disabled={busy} variant="outline" onClick={() => onDecide(item, "rejected", prompt, answer)}>Rejeter</Button></div></CardContent></Card>;
}
