"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetencyItemRow } from "@/lib/db/items";
import { reviewCompetencyItem } from "@/lib/actions/items";

export function ItemReviewQueue({ initialItems }: { initialItems: CompetencyItemRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function decide(item: CompetencyItemRow, decision: "human_approved" | "rejected", promptFr: string, correctAnswer: string) {
    setBusy(item.id); setError("");
    try { await reviewCompetencyItem({ id: item.id, decision, promptFr, correctAnswer: correctAnswer || null }); setItems((rows) => rows.filter((row) => row.id !== item.id)); router.refresh(); }
    catch { setError("La décision n’a pas pu être enregistrée."); }
    finally { setBusy(null); }
  }
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Aucune exception à traiter.</p>;
  return <div className="space-y-4">{error && <p className="text-sm text-destructive">{error}</p>}{items.map((item) => <ReviewCard key={item.id} item={item} busy={busy === item.id} onDecide={decide} />)}</div>;
}

function ReviewCard({ item, busy, onDecide }: { item: CompetencyItemRow; busy: boolean; onDecide: (item: CompetencyItemRow, decision: "human_approved" | "rejected", prompt: string, answer: string) => void }) {
  const [prompt, setPrompt] = useState(item.promptFr); const [answer, setAnswer] = useState(item.correctAnswer ?? "");
  return <Card><CardContent className="space-y-4 pt-6"><div><p className="font-medium">{item.nodeLabel}</p><p className="text-xs text-muted-foreground">{item.generationModel ?? "modèle inconnu"} · prompt {item.promptVersion ?? "—"}</p></div><textarea aria-label="Énoncé" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" /><input aria-label="Réponse correcte" value={answer} onChange={(event) => setAnswer(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /><div className="flex flex-wrap gap-2">{Object.entries(item.qcGates).map(([key,value]) => <Badge key={key} variant={value === true ? "success" : "secondary"}>{key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}</Badge>)}</div>{item.choices.length > 0 && <ul className="text-sm text-muted-foreground">{item.choices.map((choice) => <li key={choice.id}>{choice.correct ? "✓" : "×"} {choice.text}{choice.feedbackFr ? ` — ${choice.feedbackFr}` : ""}</li>)}</ul>}<div className="flex gap-2"><Button disabled={busy} onClick={() => onDecide(item, "human_approved", prompt, answer)}>Approuver</Button><Button disabled={busy} variant="outline" onClick={() => onDecide(item, "rejected", prompt, answer)}>Rejeter</Button></div></CardContent></Card>;
}
