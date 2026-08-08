"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/types";
import { safeAuthRedirect } from "@/lib/auth-redirect";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [captchaToken,setCaptchaToken]=useState<string|null>(null);
  const [captchaReset,setCaptchaReset]=useState(0);

  async function sendMagicLink(){setError(null);setMessage(null);setLoading(true);try{if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");const{error}=await createClient().auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:`${window.location.origin}/auth/callback`,captchaToken:captchaToken??undefined}});if(error)throw error;setMessage("Lien envoyé. Ouvrez votre e-mail pour vous connecter.");}catch(err){setError(err instanceof Error?err.message:"Lien impossible.");}finally{setLoading(false);setCaptchaReset(value=>value+1);}}
  async function signInGoogle(){setError(null);const{error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/auth/callback`}});if(error)setError(error.message);}

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if(turnstileSiteKey&&!captchaToken)throw new Error("Terminez la vérification anti-robot.");
      const supabase = createClient();
      const bytes = new TextEncoder().encode(email.trim().toLowerCase());
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const subjectHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const { data: limit, error: limitError } = await supabase.rpc("consume_auth_attempt", {
        p_subject_hash: subjectHash,
      });
      const rate = Array.isArray(limit) ? limit[0] : limit;
      if (limitError) throw new Error("Connexion momentanément indisponible. Réessaie.");
      if (!rate?.allowed) throw new Error("Trop de tentatives. Attends quelques minutes avant de réessayer.");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken ?? undefined },
      });
      if (error) throw error;
      const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", data.user.id).maybeSingle();
      const role = profile?.role as Role | undefined;
      const fallback = role ? ROLE_HOME[role] : "/student";
      router.push(safeAuthRedirect(params.get("next"), fallback));
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
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TurnstileChallenge action="adult_login" onToken={setCaptchaToken} resetSignal={captchaReset}/>
        <Field
          label="Mot de passe"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message&&<p className="text-sm text-[color:var(--success)]">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading||Boolean(turnstileSiteKey&&!captchaToken)}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={loading||!email||Boolean(turnstileSiteKey&&!captchaToken)} onClick={sendMagicLink}>Recevoir un lien magique (adultes)</Button>
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
