"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Circle, LoaderCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startAdaptiveDiagnostic, submitAdaptiveDiagnosticProbe } from "@/lib/actions/student";
import { track } from "@/lib/analytics";
import type { LiveDiagnosticItem } from "@/lib/diagnostic/live";
import type { FrontierReport } from "@/lib/diagnostic/report";
import {
  diagnosticSection,
  DIAGNOSTIC_SECTIONS,
  type DiagnosticSectionProgress,
} from "@/lib/diagnostic/protocol";
import type { DiagnosticLearningPathStep } from "@/lib/diagnostic/learning-path";
import type { GoalScope } from "@/lib/graph/types";
import { AccentTextarea } from "@/components/accent-textarea";
import { replaceStudentState } from "@/lib/student-store";

type AssignedItem = LiveDiagnosticItem & { runItemId: string; assignedAt: string };
type Run = {
  runId: string;
  startedAt: string;
  item: AssignedItem;
  progress: DiagnosticSectionProgress[];
  minTotalProbes: number;
  maxTotalProbes: number;
  resumed: boolean;
  isPilot: boolean;
};
type Frontier = {
  report: FrontierReport;
  labels: Record<string, { key: string; label: string }>;
  scope: GoalScope;
};
type PathSummary = {
  id: string;
  stepCount: number;
  sectionCounts: Record<string, number>;
  firstSteps: DiagnosticLearningPathStep[];
};

