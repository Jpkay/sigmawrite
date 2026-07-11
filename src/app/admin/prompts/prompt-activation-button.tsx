"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activatePromptVersion } from "@/lib/actions/admin";

export function PromptActivationButton({ promptId, active }: { promptId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function activate() {
    setBusy(true); setError("");
    try { await activatePromptVersion({ id: promptId }); router.refresh(); }
    catch { setError("Activation impossible."); }
    finally { setBusy(false); }
  }
  if (active) return null;
  return <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={activate}>{busy ? "Activation…" : "Activer"}</Button>{error && <span className="text-xs text-destructive">{error}</span>}</div>;
}
