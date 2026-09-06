"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurriculumTags } from "@/components/curriculum-tags";
import { ExercisePreview } from "@/components/exercise-preview";
import { checkReviewPreview } from "@/lib/actions/review-preview";
import { saveReviewExercise } from "@/lib/actions/items";
import { formatFrameworkRange, formatNativeGradeRange } from "@/lib/content/exercise-presentation";
import type { CompetencyItemRow } from "@/lib/db/items";

type Decision = "human_approved" | "rejected";
export type ReviewExerciseProps = {
  item: CompetencyItemRow; busy: boolean; technical?: boolean;
  onLockChange?: (locked: boolean) => void;
  onDecide: (item: CompetencyItemRow, decision: Decision, prompt: string, answer: string, note?: string) => void;
};
const sections: Record<string, string> = { reading_comprehension: "Compréhension écrite", grammar: "Grammaire", spelling: "Orthographe", conjugation: "Conjugaison" };
const tiers: Record<string, string> = { foundation: "Accessible", core: "Intermédiaire", stretch: "Avancé" };
const issues = ["Consigne ambiguë", "Réponse incorrecte", "Niveau inadapté", "Autre"];

export function ReviewExercise({ item: original, busy, technical = false, onDecide, onLockChange }: ReviewExerciseProps) {
  const [item, setItem] = useState(original);
  const [draft, setDraft] = useState(original);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(issues[0]);
  const [note, setNote] = useState(original.reviewNote ?? "");
  const [pending, setPending] = useState<Decision | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const nativeGrade = formatNativeGradeRange(item.levelGuidance?.nativeGrade?.levelMin ?? null, item.levelGuidance?.nativeGrade?.levelMax ?? null);
  const cefr = formatFrameworkRange(item.levelGuidance?.cefr?.levelMin ?? null, item.levelGuidance?.cefr?.levelMax ?? null);
  const locked = busy || saving || !!pending;
  useEffect(() => { onLockChange?.(locked || editing); return () => onLockChange?.(false); }, [locked, editing, onLockChange]);
  async function save() {
    setSaving(true); setError("");
    try {
      const result = await saveReviewExercise({ id: item.id, promptFr: draft.promptFr, correctAnswer: draft.correctAnswer, choices: draft.choices });
      const next = { ...draft, ...result, correctAnswer: result.choices.find((choice) => choice.correct)?.text ?? result.correctAnswer };
      setItem(next); setDraft(next); setEditing(false); setSaved(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }
  function decide(decision: Decision) {
    setPending(decision);
    timer.current = setTimeout(() => {
      setPending(null);
      onDecide(item, decision, item.promptFr, item.correctAnswer ?? "", reporting ? `${reason} — ${note}`.slice(0,1000) : note);
    }, 5000);
  }
  const answerCheck = item.qcGates.gate2_answer_key as { ok?: boolean } | undefined;
  const structureCheck = item.qcGates.gate1_invariants as { ok?: boolean } | undefined;
  return <article className="min-w-0 pb-6">
    <header className="py-5">
      <p className="text-sm text-muted-foreground">{sections[item.diagnostic?.sectionKey ?? ""] ?? "Français"}{nativeGrade ? ` · ${nativeGrade}` : ""}{item.diagnostic?.difficultyTier ? ` · ${tiers[item.diagnostic.difficultyTier] ?? ""}` : ""}</p>
      <details className="mt-3 border-b border-border pb-3">
        <summary className="cursor-pointer text-sm font-medium">Repères pédagogiques</summary>
        <div className="mt-4 space-y-3 text-sm leading-6"><h2 className="font-semibold">{item.nodeLabel}</h2>{item.diagnostic?.observableActionFr && <p>{item.diagnostic.observableActionFr}</p>}{item.curriculumTags?.length ? <CurriculumTags tags={item.curriculumTags} /> : null}<p>Français langue première : {nativeGrade ?? "Niveau à préciser"}<br />Français langue seconde : {cefr ? `${cefr} · CECRL` : "Niveau à préciser"}</p><p className="text-xs text-muted-foreground">Ces repères sont indicatifs. Les deux cadres ne constituent pas une équivalence.</p></div>
      </details>
    </header>
    {(answerCheck?.ok === false || structureCheck?.ok === false || item.qcGates.gate1_schema === false) && <p className="mb-4 border-l-2 border-amber-600 pl-3 text-sm leading-6">{answerCheck?.ok === false ? "La réponse attendue doit être vérifiée avant approbation." : "La présentation de cet exercice nécessite une vérification avant approbation."}</p>}
    {editing ? <section aria-label="Modifier l’exercice" className="space-y-5 border-y border-border py-6">
      <h2 className="text-xl font-semibold">Modifier l’exercice</h2>
      <label className="block text-sm font-medium">Énoncé<textarea value={draft.promptFr} onChange={(event) => setDraft({ ...draft, promptFr: event.target.value })} rows={5} maxLength={4000} disabled={saving} className="mt-2 w-full rounded-md border bg-background p-3 text-base leading-7" /></label>
      {draft.choices.length ? <fieldset disabled={saving} className="space-y-4"><legend className="mb-3 text-sm font-medium">Propositions · sélectionnez la bonne réponse</legend>{draft.choices.map((choice, index) => <div key={choice.id} className="border-l-2 border-border pl-4"><label className="flex items-center gap-2 text-sm"><input type="radio" name={`correct-${item.id}`} checked={choice.correct} onChange={() => setDraft({ ...draft, choices: draft.choices.map((entry) => ({ ...entry, correct: entry.id === choice.id })) })} />Bonne réponse · proposition {index + 1}</label><label className="mt-2 block text-sm">Proposition {index + 1}<textarea value={choice.text} maxLength={2000} rows={2} onChange={(event) => setDraft({ ...draft, choices: draft.choices.map((entry) => entry.id === choice.id ? { ...entry, text: event.target.value } : entry) })} className="mt-1 w-full rounded-md border bg-background p-3 text-base" /></label><label className="mt-2 block text-sm">Explication pour l’élève<textarea value={choice.feedbackFr ?? ""} maxLength={2000} rows={2} onChange={(event) => setDraft({ ...draft, choices: draft.choices.map((entry) => entry.id === choice.id ? { ...entry, feedbackFr: event.target.value } : entry) })} className="mt-1 w-full rounded-md border bg-background p-3 text-base" /></label></div>)}</fieldset> : <label className="block text-sm font-medium">Réponse attendue<input value={draft.correctAnswer ?? ""} maxLength={1000} disabled={saving} onChange={(event) => setDraft({ ...draft, correctAnswer: event.target.value })} className="mt-2 w-full rounded-md border bg-background p-3 text-base" /></label>}
      <div className="flex flex-wrap gap-2"><Button type="button" disabled={saving} onClick={() => void save()}>{saving ? "Enregistrement…" : "Enregistrer et voir l’aperçu"}</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => { setEditing(false); setDraft(item); setError(""); }}>Annuler</Button></div>
    </section> : <><ExercisePreview key={JSON.stringify([item.promptFr, item.correctAnswer, item.choices])} item={item} onCheck={["rubric", "llm_assisted"].includes(item.validatorType) ? undefined : (response) => checkReviewPreview({ id: item.id, ...response })} /><Button type="button" variant="ghost" size="sm" disabled={locked || item.reviewStatus !== "needs_human_review"} onClick={() => { setEditing(true); setSaved(false); }}>Modifier l’exercice</Button></>}
    {saved && <p role="status" className="mt-3 text-sm text-muted-foreground">Modifications enregistrées. L’exercice reste à approuver.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {technical && <details className="mt-5 border-t border-border py-3"><summary className="cursor-pointer text-xs text-muted-foreground">Détails techniques</summary><div className="mt-3 space-y-3 text-xs text-muted-foreground"><p>{item.generationModel} · {item.promptVersion}</p><pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(item.qcGates, null, 2)}</pre></div></details>}
    {reporting && <section aria-label="Signaler un problème" className="my-5 space-y-3 border-t border-border pt-5"><h3 className="font-semibold">Signaler un problème</h3><p className="text-sm text-muted-foreground">Le signalement écarte cet exercice de la publication jusqu’à sa correction.</p><label className="block text-sm">Problème<select value={reason} disabled={locked} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded-md border bg-background p-3">{issues.map((issue) => <option key={issue}>{issue}</option>)}</select></label><label className="block text-sm">Précisions<textarea value={note} disabled={locked} onChange={(event) => setNote(event.target.value)} maxLength={950} rows={3} className="mt-2 w-full rounded-md border bg-background p-3 text-base" /></label><Button type="button" variant="outline" disabled={locked || !note.trim()} onClick={() => decide("rejected")}>Envoyer le signalement</Button><Button type="button" variant="ghost" disabled={locked} onClick={() => setReporting(false)}>Fermer</Button></section>}
    <footer className="sticky bottom-0 z-20 mt-5 border-t border-border bg-background/95 py-4 backdrop-blur">
      {pending ? <div role="status" className="flex flex-wrap items-center justify-between gap-3 text-sm"><p>{pending === "human_approved" ? "Approbation" : "Signalement"} · enregistrement dans quelques secondes…</p><Button type="button" variant="outline" onClick={() => { if (timer.current) clearTimeout(timer.current); setPending(null); }}>Annuler la décision</Button></div> : <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={locked || editing} onClick={() => setReporting(!reporting)}>Signaler un problème</Button><Button type="button" disabled={locked || editing || reporting} onClick={() => decide("human_approved")}>{busy ? "Enregistrement…" : "Approuver et continuer"}</Button></div>}
    </footer>
  </article>;
}
