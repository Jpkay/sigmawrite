"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveReviewDraft, submitReview } from "@/lib/actions/reviews";
import { paragraphsFromText } from "@/lib/content/text-format";
import {
  ISSUE_TAG_LABELS,
  ISSUE_TAGS,
  REVIEW_CRITERIA,
  reviewValidationError,
  type QuestionReviewOutcome,
  type ReviewDecision,
  type ReviewDraft,
  type ReviewQueueItem,
} from "@/lib/review/types";
import { textTypeLabel } from "@/lib/presentation/french-labels";
import { targetLevelProfile } from "@/lib/scoring/band";
import { validateVocabularyDefinition } from "@/lib/vocabulary/contract";

type QuestionState = {
  questionIndex: number;
  outcome: QuestionReviewOutcome | "";
  comment: string;
};
type WorkspaceDraft = Omit<ReviewDraft, "questionReviews"> & {
  questionReviews: QuestionState[];
};

const scale = [
  { value: 4, shortLabel: "Excellent", label: "Excellent" },
  { value: 3, shortLabel: "Bon", label: "Bon" },
  { value: 2, shortLabel: "À revoir", label: "À améliorer" },
  { value: 1, shortLabel: "Non", label: "Inacceptable" },
] as const;

const questionOutcomes: Array<{
  value: QuestionReviewOutcome;
  label: string;
}> = [
  { value: "correct_clear", label: "Correcte et claire" },
  { value: "minor_issue", label: "Problème mineur" },
  { value: "ambiguous", label: "Ambiguë" },
  { value: "incorrect", label: "Incorrecte" },
];

const decisions: Array<{ value: ReviewDecision; label: string }> = [
  { value: "approve", label: "Approuvé" },
  { value: "approve_minor", label: "Approuvé avec changements mineurs" },
  { value: "needs_revision", label: "À réviser" },
  { value: "reject", label: "Rejeté" },
];

const levelColors = {
  green:
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  blue: "border-blue-600/30 bg-blue-500/10 text-blue-800 dark:text-blue-200",
  violet:
    "border-violet-600/30 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  neutral: "border-border bg-muted text-foreground",
} as const;

function serializableDraft(draft: WorkspaceDraft): ReviewDraft {
  return {
    ...draft,
    questionReviews: draft.questionReviews.filter(
      (item): item is QuestionState & { outcome: QuestionReviewOutcome } =>
        Boolean(item.outcome),
    ),
  };
}

function normalizeCandidate(
  candidate: ReviewQueueItem["candidate"],
): ReviewQueueItem["candidate"] {
  return {
    ...candidate,
    generated: {
      ...candidate.generated,
      targetVocabulary: candidate.generated.targetVocabulary.map((word) => {
        const legacy = word as typeof word & { exampleSentenceFr?: string };
        return {
          ...word,
          examplesFr: word.examplesFr ?? [
            legacy.exampleSentenceFr ??
              `« ${word.word} » apparaît dans une situation concrète.`,
            `L’élève réemploie « ${word.word} » dans une autre situation.`,
          ],
          grade: word.grade ?? candidate.input.studentGrade,
          status: word.status ?? "new",
          evidence: word.evidence ?? {
            exposures: 0,
            helpLookups: 0,
            successfulTypedRetrievals: 0,
          },
          plannedReuse: word.plannedReuse ?? [
            "Révision espacée dans un texte lié au même thème.",
          ],
        };
      }),
      questions: candidate.generated.questions.map((question) => ({
        ...question,
        studentInstruction:
          question.studentInstruction ??
          (question.answerFormat === "multiple_choice"
            ? "Choisis la réponse qui s’appuie sur le texte."
            : "Réponds brièvement avec tes mots."),
        acceptedConcepts: question.acceptedConcepts ?? [],
        scoringCriteria: question.scoringCriteria ?? [],
      })),
    },
  };
}

