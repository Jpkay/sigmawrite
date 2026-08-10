"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export function ItemReviewQueue({ scope, initialItems, progress, filters, pagination }: { scope: "diagnostic" | "practice-v3"; initialItems: CompetencyItemRow[]; progress: ReviewProgress; filters: { section: string; tier: string }; pagination: { page: number; pageCount: number; filteredTotal: number } }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const items = initialItems.filter((item) => !dismissed.includes(item.id));
  async function decide(item: CompetencyItemRow, decision: "human_approved" | "rejected", promptFr: string, correctAnswer: string) {
    setBusy(item.id); setError("");
    try { await reviewCompetencyItem({ id: item.id, decision, promptFr, correctAnswer: correctAnswer || null }); setDismissed((ids) => [...ids, item.id]); router.refresh(); }
    catch { setError("La décision n’a pas pu être enregistrée."); }
    finally { setBusy(null); }
  }
  const reviewed = progress.humanApproved + progress.autoApproved + progress.rejected;
  const selectionParams = { ...(scope === "practice-v3" ? { scope: "practice-v3" } : {}), ...(filters.section ? { section: filters.section } : {}), ...(filters.tier ? { tier: filters.tier } : {}) };
  const href = (page: number) => `/admin/items/review?${new URLSearchParams({ ...selectionParams, page: String(page) })}`;
  const exportHref = `/admin/items/review/export?${new URLSearchParams(selectionParams)}`;
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant={scope === "practice-v3" ? "default" : "outline"}><Link href="/admin/items/review?scope=practice-v3">Pratique v3</Link></Button>
      <Button asChild size="sm" variant={scope === "diagnostic" ? "default" : "outline"}><Link href="/admin/items/review">Diagnostic v2</Link></Button>
    </div>
    <div className="grid border-y border-border sm:grid-cols-4">
      <ReviewMetric label={scope === "practice-v3" ? "Validations restantes" : "À examiner"} value={progress.needsReview} />
      <ReviewMetric label={scope === "practice-v3" ? "Places validées" : "Approuvés humainement"} value={progress.humanApproved} />
      <ReviewMetric label={scope === "practice-v3" ? "Compétences prêtes" : "Calculés automatiquement"} value={scope === "practice-v3" ? `${progress.readyNodes ?? 0}/${progress.totalNodes ?? 0}` : progress.autoApproved} />
      <ReviewMetric label="Progression" value={progress.total ? `${Math.round(reviewed / progress.total * 100)}%` : "—"} />
    </div>
    <form className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-[1fr_1fr_auto]">
      {scope === "practice-v3" && <input type="hidden" name="scope" value="practice-v3" />}
      <label className="text-sm">Section<select name="section" defaultValue={filters.section} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Toutes</option><option value="reading_comprehension">Compréhension écrite</option><option value="grammar">Grammaire</option><option value="spelling">Orthographe</option><option value="conjugation">Conjugaison</option></select></label>
      <label className="text-sm">Niveau de difficulté<select name="tier" defaultValue={filters.tier} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"><option value="">Tous</option><option value="foundation">Fondation</option><option value="core">Central</option><option value="stretch">Avancé</option></select></label>
      <Button type="submit" variant="outline" className="self-end">Filtrer</Button>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{pagination.filteredTotal} item{pagination.filteredTotal === 1 ? "" : "s"} dans cette sélection · page {pagination.page}/{pagination.pageCount}</span><div className="flex gap-2">{scope === "diagnostic" && <Button asChild size="sm" variant="outline"><Link href={exportHref}>Exporter la sélection</Link></Button>}{pagination.page > 1 && <Button asChild size="sm" variant="outline"><Link href={href(pagination.page - 1)}>Précédente</Link></Button>}{pagination.page < pagination.pageCount && <Button asChild size="sm" variant="outline"><Link href={href(pagination.page + 1)}>Suivante</Link></Button>}</div></div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {items.length === 0 ? <p className="text-sm text-muted-foreground">Aucun item en attente dans cette sélection.</p> : items.map((item) => <ReviewCard key={item.id} item={item} busy={busy === item.id} onDecide={decide} />)}
  </div>;
}

function ReviewMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="border-b border-r border-border p-4 last:border-r-0 sm:border-b-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p></div>;
}

function ReviewCard({ item, busy, onDecide }: { item: CompetencyItemRow; busy: boolean; onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string) => void }) {
  const [prompt, setPrompt] = useState(item.promptFr); const [answer, setAnswer] = useState(item.correctAnswer ?? "");
  return <Card><CardContent className="space-y-4 pt-6"><div><p className="font-medium">{item.nodeLabel}</p><p className="text-xs text-muted-foreground">{item.generationModel ?? "modèle inconnu"} · prompt {item.promptVersion ?? "—"}</p>{item.diagnostic && <><div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="secondary">{item.diagnostic.sectionKey}</Badge><Badge variant="secondary">{item.diagnostic.evidenceExpectation}</Badge><Badge variant="secondary">{item.diagnostic.evidenceKey}</Badge><Badge variant="secondary">{item.diagnostic.promptFamily}</Badge><Badge variant="secondary">{item.diagnostic.difficultyTier} · {item.difficulty ?? "—"}</Badge></div><div className="mt-3 rounded-md border border-border/70 bg-muted/30 p-3 text-sm"><p><span className="font-medium">Action observable :</span> {item.diagnostic.observableActionFr}</p><p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-foreground">Critères :</span> {JSON.stringify(item.diagnostic.successCriteria)}</p></div></>}</div><textarea aria-label="Énoncé" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" /><input aria-label="Réponse correcte" value={answer} onChange={(event) => setAnswer(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /><div className="flex flex-wrap gap-2">{Object.entries(item.qcGates).map(([key,value]) => <Badge key={key} variant={value === true ? "success" : "secondary"}>{key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}</Badge>)}</div>{item.choices.length > 0 && <ul className="text-sm text-muted-foreground">{item.choices.map((choice) => <li key={choice.id}>{choice.correct ? "✓" : "×"} {choice.text}{choice.feedbackFr ? ` — ${choice.feedbackFr}` : ""}</li>)}</ul>}<div className="flex gap-2"><Button disabled={busy} onClick={() => onDecide(item, "human_approved", prompt, answer)}>Approuver</Button><Button disabled={busy} variant="outline" onClick={() => onDecide(item, "rejected", prompt, answer)}>Rejeter</Button></div></CardContent></Card>;
}
