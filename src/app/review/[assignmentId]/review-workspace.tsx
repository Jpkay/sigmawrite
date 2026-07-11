"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock3, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveReviewDraft, submitReview } from "@/lib/actions/reviews";
import { paragraphsFromText } from "@/lib/content/text-format";
import { ISSUE_TAG_LABELS, ISSUE_TAGS, REVIEW_CRITERIA, reviewValidationError, type QuestionReviewOutcome, type ReviewDraft, type ReviewQueueItem } from "@/lib/review/types";
import { difficultyBandLabel } from "@/lib/scoring/band";

type QuestionState = { questionIndex: number; outcome: QuestionReviewOutcome | ""; comment: string };
type WorkspaceDraft = Omit<ReviewDraft, "questionReviews"> & { questionReviews: QuestionState[] };

const scale = [
  { value: 4, label: "Excellent" }, { value: 3, label: "Bon" },
  { value: 2, label: "À améliorer" }, { value: 1, label: "Inacceptable" },
];
const questionOutcomes: Array<{ value: QuestionReviewOutcome; label: string }> = [
  { value: "correct_clear", label: "Correcte et claire" }, { value: "minor_issue", label: "Problème mineur" },
  { value: "ambiguous", label: "Ambiguë" }, { value: "incorrect", label: "Incorrecte" },
];

function serializableDraft(draft: WorkspaceDraft): ReviewDraft {
  return { ...draft, questionReviews: draft.questionReviews.filter((item): item is QuestionState & { outcome: QuestionReviewOutcome } => Boolean(item.outcome)) };
}