export function ReviewWorkspace({
  assignment,
  reviewerName,
  progress,
  nextAssignmentId,
}: {
  assignment: ReviewQueueItem;
  reviewerName: string;
  progress: { current: number; total: number; completed: number };
  nextAssignmentId: string | null;
}) {
  const router = useRouter();
  const candidate = normalizeCandidate(assignment.candidate);
  const questions = candidate.generated.questions;
  const initial: WorkspaceDraft = {
    scores: assignment.review?.scores ?? {},
    decision: assignment.review?.decision ?? "",
    generalComment: assignment.review?.generalComment ?? "",
    issueTags: assignment.review?.issueTags ?? [],
    questionReviews: questions.map(
      (_, index) =>
        assignment.review?.questionReviews.find(
          (item) => item.questionIndex === index,
        ) ?? { questionIndex: index, outcome: "", comment: "" },
    ),
  };
  const [draft, setDraft] = useState(initial);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >(assignment.review ? "saved" : "idle");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(
    assignment.status === "submitted",
  );
  const [advancing, setAdvancing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lastSaved = useRef(JSON.stringify(serializableDraft(initial)));
  const current = useMemo(
    () => JSON.stringify(serializableDraft(draft)),
    [draft],
  );

  const persist = useCallback(async () => {
    if (submitted || current === lastSaved.current) return;
    setSaveState("saving");
    try {
      const clean = serializableDraft(draft);
      await saveReviewDraft({ assignmentId: assignment.assignmentId, ...clean });
      lastSaved.current = JSON.stringify(clean);
      setDirty(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [assignment.assignmentId, current, draft, submitted]);

  useEffect(() => {
    if (!dirty || submitted) return;
    const timer = window.setTimeout(() => void persist(), 900);
    return () => window.clearTimeout(timer);
  }, [dirty, persist, submitted]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!submitted && (dirty || saveState === "saving")) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saveState, submitted]);

  function update(mutator: (value: WorkspaceDraft) => WorkspaceDraft) {
    setDraft((value) => mutator(value));
    setDirty(true);
    setSaveState("idle");
    setSubmitError("");
  }

  async function finalize() {
    const clean = serializableDraft(draft);
    const validation = reviewValidationError(clean, questions.length);
    if (validation) {
      setSubmitError(validation);
      document.getElementById("avis")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (
      !window.confirm(
        "Valider définitivement cette évaluation ? Elle ne pourra plus être modifiée.",
      )
    ) {
      return;
    }
    setSubmitError("");
    setSaveState("saving");
    try {
      await submitReview({ assignmentId: assignment.assignmentId, ...clean });
      lastSaved.current = JSON.stringify(clean);
      setDirty(false);
      setSubmitted(true);
      setSaveState("saved");
      setAdvancing(true);
      window.setTimeout(() => {
        router.push(nextAssignmentId ? `/review/${nextAssignmentId}` : "/review");
        router.refresh();
      }, 650);
    } catch (error) {
      setSaveState("error");
      setSubmitError(
        error instanceof Error ? error.message : "La validation a échoué.",
      );
    }
  }

  const wordCount = candidate.generated.body.trim().split(/\s+/).length;
  const level = targetLevelProfile(candidate.input.targetReadingBand);
  const progressPercent = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="pb-28 xl:pb-0">
      <section
        className="mb-4 border-b border-border pb-4 sm:mb-7 sm:pb-5"
        aria-label="Progression de l’évaluation"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Bonjour {reviewerName}
            </p>
            <p className="mt-1 font-semibold">
              Texte {progress.current} sur {progress.total}
            </p>
          </div>
          <SaveState state={saveState} />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <nav
        aria-label="Étapes de l’évaluation"
        className="sticky top-16 z-30 -mx-4 mb-6 grid grid-cols-3 border-y border-border bg-background/95 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:rounded-lg sm:border sm:px-2 xl:hidden"
      >
        <a
          href="#texte"
          className="grid min-h-11 place-items-center rounded-md text-sm font-medium hover:bg-muted"
        >
          1. Texte
        </a>
        <a
          href="#questions"
          className="grid min-h-11 place-items-center rounded-md text-sm font-medium hover:bg-muted"
        >
          2. Questions
        </a>
        <a
          href="#avis"
          className="grid min-h-11 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary"
        >
          3. Votre avis
        </a>
      </nav>

      {submitted && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 border-l-2 border-[color:var(--success)] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-4"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--success)]" />
          <div>
            <p className="font-medium">Évaluation validée</p>
            <p className="text-sm text-muted-foreground">
              {advancing
                ? nextAssignmentId
                  ? "Ouverture du texte suivant…"
                  : "Votre travail est terminé…"
                : "Vos réponses sont définitives et confidentielles."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-12 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <main id="texte" className="min-w-0 scroll-mt-36 xl:scroll-mt-8">
          <header className="border-b border-border pb-6">
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm ${levelColors[level.color]}`}
            >
              <Target className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">
                  Niveau cible
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-lg font-bold">{level.gradeLabel}</p>
                  <p className="text-sm font-medium">{level.readerLabel}</p>
                </div>
                <p className="mt-1 text-xs leading-5 opacity-85">
                  {level.stageLabel} · {level.guidance}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {textTypeLabel(candidate.input.textType)}
              </Badge>
            </div>
            <h1 className="mt-4 text-balance text-[clamp(1.8rem,8vw,2.5rem)] font-semibold leading-tight tracking-[-0.035em]">
              {candidate.generated.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span>{candidate.input.topic}</span>
              <span>{candidate.input.targetSkills.join(" · ") || "Compréhension"}</span>
              <span className="flex items-center gap-1">
                <Clock3 className="size-4" />
                {wordCount} mots · env. {Math.max(1, Math.ceil(wordCount / 180))} min
              </span>
            </div>
            <p className="mt-5 border-l-2 border-primary pl-3 text-sm leading-6 text-muted-foreground">
              Lisez naturellement. Signalez uniquement ce qui gênerait réellement un élève de {level.gradeLabel}.
            </p>
          </header>

          <article className="prose-review mx-auto max-w-[68ch] py-8 text-[1.0625rem] leading-8 sm:text-lg sm:leading-9">
            {paragraphsFromText(candidate.generated.body).map(
              (paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`} className="mb-5">
                  {paragraph}
                </p>
              ),
            )}
          </article>

          <section
            aria-labelledby="vocabulary-title"
            className="border-t border-border py-8"
          >
            <h2 id="vocabulary-title" className="text-xl font-semibold">
              Vocabulaire cible et preuves
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Une exposition seule ne compte jamais comme maîtrise. Le statut
              repose sur des rappels écrits espacés.
            </p>
            <div className="mt-5 grid gap-4">
              {candidate.generated.targetVocabulary.map((word) => {
                const issues = validateVocabularyDefinition({
                  word: word.word,
                  definitionFr: word.definitionFr,
                  examplesFr: word.examplesFr,
                });
                return (
                  <article
                    key={word.word}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{word.word}</h3>
                      <Badge variant="outline">Classe {word.grade}</Badge>
                      <Badge
                        variant={
                          word.status === "maintenance" ? "success" : "secondary"
                        }
                      >
                        {word.status === "new"
                          ? "Nouveau"
                          : word.status === "review"
                            ? "Révision"
                            : "Entretien"}
                      </Badge>
                      <Badge variant={issues.length ? "destructive" : "success"}>
                        {issues.length ? `${issues.length} alerte(s)` : "Contrat valide"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm">
                      <span className="font-medium">Explication simple : </span>
                      {word.definitionFr}
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Exemples concrets</span>
                      <ul className="ml-5 mt-1 list-disc">
                        {word.examplesFr.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-medium">Preuves</dt>
                        <dd className="text-muted-foreground">
                          {word.evidence.exposures} vue(s) · {word.evidence.helpLookups} aide(s) · {word.evidence.successfulTypedRetrievals} rappel(s) écrit(s)
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Réemploi prévu</dt>
                        <dd className="text-muted-foreground">
                          {word.plannedReuse.join(" · ")}
                        </dd>
                      </div>
                    </dl>
                    {issues.length > 0 && (
                      <ul className="mt-3 text-sm text-destructive">
                        {issues.map((issue) => (
                          <li key={`${issue.code}-${issue.word ?? ""}`}>
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <a
            href="#questions"
            className="mb-9 flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-border font-display text-[15px] font-bold hover:bg-muted xl:hidden"
          >
            Vérifier les questions <ArrowDown className="size-4" />
          </a>

          <section
            id="questions"
            aria-labelledby="questions-title"
            className="scroll-mt-36 border-t border-border pt-8 xl:scroll-mt-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Étape 2
            </p>
            <h2 id="questions-title" className="mt-2 text-2xl font-semibold">
              Questions et réponses
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Vérifiez que chaque question est claire et que la réponse indiquée est correcte.
            </p>
            <div className="mt-6 space-y-4">
              {questions.map((question, index) => {
                const state = draft.questionReviews[index];
                return (
                  <article
                    key={`${question.questionText}-${index}`}
                    className="rounded-xl border border-border bg-card p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Question {index + 1} sur {questions.length}
                      </p>
                      <Badge variant="outline">
                        {question.answerFormat === "short_answer"
                          ? "Réponse courte écrite"
                          : question.answerFormat === "written_summary"
                            ? "Résumé écrit"
                            : "Choix multiple"}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-medium leading-6">
                      {question.questionText}
                    </h3>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Consigne élève : </span>
                      {question.studentInstruction}
                    </p>
                    {question.choices?.length ? (
                      <ol className="mt-4 space-y-2 text-sm">
                        {question.choices.map((choice, choiceIndex) => {
                          const correct = choice === question.correctAnswer;
                          return (
                            <li
                              key={choice}
                              className={`flex gap-3 rounded-md px-3 py-2 ${correct ? "bg-emerald-500/10 text-foreground" : "text-muted-foreground"}`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + choiceIndex)}.
                              </span>
                              <span className="flex-1">{choice}</span>
                              {correct && (
                                <Check
                                  aria-label="Réponse attendue"
                                  className="size-4 shrink-0 text-[color:var(--success)]"
                                />
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <div className="mt-3 rounded-md bg-muted p-3 text-sm leading-6">
                        <p>
                          <span className="text-muted-foreground">Réponse modèle : </span>
                          {question.modelAnswer ?? question.correctAnswer ?? "Réponse ouverte selon la grille."}
                        </p>
                        <p className="mt-2">
                          <span className="text-muted-foreground">Concepts acceptés : </span>
                          {question.acceptedConcepts.join(" · ") || "À préciser"}
                        </p>
                        <ul className="mt-2 list-disc pl-5">
                          {question.scoringCriteria.map((criterion) => (
                            <li key={criterion.label}>
                              {criterion.label} — {criterion.points} point(s)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {question.rubric && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Repère : {question.rubric}
                      </p>
                    )}
                    <fieldset disabled={submitted} className="mt-5">
                      <legend className="text-sm font-medium">
                        Cette question est-elle correcte ?
                      </legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {questionOutcomes.map((outcome) => (
                          <label
                            key={outcome.value}
                            className={`grid min-h-12 cursor-pointer place-items-center rounded-md border px-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${state.outcome === outcome.value ? "border-primary bg-primary/10 font-medium text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              name={`question-${index}`}
                              checked={state.outcome === outcome.value}
                              onChange={() =>
                                update((value) => ({
                                  ...value,
                                  questionReviews: value.questionReviews.map((item) =>
                                    item.questionIndex === index
                                      ? { ...item, outcome: outcome.value }
                                      : item,
                                  ),
                                }))
                              }
                            />
                            {outcome.label}
                          </label>
                        ))}
                      </div>
                      <label className="mt-3 block text-sm">
                        <span className="text-muted-foreground">
                          Commentaire {state.outcome && ["ambiguous", "incorrect"].includes(state.outcome) ? "(obligatoire)" : "(facultatif)"}
                        </span>
                        <textarea
                          rows={2}
                          value={state.comment}
                          onChange={(event) =>
                            update((value) => ({
                              ...value,
                              questionReviews: value.questionReviews.map((item) =>
                                item.questionIndex === index
                                  ? { ...item, comment: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          className="mt-1 w-full rounded-md border border-input bg-background p-3 text-base"
                        />
                      </label>
                    </fieldset>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <aside
          id="avis"
          className="min-w-0 scroll-mt-36 xl:sticky xl:top-6 xl:self-start xl:scroll-mt-8"
        >
          <div className="border-t-2 border-primary pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Étape 3
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Votre avis</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Touchez une note pour chaque critère. Votre brouillon est enregistré automatiquement.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-card">
              <div className="grid grid-cols-4 border-b border-border px-3 py-2 text-center text-[10px] font-medium text-muted-foreground">
                {scale.map((item) => (
                  <span key={item.value}>{item.shortLabel}</span>
                ))}
              </div>
              <div className="divide-y divide-border">
                {REVIEW_CRITERIA.map(([key, label]) => {
                  const criterionLabel =
                    key === "difficulty_match"
                      ? `Adapté à la ${level.gradeLabel}`
                      : label;
                  return (
                    <fieldset key={key} disabled={submitted} className="p-3">
                      <legend className="mb-2 text-sm font-medium">
                        {criterionLabel}
                      </legend>
                      <div className="grid grid-cols-4 gap-2">
                        {scale.map((item) => (
                          <label
                            key={item.value}
                            title={item.label}
                            className={`grid min-h-11 cursor-pointer place-items-center rounded-md border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${draft.scores[key] === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                          >
                            <input
                              className="sr-only"
                              type="radio"
                              name={key}
                              aria-label={`${criterionLabel} : ${item.label}`}
                              checked={draft.scores[key] === item.value}
                              onChange={() =>
                                update((value) => ({
                                  ...value,
                                  scores: { ...value.scores, [key]: item.value },
                                }))
                              }
                            />
                            {item.value}
                          </label>
                        ))}
                      </div>
                      {key === "difficulty_match" && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Repère : {level.readerLabel.toLowerCase()}. Utilisez les problèmes ci-dessous pour préciser « trop facile » ou « trop difficile ».
                        </p>
                      )}
                    </fieldset>
                  );
                })}
              </div>
            </div>

            <fieldset disabled={submitted} className="mt-8">
              <legend className="font-medium">Décision globale</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {decisions.map((decision) => (
                  <label
                    key={decision.value}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${draft.decision === decision.value ? "border-primary bg-primary/10 font-medium text-primary" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={decision.value}
                      checked={draft.decision === decision.value}
                      onChange={() =>
                        update((value) => ({
                          ...value,
                          decision: decision.value,
                        }))
                      }
                      className="size-5 shrink-0 accent-primary"
                    />
                    {decision.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <details className="mt-8 rounded-xl border border-border bg-card open:pb-3">
              <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
                Problèmes repérés <span className="ml-2 text-sm font-normal text-muted-foreground">(facultatif)</span>
              </summary>
              <fieldset disabled={submitted} className="grid gap-2 px-3 sm:grid-cols-2 xl:grid-cols-1">
                {ISSUE_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${draft.issueTags.includes(tag) ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
                  >
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={draft.issueTags.includes(tag)}
                      onChange={(event) =>
                        update((value) => ({
                          ...value,
                          issueTags: event.target.checked
                            ? [...value.issueTags, tag]
                            : value.issueTags.filter((item) => item !== tag),
                        }))
                      }
                    />
                    {ISSUE_TAG_LABELS[tag]}
                  </label>
                ))}
              </fieldset>
            </details>

            <label className="mt-8 block font-medium">
              Commentaire général
              <textarea
                disabled={submitted}
                rows={4}
                value={draft.generalComment}
                onChange={(event) =>
                  update((value) => ({
                    ...value,
                    generalComment: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-md border border-input bg-background p-3 text-base font-normal"
                placeholder="Points à conserver ou à corriger…"
              />
            </label>

            {submitError && (
              <p
                role="alert"
                className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {submitError}
              </p>
            )}

            {!submitted && (
              <div className="mt-6 hidden gap-2 xl:grid">
                <Button
                  variant="outline"
                  onClick={() => void persist()}
                  disabled={saveState === "saving"}
                >
                  <Save /> Enregistrer le brouillon
                </Button>
                <Button
                  onClick={() => void finalize()}
                  disabled={saveState === "saving"}
                >
                  Valider et passer au suivant
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {!submitted && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Enregistrer le brouillon"
              className="h-12 w-12 shrink-0"
              onClick={() => void persist()}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
            </Button>
            <Button
              type="button"
              className="h-12 flex-1 px-3"
              onClick={() => void finalize()}
              disabled={saveState === "saving"}
            >
              Valider et continuer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveState({
  state,
}: {
  state: "idle" | "saving" | "saved" | "error";
}) {
  return (
    <div
      className="flex min-h-6 items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
      aria-live="polite"
    >
      {state === "saving" && (
        <>
          <Loader2 className="size-4 animate-spin" /> Enregistrement…
        </>
      )}
      {state === "saved" && (
        <>
          <CheckCircle2 className="size-4 text-[color:var(--success)]" /> Enregistré
        </>
      )}
      {state === "error" && (
        <span className="text-destructive">Échec de l’enregistrement</span>
      )}
    </div>
  );
}
