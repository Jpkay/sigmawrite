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
import { ExercisePrompt } from "@/components/exercise-prompt";
import { AccentTextarea } from "@/components/accent-textarea";
import { replaceStudentState } from "@/lib/student-store";
import {
  LEGACY_DIAGNOSTIC_COPY,
  legacyDiagnosticCompletionDisplay,
  legacyDiagnosticItemDisplay,
  legacyDiagnosticQuestionMeta,
  legacyDiagnosticRunDescription,
  legacyDiagnosticSectionRange,
  legacyDiagnosticSectionStatus,
  legacyDiagnosticSectionTransition,
} from "@/lib/diagnostic/granular/legacy-diagnostic-display";

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
  const started = useRef<number | null>(null);
  const [startAttempt, setStartAttempt] = useState(0);
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
    if (started.current === startAttempt) return;
    started.current = startAttempt;
    track("diagnostic_started", {});
    const restart = new URLSearchParams(window.location.search).get("restart") === "1";
    startAdaptiveDiagnostic({ restart })
      .then((value) => {
        if ("startupError" in value) {
          setError(value.startupError ?? LEGACY_DIAGNOSTIC_COPY.unavailable.fallback);
          return;
        }
        setIsPilot(Boolean(value.isPilot));
        if (value.done) {
          window.history.replaceState(null, "", window.location.pathname);
          replaceStudentState(value.state);
          setFrontier(value.frontier as Frontier);
          setLearningPath(value.learningPath as PathSummary);
          setProbeCount(value.progress.reduce((total, section) => total + section.probeCount, 0));
          return;
        }
        setRun(value as Run);
        setProbeCount(value.progress.reduce((total, section) => total + section.probeCount, 0));
      })
      .catch(() => setError(LEGACY_DIAGNOSTIC_COPY.unavailable.fallback))
      .finally(() => setPending(false));
  }, [startAttempt]);

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
      if ("submissionError" in result) {
        setError(result.submissionError ?? LEGACY_DIAGNOSTIC_COPY.run.submissionFallback);
        return;
      }
      setFeedback(result.correct);
      setProbeCount(result.probeCount);
      await new Promise((resolve) => setTimeout(resolve, 420));
      if (result.done) {
        window.history.replaceState(null, "", window.location.pathname);
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
        setError(LEGACY_DIAGNOSTIC_COPY.blocked.response);
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
    } catch {
      setError(LEGACY_DIAGNOSTIC_COPY.run.submissionError);
    } finally {
      setPending(false);
    }
  }

  if (frontier) {
    const display = legacyDiagnosticCompletionDisplay({ frontier, learningPath, isPilot });
    return (
      <>
        {isPilot && <PilotNotice completed />}
        <PageHeader
          eyebrow={display.header.eyebrow}
          title={display.header.title}
          description={display.header.description}
        />
        <div className="grid border-y border-border sm:grid-cols-4">
          {display.outcomes.map((outcome) => (
            <div key={outcome.key} className="border-b border-r border-border p-5 last:border-r-0 sm:border-b-0">
              <p className="text-sm text-muted-foreground">{outcome.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{outcome.count}</p>
            </div>
          ))}
        </div>
        {learningPath && (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-primary">{display.path?.eyebrow}</p>
                <h2 className="mt-1 text-xl font-semibold">{display.path?.heading}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{display.path?.ordering}</p>
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
          {!isPilot && <Link href="/student" className={buttonVariants()}>{LEGACY_DIAGNOSTIC_COPY.completed.startPath} <ArrowRight /></Link>}
          <Link href="/student/frontier" className={buttonVariants({ variant: "outline" })}>{LEGACY_DIAGNOSTIC_COPY.completed.viewMap}</Link>
        </div>
      </>
    );
  }

  if (pending && !run) {
    return <PageHeader title={LEGACY_DIAGNOSTIC_COPY.loading.title} description={LEGACY_DIAGNOSTIC_COPY.loading.description} />;
  }
  if (blocked) {
    return <>
      <PageHeader title={LEGACY_DIAGNOSTIC_COPY.blocked.title} description={LEGACY_DIAGNOSTIC_COPY.blocked.description} />
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{LEGACY_DIAGNOSTIC_COPY.blocked.help}</p>
      <Link href="/student/settings" className={`${buttonVariants({ variant: "outline" })} mt-5`}>{LEGACY_DIAGNOSTIC_COPY.blocked.settings}</Link>
    </>;
  }
  if (!run) {
    return (
      <>
        <PageHeader title={LEGACY_DIAGNOSTIC_COPY.unavailable.title} description={LEGACY_DIAGNOSTIC_COPY.unavailable.description} />
        {error && <p role="alert" className="max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>}
        <Button className="mt-4" onClick={() => {
          setError("");
          setPending(true);
          setStartAttempt((attempt) => attempt + 1);
        }}>{LEGACY_DIAGNOSTIC_COPY.unavailable.retry}</Button>
      </>
    );
  }

  const item = run.item;
  const currentSection = diagnosticSection(item.sectionKey);
  const currentProgress = run.progress.find((section) => section.key === item.sectionKey);
  const canSubmit = item.choices.length ? !!choice : !!answer.trim();
  const display = legacyDiagnosticItemDisplay(run, probeCount);

  return (
    <>
      {run.isPilot && <PilotNotice />}
      <PageHeader
        eyebrow={run.resumed ? LEGACY_DIAGNOSTIC_COPY.run.resumed : LEGACY_DIAGNOSTIC_COPY.run.initial}
        title={LEGACY_DIAGNOSTIC_COPY.run.title}
        description={legacyDiagnosticRunDescription(run.minTotalProbes)}
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
                {legacyDiagnosticSectionStatus(index, section, state, active)}
              </p>
            </div>
          );
        })}
      </div>

      {transitionLabel && (
        <div className="mb-5 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground animate-in fade-in slide-in-from-bottom-2">
          {legacyDiagnosticSectionTransition(transitionLabel)}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-primary">{currentSection.labelFr}</p>
              <p className="mt-1 text-sm text-muted-foreground">{legacyDiagnosticQuestionMeta(probeCount)}</p>
            </div>
            <Badge variant="secondary">{LEGACY_DIAGNOSTIC_COPY.run.adaptiveQuestion}</Badge>
          </div>

          <section className="rounded-lg border border-border bg-card p-6 shadow-[0_2px_12px_rgba(60,50,30,.05)] sm:p-8">
            <ExercisePrompt promptFr={item.promptFr} instructionsFr={item.instructionsFr} />
            {item.choices.length ? (
              <div className="mt-6 grid gap-2.5">
                {display.question.choices.map((option) => (
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
                aria-label={LEGACY_DIAGNOSTIC_COPY.run.answerLabel}
                value={answer}
                onChange={setAnswer}
                rows={4}
                className="mt-6 w-full rounded-md border border-input bg-background p-3 text-sm"
                placeholder={LEGACY_DIAGNOSTIC_COPY.run.answerPlaceholder}
              />
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
              <Button onClick={submit} disabled={pending || !canSubmit}>
                {pending ? LEGACY_DIAGNOSTIC_COPY.run.analyzing : LEGACY_DIAGNOSTIC_COPY.run.validate} <ArrowRight />
              </Button>
              {feedback !== null && (
                <p className={`flex items-center gap-2 text-sm ${feedback ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>
                  {feedback ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  {feedback ? LEGACY_DIAGNOSTIC_COPY.run.correct : LEGACY_DIAGNOSTIC_COPY.run.informative}
                </p>
              )}
            </div>
            {error && <p className="mt-4 text-sm leading-6 text-destructive">{error}</p>}
          </section>
        </main>

        <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="font-display text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{LEGACY_DIAGNOSTIC_COPY.run.why}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentSection.descriptionFr}</p>
          <dl className="mt-6 space-y-4 border-y border-border py-5 text-sm">
            <div>
              <dt className="text-muted-foreground">{LEGACY_DIAGNOSTIC_COPY.run.responsesInSection}</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.probeCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{LEGACY_DIAGNOSTIC_COPY.run.testedDirectly}</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.distinctNodesTested ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{LEGACY_DIAGNOSTIC_COPY.run.confirmed}</dt>
              <dd className="mt-1 font-display text-xl font-semibold">{currentProgress?.confirmedNodeCount ?? 0}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">{legacyDiagnosticSectionRange(currentSection.minProbes, currentSection.maxProbes)}</p>
        </aside>
      </div>
    </>
  );
}

function PilotNotice({ completed = false }: { completed?: boolean }) {
  return <div role="status" className="mb-5 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-foreground"><span className="font-semibold">{LEGACY_DIAGNOSTIC_COPY.pilot.label}</span> {completed ? LEGACY_DIAGNOSTIC_COPY.pilot.completed : LEGACY_DIAGNOSTIC_COPY.pilot.active}</div>;
}