function responseId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function DiagnosticPage() {
  const started = useRef(false);
  const responseKey = useRef(responseId());
  const [run, setRun] = useState<Run | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [probeCount, setProbeCount] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [frontier, setFrontier] = useState<Frontier | null>(null);
  const [learningPath, setLearningPath] = useState<PathSummary | null>(null);
  const [transitionLabel, setTransitionLabel] = useState("");
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [isPilot, setIsPilot] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track("diagnostic_started", {});
    startAdaptiveDiagnostic({})
      .then((value) => {
        setIsPilot(Boolean(value.isPilot));
        if (value.done) {
          replaceStudentState(value.state);
          setFrontier(value.frontier as Frontier);
          setLearningPath(value.learningPath as PathSummary);
          setProbeCount(value.progress.reduce((total, section) => total + section.probeCount, 0));
          return;
        }
        setRun(value as Run);
        setProbeCount(value.progress.reduce((total, section) => total + section.probeCount, 0));
      })
      .catch((reason) => setError(
        reason instanceof Error
          ? reason.message
          : "Le diagnostic ne peut pas démarrer. Vérifie d’abord ton profil.",
      ))
      .finally(() => setPending(false));
  }, []);

  async function submit() {
    if (!run) return;
    setPending(true);
    setError("");
    try {
      const result = await submitAdaptiveDiagnosticProbe({
        runId: run.runId,
        runItemId: run.item.runItemId,
        itemId: run.item.id,
        idempotencyKey: responseKey.current,
        selectedChoiceId: choice ?? undefined,
        answerText: choice ? undefined : answer,
        startedAt: run.item.assignedAt,
      });
      setFeedback(result.correct);
      setProbeCount(result.probeCount);
      await new Promise((resolve) => setTimeout(resolve, 420));
      if (result.done) {
        replaceStudentState(result.state);
        setIsPilot(Boolean(result.isPilot));
        setFrontier(result.frontier as Frontier);
        setLearningPath(result.learningPath as PathSummary);
        setRun(null);
        track("diagnostic_completed", {
          goal: "active",
          duration_seconds: Math.round((Date.now() - Date.parse(run.startedAt)) / 1000),
          probes_count: result.probeCount,
          path_steps: result.learningPath.stepCount,
        });
      } else if ("blocked" in result && result.blocked) {
        setError("Cette section n’a pas encore assez de questions validées pour produire un résultat fiable.");
        setBlocked(true);
        setRun((current) => current ? { ...current, progress: result.progress as DiagnosticSectionProgress[] } : current);
      } else if ("item" in result && result.item) {
        const nextItem = result.item as AssignedItem;
        setTransitionLabel(result.sectionTransition
          ? diagnosticSection(nextItem.sectionKey).labelFr
          : "");
        setRun((current) => current ? {
          ...current,
          item: nextItem,
          progress: result.progress as DiagnosticSectionProgress[],
        } : current);
        setChoice(null);
        setAnswer("");
        setFeedback(null);
        responseKey.current = responseId();
        if (result.sectionTransition) {
          globalThis.setTimeout(() => setTransitionLabel(""), 1800);
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ta réponse n’a pas pu être enregistrée. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  if (frontier) {
    const outcomes = [
      ["mastered", "Maîtrisé"],
      ["fragile", "À consolider"],
      ["missing", "À construire"],
      ["unknown", "À vérifier"],
    ] as const;
    return (
      <>
        {isPilot && <PilotNotice completed />}
        <PageHeader
          eyebrow="Diagnostic terminé"
          title="Ton parcours est prêt"
          description="Les résultats sont organisés par compétence et les prérequis viennent avant ce qu’ils permettent d’apprendre."
        />
        <div className="grid border-y border-border sm:grid-cols-4">
          {outcomes.map(([key, label]) => (
            <div key={key} className="border-b border-r border-border p-5 last:border-r-0 sm:border-b-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{frontier.report[key].length}</p>
            </div>
          ))}
        </div>
        {learningPath && (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-primary">Premières étapes</p>
                <h2 className="mt-1 text-xl font-semibold">Un parcours de {learningPath.stepCount} compétences</h2>
              </div>
              <p className="text-sm text-muted-foreground">Fondations d’abord</p>
            </div>
            <ol className="border-y border-border">
              {learningPath.firstSteps.slice(0, 5).map((step) => (
                <li key={step.nodeId} className="grid gap-3 border-b border-border py-4 last:border-0 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center">
                  <span className="grid size-8 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">{step.position}</span>
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.rationaleFr}</p>
                  </div>
                  <Badge variant="secondary">{diagnosticSection(step.section).shortLabelFr}</Badge>
                </li>
              ))}
            </ol>
          </section>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          {!isPilot && <Link href="/student" className={buttonVariants()}>Commencer mon parcours <ArrowRight /></Link>}
          <Link href="/student/frontier" className={buttonVariants({ variant: "outline" })}>Voir toute ma carte</Link>
        </div>
      </>
    );
  }

  if (pending && !run) {
    return <PageHeader title="Diagnostic adaptatif" description="Préparation des quatre sections…" />;
  }
  if (blocked) {
    return <>
      <PageHeader title="Diagnostic en pause" description="Tes réponses sont enregistrées, mais cette section ne dispose pas encore d’assez de questions validées pour conclure sans deviner." />
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Tu n’as rien à refaire maintenant. Un adulte ou l’équipe de la plateforme doit compléter la banque avant que tu reprennes.</p>
      <Link href="/student/settings" className={`${buttonVariants({ variant: "outline" })} mt-5`}>Ouvrir mes paramètres</Link>
    </>;
  }
  if (!run) {
    return (
      <>
        <PageHeader title="Diagnostic adaptatif" description="Le diagnostic doit disposer d’une taxonomie et d’une banque de questions validées." />
        {error && <p className="max-w-2xl text-sm leading-6 text-destructive">{error}</p>}
        <Link href="/student/onboarding" className={`${buttonVariants({ variant: "outline" })} mt-4`}>Revoir mon profil</Link>
      </>
    );
  }

  const item = run.item;
  const currentSection = diagnosticSection(item.sectionKey);
  const currentProgress = run.progress.find((section) => section.key === item.sectionKey);
  const canSubmit = item.choices.length ? !!choice : !!answer.trim();

  return (
    <>
      {run.isPilot && <PilotNotice />}
      <PageHeader
        eyebrow={run.resumed ? "Diagnostic repris" : "Diagnostic initial"}
        title="Trouvons ton point de départ"
        description={`Chaque domaine s’adapte séparément. Il faut au moins ${run.minTotalProbes} réponses au total; le diagnostic s’arrête dès que le profil est assez précis.`}
      />

      <div className="mb-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {DIAGNOSTIC_SECTIONS.map((section, index) => {
          const state = run.progress.find((row) => row.key === section.key);
          const active = section.key === item.sectionKey;
          const complete = state?.status === "completed";
          return (
            <div key={section.key} className={`bg-background px-4 py-3 transition-colors ${active ? "bg-accent" : ""}`}>
              <div className="flex items-center gap-2">
                {complete
                  ? <Check className="size-4 text-[color:var(--success)]" />
                  : active
                    ? <LoaderCircle className="size-4 animate-spin text-primary" />
                    : <Circle className="size-4 text-muted-foreground" />}
                <span className={`font-display text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{section.shortLabelFr}</span>
              </div>
              <p className="mt-1 pl-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {complete ? "Section terminée" : active ? `${currentProgress?.probeCount ?? 0}/${section.minProbes} minimum` : `Section ${index + 1}`}
              </p>
            </div>
          );
        })}
      </div>

      {transitionLabel && (
        <div className="mb-5 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground animate-in fade-in slide-in-from-bottom-2">
          Section suivante : {transitionLabel}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-primary">{currentSection.labelFr}</p>
              <p className="mt-1 text-sm text-muted-foreground">Question {probeCount + 1} · difficulté ajustée en continu</p>
            </div>
            <Badge variant="secondary">Question adaptative</Badge>
          </div>

          <section className="rounded-lg border border-border bg-card p-6 shadow-[0_2px_12px_rgba(60,50,30,.05)] sm:p-8">
            {item.instructionsFr && <p className="mb-3 text-sm leading-6 text-muted-foreground">{item.instructionsFr}</p>}
            <h2 className="max-w-3xl text-lg font-medium leading-7 sm:text-xl">{item.promptFr}</h2>
            {item.choices.length ? (
              <div className="mt-6 grid gap-2.5">
                {item.choices.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={pending}
                    onClick={() => setChoice(option.id)}
                    className={`min-h-12 rounded-md border px-4 py-3 text-left text-sm leading-6 transition-all ${
                      choice === option.id
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-accent/40"
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            ) : (
              <AccentTextarea
                aria-label="Ta réponse"
                value={answer}
                onChange={setAnswer}
                rows={4}
                className="mt-6 w-full rounded-md border border-input bg-background p-3 text-sm"
                placeholder="Écris ta réponse…"
              />
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
              <Button onClick={submit} disabled={pending || !canSubmit}>
                {pending ? "Analyse…" : "Valider"} <ArrowRight />
              </Button>
              {feedback !== null && (
                <p className={`flex items-center gap-2 text-sm ${feedback ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>
                  {feedback ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  {feedback ? "Bonne réponse." : "Cette réponse affine le niveau de cette compétence."}
                </p>
              )}
            </div>
            {error && <p className="mt-4 text-sm leading-6 text-destructive">{error}</p>}
          </section>
        </main>

        <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Pourquoi cette question ?</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentSection.descriptionFr}</p>
          <dl className="mt-6 space-y-4 border-y border-border py-5 text-sm">
            <div>
              <dt className="text-muted-foreground">Réponses dans cette section</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.probeCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Compétences testées directement</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.distinctNodesTested ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Compétences confirmées</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.confirmedNodeCount ?? 0}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">Une section peut prendre de {currentSection.minProbes} à {currentSection.maxProbes} questions. Une compétence n’est confirmée qu’après les types de preuves nécessaires, par exemple reconnaître puis produire. La section s’arrête selon la couverture du graphe et l’incertitude restante.</p>
        </aside>
      </div>
    </>
  );
}

function PilotNotice({ completed = false }: { completed?: boolean }) {
  return <div role="status" className="mb-5 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-foreground"><span className="font-semibold">Essai expérimental.</span> {completed ? "Ce parcours est un aperçu provisoire et ne débloque pas encore les activités normales." : "Les questions ne sont pas encore publiées. Tes réponses servent uniquement à vérifier le diagnostic et ne modifient pas ton niveau permanent."}</div>;
}