export function ReviewWorkspace({ assignment }: { assignment: ReviewQueueItem }) {
  const router = useRouter();
  const questions = assignment.candidate.generated.questions;
  const initial: WorkspaceDraft = {
    scores: assignment.review?.scores ?? {}, decision: assignment.review?.decision ?? "",
    generalComment: assignment.review?.generalComment ?? "", issueTags: assignment.review?.issueTags ?? [],
    questionReviews: questions.map((_, index) => assignment.review?.questionReviews.find((item) => item.questionIndex === index) ?? { questionIndex: index, outcome: "", comment: "" }),
  };
  const [draft, setDraft] = useState(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(assignment.review ? "saved" : "idle");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(assignment.status === "submitted");
  const [dirty, setDirty] = useState(false);
  const lastSaved = useRef(JSON.stringify(serializableDraft(initial)));
  const current = useMemo(() => JSON.stringify(serializableDraft(draft)), [draft]);

  const persist = useCallback(async () => {
    if (submitted || current === lastSaved.current) return;
    setSaveState("saving");
    try {
      const clean = serializableDraft(draft);
      await saveReviewDraft({ assignmentId: assignment.assignmentId, ...clean });
      lastSaved.current = JSON.stringify(clean);
      setDirty(false);
      setSaveState("saved");
    } catch { setSaveState("error"); }
  }, [assignment.assignmentId, current, draft, submitted]);

  useEffect(() => {
    if (!dirty || submitted) return;
    const timer = window.setTimeout(() => void persist(), 900);
    return () => window.clearTimeout(timer);
  }, [dirty, persist, submitted]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!submitted && (dirty || saveState === "saving")) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saveState, submitted]);

  function update(mutator: (value: WorkspaceDraft) => WorkspaceDraft) { setDraft((value) => mutator(value)); setDirty(true); setSaveState("idle"); }
  async function finalize() {
    const clean = serializableDraft(draft);
    const validation = reviewValidationError(clean, questions.length);
    if (validation) { setSubmitError(validation); return; }
    if (!window.confirm("Valider définitivement cette évaluation ? Elle ne pourra plus être modifiée.")) return;
    setSubmitError(""); setSaveState("saving");
    try {
      await submitReview({ assignmentId: assignment.assignmentId, ...clean });
      lastSaved.current = JSON.stringify(clean); setDirty(false); setSubmitted(true); setSaveState("saved"); router.refresh();
    } catch (error) { setSaveState("error"); setSubmitError(error instanceof Error ? error.message : "La validation a échoué."); }
  }

  const candidate = assignment.candidate;
  const wordCount = candidate.generated.body.trim().split(/\s+/).length;
  return <div className="-mx-1">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link href="/review"><ChevronLeft />Retour à la file</Link></Button><div className="flex items-center gap-2 text-sm" aria-live="polite">{saveState === "saving" && <><Loader2 className="size-4 animate-spin" />Enregistrement…</>}{saveState === "saved" && <><CheckCircle2 className="size-4 text-[color:var(--success)]" />Enregistré</>}{saveState === "error" && <span className="text-destructive">Échec de l’enregistrement</span>}</div></div>
    {submitted && <div role="status" className="mb-6 flex items-start gap-3 border-l-2 border-[color:var(--success)] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-4"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--success)]" /><div><p className="font-medium">Évaluation validée</p><p className="text-sm text-muted-foreground">Merci. Vos réponses sont maintenant définitives et restent confidentielles.</p></div></div>}

    <div className="grid gap-10 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
      <main className="min-w-0">
        <header className="border-b border-border pb-6"><div className="flex flex-wrap gap-2"><Badge variant="outline" title={`Code interne : ${candidate.input.targetReadingBand}`}>{difficultyBandLabel(candidate.input.targetReadingBand)}</Badge><Badge variant="secondary">{candidate.input.textType}</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight">{candidate.generated.title}</h1><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"><span>{candidate.input.topic}</span><span>{candidate.input.targetSkills.join(" · ") || "Compréhension"}</span><span className="flex items-center gap-1"><Clock3 className="size-4" />{wordCount} mots · env. {Math.max(1,Math.ceil(wordCount/180))} min</span></div></header>
        <article className="prose-review py-8 text-[1.05rem] leading-8">{paragraphsFromText(candidate.generated.body).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`} className="mb-5">{paragraph}</p>)}</article>
        <section aria-labelledby="questions-title" className="border-t border-border pt-8"><h2 id="questions-title" className="text-xl font-semibold">Questions et réponses attendues</h2><p className="mt-1 text-sm text-muted-foreground">Vérifiez que la réponse indiquée est réellement correcte.</p><div className="mt-6 divide-y divide-border border-y border-border">{questions.map((question, index) => {
          const state = draft.questionReviews[index];
          return <article key={`${question.questionText}-${index}`} className="py-7"><p className="text-xs font-medium uppercase tracking-wide text-primary">Question {index+1}</p><h3 className="mt-2 font-medium leading-6">{question.questionText}</h3>{question.choices?.length ? <ol className="mt-3 space-y-2 pl-6 text-sm text-muted-foreground">{question.choices.map((choice, choiceIndex) => <li key={choice} className={choice === question.correctAnswer ? "text-foreground" : ""}><span className="mr-2">{String.fromCharCode(65+choiceIndex)}.</span>{choice}{choice === question.correctAnswer && <span className="ml-2 text-xs text-[color:var(--success)]">Réponse attendue</span>}</li>)}</ol> : <p className="mt-3 rounded-md bg-muted p-3 text-sm"><span className="text-muted-foreground">Réponse attendue : </span>{question.correctAnswer ?? "Réponse ouverte selon la grille."}</p>}{question.rubric && <p className="mt-2 text-sm text-muted-foreground">Repère : {question.rubric}</p>}
            <fieldset disabled={submitted} className="mt-5"><legend className="text-sm font-medium">Votre avis sur cette question</legend><div className="mt-2 flex flex-wrap gap-2">{questionOutcomes.map((outcome) => <label key={outcome.value} className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${state.outcome === outcome.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}><input type="radio" className="sr-only" name={`question-${index}`} checked={state.outcome === outcome.value} onChange={() => update((value) => ({ ...value, questionReviews: value.questionReviews.map((item) => item.questionIndex === index ? { ...item, outcome: outcome.value } : item) }))} />{outcome.label}</label>)}</div><label className="mt-3 block text-sm"><span className="text-muted-foreground">Commentaire {state.outcome && ["ambiguous","incorrect"].includes(state.outcome) ? "(obligatoire)" : "(facultatif)"}</span><textarea rows={2} value={state.comment} onChange={(event) => update((value) => ({ ...value, questionReviews: value.questionReviews.map((item) => item.questionIndex === index ? { ...item, comment: event.target.value } : item) }))} className="mt-1 w-full rounded-md border border-input bg-background p-3" /></label></fieldset>
          </article>;
        })}</div></section>
      </main>

      <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start"><div className="border-t-2 border-primary pt-5"><h2 className="text-xl font-semibold">Votre évaluation</h2><p className="mt-1 text-sm text-muted-foreground">Il n’y a pas de note neutre. Choisissez le jugement qui correspond le mieux.</p>
        <div className="mt-6 space-y-6">{REVIEW_CRITERIA.map(([key,label]) => <fieldset key={key} disabled={submitted}><legend className="text-sm font-medium">{label}</legend><div className="mt-2 grid grid-cols-2 gap-2">{scale.map((item) => <label key={item.value} className={`cursor-pointer rounded-md border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${draft.scores[key] === item.value ? "border-primary bg-primary/10" : "border-border"}`}><input className="sr-only" type="radio" name={key} checked={draft.scores[key] === item.value} onChange={() => update((value) => ({ ...value, scores: { ...value.scores, [key]: item.value } }))} /><span className="font-semibold">{item.value}</span><span className="ml-2 text-xs text-muted-foreground">{item.label}</span></label>)}</div></fieldset>)}</div>
        <fieldset disabled={submitted} className="mt-8"><legend className="font-medium">Décision globale</legend><div className="mt-2 space-y-2">{[["approve","Approuver"],["approve_minor","Approuver avec changements mineurs"],["needs_revision","À réviser"],["reject","Rejeter"]].map(([value,label]) => <label key={value} className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm"><input type="radio" name="decision" value={value} checked={draft.decision === value} onChange={() => update((draftValue) => ({ ...draftValue, decision: value as ReviewDraft["decision"] }))} className="size-4 accent-primary" />{label}</label>)}</div></fieldset>
        <fieldset disabled={submitted} className="mt-8"><legend className="font-medium">Problèmes repérés</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{ISSUE_TAGS.map((tag) => <label key={tag} className="flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={draft.issueTags.includes(tag)} onChange={(event) => update((value) => ({ ...value, issueTags: event.target.checked ? [...value.issueTags,tag] : value.issueTags.filter((item) => item !== tag) }))} />{ISSUE_TAG_LABELS[tag]}</label>)}</div></fieldset>
        <label className="mt-8 block font-medium">Commentaire général<textarea disabled={submitted} rows={5} value={draft.generalComment} onChange={(event) => update((value) => ({ ...value, generalComment: event.target.value }))} className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm font-normal" placeholder="Expliquez brièvement les points à conserver ou à corriger." /></label>
        {submitError && <p role="alert" className="mt-4 text-sm text-destructive">{submitError}</p>}
        {!submitted && <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button variant="outline" onClick={() => void persist()} disabled={saveState === "saving"}>Enregistrer le brouillon</Button><Button onClick={() => void finalize()} disabled={saveState === "saving"}>Valider définitivement</Button></div>}
      </div></aside>
    </div>
  </div>;
}
