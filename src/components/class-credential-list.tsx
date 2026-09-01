"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { resetManagedUserPassword } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";

export function ClassCredentialList({ accounts }: { accounts: Array<{ profileId: string; name: string; username: string }> }) {
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<{ name: string; username: string; password: string; emailDelivered: boolean } | null>(null);
  async function reset(account: (typeof accounts)[number]) {
    setBusyId(account.profileId); setError(""); setCredentials(null); setCopied(false);
    try {
      const result = await resetManagedUserPassword({ profileId: account.profileId });
      setCredentials({ name: account.name, username: result.username, password: result.temporaryPassword, emailDelivered: result.emailDelivered });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Réinitialisation impossible."); }
    finally { setBusyId(""); }
  }
  if (!accounts.length) return null;
  return <section className="mt-8 border-t border-border pt-7"><h2 className="text-lg font-semibold">Accès des élèves</h2><p className="mt-1 text-sm text-muted-foreground">Les noms d’utilisateur restent consultables. Un mot de passe temporaire n’est affiché qu’au moment où vous le créez.</p>{credentials&&<div role="status" className="mt-4 rounded-md bg-accent/50 p-4"><p className="font-medium">{credentials.name}</p><p className="mt-1 text-sm text-muted-foreground">{credentials.emailDelivered?"Envoyé par e-mail. Une copie est affichée ci-dessous.":"Transmettez ces identifiants de façon sécurisée."}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-sm"><div><p>{credentials.username}</p><p>{credentials.password}</p></div><Button type="button" size="sm" variant="outline" onClick={async()=>{await navigator.clipboard.writeText(`${credentials.username}\n${credentials.password}`);setCopied(true);}}>{copied?<Check/>:<Copy/>}{copied?"Copié":"Copier"}</Button></div></div>}{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-4 divide-y divide-border border-y border-border">{accounts.map(account=><div key={account.profileId} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{account.name}</p><p className="font-mono text-xs text-muted-foreground">{account.username}</p></div><Button type="button" size="sm" variant="outline" disabled={Boolean(busyId)} onClick={()=>reset(account)}><KeyRound/>{busyId===account.profileId?"Création…":"Mot de passe temporaire"}</Button></div>)}</div></section>;
}
