"use client";

import { SyllableText } from "@/components/syllable-text";
import { buildEvidenceChallenge } from "@/lib/content/evidence";
import { recordReadingJustification } from "@/lib/actions/student";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import type { SeedText } from "@/lib/content/types";
import { scoreSession } from "@/lib/scoring/session";
import { difficultyBandLabel } from "@/lib/scoring/band";
import { updateSkillsFromSession } from "@/lib/scoring/skill-estimate";
import { buildRetrievalCards } from "@/lib/content/retrieval-cards";
import { track } from "@/lib/analytics";
import { AccentTextarea } from "@/components/accent-textarea";
import { flushQueue, queueAnswer } from "@/lib/offline-queue";
import {
  completeReadingSession as updateReadingCache,
  hasStudentBackend,
  lastSuccessRate,
  replaceStudentState,
  useStudentState,
} from "@/lib/student-store";
import {
  completeReadingSession as persistReadingSession,
  loadReadingResume,
  loadReadingText,
  startReadingSession,
  submitAnswer,
  submitSummary,
} from "@/lib/actions/student";

type Phase = "read" | "questions" | "summary" | "retrieval";

export default function ReadingSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const state = useStudentState();

  const startedAt = useRef(new Date().toISOString());
  const finished = useRef(false);
  const [phase, setPhase] = useState<Phase>("read");
  const phaseRef = useRef<Phase>("read");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState("");
  const [retrieval, setRetrieval] = useState("");
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState<SeedText | null>(SEED_TEXT_BY_ID[params.sessionId] ?? null);
  const [textLoaded, setTextLoaded] = useState<boolean>(!hasStudentBackend || !!SEED_TEXT_BY_ID[params.sessionId]);
  const [readerMode,setReaderMode]=useState({friendly:false,spacing:false,lineFocus:false,syllables:false});const [spoken,setSpoken]=useState<{paragraph:number;char:number}|null>(null);const [checked,setChecked]=useState<Record<string,boolean>>({});const [evidencePick,setEvidencePick]=useState<Record<string,number>>({});const [evidenceDone,setEvidenceDone]=useState<Record<string,boolean>>({});
  const [focusedParagraph,setFocusedParagraph]=useState<number|null>(null);

  function readAloud(paragraph:string,index:number){if(typeof window==="undefined"||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(paragraph);utterance.lang="fr-FR";utterance.rate=0.95;utterance.onboundary=(event)=>{if(event.name==="word")setSpoken({paragraph:index,char:event.charIndex});};utterance.onend=()=>setSpoken(null);utterance.onerror=()=>setSpoken(null);window.speechSynthesis.speak(utterance);}

  useEffect(() => {
    const fallback = SEED_TEXT_BY_ID[params.sessionId] ?? null;
    if (!hasStudentBackend) return;
    let active = true;
    loadReadingText({ textKey: params.sessionId })
      .then((loaded) => { if (active) setText(loaded); })
      .catch(() => { if (active) setText(fallback); })
      .finally(() => { if (active) setTextLoaded(true); });
    return () => { active = false; };
  }, [params.sessionId]);

  useEffect(() => {
    if (!hasStudentBackend || !textLoaded || !text) return;
    let active=true;loadReadingResume({textKey:text.id}).then((resume)=>{if(!active||!resume)return;startedAt.current=resume.startedAt;setDbSessionId(resume.sessionId);setAnswers(resume.answers);setSummary(resume.summary??"");setPhase(resume.phase);setQIndex(Math.min(Object.keys(resume.answers).length,Math.max(0,text.questions.length-1)));}).catch(()=>undefined);return()=>{active=false};
  },[textLoaded,text]);

  useEffect(()=>{const sync=()=>{void flushQueue(answer=>submitAnswer(answer));};window.addEventListener("online",sync);if(navigator.onLine)sync();return()=>window.removeEventListener("online",sync);},[]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (!finished.current) track("reading_session_abandoned", { text_id: params.sessionId, phase: phaseRef.current }); }, [params.sessionId]);

  const concepts = useMemo(() => text?.concepts ?? [], [text]);

  if (!textLoaded) return <PageHeader title="Lecture" description="Chargement…" />;

  if (!text) {
    return (
      <>
        <PageHeader title="Texte introuvable" />
        <Link href="/student" className={buttonVariants({ variant: "outline" })}>
          Retour à l&apos;accueil
        </Link>
      </>
    );
  }

  const activeText = text;
  const question = activeText.questions[qIndex];

  async function beginQuestions() {
    setPending(true);
    setError("");
    try {
      if (hasStudentBackend) {
        const session = await startReadingSession({ textKey: activeText.id, startedAt: startedAt.current });
        setDbSessionId(session.sessionId);
      }
      setPhase("questions");
    } catch {
      setError("La séance n'a pas pu démarrer. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  async function nextQuestion() {
    setPending(true);
    setError("");
    try {
      if (hasStudentBackend) {
        if (!dbSessionId) throw new Error("missing session");
        await submitAnswer({ sessionId: dbSessionId, textKey: activeText.id, questionKey: question.id, choiceIndex: answers[question.id], nextPhase: qIndex + 1 < activeText.questions.length ? "questions" : "summary" });
      }
      if (qIndex + 1 < activeText.questions.length) setQIndex(qIndex + 1);
      else setPhase("summary");
    } catch {
      if(hasStudentBackend&&dbSessionId&&typeof navigator!=="undefined"&&!navigator.onLine){queueAnswer({sessionId:dbSessionId,textKey:activeText.id,questionKey:question.id,choiceIndex:answers[question.id],nextPhase:qIndex+1<activeText.questions.length?"questions":"summary"});setError("Réponse gardée hors connexion. Elle sera envoyée automatiquement.");if(qIndex+1<activeText.questions.length)setQIndex(qIndex+1);else setPhase("summary");}else setError("Ta réponse n'a pas pu être enregistrée. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  async function saveSummaryAndContinue() {
    setPending(true);
    setError("");
    try {
      if (hasStudentBackend) {
        if (!dbSessionId) throw new Error("missing session");
        await submitSummary({ sessionId: dbSessionId, textKey: activeText.id, summaryText: summary });
      }
      setPhase("retrieval");
    } catch {
      setError("Ta réponse n'a pas pu être enregistrée. Réessaie plus tard.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    setError("");
    const completedAt = new Date().toISOString();
    const result = scoreSession({
      studentId: "local-student",
      text: activeText,
      answers,
      summaryText: summary,
      retrievalText: retrieval,
      startedAt: startedAt.current,
      completedAt,
      previousSuccessRate: lastSuccessRate(),
    });
    const skills = updateSkillsFromSession(state.skillEstimates, activeText, answers);
    updateReadingCache({
      result,
      answers,
      skillEstimates: skills,
      retrievalSeeds: buildRetrievalCards(activeText),
      vocabWords: activeText.targetVocabulary.map((v) => v.word),
      nowMs: Date.now(),
    });
    try {
      let authoritative = result;
      if (hasStudentBackend) {
        if (!dbSessionId) throw new Error("missing session");
        const response = await persistReadingSession({
          sessionId: dbSessionId, textKey: activeText.id, answers,
          summaryText: summary, retrievalText: retrieval,
          startedAt: startedAt.current, completedAt,
        });
        authoritative = response.result;
        replaceStudentState(response.state);
      }
      track("reading_session_completed", {
        textId: activeText.id,
        successRate: authoritative.successRate,
        nextAction: authoritative.recommendedNextAction,
      });
      finished.current = true;
      router.push(`/student/results/${activeText.id}`);
    } catch {
      setError("La séance n'a pas pu être terminée. Tes réponses restent affichées.");
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader title={activeText.title} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge>{difficultyBandLabel(activeText.difficultyBand)}</Badge>
        {concepts.map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
      </div>

      {phase === "read" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2 rounded-md border border-border p-3 text-sm"><button aria-pressed={readerMode.friendly} onClick={()=>setReaderMode(value=>({...value,friendly:!value.friendly}))} className="min-h-11 rounded-md border border-border px-3">Police lisible</button><button aria-pressed={readerMode.spacing} onClick={()=>setReaderMode(value=>({...value,spacing:!value.spacing}))} className="min-h-11 rounded-md border border-border px-3">Espacement</button><button aria-pressed={readerMode.lineFocus} onClick={()=>setReaderMode(value=>({...value,lineFocus:!value.lineFocus}))} className="min-h-11 rounded-md border border-border px-3">Focus ligne</button><button aria-pressed={readerMode.syllables} onClick={()=>setReaderMode(value=>({...value,syllables:!value.syllables}))} className="min-h-11 rounded-md border border-border px-3">Syllabes</button></div>
            <div className={`space-y-4 leading-relaxed ${readerMode.friendly?"font-[family-name:var(--font-legible)]":""} ${readerMode.spacing?"text-lg leading-9 tracking-wide":""}`}>
              {activeText.body.map((p, i) => (
                <div key={i} className={`group flex items-start gap-2 rounded-md p-2 ${readerMode.lineFocus&&focusedParagraph!==null&&focusedParagraph!==i?"opacity-30":""}`}><p tabIndex={readerMode.lineFocus?0:undefined} onClick={()=>setFocusedParagraph(i)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setFocusedParagraph(i);}}} className="flex-1"><SyllableText text={p} syllables={readerMode.syllables} spokenCharIndex={spoken?.paragraph===i?spoken.char:null} /></p><button aria-label={`Lire le paragraphe ${i+1}`} onClick={()=>readAloud(p,i)} className="min-h-11 min-w-11 rounded-md border border-border p-2 opacity-70 hover:opacity-100"><Volume2 className="size-4"/></button></div>
              ))}
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="size-4 text-primary" /> Mots à retenir
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {activeText.targetVocabulary.map((v) => (
                  <li key={v.word}>
                    <span className="font-medium text-foreground">{v.word}</span> —{" "}
                    {v.definitionFr}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={beginQuestions} disabled={pending}>
              Passons aux questions <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "questions" && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Question {qIndex + 1} / {activeText.questions.length}
          </p>
          <Card>
            <CardContent className="pt-6">
              <ChoiceList
                prompt={question.prompt}
                choices={question.choices}
                value={answers[question.id] ?? null}
                onChange={(i) => { if (!checked[question.id]) setAnswers((a) => ({ ...a, [question.id]: i })); }}
              />
              {checked[question.id] && (() => {
                const answerCorrect = answers[question.id] === question.correctIndex;
                const challenge = buildEvidenceChallenge(activeText.body, question.choices[question.correctIndex] ?? "", question.explanationFr, `${activeText.id}:${question.id}`);
                const picked = evidencePick[question.id];
                return (
                  <div className="mt-5 space-y-4">
                    <div className={`flex gap-3 border-l-2 py-2 pl-3 text-sm ${answerCorrect ? "border-emerald-500" : "border-amber-500"}`} role="status">
                      <div><p className="font-medium">{answerCorrect ? "Bonne réponse." : `Pas tout à fait : la bonne réponse est « ${question.choices[question.correctIndex]} ».`}</p><p className="mt-1 text-muted-foreground">{question.explanationFr}</p></div>
                    </div>
                    {challenge && !evidenceDone[question.id] && (
                      <div>
                        <p className="text-sm font-medium">Quelle phrase du texte justifie cette réponse ?</p>
                        <div role="radiogroup" aria-label="Phrase justificative" className="mt-2 grid gap-2">
                          {challenge.candidates.map((sentence, index) => <button key={index} type="button" role="radio" aria-checked={picked === index} onClick={() => setEvidencePick((current) => ({ ...current, [question.id]: index }))} className={`rounded-md border px-3 py-2 text-left text-sm leading-6 ${picked === index ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>« {sentence} »</button>)}
                        </div>
                        <Button className="mt-3" variant="outline" disabled={picked === undefined} onClick={() => { const correct = picked === challenge.answerIndex; setEvidenceDone((current) => ({ ...current, [question.id]: true })); if (hasStudentBackend && dbSessionId) void recordReadingJustification({ sessionId: dbSessionId, questionKey: question.id, correct, answerCorrect }).catch(() => undefined); }}>Valider la justification</Button>
                      </div>
                    )}
                    {challenge && evidenceDone[question.id] && <p className="text-sm" role="status">{picked === challenge.answerIndex ? "Justification exacte : c’est bien cette phrase qui porte l’information." : <>La phrase qui justifie la réponse est : <span className="font-medium">« {challenge.candidates[challenge.answerIndex]} »</span>.</>}</p>}
                  </div>
                );
              })()}
              <div className="mt-5">
                {!checked[question.id] ? (
                  <Button onClick={() => setChecked((current) => ({ ...current, [question.id]: true }))} disabled={answers[question.id] === undefined || pending}>Vérifier</Button>
                ) : (
                  <Button onClick={nextQuestion} disabled={pending}>
                    {qIndex + 1 < text.questions.length ? "Suivant" : "Continuer"}{" "}
                    <ArrowRight />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "summary" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">{text.summaryPrompt}</p>
            <AccentTextarea
              value={summary}
              onChange={setSummary}
              rows={4}
              placeholder="Ton résumé…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button onClick={saveSummaryAndContinue} disabled={!summary.trim() || pending}>
              Continuer <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "retrieval" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm font-medium">Une dernière question de mémoire</p>
            <p className="text-sm text-muted-foreground">{text.retrievalPrompt}</p>
            <AccentTextarea
              value={retrieval}
              onChange={setRetrieval}
              rows={3}
              placeholder="Réponds avec tes mots…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button onClick={finish} disabled={!retrieval.trim() || !state.hydrated || pending}>
              Terminer la séance <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </>
  );
}
