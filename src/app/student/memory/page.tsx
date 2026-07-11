"use client";

import { useState } from "react";
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
    recordRetrieval(card.id, graded, Date.now());
    try {
      if (hasStudentBackend) {
        const response = await submitRetrievalAttempt({ cardId: card.id, answerText: answer, attemptedAt: new Date().toISOString() });
        replaceStudentState(response.state);
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

  // Concept mastery = how far each concept's cards have climbed the ladder.
  const byConcept = new Map<string, { reps: number; n: number }>();
  for (const c of state.retrievalCards) {
    const e = byConcept.get(c.conceptLabel) ?? { reps: 0, n: 0 };
    byConcept.set(c.conceptLabel, { reps: e.reps + c.repetitions, n: e.n + 1 });
  }
  const concepts = [...byConcept.entries()].map(([label, { reps, n }]) => ({
    label,
    mastery: Math.min(100, Math.round((reps / n / 5) * 100)),
  }));

  const vocab = Object.entries(state.vocab).sort((a, b) => b[1].exposures - a[1].exposures);

  return (
    <>
      <PageHeader
        title="Mémoire"
        description="Les notions reviennent à intervalles croissants : 1, 3, 7, 21 puis 45 jours."
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

      {/* Concept mastery */}
      {concepts.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Maîtrise des concepts</h2>
          <div className="mb-8 space-y-2">
            {concepts.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="w-48 shrink-0 text-sm text-muted-foreground">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${c.mastery}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                  {c.mastery}
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
