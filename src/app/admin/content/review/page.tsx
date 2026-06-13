"use client";

import { useState } from "react";
import { AlertTriangle, Check, Loader2, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBars } from "@/components/difficulty-bars";
import { INTERESTS, INTEREST_BY_KEY } from "@/lib/content/interests";
import { DIFFICULTY_BANDS, type TextType } from "@/lib/types";
import {
  REVIEW_STATUS_LABEL,
  REVIEW_STATUS_VARIANT,
} from "@/lib/content/review-status";
import { runGenerationPipeline, type ContentCandidate } from "@/lib/ai/pipeline";
import type { GenerateTextInput } from "@/lib/ai/schemas";
import {
  addCandidate,
  setReviewStatus,
  updateCandidateBody,
  useCandidates,
} from "@/lib/content-store";

const TEXT_TYPES: TextType[] = [
  "expository",
  "argumentative",
  "biography",
  "narrative_nonfiction",
];

function buildInput(form: {
  topic: string;
  interest: string;
  band: string;
  textType: TextType;
  wordCount: number;
}): GenerateTextInput {
  return {
    language: "fr",
    studentGrade: 7,
    targetReadingBand: form.band,
    topic: form.topic,
    primaryInterest: form.interest,
    knowledgeDomains: INTEREST_BY_KEY[form.interest]?.transfer ?? [],
    targetConcepts: [],
    textType: form.textType as GenerateTextInput["textType"],
    wordCountTarget: form.wordCount,
    maxAverageSentenceLength: 18,
    maxNewAcademicWords: 8,
    targetVocabulary: ["migration", "opportunité", "phénomène"],
    targetSkills: ["literal_comprehension", "inference", "cause_consequence"],
    avoid: [],
    tone: "curious_explainer",
  };
}

export default function ReviewPage() {
  const candidates = useCandidates();
  const [topic, setTopic] = useState("La migration des jeunes footballeurs");
  const [interest, setInterest] = useState("football");
  const [band, setBand] = useState<string>("Secondary 7A");
  const [textType, setTextType] = useState<TextType>("expository");
  const [wordCount, setWordCount] = useState(450);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    try {
      const candidate = await runGenerationPipeline(
        buildInput({ topic, interest, band, textType, wordCount })
      );
      addCandidate(candidate);
      setSelectedId(candidate.id);
    } finally {
      setGenerating(false);
    }
  }

  const pending = candidates.filter(
    (c) => c.reviewStatus === "needs_human_review" || c.reviewStatus === "draft"
  );
  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Révision du contenu"
        description="Génère, inspecte la difficulté et la modération, puis approuve ou rejette."
      />

      {/* Generation form (PRD §H step 1–4). */}
      <Card className="mb-6">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Sujet</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Intérêt</span>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {INTERESTS.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.labelFr}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Bande cible</span>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {DIFFICULTY_BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type de texte</span>
            <select
              value={textType}
              onChange={(e) => setTextType(e.target.value as TextType)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TEXT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Nombre de mots</span>
            <input
              type="number"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <Button onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {generating ? "Génération…" : "Générer un candidat"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            File de révision ({pending.length})
          </h2>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun candidat. Génère-en un ci-dessus.
            </p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    selectedId === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {c.generated.title}
                    </span>
                    <Badge variant={REVIEW_STATUS_VARIANT[c.reviewStatus]}>
                      {REVIEW_STATUS_LABEL[c.reviewStatus]}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.difficulty.band}</span>
                    <span>· difficulté {c.difficulty.overall}</span>
                    {(c.flags.sensitive ||
                      c.flags.factualNeedsReview ||
                      c.flags.difficultyMismatch ||
                      !c.flags.moderationPassed) && (
                      <AlertTriangle className="size-3.5 text-[color:var(--destructive)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <CandidateDetail
              key={selected.id}
              candidate={selected}
              onApprove={() => setReviewStatus(selected.id, "human_approved")}
              onReject={() => setReviewStatus(selected.id, "rejected")}
              onSaveBody={(b) => updateCandidateBody(selected.id, b)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sélectionne un candidat pour l&apos;inspecter.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function CandidateDetail({
  candidate,
  onApprove,
  onReject,
  onSaveBody,
}: {
  candidate: ContentCandidate;
  onApprove: () => void;
  onReject: () => void;
  onSaveBody: (body: string) => void;
}) {
  const [body, setBody] = useState(candidate.generated.body);
  const flags = candidate.flags;

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div>
          <h3 className="font-semibold">{candidate.generated.title}</h3>
          <p className="text-xs text-muted-foreground">
            {candidate.input.textType} · cible {candidate.input.targetReadingBand}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Difficulté (moteur déterministe)</p>
          <DifficultyBars difficulty={candidate.difficulty} />
          <p className="mt-2 text-xs text-muted-foreground">
            {candidate.difficulty.features.wordCount} mots ·{" "}
            {candidate.difficulty.features.avgSentenceLength} mots/phrase ·{" "}
            {candidate.difficulty.features.connectorCount} connecteurs
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={flags.moderationPassed ? "success" : "outline"}>
            Modération : {flags.moderationPassed ? "OK" : "à revoir"}
          </Badge>
          {flags.sensitive && <Badge>Domaine sensible</Badge>}
          {flags.factualNeedsReview && <Badge>Factualité à vérifier</Badge>}
          {flags.difficultyMismatch && <Badge>Difficulté hors cible</Badge>}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Questions ({candidate.generated.questions.length})
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {candidate.generated.questions.map((q, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{q.questionText}</span>
                <Badge variant="secondary">
                  {q.questionType} · {candidate.questionDifficulties[i]}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Corps du texte (modifiable)</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onSaveBody(body)}
            disabled={body === candidate.generated.body}
          >
            Recalculer la difficulté
          </Button>
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <Button onClick={onApprove}>
            <Check /> Approuver
          </Button>
          <Button variant="destructive" onClick={onReject}>
            <X /> Rejeter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
