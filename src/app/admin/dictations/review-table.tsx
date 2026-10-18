"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AccentTextarea } from "@/components/accent-textarea";
import { loadDictationReviewAudio, renderDictationAudioNow, reviewDictation, runDictationGatesNow, takeDownDictation, type AdminDictationRow } from "@/lib/actions/dictations-admin";

const GRADE: Record<number, string> = { 4: "CM1", 5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e" };
const STATUS: Record<string, string> = { auto_approved: "Publiée automatiquement", human_approved: "Approuvée", rejected: "À corriger", needs_human_review: "En attente des vérifications", taken_down: "Retirée" };
const PUBLISHED = new Set(["auto_approved", "human_approved"]);
const GATE_STATUS: Record<string, string> = { pass: "réussie", fail: "échouée", skipped: "non exécutée" };
const AUDIO: Record<string, string> = { ready: "Audio disponible", pending: "Audio en préparation", rendering: "Audio en préparation", failed: "Audio à préparer de nouveau" };

export function DictationReviewTable({ rows }: { rows: AdminDictationRow[] }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(rows.find((row) => !PUBLISHED.has(row.reviewStatus) && row.reviewStatus !== "taken_down")?.id ?? rows[0]?.id ?? null);
  const [reason, setReason] = useState("");
  const row = rows.find((entry) => entry.id === open);
  function act(work: () => Promise<unknown>, label: string, advance = false) {
    setMessage("");
    start(async () => {
      try {
        await work(); setMessage(label);
        if (advance) { const index = rows.findIndex((entry) => entry.id === open); const next = [...rows.slice(index + 1), ...rows.slice(0, index)].find((entry) => entry.reviewStatus === "needs_human_review" || entry.reviewStatus === "rejected"); if (next) setOpen(next.id); }
      } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); }
    });
  }
  const pendingAudio = rows.filter((entry) => PUBLISHED.has(entry.reviewStatus) && entry.audioStatus !== "ready").length;
  const waiting = rows.filter((entry) => entry.reviewStatus === "needs_human_review" || entry.reviewStatus === "rejected").length;
  return <div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4"><p className="text-sm text-muted-foreground">{rows.filter((entry) => PUBLISHED.has(entry.reviewStatus)).length} publiées · {waiting} en attente · {rows.filter((entry) => entry.reviewStatus === "taken_down").length} retirées</p><label className="text-sm">Choisir une dictée<select value={open ?? ""} disabled={pending} onChange={(event) => setOpen(event.target.value)} className="ml-2 max-w-full rounded-md border bg-background p-2 pr-10">{rows.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {STATUS[entry.reviewStatus] ?? "En attente"}</option>)}</select></label></div>
    {message && <p role="status" className="my-4 text-sm">{message}</p>}
    {row ? <>
      <header className="py-6"><p className="text-sm text-muted-foreground">{GRADE[row.gradeMin]}{row.gradeMax !== row.gradeMin ? ` – ${GRADE[row.gradeMax]}` : ""} · {row.wordCount} mots · {STATUS[row.reviewStatus] ?? "En attente"}</p><h2 className="mt-2 text-2xl font-semibold">{row.title}</h2>{row.focus && <details className="mt-3 text-sm"><summary className="cursor-pointer">Repères pédagogiques</summary><p className="mt-2">{row.focus}</p></details>}</header>
      <DictationPreview key={`${row.id}:${row.audioStatus}`} row={row} />
      <GateSummary row={row} />
      <div className="sticky bottom-0 flex flex-wrap items-end justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur">
        {PUBLISHED.has(row.reviewStatus) ? <>
          <label className="mr-auto min-w-0 flex-1 text-sm">Motif du retrait (facultatif)<input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} className="mt-1 block h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
          <Button variant="outline" disabled={pending} onClick={() => act(async () => { await takeDownDictation({ dictationId: row.id, reason: reason || undefined }); setReason(""); }, "Dictée retirée : les élèves ne la voient plus.")}>Retirer pour les élèves</Button>
        </> : row.reviewStatus === "taken_down" ? (
          <Button disabled={pending} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "human_approved" }), "Dictée remise en ligne.")}>Remettre en ligne</Button>
        ) : <>
          <Button variant="outline" disabled={pending} onClick={() => act(() => runDictationGatesNow(row.id), "Vérifications terminées. Consultez le résultat ci-dessus.")}>Lancer les vérifications automatiques</Button>
          <Button disabled={pending} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "human_approved" }), "Approbation enregistrée.", true)}>Approuver et continuer</Button>
        </>}
      </div>
      <details className="mt-4 border-t border-border py-4 text-sm"><summary className="cursor-pointer text-muted-foreground">Gestion de la dictée et de l’audio</summary><div className="mt-4 space-y-3"><p>{AUDIO[row.audioStatus] ?? "Audio indisponible"} · {row.attempts} tentatives d’élèves</p>{row.audioError && <p className="text-destructive">La préparation de l’audio a échoué.</p>}<Button size="sm" variant="outline" disabled={pending || pendingAudio === 0} onClick={() => act(() => renderDictationAudioNow(), "Préparation de l’audio terminée. Consultez son état avant de l’écouter.")}>Préparer les audios en attente</Button><Button size="sm" variant="ghost" disabled={pending || row.reviewStatus === "rejected"} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "rejected" }), "Dictée signalée : elle reste à corriger.")}>Marquer à corriger</Button></div></details>
    </> : <p className="py-10 text-muted-foreground">Aucune dictée pour l’instant.</p>}
  </div>;
}

