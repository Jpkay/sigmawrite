"use client";

import { useState, useTransition } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccentTextarea } from "@/components/accent-textarea";
import { overrideWritingScore, postTeacherComment, type StudentWritingSample } from "@/lib/actions/teacher";

type Comment = { id: string; targetType: string; targetId: string | null; body: string; createdAt: string; readAt: string | null };

const when = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Teacher feedback on a student's writing, delivered to the student inbox (roadmap 5.4). */
export function TeacherCommentPanel({ studentId, samples, comments: initial, language }: { studentId: string; samples: StudentWritingSample[]; comments: Comment[]; language: "fr" | "en" }) {
  const en = language === "en";
  const [target, setTarget] = useState<string>(samples[0] ? `${samples[0].kind}:${samples[0].id}` : "general:");
  const [body, setBody] = useState("");
  const [comments, setComments] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [override, setOverride] = useState<{ id: string; score: number } | null>(null);
  function applyOverride() {
    if (!override) return;
    setMessage("");
    start(async () => {
      try { await overrideWritingScore({ studentId, evaluationId: override.id, score: override.score }); setMessage(en ? `Score set to ${override.score}/100 for the student and reports.` : `Note ${override.score}/100 enregistrée pour l’élève et les rapports.`); setOverride(null); }
      catch (caught) { setMessage(caught instanceof Error ? caught.message : (en ? "Could not save." : "Enregistrement impossible.")); }
    });
  }
  function send() {
    const [targetType, targetId] = target.split(":");
    setMessage("");
    start(async () => {
      try {
        const result = await postTeacherComment({ studentId, targetType, targetId: targetId || undefined, body });
        setComments((current) => [{ id: result.id, targetType, targetId: targetId || null, body, createdAt: new Date().toISOString(), readAt: null }, ...current]);
        setBody(""); setMessage(en ? "Sent to the student’s inbox." : "Envoyé dans la boîte de réception de l’élève.");
      } catch (caught) { setMessage(caught instanceof Error ? caught.message : (en ? "Could not send." : "Envoi impossible.")); }
    });
  }
  return (
    <section className="mt-9 border-t border-border pt-7">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquareText className="size-5 text-primary" />{en ? "Feedback on writing" : "Retour sur les écrits"}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{en ? "One short, specific comment reaches the student’s inbox. Comments are moderated and logged." : "Un commentaire court et précis arrive dans la boîte de réception de l’élève. Les commentaires sont modérés et journalisés."}</p>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card><CardContent className="pt-6">
          {samples.length === 0 ? <p className="text-sm text-muted-foreground">{en ? "No writing yet." : "Pas encore d’écrit."}</p> : (
            <ul className="grid gap-3">
              {samples.map((sample) => {
                const key = `${sample.kind}:${sample.id}`;
                return <li key={key}><label className={`block cursor-pointer rounded-md border p-3 text-sm ${target === key ? "border-primary bg-accent/40" : "border-border"}`}><input type="radio" name="target" className="mr-2 accent-primary" checked={target === key} onChange={() => setTarget(key)} /><span className="font-medium">{sample.title}</span><span className="ml-2 text-xs text-muted-foreground">{when(sample.at)}{sample.score ? ` · ${sample.score}` : ""}</span>{sample.excerpt && <p className="mt-1 text-muted-foreground">{sample.excerpt}</p>}{sample.kind === "summary" && <span className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">{en ? "Override AI score" : "Remplacer la note IA"}</span><input type="number" min={0} max={100} value={override?.id === sample.id ? override.score : ""} onChange={(event) => setOverride({ id: sample.id, score: Number(event.target.value) })} className="h-8 w-20 rounded-md border border-input bg-background px-2" aria-label={en ? "Teacher score" : "Note enseignant"} /><Button type="button" size="sm" variant="outline" disabled={pending || override?.id !== sample.id} onClick={applyOverride}>{en ? "Apply" : "Appliquer"}</Button></span>}</label></li>;
              })}
              <li><label className={`block cursor-pointer rounded-md border p-3 text-sm ${target === "general:" ? "border-primary bg-accent/40" : "border-border"}`}><input type="radio" name="target" className="mr-2 accent-primary" checked={target === "general:"} onChange={() => setTarget("general:")} />{en ? "General encouragement" : "Encouragement général"}</label></li>
            </ul>
          )}
          <AccentTextarea value={body} onChange={setBody} rows={3} maxLength={1000} placeholder={en ? "e.g. Your second paragraph is clear. Check the agreement of « les élèves » with the verb." : "ex. Ton deuxième paragraphe est clair. Vérifie l’accord de « les élèves » avec le verbe."} className="mt-4 w-full rounded-md border border-input bg-background p-3 text-sm" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{body.length}/1000</span><Button disabled={pending || body.trim().length === 0} onClick={send}><Send className="size-4" />{pending ? (en ? "Sending…" : "Envoi…") : (en ? "Send" : "Envoyer")}</Button></div>
          {message && <p role="status" className="mt-2 text-sm">{message}</p>}
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <h3 className="text-sm font-semibold">{en ? "Previous comments" : "Commentaires précédents"}</h3>
          {comments.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">—</p> : <ul className="mt-2 grid gap-2 text-sm">{comments.map((comment) => <li key={comment.id} className="border-l-2 border-border pl-3"><p className="text-xs text-muted-foreground">{when(comment.createdAt)} · {comment.targetType}{comment.readAt ? (en ? " · read" : " · lu") : ""}</p><p>{comment.body}</p></li>)}</ul>}
        </CardContent></Card>
      </div>
    </section>
  );
}
