"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, Loader2, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBars } from "@/components/difficulty-bars";
import { INTERESTS, INTEREST_BY_KEY } from "@/lib/content/interests";
import { DIFFICULTY_BANDS, type TextType } from "@/lib/types";
import { REVIEW_STATUS_LABEL, REVIEW_STATUS_VARIANT } from "@/lib/content/review-status";
import { difficultyBandLabel } from "@/lib/scoring/band";
import type { GenerateTextInput } from "@/lib/ai/schemas";
import type { PersistedCandidate } from "@/lib/db/content";
import {
  approveTextVersion,
  generateTextCandidate,
  reviewTextCandidate,
  runDifficultyScoring,
  runModeration,
} from "@/lib/actions/admin";

const TEXT_TYPES: TextType[] = ["expository", "argumentative", "biography", "narrative_nonfiction"];

function buildInput(form: {
  topic: string; interest: string; band: string; textType: TextType; wordCount: number;
}): GenerateTextInput {
  const parsedGrade=form.band.startsWith("Advanced")?11:Number(form.band.match(/\d+/)?.[0]??7);const sentenceLength=parsedGrade<=6?15:parsedGrade<=8?18:parsedGrade<=10?22:24;const targetSkills=form.textType==="argumentative"?["inference","argument_structure","academic_connectors"]:form.textType==="expository"?["literal_comprehension","inference","cause_consequence"]:["literal_comprehension","inference","vocabulary_in_context"];
  return {
    language: "fr", studentGrade: parsedGrade, targetReadingBand: form.band, topic: form.topic,
    primaryInterest: form.interest, knowledgeDomains: INTEREST_BY_KEY[form.interest]?.transfer ?? [],
    targetConcepts: [], textType: form.textType as GenerateTextInput["textType"], wordCountTarget: form.wordCount,
    maxAverageSentenceLength: sentenceLength, maxNewAcademicWords: parsedGrade<=6?4:parsedGrade<=8?6:8,
    targetVocabulary: [], targetSkills,
    avoid: ["statistiques non sourcées","stéréotypes","publicité"], tone: "curious_explainer",
  };
}

function SelectChevron() {
  return <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />;
}

