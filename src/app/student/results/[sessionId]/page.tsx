"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { MICRO_LESSONS } from "@/lib/content/micro-lessons";
import { NEXT_ACTION_LABEL } from "@/lib/scoring/session";
import { selectNextStep } from "@/lib/scoring/adaptive";
import { useStudentState } from "@/lib/student-store";
import { SUCCESS_ZONE, type ReadingSessionResult } from "@/lib/types";

function findSession(
  sessions: ReadingSessionResult[],
  textId: string
): ReadingSessionResult | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].textVersionId === textId) return sessions[i];
  }
  return null;
}

const CATEGORIES: { key: keyof ReadingSessionResult; label: string }[] = [
  { key: "literalScore", label: "Littéral / idée principale" },
  { key: "inferenceScore", label: "Inférence / cause" },
  { key: "vocabularyScore", label: "Vocabulaire" },
  { key: "summaryScore", label: "Résumé" },
  { key: "retrievalScore", label: "Mémoire" },
];


export default function ResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const text = SEED_TEXT_BY_ID[params.sessionId];
  const state = useStudentState();
  const result = findSession(state.sessions, params.sessionId);
  const answers = state.answersByText[params.sessionId] ?? {};
  const interests = state.interests;

  if (!text) return <PageHeader title="Résultats introuvables" />;
  if (!state.hydrated) return <PageHeader title="Résultats" description="Chargement…" />;
  if (!result)
    return (
      <>
        <PageHeader title="Aucun résultat pour ce texte" />
        <Link href={`/student/read/${text.id}`} className={buttonVariants()}>
          Faire la lecture
        </Link>
      </>
    );

  const pct = Math.round(result.successRate * 100);
  const inZone =
    result.successRate >= SUCCESS_ZONE.min && result.successRate <= SUCCESS_ZONE.max;

  const step = selectNextStep({
    interests,
    currentBand: text.difficultyBand,
    action: result.recommendedNextAction,
    currentInterest: text.primaryInterest,
    skills: state.skillEstimates,
  });
  const cta =
    step.type === "repair"
      ? {
          href: `/student/repair/${step.skillKey}`,
          label: `Renforcer : ${MICRO_LESSONS[step.skillKey]?.title ?? "les bases"}`,
        }
      : {
          href: `/student/read/${step.textId}`,
          label:
            result.recommendedNextAction === "change_topic"
              ? "Changer de sujet"
              : `Lecture suivante (${step.band})`,
        };

  return (
    <>
      <PageHeader title="Résultats" description={text.title} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Taux de réussite</p>
              <p className="text-4xl font-semibold">{pct}%</p>
            </div>
            <Badge variant={inZone ? "success" : "secondary"}>
              <Target className="mr-1 size-3.5" />
              {inZone ? "Dans la zone d'apprentissage" : "Hors zone (80–85%)"}
            </Badge>
          </div>
          {/* Success-zone bar with the 80–85% target highlighted. */}
          <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 bg-[color:var(--success)]/30"
              style={{ left: "80%", right: "15%" }}
            />
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const v = Math.round((result[c.key] as number) * 100);
          return (
            <Card key={c.key}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-semibold">{v}%</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6 border-primary/40 bg-accent/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Prochaine action recommandée</p>
            <p className="text-lg font-medium">
              {NEXT_ACTION_LABEL[result.recommendedNextAction]}
            </p>
          </div>
          <Link href={cta.href} className={buttonVariants()}>
            {cta.label} <ArrowRight />
          </Link>
        </CardContent>
      </Card>

      <p className="mb-3 text-sm text-muted-foreground">
        🧠 Les notions de ce texte reviendront demain, puis dans 3, 7, 21 et 45 jours.
      </p>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Correction</h2>
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
