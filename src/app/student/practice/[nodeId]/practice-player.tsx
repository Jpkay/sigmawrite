"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Lightbulb, Sparkles, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  completeNodePracticeSession,
  startNodePracticeSession,
  submitNodePractice,
} from "@/lib/actions/student";
import type { getNodePractice } from "@/lib/db/practice";
import { AccentTextarea } from "@/components/accent-textarea";
import { ErrorHuntWidget, JustifiedWidget, OrderingWidget, RewriteWidget, shuffledOrder } from "@/components/exercise-widgets";
import { buildHintLadder } from "@/lib/practice/hints";
import { workedExample } from "@/lib/practice/scaffolding";
import { expandReviewedPractice, PRACTICE_BASE_XP, PRACTICE_PERFECT_BONUS_XP } from "@/lib/practice/session";

type Practice = Awaited<ReturnType<typeof getNodePractice>>;
type Remediation = { nodeId: string; label: string } | null;
type TimedSession = Awaited<ReturnType<typeof startNodePracticeSession>>;
type Completion = Awaited<ReturnType<typeof completeNodePracticeSession>>;

const minuteClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function PracticePlayer({ practice }: { practice: Practice }) {
  const [phase, setPhase] = useState<"lesson" | "practice" | "done">(practice.lesson ? "lesson" : "practice");
  const [session, setSession] = useState<TimedSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(7 * 60);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [rule, setRule] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string | null; mastery: number } | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [error, setError] = useState("");
  const [scaffoldLevel, setScaffoldLevel] = useState(practice.scaffoldLevel);
  const [hintsShown, setHintsShown] = useState(Math.min(2, practice.scaffoldLevel));
  const [remediation, setRemediation] = useState<Remediation>(null);
  const [attemptsOnItem, setAttemptsOnItem] = useState(0);
  const [itemStartedAt, setItemStartedAt] = useState(() => new Date().toISOString());
  const clientRequestId = useRef<string | null>(null);
  const finalizing = useRef(false);
  const plannedExercises = session?.plannedExercises ?? Math.min(6, practice.items.length);
  const sessionItems = useMemo(() => expandReviewedPractice(practice.items, plannedExercises), [plannedExercises, practice.items]);
  const item = sessionItems[index];

  useEffect(() => {
    clientRequestId.current ??= crypto.randomUUID();
    let active = true;
    void startNodePracticeSession({ nodeId: practice.node.id, clientRequestId: clientRequestId.current })
      .then((started) => { if (active) setSession(started); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "La leçon n’a pas pu démarrer."); });
    return () => { active = false; };
  }, [practice.node.id]);

  const finish = useCallback(async () => {
    if (!session || finalizing.current) return;
    finalizing.current = true;
    setBusy(true);
    try {
      const result = await completeNodePracticeSession({ practiceSessionId: session.id });
      setCompletion(result);
      setPhase("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La leçon n’a pas pu être terminée.");
      finalizing.current = false;
    } finally {
      setBusy(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session || phase === "done") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((Date.parse(session.expiresAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) void finish();
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [finish, phase, session]);

  const hints = useMemo(() => item ? buildHintLadder({
    nodeLabel: practice.node.label,
    nodeDescription: practice.node.description,
    validatorType: item.validatorType,
    validatorConfig: item.validatorConfig,
    choiceCount: item.choices.length,
  }) : [], [item, practice.node.label, practice.node.description]);
  const support = item ? [...hints, workedExample(practice.node.label, item.validatorType)] : hints;
  const progress = plannedExercises ? Math.round((Math.min(index, plannedExercises) / plannedExercises) * 100) : 0;

  async function submit() {
    if (!item || !session) return;
    setBusy(true); setError("");
    try {
      const result = await submitNodePractice({
        nodeId: practice.node.id,
        itemId: item.id,
        practiceSessionId: session.id,
        exercisePosition: index,
        selectedChoiceId: choice ?? undefined,
        answerText: item.responseType === "justified" ? rule : choice ? undefined : answer,
        startedAt: itemStartedAt,
        hintsUsed: hintsShown,
      });
      setFeedback({ correct: result.correct, text: result.feedbackFr, mastery: result.mastery });
      setRemediation(result.remediation ?? null);
      setScaffoldLevel(result.scaffoldLevel);
      setAttemptsOnItem((value) => value + 1);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "La réponse n’a pas pu être enregistrée.";
      setError(message);
      if (/sept minutes/i.test(message)) void finish();
    } finally { setBusy(false); }
  }

  async function next() {
    if (index + 1 >= plannedExercises) { await finish(); return; }
    setIndex((value) => value + 1);
    setChoice(null); setAnswer(""); setOrder([]); setRule(""); setFeedback(null); setRemediation(null); setAttemptsOnItem(0);
    setHintsShown(Math.min(2, scaffoldLevel));
    setItemStartedAt(new Date().toISOString());
  }

  function retry() {
    setChoice(null); setAnswer(""); setOrder([]); setRule(""); setFeedback(null);
    setHintsShown((value) => Math.min(support.length, Math.max(value + 1, scaffoldLevel)));
    setItemStartedAt(new Date().toISOString());
  }

  if (!practice.items.length) return <p className="text-sm text-muted-foreground">Aucun exercice approuvé pour cette compétence.</p>;

  if (phase === "done" && completion) return <section className="mx-auto max-w-2xl py-8 sm:py-14">
    <div className="border-y border-border py-10 text-center">
      {completion.completed ? <Trophy className="mx-auto size-10 text-primary" /> : <Clock3 className="mx-auto size-10 text-muted-foreground" />}
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{completion.completed ? "Leçon terminée" : "Temps écoulé"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{completion.completed ? `+${completion.totalXp} XP` : "On s’arrête ici pour aujourd’hui"}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {completion.completed
          ? `${completion.exercisesCompleted} exercices terminés. La prochaine révision sera proposée au bon moment.`
          : `${completion.exercisesCompleted} exercice${completion.exercisesCompleted === 1 ? "" : "s"} terminé${completion.exercisesCompleted === 1 ? "" : "s"}. La session reste limitée à sept minutes.`}
      </p>
      {completion.bonusXp > 0 && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"><Sparkles className="size-4" />Sans faute du premier coup · +{completion.bonusXp} XP bonus</p>}
      <div className="mt-7"><Link href="/student" className={buttonVariants()}>Retour au programme <ArrowRight /></Link></div>
    </div>
  </section>;

  return <section className="mx-auto max-w-3xl pb-24 sm:pb-10">
    <header className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-5 sm:pt-0">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{practice.node.label}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${phase === "lesson" ? 4 : progress}%` }} /></div>
        </div>
        <div className={`flex shrink-0 items-center gap-2 font-mono text-sm font-semibold ${secondsLeft <= 60 ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite"><Clock3 className="size-4" />{minuteClock(secondsLeft)}</div>
      </div>
    </header>

    {phase === "lesson" && practice.lesson ? <div className="py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{practice.lesson.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Une idée, puis la pratique.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8">{practice.lesson.explanation}</p>
      <div className="mt-8 border-y border-border py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repère</p>
        <p className="mt-2 font-medium">{practice.lesson.pattern}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">{practice.lesson.examples.map((example) => <p key={example} className="border-l-2 border-primary pl-3 text-sm">{example}</p>)}</div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold">Exceptions à retenir</p>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">{practice.lesson.exceptions.map((exception) => <li key={exception} className="flex gap-2"><span className="text-primary">•</span><span>{exception}</span></li>)}</ul>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={() => { setPhase("practice"); setItemStartedAt(new Date().toISOString()); }} disabled={!session}>Commencer les {plannedExercises || ""} exercices <ArrowRight /></Button>
        <span className="text-sm text-muted-foreground">+{PRACTICE_BASE_XP} XP · +{PRACTICE_PERFECT_BONUS_XP} sans faute</span>
      </div>
    </div> : <div className="py-7 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Exercice {index + 1} sur {plannedExercises}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">À toi de jouer</h1></div>
        <span className="hidden text-xs text-muted-foreground sm:inline">Difficulté adaptée à ton niveau</span>
      </div>

      <div className="mt-8 border-y border-border py-7">
        {item.instructionsFr && <p className="text-sm text-muted-foreground">{item.instructionsFr}</p>}
        <p className="mt-2 text-xl font-medium leading-8">{item.promptFr}</p>
        {item.responseType === "error_hunt" ? <ErrorHuntWidget sentence={item.promptFr} value={answer} onChange={setAnswer} disabled={!!feedback} />
          : item.responseType === "ordering" ? <OrderingWidget order={order.length ? order : shuffledOrder(((item.validatorConfig?.tokens as string[] | undefined) ?? []), item.id)} onChange={(next) => { setOrder(next); setAnswer(next.join(" ")); }} disabled={!!feedback} />
          : item.responseType === "justified" ? <JustifiedWidget choices={item.choices} rules={((item.validatorConfig?.rules as { key: string; label: string }[] | undefined) ?? [])} choice={choice} rule={rule} onChoice={setChoice} onRule={(key) => { setRule(key); setAnswer(key); }} disabled={!!feedback} />
          : item.responseType === "combine" || (item.responseType === "transform" && Array.isArray(item.validatorConfig?.sources)) ? <RewriteWidget sources={item.responseType === "combine" ? ((item.validatorConfig?.sentences as string[] | undefined) ?? []) : ((item.validatorConfig?.sources as string[] | undefined) ?? [])} value={answer} onChange={setAnswer} disabled={!!feedback} placeholder={item.responseType === "combine" ? "Une seule phrase qui garde toutes les informations." : "Réécris la phrase en suivant la consigne."} />
          : item.choices.length ? <div role="radiogroup" aria-label="Choix de réponse" className="mt-6 grid gap-3">{item.choices.map((option) => <button type="button" role="radio" aria-checked={choice === option.id} key={option.id} disabled={!!feedback} onClick={() => setChoice(option.id)} className={`min-h-12 rounded-lg border px-4 py-3 text-left text-base transition-colors ${choice === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>{option.text}</button>)}</div> : <AccentTextarea disabled={!!feedback} value={answer} onChange={setAnswer} rows={3} autoCapitalize="none" autoCorrect="off" className="mt-6 w-full rounded-lg border border-input bg-background p-4 text-base" />}
      </div>

      {hintsShown > 0 && <div className="mt-5 space-y-2">{support.slice(0, hintsShown).map((hint, hintIndex) => <div key={hintIndex} className="flex gap-3 border-l-2 border-secondary py-1 pl-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-secondary" /><p>{hint}</p></div>)}</div>}
      {feedback && <div className={`mt-5 flex gap-3 border-l-2 py-3 pl-4 text-sm ${feedback.correct ? "border-emerald-500" : "border-amber-500"}`}><CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${feedback.correct ? "text-emerald-600" : "text-amber-600"}`} /><div><p className="font-medium">{feedback.correct ? "Bonne réponse." : "Pas encore — essaie avec l’indice."}</p>{feedback.text && <p className="mt-1 text-muted-foreground">{feedback.text}</p>}<p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/student/reference/regle/${encodeURIComponent(practice.node.key)}`}>Voir la règle</Link>{practice.node.strand === "conjugaison" && <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/student/reference/verbe">Tables de conjugaison</Link>}</p></div></div>}
      {feedback && remediation && <p className="mt-4 text-sm text-muted-foreground">Après cette session, révise aussi <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/student/practice/${remediation.nodeId}`}>{remediation.label}</Link>.</p>}
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:mt-7 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          {feedback ? (feedback.correct ? <Button onClick={() => void next()} disabled={busy}>{index + 1 >= plannedExercises ? "Terminer la leçon" : "Exercice suivant"} <ArrowRight /></Button> : <Button onClick={retry}>Réessayer avec un indice</Button>) : <>
            <Button disabled={busy || !session || (item.responseType === "justified" ? !choice || !rule : item.responseType === "ordering" ? order.length === 0 : !choice && !answer.trim())} onClick={() => void submit()}>{busy ? "Vérification…" : attemptsOnItem ? "Valider la correction" : "Valider"}</Button>
            {hintsShown < support.length && <Button variant="outline" onClick={() => setHintsShown((value) => value + 1)}><Lightbulb /> Indice</Button>}
          </>}
        </div>
      </div>
    </div>}
    {error && phase === "lesson" && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
