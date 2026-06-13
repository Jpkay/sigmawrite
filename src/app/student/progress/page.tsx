"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { NEXT_ACTION_LABEL } from "@/lib/scoring/session";
import { useStudentState } from "@/lib/student-store";
import type { DiagnosticResult } from "@/lib/types";

const SKILL_LABELS: Record<keyof DiagnosticResult["skillEstimates"], string> = {
  literalComprehension: "Compréhension littérale",
  inference: "Inférence",
  vocabularyInContext: "Vocabulaire en contexte",
  sentenceParsing: "Analyse de phrases",
  summary: "Résumé",
  argumentStructure: "Structure argumentative",
  academicConnectors: "Connecteurs académiques",
};

// Labels for skill *keys* (as stored in live estimates / seed content).
const SKILL_KEY_LABELS: Record<string, string> = {
  literal_comprehension: "Compréhension littérale",
  main_idea: "Idée principale",
  inference: "Inférence",
  evidence_selection: "Sélection de preuves",
  cause_consequence: "Cause et conséquence",
  compare_contrast: "Comparer et opposer",
  academic_connectors: "Connecteurs académiques",
  sentence_parsing: "Analyse de phrases",
  pronoun_reference: "Suivi des références",
  vocabulary_in_context: "Vocabulaire en contexte",
  summarization: "Résumé",
  argument_structure: "Structure argumentative",
  disciplinary_vocabulary: "Vocabulaire disciplinaire",
  reading_stamina: "Endurance de lecture",
};

export default function ProgressPage() {
  const state = useStudentState();

  if (!state.diagnostic) {
    return (
      <>
        <PageHeader title="Progrès" description="Fais d'abord le diagnostic." />
        <Link href="/student/diagnostic" className={buttonVariants()}>
          Faire le diagnostic
        </Link>
      </>
    );
  }

  const band = state.diagnostic.overallReadingBand;
  const skills = state.diagnostic.skillEstimates;
  const live = Object.entries(state.skillEstimates);

  return (
    <>
      <PageHeader title="Progrès" description="Ton profil de lecture et ton historique." />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <span className="text-2xl font-semibold">
            Grade {band.minGrade.toFixed(1)}–{band.maxGrade.toFixed(1)}
          </span>
          <Badge variant="secondary">Confiance : {band.confidence}</Badge>
          <Badge>{state.diagnostic.recommendedStartingLevel}</Badge>
        </CardContent>
      </Card>

      {live.length > 0 && (
        <>
          <h2 className="mb-1 text-lg font-semibold">Compétences (mises à jour)</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Affinées à chaque séance par le moteur adaptatif.
          </p>
          <div className="mb-8 space-y-2">
            {live.map(([k, est]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-52 shrink-0 text-sm text-muted-foreground">
                  {SKILL_KEY_LABELS[k] ?? k}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${est.ability}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                  {est.ability}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 text-lg font-semibold">Profil initial (diagnostic)</h2>
      <div className="mb-8 space-y-2">
        {Object.entries(skills).map(([k, v]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-52 shrink-0 text-sm text-muted-foreground">
              {SKILL_LABELS[k as keyof typeof SKILL_LABELS]}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${v}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm tabular-nums">{v}</span>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Séances récentes</h2>
      {state.sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune séance pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">
          {[...state.sessions].reverse().map((s, i) => {
            const text = SEED_TEXT_BY_ID[s.textVersionId];
            return (
              <Card key={`${s.textVersionId}-${i}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{text?.title ?? s.textVersionId}</p>
                    <p className="text-sm text-muted-foreground">
                      {NEXT_ACTION_LABEL[s.recommendedNextAction]}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(s.successRate * 100)}%
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
