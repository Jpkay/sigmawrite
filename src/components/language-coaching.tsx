"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPracticeLanguageCoaching } from "@/lib/actions/language-coaching";
import { coachReviewPreview } from "@/lib/actions/review-preview";
import type { CoachingResult } from "@/lib/content/language-coaching";

type Props = { attemptId: string; preview?: never } | { attemptId?: never; preview: { id: string; answerText: string } };
/** Mounted only after success; additional help never interrupts the next exercise. */
export function LanguageCoaching(props: Props) {
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);
  const manual = useRef(false);
  useEffect(() => {
    if (!props.attemptId) return;
    let active = true;
    void getPracticeLanguageCoaching({ attemptId: props.attemptId, requested: false })
      .then((feedback) => { if (active && !manual.current) setResult(feedback); }).catch(() => {});
    return () => { active = false; };
  }, [props.attemptId]);
  async function request() {
    manual.current = true; setBusy(true); setRequested(true);
    try { setResult(props.attemptId ? await getPracticeLanguageCoaching({ attemptId: props.attemptId, requested: true }) : await coachReviewPreview(props.preview)); }
    catch { setResult({ tip: null, available: false }); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 text-sm">
    {result?.tip && <aside aria-label="Un conseil pour ta phrase" className="mb-3 border-l-2 border-border py-2 pl-4 leading-6">
      <p className="font-medium">{result.tip.kind === "clarity" ? "Une formulation plus claire" : "Un petit point de langue"}</p>
      <p className="mt-1">« {result.tip.before} » → « {result.tip.after} »</p>
      <p className="mt-1 text-muted-foreground">{result.tip.explanationFr}</p>
    </aside>}
    {requested && result && !result.tip && !busy && <p role="status" className="mb-2 text-muted-foreground">{result.available ? "Ta formulation convient : rien d’utile à changer ici." : "Le conseil est indisponible pour le moment. Cela ne change pas ta bonne réponse."}</p>}
    <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void request()}>{busy ? "Recherche d’un conseil…" : "Améliorer ma phrase"}</Button>
  </div>;
}
