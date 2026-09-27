"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import type { SeedText } from "@/lib/content/types";
import { useStudentState } from "@/lib/student-store";
import type { ReadingSessionResult } from "@/lib/types";
import { WritingFeedback } from "@/components/writing-feedback";
import {
  READING_RESULTS_COPY as copy,
  readingResultsDisplay,
} from "@/lib/diagnostic/granular/reading-display";

function findSession(
  sessions: ReadingSessionResult[],
  textId: string
): ReadingSessionResult | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].textVersionId === textId) return sessions[i];
  }
  return null;
}

export function ReadingResults({textKey, text, nextStep: cta}: {textKey: string; text: SeedText | null; nextStep: {href: string; label: string}}) {
  const state = useStudentState();
  const result = findSession(state.sessions, textKey);
  const answers = state.answersByText[textKey] ?? {};

  const display = readingResultsDisplay({ text, result, nextStep: cta, hydrated: state.hydrated });
  if (!text) return <PageHeader title={display.copy.missingTitle} />;
  if (!state.hydrated) return <PageHeader title={display.copy.title} description={display.copy.loading} />;
  if (!result)
    return (
      <>
        <PageHeader title={display.copy.emptyTitle} />
        <Link href={`/student/read/${text.id}`} className={buttonVariants()}>
          {display.copy.read}
        </Link>
      </>
    );

  const resultDisplay = readingResultsDisplay({ text, result, nextStep: cta, hydrated: true });
  if (resultDisplay.state !== "result") return null;

  return (
    <>
      <PageHeader title={resultDisplay.title} description={resultDisplay.description} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{copy.successRate}</p>
              <p className="text-4xl font-semibold">{resultDisplay.successRate}</p>
            </div>
            <Badge variant={resultDisplay.inZone ? "success" : "secondary"}>
              <Target className="mr-1 size-3.5" />
              {resultDisplay.zone}
            </Badge>
          </div>
          {/* Success-zone bar with the 80–85% target highlighted. */}
          <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 bg-[color:var(--success)]/30"
              style={{ left: "80%", right: "15%" }}
            />
            <div className="h-full bg-primary" style={{ width: `${resultDisplay.percentage}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resultDisplay.categories.map((category) => {
          return (
            <Card key={category.key}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{category.label}</p>
                <p className="mt-1 text-2xl font-semibold">{category.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <WritingFeedback textKey={text.id} />

      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">{copy.nextAction}</p>
            <p className="text-lg font-medium">
              {resultDisplay.nextAction}
            </p>
          </div>
          <Link href={resultDisplay.nextStep.href} className={buttonVariants()}>
            {resultDisplay.nextStep.label} <ArrowRight />
          </Link>
        </CardContent>
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">
        {copy.schedule}
      </p>

      <h2 className="mb-3 mt-8 text-lg font-semibold">{copy.correction}</h2>
      <div className="space-y-4">
        {text.questions.map((q) => (
          <Card key={q.id}>
            <CardContent className="pt-6">
              <ChoiceList
                prompt={q.prompt}
                choices={q.choices}
                value={answers[q.id] ?? null}
                reveal
                correctIndex={q.correctIndex}
              />
              <p className="mt-3 text-sm text-muted-foreground">{q.explanationFr}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
