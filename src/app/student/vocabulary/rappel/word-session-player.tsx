"use client";
/**
 * "Rappel éclair" player (roadmap 2026-10 Phase D). A few words, a minute or
 * two, inside the daily session. Warm and short: no counters of due words,
 * misses read "on le revoit", returning words are celebrated, and the burst
 * always ends on a success.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, Sparkles, Volume2 } from "lucide-react";
import { AccentInput } from "@/components/accent-input";
import { AccentTextarea } from "@/components/accent-textarea";
import { Confetti } from "@/components/motivation";
import { Button, buttonVariants } from "@/components/ui/button";
import { explainWordAnswer, introduceSessionWord, submitWordAnswer, type WordAnswerResult, type WordSession } from "@/lib/actions/words";
import { interestEmoji } from "@/lib/content/interest-matching";
import { WORD_SESSION_COPY as copy } from "@/lib/vocabulary/session/copy";
import { applyResult, initFlow, isTyped, missedWordItem, nextStep, type FlowState, type FlowStep } from "@/lib/vocabulary/session/flow";
import type { ChoiceOption, FeedbackSegment, MiniDictationItem, SplitSentence, WordItem, WordItemCore } from "@/lib/vocabulary/session/types";

type Feedback = {
  correct: boolean;
  message: string;
  celebration: string | null;
  expected: string | null;
  segments: FeedbackSegment[] | null;
  correctChoiceId: string | null;
  definition?: string | null;
  /** Per-word results of a mini-dictée. */
  words?: Array<{ id: string; result: WordAnswerResult }>;
};

