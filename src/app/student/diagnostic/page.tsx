"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChoiceList } from "@/components/choice-list";
import {
  DIAGNOSTIC_ITEMS,
  DIAGNOSTIC_SUMMARY_PROMPT,
} from "@/lib/content/diagnostic";
import { scoreDiagnostic } from "@/lib/scoring/diagnostic";
import { getStudentState, saveDiagnostic } from "@/lib/student-store";
import { recommendTextId } from "@/lib/content/recommend";
import { track } from "@/lib/analytics";
import type { DiagnosticResult } from "@/lib/types";

type Phase = "items" | "summary" | "result";

const SKILL_LABELS: Record<keyof DiagnosticResult["skillEstimates"], string> = {
  literalComprehension: "Compréhension littérale",
  inference: "Inférence",
  vocabularyInContext: "Vocabulaire en contexte",
  sentenceParsing: "Analyse de phrases",
  summary: "Résumé",
  argumentStructure: "Structure argumentative",
  academicConnectors: "Connecteurs académiques",
};

export default function DiagnosticPage() {
  const [phase, setPhase] = useState<Phase>("items");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const item = DIAGNOSTIC_ITEMS[index];
  const total = DIAGNOSTIC_ITEMS.length;

  function next() {
    if (index + 1 < total) setIndex(index + 1);
    else setPhase("summary");
  }

  function finish() {
    const r = scoreDiagnostic("local-student", answers, summary);
    saveDiagnostic(r);
    track("diagnostic_completed", {
      band: r.recommendedStartingLevel,
      confidence: r.overallReadingBand.confidence,
    });
    setResult(r);
    setPhase("result");
  }

  if (phase === "result" && result) {
    const strengths = Object.entries(result.skillEstimates)
      .filter(([, v]) => v >= 65)
      .map(([k]) => SKILL_LABELS[k as keyof typeof SKILL_LABELS]);
    const needsWork = Object.entries(result.skillEstimates)
      .filter(([, v]) => v < 50)
      .map(([k]) => SKILL_LABELS[k as keyof typeof SKILL_LABELS]);
    const recommended = recommendTextId(getStudentState().interests);

    return (
      <>
        <PageHeader
          title="Ton profil de lecture"
          description="Bande de lecture académique française estimée d'après tes réponses."
        />
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <span className="text-3xl font-semibold">
              Grade {result.overallReadingBand.minGrade.toFixed(1)}–
              {result.overallReadingBand.maxGrade.toFixed(1)}
            </span>
            <Badge variant="secondary">
              Confiance : {result.overallReadingBand.confidence}
            </Badge>
            <Badge>Zone de départ : {result.recommendedStartingLevel}</Badge>
          </CardContent>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">Points forts</h3>
              {strengths.length ? (
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">À construire ensemble.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold">À travailler</h3>
              {needsWork.length ? (
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {needsWork.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Rien d&apos;urgent. Beau travail !</p>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Estimation basée sur ta performance dans l&apos;application — ce n&apos;est pas un
          diagnostic clinique.
        </p>

        <Link href={`/student/read/${recommended}`} className={buttonVariants()}>
          Commencer ma première lecture <ArrowRight />
        </Link>
      </>
    );
  }

  if (phase === "summary") {
    return (
      <>
        <PageHeader title="Dernière étape : un court résumé" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">{DIAGNOSTIC_SUMMARY_PROMPT}</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Écris ton résumé ici…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button onClick={finish}>
              Voir mon profil <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Diagnostic"
        description="Réponds du mieux que tu peux. Il n'y a pas de piège."
      />
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Question {index + 1} / {total}
      </p>
      <Card>
        <CardContent className="pt-6">
          <ChoiceList
            prompt={item.prompt}
            passage={item.passage}
            choices={item.choices}
            value={answers[item.id] ?? null}
            onChange={(i) => setAnswers((a) => ({ ...a, [item.id]: i }))}
          />
          <div className="mt-5">
            <Button onClick={next} disabled={answers[item.id] === undefined}>
              {index + 1 < total ? "Suivant" : "Continuer"} <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