function GateSummary({ row }: { row: AdminDictationRow }) {
  const notable = row.gates.filter((gate) => gate.status !== "pass");
  return <section aria-label="Vérifications automatiques" className="border-t border-border py-5 text-sm">
    <h3 className="font-medium">Vérifications automatiques</h3>
    {row.gates.length === 0 ? <p className="mt-2 text-muted-foreground">Pas encore lancées.</p> : <>
      <p className="mt-2 text-muted-foreground">{row.gatesPassed ? "Toutes les vérifications bloquantes sont réussies" : "Au moins une vérification bloquante a échoué"}{row.pipelineVersion ? ` · pipeline ${row.pipelineVersion}` : ""}{row.autoApprovedAt ? ` · publiée le ${new Date(row.autoApprovedAt).toLocaleDateString("fr-FR")}` : ""}</p>
      {notable.length > 0 && <ul className="mt-3 space-y-2">{notable.map((gate) => <li key={gate.gate} className={gate.status === "fail" && gate.blocking ? "text-destructive" : "text-muted-foreground"}>
        <span className="font-medium">{gate.gate}</span> : {GATE_STATUS[gate.status] ?? gate.status}{gate.blocking ? "" : " (indicative)"}
        {gate.details && <code className="mt-1 block break-words text-xs">{JSON.stringify(gate.details).slice(0, 400)}</code>}
      </li>)}</ul>}
    </>}
    {row.takenDownAt && <p className="mt-3 text-muted-foreground">Retirée le {new Date(row.takenDownAt).toLocaleDateString("fr-FR")}{row.takedownReason ? ` : ${row.takedownReason}` : ""}</p>}
    {(row.themes.length > 0 || row.interests.length > 0) && <p className="mt-3 text-muted-foreground">Thèmes : {row.themes.join(", ") || "aucun"} · Centres d’intérêt : {row.interests.join(", ") || "aucun"}</p>}
  </section>;
}

function DictationPreview({ row }: { row: AdminDictationRow }) {
  const [audio, setAudio] = useState<Awaited<ReturnType<typeof loadDictationReviewAudio>>>(null);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState(0);
  const [answers, setAnswers] = useState<string[]>(row.segments.map(() => ""));
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    let active = true;
    loadDictationReviewAudio(row.id).then((result) => { if (active) setAudio(result); }).catch(() => { if (active) setError("L’audio n’a pas pu être chargé. Rouvrez cette dictée pour réessayer."); });
    return () => { active = false; };
  }, [row.id]);
  return <section aria-label="Aperçu élève" className="pb-7">
    <p className="mb-4 text-xs text-muted-foreground">Aperçu élève · les essais ne sont pas enregistrés</p>
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    {audio?.full ? <div className="mb-5"><p className="mb-2 text-sm font-medium">Écouter en entier</p><audio onPlay={pauseOtherAudio} controls preload="none" src={audio.full} className="w-full" aria-label="Dictée entière" /></div> : <p className="mb-5 text-sm text-muted-foreground">{row.audioStatus === "ready" ? (error ? "Audio indisponible." : "Chargement de l’audio…") : "L’audio sera disponible après l’approbation du texte et sa préparation."}</p>}
    <p className="mb-3 text-sm font-medium">Segment {segment + 1} sur {row.segments.length}</p>
    {audio?.segments[segment] && <audio key={segment} onPlay={pauseOtherAudio} controls preload="none" src={audio.segments[segment]!} aria-label={`Écouter le segment ${segment + 1}`} className="mb-4 w-full" />}
    <AccentTextarea aria-label="Écris ce que tu entends" placeholder="Écris ce que tu entends…" value={answers[segment] ?? ""} onChange={(value) => setAnswers((current) => current.map((entry, index) => index === segment ? value : entry))} rows={4} className="w-full rounded-lg border border-input bg-background p-4 text-base leading-7" />
    <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={segment === 0} onClick={() => setSegment(segment - 1)}>Segment précédent</Button><Button variant="outline" disabled={segment >= row.segments.length - 1} onClick={() => setSegment(segment + 1)}>Segment suivant</Button><Button variant="ghost" onClick={() => setRevealed(!revealed)}>{revealed ? "Masquer la transcription" : "Voir la transcription"}</Button><Button variant="ghost" onClick={() => { setAnswers(row.segments.map(() => "")); setSegment(0); setRevealed(false); }}>Réessayer</Button></div>
    {revealed && <article className="mt-5 border-l-2 border-primary pl-4 text-lg leading-8">{row.segments.map((text, index) => <p className="mb-3" key={index}>{text}</p>)}</article>}
  </section>;
}

function pauseOtherAudio(event: React.SyntheticEvent<HTMLAudioElement>) {
  const current = event.currentTarget;
  current.closest("section")?.querySelectorAll("audio").forEach((audio) => { if (audio !== current) audio.pause(); });
}