export function ReviewClient({ initialCandidates }: { initialCandidates: PersistedCandidate[] }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [topic, setTopic] = useState("La migration des jeunes footballeurs");
  const [interest, setInterest] = useState("football");
  const [band, setBand] = useState<string>("Secondary 7A");
  const [textType, setTextType] = useState<TextType>("expository");
  const [wordCount, setWordCount] = useState(450);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialCandidates[0]?.id ?? null);
  const [error, setError] = useState("");

  async function generate() {
    setBusy("generate"); setError("");
    try {
      const candidate = await generateTextCandidate(buildInput({ topic, interest, band, textType, wordCount }));
      setCandidates((rows) => [{ ...candidate, approvedTextVersionId: null, updatedAt: candidate.createdAt }, ...rows]);
      setSelectedId(candidate.id);
      router.refresh();
    } catch { setError("La génération n'a pas abouti. Vérifie la configuration du fournisseur."); }
    finally { setBusy(null); }
  }

  async function act(id: string, operation: "approve" | "reject" | "moderate") {
    setBusy(`${operation}:${id}`); setError("");
    try {
      if (operation === "approve") await approveTextVersion({ id });
      else if (operation === "reject") await reviewTextCandidate({ id, decision: "reject" });
      else await runModeration({ id });
      router.refresh();
    } catch { setError("La décision n'a pas pu être enregistrée. Réessaie."); }
    finally { setBusy(null); }
  }

  async function saveBody(id: string, body: string) {
    setBusy(`edit:${id}`); setError("");
    try {
      const updated = await runDifficultyScoring({ id, body });
      setCandidates((rows) => rows.map((row) => row.id === id ? { ...row, ...updated } : row));
      router.refresh();
    } catch { setError("Le texte modifié n'a pas pu être enregistré."); }
    finally { setBusy(null); }
  }

  const pending = candidates.filter((candidate) => ["needs_human_review", "draft"].includes(candidate.reviewStatus));
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const selectClass = "h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm";
  const frozenInput=buildInput({topic,interest,band,textType,wordCount});

  return (
    <>
      <PageHeader title="Révision du contenu" description="Génère, inspecte la difficulté et la modération, puis approuve ou rejette." />
      <Card className="mb-6">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Sujet</span>
            <input value={topic} onChange={(event) => setTopic(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Intérêt</span>
            <span className="relative block">
              <select value={interest} onChange={(event) => setInterest(event.target.value)} className={selectClass}>
                {INTERESTS.map((item) => <option className="bg-zinc-950" key={item.key} value={item.key}>{item.labelFr}</option>)}
              </select><SelectChevron />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Bande cible</span>
            <span className="relative block">
              <select value={band} onChange={(event) => setBand(event.target.value)} className={selectClass}>
                {DIFFICULTY_BANDS.map((item) => <option className="bg-zinc-950" key={item} value={item}>{item}</option>)}
              </select><SelectChevron />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type de texte</span>
            <span className="relative block">
              <select value={textType} onChange={(event) => setTextType(event.target.value as TextType)} className={selectClass}>
                {TEXT_TYPES.map((item) => <option className="bg-zinc-950" key={item} value={item}>{item}</option>)}
              </select><SelectChevron />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Nombre de mots</span>
            <input type="number" min={150} max={1500} value={wordCount} onChange={(event) => setWordCount(Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:col-span-2"><p className="font-medium text-foreground">Contrat qui sera figé</p><p>Classe {frozenInput.studentGrade} · phrases ≤ {frozenInput.maxAverageSentenceLength} mots · vocabulaire académique nouveau ≤ {frozenInput.maxNewAcademicWords}</p><p>Compétences : {frozenInput.targetSkills.join(" · ")}. Aucun mot cible arbitraire n’est injecté.</p></div>
          <div className="sm:col-span-2">
            <Button onClick={generate} disabled={busy !== null}>
              {busy === "generate" ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {busy === "generate" ? "Génération…" : "Générer un candidat"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">File de révision ({pending.length})</h2>
          {candidates.length === 0 ? <p className="text-sm text-muted-foreground">Aucun candidat. Génère-en un ci-dessus.</p> : (
            <div className="space-y-2">
              {candidates.map((candidate) => (
                <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`w-full rounded-md border p-3 text-left transition-colors ${selectedId === candidate.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{candidate.generated.title}</span>
                    <Badge variant={REVIEW_STATUS_VARIANT[candidate.reviewStatus]}>{REVIEW_STATUS_LABEL[candidate.reviewStatus]}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{candidate.difficulty.band}</span><span>· difficulté {candidate.difficulty.overall}</span>
                    {(candidate.flags.sensitive || candidate.flags.factualNeedsReview || candidate.flags.difficultyMismatch || !candidate.flags.moderationPassed) && <AlertTriangle className="size-3.5 text-destructive" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {selected ? (
            <CandidateDetail key={`${selected.id}:${selected.updatedAt}`} candidate={selected} busy={busy !== null}
              onApprove={() => act(selected.id, "approve")}
              onReject={() => act(selected.id, "reject")}
              onModerate={() => act(selected.id, "moderate")}
              onSaveBody={(body) => saveBody(selected.id, body)} />
          ) : <p className="text-sm text-muted-foreground">Sélectionne un candidat pour l&apos;inspecter.</p>}
        </div>
      </div>
    </>
  );
}

function CandidateDetail({ candidate, busy, onApprove, onReject, onModerate, onSaveBody }: {
  candidate: PersistedCandidate; busy: boolean; onApprove: () => void; onReject: () => void;
  onModerate: () => void; onSaveBody: (body: string) => void;
}) {
  const [body, setBody] = useState(candidate.generated.body);
  const decided = ["human_approved", "rejected"].includes(candidate.reviewStatus);
  return (
    <Card><CardContent className="space-y-5 pt-6">
      <div><h3 className="font-semibold">{candidate.generated.title}</h3><p className="text-xs text-muted-foreground">{candidate.input.textType} · cible {difficultyBandLabel(candidate.input.targetReadingBand)}</p></div>
      <div><p className="mb-2 text-sm font-medium">Difficulté (moteur déterministe)</p><DifficultyBars difficulty={candidate.difficulty} /><p className="mt-2 text-xs text-muted-foreground">{candidate.difficulty.features.wordCount} mots · {candidate.difficulty.features.avgSentenceLength} mots/phrase · {candidate.difficulty.features.connectorCount} connecteurs</p></div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={candidate.flags.moderationPassed ? "success" : "outline"}>Modération : {candidate.flags.moderationPassed ? "OK" : "à revoir"}</Badge>
        {candidate.flags.sensitive && <Badge>Domaine sensible</Badge>}
        {candidate.flags.factualNeedsReview && <Badge>Factualité à vérifier</Badge>}
        {candidate.flags.difficultyMismatch && <Badge>Difficulté hors cible</Badge>}
        {candidate.flags.nearDuplicate && <Badge>Texte très proche d’un texte approuvé</Badge>}
      </div>
      <div><p className="mb-2 text-sm font-medium">Questions ({candidate.generated.questions.length})</p><ul className="space-y-1 text-sm text-muted-foreground">{candidate.generated.questions.map((question, index) => <li key={`${question.questionText}-${index}`} className="flex items-center justify-between gap-2"><span className="truncate">{question.questionText}</span><Badge variant="secondary">{question.questionType} · {candidate.questionDifficulties[index]}</Badge></li>)}</ul></div>
      <div><p className="mb-2 text-sm font-medium">Corps du texte (modifiable)</p><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none ring-ring focus:ring-2" /><div className="mt-2 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onSaveBody(body)} disabled={busy || body === candidate.generated.body}>Enregistrer et recalculer</Button><Button variant="outline" size="sm" onClick={onModerate} disabled={busy}>Relancer la modération</Button></div></div>
      <div className="flex gap-2 border-t border-border pt-4"><Button onClick={onApprove} disabled={busy || decided}><Check /> Approuver</Button><Button variant="destructive" onClick={onReject} disabled={busy || decided}><X /> Rejeter</Button></div>
    </CardContent></Card>
  );
}