export function WordSessionPlayer({ session, backHref = "/student" }: { session: WordSession; backHref?: string }) {
  const [flow, setFlow] = useState<FlowState>(() => initFlow(session.items));
  const step = useMemo(() => nextStep(flow), [flow]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingResult, setPendingResult] = useState<{ correct: boolean; missed: WordItem[] } | null>(null);
  const [override, setOverride] = useState<FlowStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const attempts = useRef(new Map<string, number>());
  const shownAt = useRef(0);
  const current = override ?? step;
  const currentToken = current?.item.token ?? null;
  useEffect(() => { shownAt.current = Date.now(); }, [currentToken, flow.position]);

  if (!session.items.length) {
    return <Empty holiday={session.holiday} backHref={backHref} />;
  }

  if (!current) {
    return <section className="relative mx-auto max-w-xl overflow-hidden border-y border-border py-12 text-center">
      <Confetti />
      <Sparkles className="relative mx-auto size-9 text-primary" />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{copy.done}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.wordsToday(flow.worked.length)} · {copy.doneHelp}</p>
      <div className="mt-7"><Link href={backHref} className={buttonVariants()}>{copy.backToPlan} <ArrowRight /></Link></div>
    </section>;
  }

  const attemptOf = (item: WordItemCore) => attempts.current.get(item.token) ?? 0;
  const bump = (item: WordItemCore) => attempts.current.set(item.token, attemptOf(item) + 1);
  const elapsed = () => Math.max(0, Math.min(600_000, shownAt.current ? Date.now() - shownAt.current : 0));

  async function run<T>(work: () => Promise<T>): Promise<T | null> {
    setBusy(true); setError("");
    try { return await work(); } catch (caught) { setError(caught instanceof Error && caught.message.length < 140 ? caught.message : copy.error); return null; } finally { setBusy(false); }
  }

  async function answerTyped(item: WordItemCore, answer: string, hintLevel: number) {
    const result = await run(() => submitWordAnswer({ token: item.token, answer, hintLevel, responseMs: elapsed(), attempt: attemptOf(item) }));
    if (!result) return;
    bump(item);
    setFeedback({ correct: result.correct, message: result.message, celebration: result.celebration, expected: result.expected, segments: result.segments, correctChoiceId: null });
    setPendingResult({ correct: result.correct, missed: [] });
  }

  async function answerChoice(item: WordItemCore, choiceId: string) {
    const result = await run(() => submitWordAnswer({ token: item.token, choiceId, hintLevel: 0, responseMs: elapsed(), attempt: attemptOf(item) }));
    if (!result) return;
    bump(item);
    setFeedback({ correct: result.correct, message: result.message, celebration: result.celebration, expected: null, segments: null, correctChoiceId: result.correctChoiceId ?? (result.correct ? choiceId : null) });
    setPendingResult({ correct: result.correct, missed: [] });
  }

  async function answerMini(item: MiniDictationItem, answers: string[]) {
    const results = await run(async () => {
      const out: Array<{ id: string; result: WordAnswerResult }> = [];
      for (const [index, word] of item.words.entries()) {
        out.push({ id: word.id, result: await submitWordAnswer({ token: word.token, answer: answers[index] ?? "", hintLevel: 0, responseMs: elapsed(), attempt: 0 }) });
      }
      return out;
    });
    if (!results) return;
    const missed = item.words.filter((word, index) => !results[index].result.correct).map(missedWordItem).filter((value): value is WordItem => !!value);
    const allRight = results.every((entry) => entry.result.correct);
    setFeedback({ correct: allRight, message: allRight ? copy.correct[0] : copy.wrong, celebration: results.find((entry) => entry.result.celebration)?.result.celebration ?? null, expected: null, segments: null, correctChoiceId: null, words: results });
    setPendingResult({ correct: allRight, missed });
  }

  async function answerExplain(item: WordItemCore, text: string) {
    const result = await run(() => explainWordAnswer({ token: item.token, text, responseMs: elapsed() }));
    if (!result) return;
    bump(item);
    if (result.verdict === "uncertain") {
      // Never graded wrong: switch to a multiple choice on the same word.
      const parent = flow.parents[current!.parentId];
      const fallback = parent?.rescue && parent.rescue.format === "pick_definition" ? parent.rescue : null;
      if (fallback) { setOverride({ parentId: current!.parentId, item: fallback, stage: current!.stage, assist: false }); setError(""); setFeedback(null); setFallbackNote(result.message); return; }
      setFeedback({ correct: true, message: result.message, celebration: null, expected: null, segments: null, correctChoiceId: null, definition: result.definition });
      setPendingResult({ correct: true, missed: [] });
      return;
    }
    setFeedback({ correct: result.verdict !== "wrong", message: result.message, celebration: result.celebration, expected: null, segments: null, correctChoiceId: null, definition: result.verdict === "correct" ? null : result.definition });
    setPendingResult({ correct: result.verdict !== "wrong", missed: [] });
  }

  async function introduced(item: WordItemCore) {
    const result = await run(() => introduceSessionWord({ token: item.token }));
    if (!result) return;
    setFeedback({ correct: true, message: result.message, celebration: null, expected: null, segments: null, correctChoiceId: null });
    setPendingResult({ correct: true, missed: [] });
  }

  function next() {
    if (!current || !pendingResult) return;
    setFlow((state) => applyResult(state, current, pendingResult.correct, pendingResult.missed));
    setFeedback(null); setPendingResult(null); setOverride(null); setFallbackNote(null); setError("");
  }

  const item = current.item;
  const interest = interestEmoji(item.interest);

  return <section className="mx-auto max-w-2xl pb-28 sm:pb-10">
    <header className="flex items-center justify-between gap-4 border-b border-border pb-3">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.format === "introduce" ? copy.newWord : copy.title}</p>
      {interest && <span aria-hidden className="text-lg">{interest}</span>}
    </header>
    <div key={`${item.token}:${flow.position}`} className="py-7 motion-safe:animate-in motion-safe:fade-in">
      {fallbackNote && <p className="mb-4 text-sm text-muted-foreground">{fallbackNote}</p>}
      <ItemView step={current} feedback={feedback} busy={busy}
        onTyped={answerTyped} onChoice={answerChoice} onMini={answerMini} onExplain={answerExplain} onIntroduced={introduced} />
      {feedback && <FeedbackPanel feedback={feedback} item={item} />}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
    {feedback && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0">
      <div className="mx-auto flex max-w-2xl"><Button autoFocus onClick={next} className="min-h-11">{copy.next} <ArrowRight /></Button></div>
    </div>}
  </section>;
}

function Empty({ holiday, backHref }: { holiday: boolean; backHref: string }) {
  return <section className="mx-auto max-w-xl border-y border-border py-12 text-center">
    <Sparkles className="mx-auto size-8 text-primary" />
    <h1 className="mt-4 text-2xl font-semibold tracking-tight">{holiday ? copy.holiday : copy.nothingToday}</h1>
    {!holiday && <p className="mt-2 text-sm text-muted-foreground">{copy.nothingTodayHelp}</p>}
    <div className="mt-7"><Link href={backHref} className={buttonVariants({ variant: "outline" })}>{copy.backToPlan} <ArrowRight /></Link></div>
  </section>;
}

