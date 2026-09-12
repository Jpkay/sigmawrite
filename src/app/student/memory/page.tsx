"use client";

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
    return <PageHeader title="Mémoire" description="Chargement…" />;
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
      setError("Ta réponse n'a pas pu être enregistrée. Réessaie plus tard.");
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
        title="Mémoire"
        description="Les cartes reviennent selon tes réponses, pour t’aider à retenir ce que tu as lu."
      />

      {/* Review */}
      {!card ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="flex items-center gap-2 text-sm">
              <Brain className="size-4 text-primary" />
              {state.retrievalCards.length === 0
                ? "Termine une lecture pour créer tes premières cartes de mémoire."
                : "Tu es à jour ! Aucune carte à réviser pour l'instant."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-primary/40 bg-accent/40">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{card.conceptLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                {due.length} carte(s) à réviser
              </span>
            </div>
            <p className="font-medium">{card.promptFr}</p>
            <AccentTextarea
              value={answer}
              onChange={setAnswer}
              rows={3}
              disabled={graded !== null}
              placeholder="Réponds avec tes mots…"
              className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
            />
            {graded ? (
              <div className="space-y-3">
                <Badge variant={RESULT_VARIANT[graded]}>
                  {RETRIEVAL_RESULT_LABEL[graded]}
                </Badge>
                <Button onClick={next} className="ml-2" disabled={pending}>
                  Carte suivante
                </Button>
              </div>
            ) : (
              <Button onClick={check} disabled={!answer.trim()}>
                Vérifier <Check />
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Card inventory, distinct from the competency assessment. */}
      {concepts.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Tes cartes par notion</h2>
          <p className="mb-3 text-sm text-muted-foreground">Le nombre de cartes ne mesure pas tes acquis. <Link href="/student/diagnostic" className="text-primary underline">Voir mon bilan de compétences</Link></p>
          <div className="mb-8 space-y-2">
            {concepts.map((c) => (
              <div key={c.label} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">
                  {c.cards} carte{c.cards > 1 ? "s" : ""} · {c.due} à revoir aujourd’hui
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vocabulary retention */}
      {vocab.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Vocabulaire travaillé</h2>
          <div className="flex flex-wrap gap-2">
            {vocab.map(([word, v]) => (
              <Badge key={word} variant="secondary">
                {word} · {v.exposures}×
              </Badge>
            ))}
          </div>
        </>
      )}
    </>
  );
}
