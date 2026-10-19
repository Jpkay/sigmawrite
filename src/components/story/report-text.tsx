"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportText } from "@/lib/actions/story";
import { REPORT_REASONS, STORY_COPY as copy, type ReportReason } from "@/lib/story/copy";

/** "Signaler ce texte" (H.15 feedback loop): feeds the daily audit, never deletes by itself. */
export function ReportText({ chapterId, send = reportText }: { chapterId: string; send?: typeof reportText }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (state === "sent") return <p role="status" className="text-sm text-success">{copy.reportThanks}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline decoration-border-strong underline-offset-4 hover:text-foreground">
        <Flag aria-hidden="true" className="size-4" />{copy.report}
      </button>
    );
  }
  async function submit() {
    if (!reason) return;
    setState("sending");
    try {
      await send({ kind: "story_chapter", contentId: chapterId, reason, note: note.trim() || null });
      setState("sent");
    } catch {
      setState("error");
    }
  }
  return (
    <form className="w-full max-w-md border border-border-strong bg-card p-4 text-left" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <fieldset>
        <legend className="font-semibold">{copy.reportTitle}</legend>
        <div className="mt-3 grid gap-2">
          {REPORT_REASONS.map((key) => (
            <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input type="radio" name="story-report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="size-4 accent-[var(--primary)]" />
              {copy.reportReasons[key]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm text-muted-foreground" htmlFor="story-report-note">{copy.reportNote}</label>
      <textarea id="story-report-note" value={note} maxLength={500} rows={2} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full border border-input bg-background p-2 text-[15px]" />
      {state === "error" && <p role="alert" className="mt-2 text-sm text-destructive">{copy.reportError}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={!reason || state === "sending"}>{copy.reportSend}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setState("idle"); }}>{copy.reportCancel}</Button>
      </div>
    </form>
  );
}