function Sentence({ sentence, blank, highlight = true }: { sentence: SplitSentence; blank?: number; highlight?: boolean }) {
  return <p className="text-xl leading-9">
    {sentence.before}
    {blank != null ? <span aria-label="mot manquant" className="mx-1 inline-block min-w-24 border-b-2 border-dashed border-primary align-baseline" style={{ width: `${Math.max(4, blank) * 0.75}em` }}>&nbsp;</span>
      : highlight ? <mark className="rounded bg-primary/15 px-1 font-semibold text-foreground">{sentence.word}</mark> : sentence.word}
    {sentence.after}
  </p>;
}

type ItemProps = {
  step: FlowStep;
  feedback: Feedback | null;
  busy: boolean;
  onTyped: (item: WordItemCore, answer: string, hintLevel: number) => void;
  onChoice: (item: WordItemCore, choiceId: string) => void;
  onMini: (item: MiniDictationItem, answers: string[]) => void;
  onExplain: (item: WordItemCore, text: string) => void;
  onIntroduced: (item: WordItemCore) => void;
};

function ItemView(props: ItemProps) {
  const { item } = props.step;
  switch (item.format) {
    case "introduce": return <Introduce {...props} item={item} />;
    case "hear_and_type": return <Typed {...props} prompt={copy.hear} audioUrl={item.audioUrl} length={item.length} firstLetter={item.firstLetter} />;
    case "type_from_definition": return <Typed {...props} prompt={copy.typeFromDefinition} body={<p className="text-xl leading-8">{item.definition}</p>} length={item.length} firstLetter={item.firstLetter} />;
    case "gap_fill_typed": return <Typed {...props} prompt={copy.gap} body={<><Sentence sentence={item.sentence} blank={item.length} />{item.definition && <p className="mt-3 text-sm text-muted-foreground">{item.definition}</p>}</>} length={item.length} firstLetter={item.firstLetter} />;
    case "rebuild_letters": return <Rebuild letters={item.letters} definition={item.definition} disabled={!!props.feedback || props.busy} onDone={(word) => props.onTyped(item, word, 0)} />;
    case "mini_dictation": return <Mini {...props} item={item} />;
    case "judge_usage": return <Choice {...props} prompt={copy.judge(item.word)} options={item.options} />;
    case "synonym_antonym": return <Choice {...props} prompt={item.relation === "synonym" ? copy.synonym(item.word) : copy.antonym(item.word)} body={item.sentence ? <Sentence sentence={item.sentence} /> : null} options={item.options} />;
    case "odd_one_out": return <Choice {...props} prompt={copy.odd} options={item.options} />;
    case "pick_definition": return <Choice {...props} prompt={copy.pick(item.word)} options={item.options} />;
    case "explain_own_words": return <Explain {...props} word={item.word} sentence={item.sentence} />;
  }
}

