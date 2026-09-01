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
import { textTypeLabel } from "@/lib/presentation/french-labels";
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
  const firstActionable = initialCandidates.find((candidate) => ["needs_human_review", "draft"].includes(candidate.reviewStatus));
  const [selectedId, setSelectedId] = useState<string | null>(firstActionable?.id ?? initialCandidates[0]?.id ?? null);
  const [view, setView] = useState<"pending" | "flagged" | "all">("pending");
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
  const flagged = candidates.filter((candidate) => candidate.flags.sensitive || candidate.flags.factualNeedsReview || candidate.flags.difficultyMismatch || !candidate.flags.moderationPassed);
  const approved = candidates.filter((candidate) => ["auto_approved", "human_approved", "benchmark_locked"].includes(candidate.reviewStatus));
  const visibleCandidates = view === "pending" ? pending : view === "flagged" ? flagged : candidates;
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? null;
  const selectClass = "h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm";
  const frozenInput=buildInput({topic,interest,band,textType,wordCount});

  return (
    <>
      <PageHeader title="Textes à traiter" description="Commencez par les textes qui attendent une décision. Les outils de création et les diagnostics détaillés restent disponibles à la demande." />
      <section aria-label="État de la file" className="mb-7 grid grid-cols-3 gap-5 border-y border-border py-5">
        <div><p className="text-2xl font-semibold tabular-nums">{pending.length}</p><p className="text-xs text-muted-foreground">À traiter</p></div>
        <div><p className="text-2xl font-semibold tabular-nums">{flagged.length}</p><p className="text-xs text-muted-foreground">Signalés</p></div>
        <div><p className="text-2xl font-semibold tabular-nums">{approved.length}</p><p className="text-xs text-muted-foreground">Approuvés</p></div>
      </section>
      <details className="group mb-8 border-b border-border pb-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2 font-medium marker:content-none">Créer un nouveau texte <span className="text-sm font-normal text-muted-foreground group-open:hidden">Afficher le formulaire</span><span className="hidden text-sm font-normal text-muted-foreground group-open:inline">Masquer le formulaire</span></summary>
      <Card className="mt-4 border-border/70 shadow-none">
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
                {DIFFICULTY_BANDS.map((item) => <option className="bg-zinc-950" key={item} value={item}>{difficultyBandLabel(item)}</option>)}
              </select><SelectChevron />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type de texte</span>
            <span className="relative block">
              <select value={textType} onChange={(event) => setTextType(event.target.value as TextType)} className={selectClass}>
                {TEXT_TYPES.map((item) => <option className="bg-zinc-950" key={item} value={item}>{textTypeLabel(item)}</option>)}
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
      </details>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Décisions en attente</h2><p className="mt-1 text-sm text-muted-foreground">Sélectionnez un texte pour l’examiner.</p></div><div className="flex rounded-md bg-muted p-1 text-xs">{([["pending","À traiter"],["flagged","Signalés"],["all","Tous"]] as const).map(([value,label])=><button key={value} onClick={()=>{setView(value);const rows=value==="pending"?pending:value==="flagged"?flagged:candidates;setSelectedId(rows[0]?.id??null);}} className={`rounded px-2.5 py-1.5 transition-colors ${view===value?"bg-background font-medium shadow-sm":"text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div></div>
          {candidates.length === 0 ? <p className="text-sm text-muted-foreground">Aucun candidat. Génère-en un ci-dessus.</p> : (
            <div className="divide-y divide-border border-y border-border">
              {visibleCandidates.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun texte dans cette vue.</p> : visibleCandidates.map((candidate) => (
                <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`w-full px-3 py-4 text-left transition-colors ${selectedId === candidate.id ? "bg-primary/10" : "hover:bg-muted/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{candidate.generated.title}</span>
                    <Badge variant={REVIEW_STATUS_VARIANT[candidate.reviewStatus]}>{REVIEW_STATUS_LABEL[candidate.reviewStatus]}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Cible : {difficultyBandLabel(candidate.input.targetReadingBand)}</span><span>· difficulté calculée {candidate.difficulty.overall}</span>
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
    <section className="border-t-2 border-primary pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{candidate.generated.title}</h3><p className="mt-1 text-xs text-muted-foreground">{textTypeLabel(candidate.input.textType)} · {difficultyBandLabel(candidate.input.targetReadingBand)}</p></div><Badge variant={REVIEW_STATUS_VARIANT[candidate.reviewStatus]}>{REVIEW_STATUS_LABEL[candidate.reviewStatus]}</Badge></div>

      <label className="mt-6 block"><span className="text-sm font-medium">Texte à examiner</span><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={14} className="mt-2 w-full rounded-md border border-input bg-background p-4 text-sm leading-6 outline-none ring-ring focus:ring-2" /></label>
      <Button className="mt-2" variant="outline" size="sm" onClick={() => onSaveBody(body)} disabled={busy || body === candidate.generated.body}>Enregistrer les modifications</Button>

      <section className="mt-7 border-t border-border pt-5"><h4 className="text-sm font-semibold">Questions à vérifier ({candidate.generated.questions.length})</h4><ol className="mt-3 divide-y divide-border border-y border-border text-sm">{candidate.generated.questions.map((question, index) => <li key={`${question.questionText}-${index}`} className="py-3"><span className="mr-2 font-semibold text-primary">{index + 1}.</span>{question.questionText}</li>)}</ol></section>

      <details className="group mt-6 border-y border-border py-3"><summary className="flex cursor-pointer list-none items-center justify-between font-medium marker:content-none">Analyse technique <span className="text-xs font-normal text-muted-foreground group-open:hidden">Afficher</span><span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Masquer</span></summary><div className="mt-5 space-y-5"><div><p className="mb-2 text-sm font-medium">Difficulté calculée</p><DifficultyBars difficulty={candidate.difficulty} /><p className="mt-2 text-xs text-muted-foreground">{candidate.difficulty.features.wordCount} mots · {candidate.difficulty.features.avgSentenceLength} mots/phrase · {candidate.difficulty.features.connectorCount} connecteurs</p></div><div className="flex flex-wrap gap-2"><Badge variant={candidate.flags.moderationPassed ? "success" : "outline"}>Modération : {candidate.flags.moderationPassed ? "OK" : "à revoir"}</Badge>{candidate.flags.sensitive && <Badge>Domaine sensible</Badge>}{candidate.flags.factualNeedsReview && <Badge>Factualité à vérifier</Badge>}{candidate.flags.difficultyMismatch && <Badge>Difficulté hors cible</Badge>}{candidate.flags.nearDuplicate && <Badge>Texte très proche d’un texte approuvé</Badge>}</div><Button variant="outline" size="sm" onClick={onModerate} disabled={busy}>Relancer la modération</Button></div></details>

      <div className="sticky bottom-0 mt-6 flex gap-2 border-t border-border bg-background/95 py-4 backdrop-blur"><Button onClick={onApprove} disabled={busy || decided}><Check /> Approuver</Button><Button variant="destructive" onClick={onReject} disabled={busy || decided}><X /> Rejeter</Button></div>
    </section>
  );
}
