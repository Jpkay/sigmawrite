"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { scoreSession } from "@/lib/scoring/session";
import { addSession, lastSuccessRate } from "@/lib/student-store";

type Phase = "read" | "questions" | "summary" | "retrieval";

export default function ReadingSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const text = SEED_TEXT_BY_ID[params.sessionId];

  const startedAt = useRef(new Date().toISOString());
  const [phase, setPhase] = useState<Phase>("read");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState("");
  const [retrieval, setRetrieval] = useState("");

  const concepts = useMemo(() => text?.concepts ?? [], [text]);

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

  const question = text.questions[qIndex];

  function nextQuestion() {
    if (qIndex + 1 < text.questions.length) setQIndex(qIndex + 1);
    else setPhase("summary");
  }

  function finish() {
    const result = scoreSession({
      studentId: "local-student",
      text,
      answers,
      summaryText: summary,
      retrievalText: retrieval,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      previousSuccessRate: lastSuccessRate(),
    });
    addSession(result, answers);
    router.push(`/student/results/${text.id}`);
  }

  return (
    <>
      <PageHeader title={text.title} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge>{text.difficultyBand}</Badge>
        {concepts.map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
      </div>

      {phase === "read" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-4 leading-relaxed">
              {text.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="size-4 text-primary" /> Mots à retenir
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {text.targetVocabulary.map((v) => (
                  <li key={v.word}>
                    <span className="font-medium text-foreground">{v.word}</span> —{" "}
                    {v.definitionFr}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => setPhase("questions")}>
              Passons aux questions <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "questions" && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Question {qIndex + 1} / {text.questions.length}
          </p>
          <Card>
            <CardContent className="pt-6">
              <ChoiceList
                prompt={question.prompt}
                choices={question.choices}
                value={answers[question.id] ?? null}
                onChange={(i) => setAnswers((a) => ({ ...a, [question.id]: i }))}
              />
              <div className="mt-5">
                <Button
                  onClick={nextQuestion}
                  disabled={answers[question.id] === undefined}
                >
                  {qIndex + 1 < text.questions.length ? "Suivant" : "Continuer"}{" "}
                  <ArrowRight />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {phase === "summary" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">{text.summaryPrompt}</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Ton résumé…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button onClick={() => setPhase("retrieval")} disabled={!summary.trim()}>
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
            <textarea
              value={retrieval}
              onChange={(e) => setRetrieval(e.target.value)}
              rows={3}
              placeholder="Réponds avec tes mots…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button onClick={finish} disabled={!retrieval.trim()}>
              Terminer la séance <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
