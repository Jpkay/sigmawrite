"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acknowledgeReviewInstructions } from "@/lib/actions/reviews";

export function InstructionsAcknowledge() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="border-t border-border pt-5"><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={checked} onChange={(event) => setChecked(event.target.checked)} /><span>J’ai lu les consignes et je m’engage à effectuer mes évaluations de manière indépendante.</span></label>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<Button disabled={!checked || busy} className="mt-4" onClick={async () => { setBusy(true); setError(""); try { await acknowledgeReviewInstructions(); router.push("/review"); router.refresh(); } catch { setError("La confirmation n’a pas pu être enregistrée."); setBusy(false); } }}>{busy ? "Enregistrement…" : "Confirmer et commencer"}</Button></div>;
}
