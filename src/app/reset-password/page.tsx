"use client";

import { useState } from "react";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { requestPasswordRecovery } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [identifier,setIdentifier]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [captchaToken,setCaptchaToken]=useState<string|null>(null);
  const [captchaReset,setCaptchaReset]=useState(0);
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");
      const result=await requestPasswordRecovery({identifier,captchaToken});
      setMessage(result.message);
    }catch(caught){setError(caught instanceof Error?caught.message:"Le lien n’a pas pu être envoyé.");}
    finally{setBusy(false);setCaptchaReset(value=>value+1);}
  }
  return <AuthCard title="Réinitialiser le mot de passe" description="Utilisez votre e-mail ou votre nom d’utilisateur.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail ou nom d’utilisateur" name="identifier" required autoComplete="username" value={identifier} onChange={event=>setIdentifier(event.target.value)}/>
      <TurnstileChallenge action="password_recovery" onToken={setCaptchaToken} resetSignal={captchaReset}/>
      {message&&<p role="status" className="text-sm text-[color:var(--success)]">{message}</p>}
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy||Boolean(turnstileSiteKey&&!captchaToken)}>{busy?"Envoi…":"Envoyer le lien"}</Button>
    </form>
  </AuthCard>;
}
