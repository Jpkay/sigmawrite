"use client";

import { shuffleChoices } from "@/lib/content/choice-order";
import { useState } from "react";
import { ExerciseSurface, type ExerciseSurfaceItem } from "@/components/exercise-surface";
import { Button } from "@/components/ui/button";

export type PreviewItem = Omit<ExerciseSurfaceItem, "choices"> & {
  correctAnswer?: string | null;
  rubric?: string | null;
  choices: { id: string; text: string; correct?: boolean; feedbackFr?: string | null }[];
};
export type PreviewCheck = (response: { selectedChoiceId?: string; answerText?: string }) => Promise<{ correct: boolean; feedbackFr: string | null }>;

/** Local rehearsal only: saving a review is a separate, explicit action. */
export function ExercisePreview({ item, onCheck }: { item: PreviewItem; onCheck?: PreviewCheck }) {
  const choices = shuffleChoices(item.choices, item.choiceOrderSeed ?? `exercise:${item.id}`);
  const [choice, setChoice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [rule, setRule] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; feedbackFr: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canCheck = !!onCheck || (item.choices.length > 0 && item.choices.some((entry) => entry.correct !== undefined));
  const answered = item.responseType === "justified" ? !!choice && !!rule : item.responseType === "ordering" ? order.length > 0 : !!choice || !!answer.trim();
  async function check() {
    setBusy(true); setError("");
    try {
      if (onCheck) setFeedback(await onCheck({ selectedChoiceId: choice ?? undefined, answerText: item.responseType === "justified" ? rule : answer }));
      else {
        const selected = item.choices.find((entry) => entry.id === choice);
        if (selected) setFeedback({ correct: !!selected.correct, feedbackFr: selected.feedbackFr ?? null });
      }
    } catch { setError("La vérification est indisponible. Réessayez ou consultez le corrigé."); }
    finally { setBusy(false); }
  }
  function reset() { setChoice(null); setAnswer(""); setOrder([]); setRule(""); setRevealed(false); setFeedback(null); setError(""); }
  return <section aria-label="Aperçu élève" className="min-w-0">
    <p className="mb-3 text-xs font-medium text-muted-foreground">Aperçu élève · les essais ne sont pas enregistrés</p>
    <ExerciseSurface item={item} choice={choice} answer={answer} order={order} rule={rule} setChoice={setChoice} setAnswer={setAnswer} setOrder={setOrder} setRule={setRule} disabled={busy || !!feedback || revealed} />
    {feedback && <div role="status" className={`mt-4 border-l-2 py-2 pl-4 text-sm ${feedback.correct ? "border-emerald-600" : "border-amber-600"}`}><p className="font-semibold">{feedback.correct ? "Bonne réponse." : "Pas encore — essaie à nouveau."}</p>{feedback.feedbackFr && <p className="mt-1 leading-6">{feedback.feedbackFr}</p>}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <div className="my-5 flex flex-wrap gap-2">
      {canCheck && !feedback && !revealed && <Button type="button" disabled={!answered || busy} onClick={() => void check()}>{busy ? "Vérification…" : "Vérifier ma réponse"}</Button>}
      {!revealed && <Button type="button" variant="outline" disabled={busy} onClick={() => setRevealed(true)}>{item.validatorConfig?.readingRubric ? "Voir un exemple de réponse" : "Voir le corrigé"}</Button>}
      {(feedback || revealed || answered) && <Button type="button" variant="ghost" disabled={busy} onClick={reset}>Réessayer</Button>}
    </div>
    {revealed && <div className="mb-6 border-l-2 border-primary bg-primary/5 p-4 text-sm leading-6">
      <p className="font-semibold">{item.validatorConfig?.readingRubric ? "Exemple de réponse" : "Corrigé"}</p>
      {!!item.validatorConfig?.readingRubric && <p className="mt-1 text-muted-foreground">D’autres formulations sont possibles si elles expriment les idées attendues.</p>}
      {item.choices.length ? <ul className="mt-2 space-y-3">{choices.map((entry) => <li key={entry.id}><p><span className="font-semibold">{entry.correct ? "Réponse attendue : " : "Autre proposition : "}</span>{entry.text}</p>{entry.feedbackFr && <p className="text-muted-foreground">{entry.feedbackFr}</p>}</li>)}</ul> : <p className="mt-2 whitespace-pre-wrap">{item.correctAnswer || "Réponse ouverte à examiner avec la grille de correction."}</p>}
      {item.responseType === "justified" && <p className="mt-3">Justification : {((item.validatorConfig?.rules as { key: string; label: string }[] | undefined) ?? []).find((entry) => entry.key === item.validatorConfig?.ruleKey)?.label ?? "À renseigner"}</p>}
      {item.rubric && <p className="mt-3 whitespace-pre-wrap">{item.rubric}</p>}
    </div>}
  </section>;
}
