"use client";

import { Fragment, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renderDictationAudioNow, reviewDictation, type AdminDictationRow } from "@/lib/actions/dictations-admin";

const GRADE: Record<number, string> = { 4: "CM1", 5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e" };

export function DictationReviewTable({ rows }: { rows: AdminDictationRow[] }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  function act(work: () => Promise<unknown>, label: string) {
    setMessage("");
    start(async () => { try { const result = await work(); setMessage(typeof result === "object" && result && "rendered" in result ? `${label} : ${JSON.stringify(result)}` : `${label} enregistré.`); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); } });
  }
  const pendingAudio = rows.filter((row) => row.reviewStatus === "human_approved" && row.audioStatus !== "ready").length;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{rows.length} texte(s) · {rows.filter((row) => row.reviewStatus === "human_approved").length} approuvé(s) · {pendingAudio} en attente d’audio</p>
        <Button variant="outline" disabled={pending || pendingAudio === 0} onClick={() => act(() => renderDictationAudioNow(), "Rendu audio")}>Rendre l’audio maintenant</Button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-[.08em] text-muted-foreground"><tr><th className="p-3">Texte</th><th className="p-3">Niveau</th><th className="p-3">Relecture</th><th className="p-3">Audio</th><th className="p-3">Tentatives</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="border-t border-border align-top">
                  <td className="p-3"><button type="button" className="text-left font-medium underline-offset-4 hover:underline" onClick={() => setOpen(open === row.id ? null : row.id)}>{row.title}</button><p className="text-xs text-muted-foreground">{row.kind} · {row.wordCount} mots{row.focus ? ` · ${row.focus}` : ""}</p></td>
                  <td className="p-3">{GRADE[row.gradeMin]}{row.gradeMax !== row.gradeMin ? ` – ${GRADE[row.gradeMax]}` : ""}</td>
                  <td className="p-3"><Badge variant={row.reviewStatus === "human_approved" ? "default" : "outline"}>{row.reviewStatus}</Badge></td>
                  <td className="p-3"><Badge variant={row.audioStatus === "ready" ? "default" : "outline"}>{row.audioStatus}</Badge>{row.audioModel && <p className="text-xs text-muted-foreground">{row.audioModel}</p>}{row.audioError && <p className="max-w-56 text-xs text-destructive">{row.audioError}</p>}</td>
                  <td className="p-3 tabular-nums">{row.attempts}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-2">
                    {row.reviewStatus !== "human_approved" && <Button size="sm" disabled={pending} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "human_approved" }), "Approbation")}>Approuver</Button>}
                    {row.reviewStatus !== "rejected" && <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "rejected" }), "Rejet")}>Rejeter</Button>}
                    {row.reviewStatus !== "needs_human_review" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(() => reviewDictation({ dictationId: row.id, decision: "needs_human_review" }), "Retour en relecture")}>Retirer</Button>}
                  </div></td>
                </tr>
                {open === row.id && <tr className="bg-muted/30"><td colSpan={6} className="p-4"><ol className="list-decimal space-y-1 pl-5 text-[15px] leading-7">{row.segments.map((segment, index) => <li key={index}>{segment}</li>)}</ol></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
