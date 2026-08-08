"use client";

import { useState } from "react";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email,setEmail]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [captchaToken,setCaptchaToken]=useState<string|null>(null);
  const [captchaReset,setCaptchaReset]=useState(0);
  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");
      const redirectTo=`${window.location.origin}/set-password?recovery=1`;
      const {error:resetError}=await createClient().auth.resetPasswordForEmail(email.trim(),{redirectTo,captchaToken:captchaToken??undefined});
      if(resetError)throw resetError;
      setMessage("Si ce compte existe, un lien de réinitialisation vient d’être envoyé.");
    }catch(caught){setError(caught instanceof Error?caught.message:"Le lien n’a pas pu être envoyé.");}
    finally{setBusy(false);setCaptchaReset(value=>value+1);}
  }
  return <AuthCard title="Réinitialiser le mot de passe" description="Recevez un lien sécurisé par e-mail.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail" type="email" name="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/>
      <TurnstileChallenge action="password_recovery" onToken={setCaptchaToken} resetSignal={captchaReset}/>
      {message&&<p role="status" className="text-sm text-[color:var(--success)]">{message}</p>}
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy||Boolean(turnstileSiteKey&&!captchaToken)}>{busy?"Envoi…":"Envoyer le lien"}</Button>
    </form>
  </AuthCard>;
}
