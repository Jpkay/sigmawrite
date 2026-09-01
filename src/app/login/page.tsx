"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { loginWithPassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [captchaToken,setCaptchaToken]=useState<string|null>(null);
  const [captchaReset,setCaptchaReset]=useState(0);

  async function sendMagicLink(){setError(null);setMessage(null);setLoading(true);try{if(!identifier.includes("@"))throw new Error("Saisissez votre e-mail pour recevoir un lien magique.");if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");const{error}=await createClient().auth.signInWithOtp({email:identifier.trim(),options:{shouldCreateUser:false,emailRedirectTo:`${window.location.origin}/auth/callback`,captchaToken:captchaToken??undefined}});if(error)throw error;setMessage("Lien envoyé. Ouvrez votre e-mail pour vous connecter.");}catch(err){setError(err instanceof Error?err.message:"Lien impossible.");}finally{setLoading(false);setCaptchaReset(value=>value+1);}}
  async function signInGoogle(){setError(null);const{error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback`}});if(error)setError(error.message);}

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");
      const result = await loginWithPassword({
        identifier,
        password,
        captchaToken,
        next: params.get("next"),
      });
      router.push(result.redirectTo);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connexion impossible. Vérifiez la configuration Supabase."
      );
    } finally {
      setLoading(false);
      setCaptchaReset(value=>value+1);
    }
  }

  return (
    <AuthCard
      title="Se connecter"
      description="Accédez à votre espace."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-primary underline underline-offset-2">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="E-mail ou nom d’utilisateur"
          name="identifier"
          autoComplete="username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <TurnstileChallenge action="adult_login" onToken={setCaptchaToken} resetSignal={captchaReset}/>
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message&&<p className="text-sm text-[color:var(--success)]">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading||Boolean(turnstileSiteKey&&!captchaToken)}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={loading||!identifier||Boolean(turnstileSiteKey&&!captchaToken)} onClick={sendMagicLink}>Recevoir un lien magique (avec e-mail)</Button>
        {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED==="true"&&<Button type="button" variant="outline" className="w-full" onClick={signInGoogle}>Continuer avec Google (adultes)</Button>}
        <div className="flex justify-between text-xs text-muted-foreground">
          <Link href="/reset-password" className="hover:text-foreground">
            Mot de passe oublié ?
          </Link>
          <Link href="/join" className="hover:text-foreground">
            Rejoindre avec un code
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