function Prompt({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-semibold tracking-tight">{children}</h1>;
}

function AudioButton({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [played, setPlayed] = useState(false);
  return <div className="mt-5">
    <audio ref={ref} src={src} preload="auto" />
    <Button type="button" variant="outline" className="min-h-12" onClick={() => { void ref.current?.play().catch(() => undefined); setPlayed(true); }}><Volume2 /> {played ? copy.replay : copy.play}</Button>
  </div>;
}

function Typed({ step, feedback, busy, onTyped, prompt, body, audioUrl, length, firstLetter }: ItemProps & { prompt: string; body?: React.ReactNode; audioUrl?: string; length: number; firstLetter: string }) {
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState(step.assist ? 1 : 0);
  const disabled = !!feedback || busy;
  return <form onSubmit={(event) => { event.preventDefault(); if (answer.trim() && !disabled) onTyped(step.item, answer, hint); }}>
    <Prompt>{prompt}</Prompt>
    {audioUrl && <AudioButton src={audioUrl} />}
    {body && <div className="mt-5">{body}</div>}
    {hint > 0 && <p className="mt-4 flex items-center gap-2 border-l-2 border-secondary pl-3 text-sm"><Lightbulb className="size-4 text-secondary" />{hint === 1 ? copy.hintFirstLetter(firstLetter) : copy.hintLength(firstLetter, length)}</p>}
    <label className="mt-6 block text-sm font-medium">{copy.answerLabel}
      <AccentInput autoFocus autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={disabled} value={answer} onChange={setAnswer} className="mt-2 h-12 w-full rounded-lg border border-input bg-card px-4 text-xl" />
    </label>
    {!feedback && <div className="mt-5 flex flex-wrap gap-2">
      <Button type="submit" className="min-h-11" disabled={disabled || !answer.trim()}>{copy.check}</Button>
      {hint < 2 && <Button type="button" variant="outline" className="min-h-11" onClick={() => setHint((value) => value + 1)}><Lightbulb /> {copy.hint}</Button>}
      <Button type="button" variant="ghost" className="min-h-11" disabled={disabled} onClick={() => onTyped(step.item, "", 3)}>{copy.showWord}</Button>
    </div>}
  </form>;
}

function Choice({ step, feedback, busy, onChoice, prompt, body, options }: ItemProps & { prompt: string; body?: React.ReactNode; options: ChoiceOption[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  return <div>
    <Prompt>{prompt}</Prompt>
    {body && <div className="mt-5">{body}</div>}
    <div role="radiogroup" aria-label={prompt} className="mt-6 grid gap-3">
      {options.map((option) => {
        const right = feedback && (feedback.correctChoiceId === option.id || (feedback.correct && picked === option.id));
        const wrong = feedback && !feedback.correct && picked === option.id;
        return <button key={option.id} type="button" role="radio" aria-checked={picked === option.id} disabled={!!feedback || busy}
          onClick={() => { setPicked(option.id); onChoice(step.item, option.id); }}
          className={`min-h-12 rounded-lg border px-4 py-3 text-left text-base transition-colors ${right ? "border-emerald-500 bg-emerald-500/10" : wrong ? "border-amber-500 bg-amber-500/10" : "border-input bg-card hover:border-primary/60 hover:bg-accent/30"}`}>{option.label}</button>;
      })}
    </div>
  </div>;
}

function Rebuild({ letters, definition, disabled, onDone, intro = false }: { letters: string[]; definition: string | null; disabled: boolean; onDone: (word: string) => void; intro?: boolean }) {
  const [used, setUsed] = useState<number[]>([]);
  const word = used.map((index) => letters[index]).join("");
  return <div>
    <Prompt>{copy.rebuild}</Prompt>
    {!intro && definition && <p className="mt-4 text-lg leading-8">{definition}</p>}
    <p className="mt-2 text-sm text-muted-foreground">{copy.rebuildHelp}</p>
    <div aria-live="polite" className="mt-5 flex min-h-14 flex-wrap items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 font-display text-2xl tracking-wide">{word || <span className="text-sm text-muted-foreground">…</span>}</div>
    <div className="mt-4 flex flex-wrap gap-2">
      {letters.map((letter, index) => <button key={index} type="button" disabled={disabled || used.includes(index)} aria-label={letter}
        onClick={() => { const next = [...used, index]; setUsed(next); if (next.length === letters.length) onDone(next.map((at) => letters[at]).join("")); }}
        className="grid size-12 place-items-center rounded-lg border border-input bg-card font-display text-xl font-semibold transition-colors hover:border-primary disabled:opacity-30">{letter}</button>)}
    </div>
    {!disabled && used.length > 0 && <Button type="button" variant="ghost" className="mt-3 min-h-11" onClick={() => setUsed(used.slice(0, -1))}>{copy.undo}</Button>}
  </div>;
}

function Introduce({ item, feedback, busy, onIntroduced }: ItemProps & { item: Extract<WordItemCore, { format: "introduce" }> }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [tries, setTries] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  if (stage === 0) return <div>
    <p className="font-display text-4xl font-bold tracking-tight">{item.word}</p>
    {item.context && <><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.metIn}</p><div className="mt-2 border-l-2 border-primary pl-4"><Sentence sentence={item.context} /></div></>}
    <Button className="mt-7 min-h-11" onClick={() => setStage(1)}>{copy.next} <ArrowRight /></Button>
  </div>;
  if (stage === 1) return <div>
    <p className="font-display text-4xl font-bold tracking-tight">{item.word}</p>
    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.meaning}</p>
    <p className="mt-2 text-xl leading-8">{item.definition}</p>
    {item.example && <><p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{copy.example} {interestEmoji(item.example.interest) && <span aria-hidden>{interestEmoji(item.example.interest)}</span>}</p><p className="mt-2 text-lg leading-8">{item.example.text}</p></>}
    <Button className="mt-7 min-h-11" onClick={() => setStage(2)}>{copy.next} <ArrowRight /></Button>
  </div>;
  // The first recall is very easy and never a test: wrong orders just start again.
  return <div>
    <Rebuild key={resetKey} intro letters={item.letters} definition={null} disabled={!!feedback || busy}
      onDone={(built) => {
        if (built.normalize("NFC").toLocaleLowerCase("fr") === item.word.normalize("NFC").toLocaleLowerCase("fr") || tries >= 1) onIntroduced(item);
        else { setTries(tries + 1); setResetKey(resetKey + 1); }
      }} />
    {tries > 0 && !feedback && <p className="mt-3 text-sm text-muted-foreground">{copy.hintFirstLetter(item.word.charAt(0))} <span className="font-semibold">{item.word}</span></p>}
  </div>;
}

function Mini({ item, feedback, busy, onMini }: ItemProps & { item: MiniDictationItem }) {
  const [answers, setAnswers] = useState<string[]>(() => item.words.map(() => ""));
  const disabled = !!feedback || busy;
  return <form onSubmit={(event) => { event.preventDefault(); if (!disabled && answers.every((answer) => answer.trim())) onMini(item, answers); }}>
    <Prompt>{copy.miniDictation}</Prompt>
    <ol className="mt-6 space-y-5">
      {item.words.map((word, index) => {
        const result = feedback?.words?.find((entry) => entry.id === word.id)?.result;
        return <li key={word.id} className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <AudioButton src={word.audioUrl} />
          <div>
            <AccentInput aria-label={`${copy.answerLabel} ${index + 1}`} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={disabled} value={answers[index]} onChange={(value) => setAnswers((list) => list.map((entry, at) => (at === index ? value : entry)))} className="h-12 w-full rounded-lg border border-input bg-card px-4 text-xl" />
            {result && (result.correct ? <p className="mt-1 text-sm text-emerald-600">✓</p> : result.expected && <p className="mt-1 text-sm"><Highlighted segments={result.segments} fallback={result.expected} /></p>)}
          </div>
        </li>;
      })}
    </ol>
    {!feedback && <Button type="submit" className="mt-6 min-h-11" disabled={disabled || answers.some((answer) => !answer.trim())}>{copy.check}</Button>}
  </form>;
}

function Explain({ step, feedback, busy, onExplain, word, sentence }: ItemProps & { word: string; sentence: SplitSentence | null }) {
  const [text, setText] = useState("");
  const disabled = !!feedback || busy;
  return <form onSubmit={(event) => { event.preventDefault(); if (text.trim() && !disabled) onExplain(step.item, text); }}>
    <Prompt>{copy.explain(word)}</Prompt>
    {sentence && <div className="mt-5 border-l-2 border-primary pl-4"><Sentence sentence={sentence} /></div>}
    <p className="mt-4 text-sm text-muted-foreground">{copy.explainHelp}</p>
    <AccentTextarea aria-label={copy.answerLabel} placeholder={copy.explainPlaceholder} disabled={disabled} value={text} onChange={setText} rows={3} maxLength={400} className="mt-3 w-full rounded-lg border border-input bg-card p-4 text-base" />
    {!feedback && <Button type="submit" className="mt-4 min-h-11" disabled={disabled || !text.trim()}>{copy.check}</Button>}
  </form>;
}

function Highlighted({ segments, fallback }: { segments: FeedbackSegment[] | null; fallback: string }) {
  if (!segments?.length) return <strong className="font-display text-2xl">{fallback}</strong>;
  return <strong className="font-display text-2xl tracking-wide">
    {segments.map((segment, index) => segment.kind === "ok"
      ? <span key={index}>{segment.text}</span>
      : <span key={index} className={`rounded px-0.5 ${segment.kind === "accent" ? "bg-secondary/25 underline decoration-secondary decoration-2 underline-offset-4" : "bg-amber-400/30 underline decoration-amber-500 decoration-2 underline-offset-4"}`}>{segment.text}</span>)}
  </strong>;
}

function FeedbackPanel({ feedback, item }: { feedback: Feedback; item: WordItemCore }) {
  return <div role="status" aria-live="polite" className={`relative mt-6 overflow-hidden border-l-2 py-3 pl-4 ${feedback.correct ? "border-emerald-500" : "border-amber-500"}`}>
    {feedback.celebration && <Confetti />}
    <p className="font-medium">{feedback.message}</p>
    {feedback.celebration && <p className="mt-1 flex items-center gap-2 font-semibold text-primary"><Sparkles className="size-4" />{feedback.celebration}</p>}
    {!feedback.correct && feedback.expected && isTypedOrRebuild(item) && <p className="mt-2"><Highlighted segments={feedback.segments} fallback={feedback.expected} /></p>}
    {feedback.correct && feedback.segments === null && feedback.expected && item.format !== "rebuild_letters" && isTyped(item) && <p className="mt-1 font-display text-xl">{feedback.expected}</p>}
    {feedback.definition && <p className="mt-2 text-muted-foreground">{feedback.definition}</p>}
  </div>;
}

const isTypedOrRebuild = (item: WordItemCore) => isTyped(item) || item.format === "rebuild_letters";
