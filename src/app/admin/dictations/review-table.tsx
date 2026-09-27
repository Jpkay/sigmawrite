"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AccentTextarea } from "@/components/accent-textarea";
import { loadDictationReviewAudio, renderDictationAudioNow, reviewDictation, type AdminDictationRow } from "@/lib/actions/dictations-admin";

const GRADE: Record<number, string> = { 4: "CM1", 5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e" };
const STATUS: Record<string, string> = { human_approved: "Approuvée", rejected: "À corriger", needs_human_review: "À relire" };
const AUDIO: Record<string, string> = { ready: "Audio disponible", pending: "Audio en préparation", rendering: "Audio en préparation", failed: "Audio à préparer de nouveau" };

export function DictationReviewTable({ rows }: { rows: AdminDictationRow[] }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(rows.find((row) => row.reviewStatus === "needs_human_review")?.id ?? rows[0]?.id ?? null);
  const row = rows.find((entry) => entry.id === open);
  function act(work: () => Promise<unknown>, label: string, advance = false) {
    setMessage("");
    start(async () => {
      try {
        await work(); setMessage(label);
        if (advance) { const index = rows.findIndex((entry) => entry.id === open); const next = [...rows.slice(index + 1), ...rows.slice(0, index)].find((entry) => entry.reviewStatus === "needs_human_review"); if (next) setOpen(next.id); }
      } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); }
    });
  }
  const pendingAudio = rows.filter((entry) => entry.reviewStatus === "human_approved" && entry.audioStatus !== "ready").length;
  return <div className="mx-auto max-w-4xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4"><p className="text-sm text-muted-foreground">{rows.filter((entry) => entry.reviewStatus === "needs_human_review").length} dictées à relire</p><label className="text-sm">Choisir une dictée<select value={open ?? ""} disabled={pending} onChange={(event) => setOpen(event.target.value)} className="ml-2 max-w-full rounded-md border bg-background p-2">{rows.map((entry) => <option key={entry.id} value={entry.id}>{entry.title} · {STATUS[entry.reviewStatus] ?? "À relire"}</option>)}</select></label></div>
    {message && <p role="status" className="my-4 text-sm">{message}</p>}
    {row ? <>
      <header className="py-6"><p className="text-sm text-muted-foreground">{GRADE[row.gradeMin]}{row.gradeMax !== row.gradeMin ? ` – ${GRADE[row.gradeMax]}` : ""} · {row.wordCount} mots · {STATUS[row.reviewStatus] ?? "À relire"}</p><h2 className="mt-2 text-2xl font-semibold">{row.title}</h2>{row.focus && <details className="mt-3 text-sm"><summary className="cursor-pointer">Repères pédagogiques</summary><p className="mt-2">{row.focus}</p></details>}</header>
      <DictationPreview key={`${row.id}:${row.audioStatus}`} row={row} />
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-background/95 py-4 backdrop-blur"><Button variant="outline" disabled={pending || row.reviewStatus === "rejected"} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "rejected" }), "Dictée signalée : elle reste à corriger.", true)}>À corriger</Button><Button disabled={pending || row.reviewStatus === "human_approved"} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "human_approved" }), "Approbation enregistrée.", true)}>Approuver et continuer</Button></div>
      <details className="mt-4 border-t border-border py-4 text-sm"><summary className="cursor-pointer text-muted-foreground">Gestion de la dictée et de l’audio</summary><div className="mt-4 space-y-3"><p>{AUDIO[row.audioStatus] ?? "Audio indisponible"} · {row.attempts} tentatives d’élèves</p>{row.audioError && <p className="text-destructive">La préparation de l’audio a échoué.</p>}<Button size="sm" variant="outline" disabled={pending || pendingAudio === 0} onClick={() => act(() => renderDictationAudioNow(), "Préparation de l’audio terminée. Consultez son état avant de l’écouter.")}>Préparer les audios en attente</Button><Button size="sm" variant="ghost" disabled={pending || row.reviewStatus === "needs_human_review"} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "needs_human_review" }), "Dictée remise en relecture.")}>Remettre en relecture</Button></div></details>
    </> : <p className="py-10 text-muted-foreground">Aucune dictée à relire.</p>}
  </div>;
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
