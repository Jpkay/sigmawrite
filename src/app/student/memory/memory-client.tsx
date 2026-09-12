"use client";
import {MEMORY_COPY as copy,memoryDueText,memoryConceptText,memoryWordText} from "@/lib/diagnostic/granular/memory-display";

import { useState } from "react";
import Link from "next/link";
import { Brain, Check } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  gradeRetrieval,
  RETRIEVAL_RESULT_LABEL,
  type RetrievalResult,
} from "@/lib/scoring/retrieval";
import { hasStudentBackend, recordRetrieval, replaceStudentState, useStudentState } from "@/lib/student-store";
import { submitRetrievalAttempt } from "@/lib/actions/student";
import { AccentTextarea } from "@/components/accent-textarea";
import { track } from "@/lib/analytics";

const RESULT_VARIANT: Record<RetrievalResult, "success" | "default" | "secondary"> = {
  easy: "success",
  good: "success",
  hard: "default",
  forgot: "secondary",
};

export default function MemoryPage() {
  const state = useStudentState();
  // Capture "now" once at mount (lazy init) so render stays pure.
  const [nowMs] = useState(() => Date.now());
  const due = state.retrievalCards.filter(
    (c) => new Date(c.dueAt).getTime() <= nowMs
  );

  const [answer, setAnswer] = useState("");
  const [graded, setGraded] = useState<RetrievalResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const card = due[0];

  if (!state.hydrated) {
    return <PageHeader title={copy.title} description={copy.loading} />;
  }

  function check() {
    if (!card) return;
    setGraded(gradeRetrieval(answer, card.keywords));
  }

  async function next() {
    if (!card || !graded) return;
    setPending(true);
    setError("");
    try {
      if (hasStudentBackend) {
        const response = await submitRetrievalAttempt({ cardId: card.id, answerText: answer, attemptedAt: new Date().toISOString() });
        replaceStudentState(response.state);
      } else {
        recordRetrieval(card.id, graded, Date.now());
      }
      track("retrieval_completed", { card_id: card.id, result: graded });
      setAnswer("");
      setGraded(null);
    } catch {
      setError(copy.error);
    } finally {
      setPending(false);
    }
  }

  // Scheduling repetitions reset after a forgotten answer; they are neither
  // a lifetime review count nor evidence of competency mastery.
  const byConcept = new Map<string, { cards: number; due: number }>();
  for (const card of state.retrievalCards) {
    const current = byConcept.get(card.conceptLabel) ?? { cards: 0, due: 0 };
    byConcept.set(card.conceptLabel, {
      cards: current.cards + 1,
      due: current.due + (Date.parse(card.dueAt) <= nowMs ? 1 : 0),
    });
  }
  const concepts = [...byConcept.entries()].map(([label, counts]) => ({label, ...counts}));

  const vocab = Object.entries(state.vocab).sort((a, b) => b[1].exposures - a[1].exposures);

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
      />

      {/* Review */}
      {!card ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-sm">
              <Brain className="size-4 text-primary" />
              {state.retrievalCards.length === 0
                ? copy.empty
                : copy.upToDate}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-primary/40 bg-accent/40">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{card.conceptLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                {memoryDueText(due.length)}
              </span>
            </div>
            <p className="font-medium">{card.promptFr}</p>
            <AccentTextarea
              value={answer}
              onChange={setAnswer}
              rows={3}
              disabled={graded !== null}
              placeholder={copy.placeholder}
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            {graded ? (
              <div className="space-y-3">
                <Badge variant={RESULT_VARIANT[graded]}>
                  {RETRIEVAL_RESULT_LABEL[graded]}
                </Badge>
                <Button onClick={next} className="ml-2" disabled={pending}>
                  {copy.next}
                </Button>
              </div>
            ) : (
              <Button onClick={check} disabled={!answer.trim()}>
                {copy.verify} <Check />
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Card inventory, distinct from the competency assessment. */}
      {concepts.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">{copy.inventory}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{copy.inventoryHelp}<Link href="/student/diagnostic" className="text-primary underline">{copy.results}</Link></p>
          <div className="mb-8 space-y-2">
            {concepts.map((c) => (
              <div key={c.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">
                  {memoryConceptText(c.cards,c.due)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vocabulary retention */}
      {vocab.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">{copy.vocabulary}</h2>
          <div className="flex flex-wrap gap-2">
            {vocab.map(([word, v]) => (
              <Badge key={word} variant="secondary">
                {memoryWordText(word,v.exposures)}
              </Badge>
            ))}
          </div>
        </>
      )}
    </>
  );
}
