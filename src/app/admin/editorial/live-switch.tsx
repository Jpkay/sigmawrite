"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAuditRead, setEditorialLiveGeneration } from "@/lib/actions/editorial-admin";

export function EditorialLiveSwitch({ enabled, mode }: { enabled: boolean; mode: "live" | "library_only" }) {
  const [state, setState] = useState({ enabled, mode });
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const apply = (next: { enabled: boolean; mode: "live" | "library_only" }) => start(async () => {
    try { setState(await setEditorialLiveGeneration(next)); setMessage("Réglage enregistré."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); }
  });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant={state.enabled ? "outline" : "default"} disabled={pending} onClick={() => apply({ enabled: !state.enabled, mode: state.mode })} aria-pressed={state.enabled}>
        {state.enabled ? "Couper la génération en direct" : "Rétablir la génération en direct"}
      </Button>
      {state.mode === "library_only" && <Button size="sm" disabled={pending} onClick={() => apply({ enabled: state.enabled, mode: "live" })}>Lever la bascule automatique</Button>}
      {message && <span role="status" className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

export function MarkAuditRead({ auditId }: { auditId: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <span className="text-xs text-muted-foreground">Lu</span>;
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { await markAuditRead({ auditId }); setDone(true); })}>Marquer comme lu</Button>;
}
