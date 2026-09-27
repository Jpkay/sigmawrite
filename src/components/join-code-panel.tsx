"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JoinCodeInfo } from "@/lib/db/lifecycle";
import { inviteStudents } from "@/lib/actions/teacher";
import { CLASS_INVITE_CONFIG } from "@/lib/invite-config";

export function JoinCodePanel({ classId, initial }: { classId: string; initial: JoinCodeInfo | null }) {
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number>(CLASS_INVITE_CONFIG.defaultExpiresInDays);
  const [maxUses, setMaxUses] = useState<number>(CLASS_INVITE_CONFIG.defaultMaxUses);
  const [confirmingReplacement, setConfirmingReplacement] = useState(false);

  const codeIsFull = Boolean(code && code.uses >= code.maxUses);
  const settingsAreValid = Number.isInteger(maxUses)
    && maxUses >= CLASS_INVITE_CONFIG.maxUses.min
    && maxUses <= CLASS_INVITE_CONFIG.maxUses.max;

  async function rotate() {
    if (code && !codeIsFull && !confirmingReplacement) {
      setConfirmingReplacement(true);
      setMessage("Confirmez le remplacement : l’ancien code cessera immédiatement de fonctionner.");
      return;
    }
    setBusy(true); setMessage(""); setError("");
    try {
      const created = await inviteStudents({ classId, expiresInDays, maxUses });
      setCode({ ...created, classId });
      setMessage("Nouveau code actif. L’ancien code ne peut plus être utilisé.");
      setConfirmingReplacement(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le code n’a pas pu être créé.");
    } finally { setBusy(false); }
  }

  async function copy() {
    if (!code) return;
    setError("");
    try {
      await navigator.clipboard.writeText(code.code);
      setMessage("Code copié.");
    } catch {
      setError("La copie automatique a échoué. Sélectionnez le code et copiez-le manuellement.");
    }
  }

  return <Card className="mb-8 border-primary/30"><CardContent className="space-y-4 pt-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium">Code pour rejoindre la classe</p>{code ? <><p className="mt-1 select-all font-mono text-2xl font-semibold tracking-wider">{code.code}</p><p className={`text-xs ${codeIsFull ? "text-destructive" : "text-muted-foreground"}`}>{code.uses}/{code.maxUses} utilisations · {codeIsFull ? "code complet" : `expire le ${new Date(code.expiresAt).toLocaleDateString("fr-FR")}`}</p></> : <p className="mt-1 text-sm text-muted-foreground">Aucun code actif.</p>}</div>
      <div className="flex flex-wrap gap-2">{code && <Button variant="outline" size="sm" onClick={copy}><Copy /> Copier</Button>}<Button size="sm" onClick={rotate} disabled={busy || !settingsAreValid}><RefreshCw /> {busy ? "Création…" : confirmingReplacement ? "Confirmer le remplacement" : code ? "Remplacer le code" : "Créer le code"}</Button>{confirmingReplacement && <Button variant="ghost" size="sm" onClick={() => { setConfirmingReplacement(false); setMessage(""); }}>Annuler</Button>}</div>
    </div>
    <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Durée du prochain code<select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 font-normal" value={expiresInDays} onChange={(event) => setExpiresInDays(Number(event.target.value))} disabled={busy}>{CLASS_INVITE_CONFIG.expiryOptions.map((days) => <option key={days} value={days}>{days} jours</option>)}</select></label>
      <label className="text-sm font-medium">Nombre maximal d’élèves<input className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 font-normal" type="number" min={CLASS_INVITE_CONFIG.maxUses.min} max={CLASS_INVITE_CONFIG.maxUses.max} value={maxUses} onChange={(event) => setMaxUses(Number(event.target.value))} disabled={busy} /></label>
    </div>
    {!settingsAreValid && <p role="alert" className="text-sm text-destructive">Choisissez un nombre d’élèves entre {CLASS_INVITE_CONFIG.maxUses.min} et {CLASS_INVITE_CONFIG.maxUses.max}.</p>}
    <p className="text-sm text-muted-foreground">Le code inscrit l’élève dans cette classe et active l’autorisation scolaire. Retirez ensuite son inscription pour retirer cet accès.</p>
    {message && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </CardContent></Card>;
}
