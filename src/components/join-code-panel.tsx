"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JoinCodeInfo } from "@/lib/db/lifecycle";
import { inviteStudents } from "@/lib/actions/teacher";

export function JoinCodePanel({ classId, initial }: { classId: string; initial: JoinCodeInfo | null }) {
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function rotate() {
    setBusy(true); setMessage("");
    try {
      const created = await inviteStudents({ classId, expiresInDays: 14, maxUses: 40 });
      setCode({ ...created, classId });
      setMessage("Nouveau code actif.");
    } catch { setMessage("Le code n'a pas pu être créé."); }
    finally { setBusy(false); }
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code.code);
    setMessage("Code copié.");
  }

  return <Card className="mb-8 border-primary/30"><CardContent className="space-y-4 pt-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium">Code pour rejoindre la classe</p>{code ? <><p className="mt-1 font-mono text-2xl font-semibold tracking-wider">{code.code}</p><p className="text-xs text-muted-foreground">{code.uses}/{code.maxUses} utilisations · expire le {new Date(code.expiresAt).toLocaleDateString("fr-FR")}</p></> : <p className="mt-1 text-sm text-muted-foreground">Aucun code actif.</p>}</div>
      <div className="flex gap-2">{code && <Button variant="outline" size="sm" onClick={copy}><Copy /> Copier</Button>}<Button size="sm" onClick={rotate} disabled={busy}><RefreshCw /> {code ? "Faire tourner" : "Créer"}</Button></div>
    </div>
    <p className="text-sm text-muted-foreground">Tout élève qui utilise ce code est immédiatement autorisé à commencer. Désactive son inscription pour retirer cet accès.</p>
    {message && <p className="text-sm text-muted-foreground">{message}</p>}
  </CardContent></Card>;
}
