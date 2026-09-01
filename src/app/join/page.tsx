"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { createClient } from "@/lib/supabase/client";

type ValidCode = { class_name: string; school_name: string; school_consent_enabled: boolean };

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validated, setValidated] = useState<ValidCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function verifyCode() {
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("validate_class_join_code", { p_code: code.trim() });
      if (rpcError || !data?.[0]) throw new Error("Ce code est invalide, expiré ou complet.");
      setValidated(data[0] as ValidCode);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Code invalide."); }
    finally { setBusy(false); }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!validated) return verifyCode();
    setBusy(true); setError("");
    try {
      if (turnstileSiteKey && !captchaToken) throw new Error("Termine la vérification anti-robot.");
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { role: "student", display_name: name.trim(), username: username.trim().toLowerCase(), date_of_birth: dateOfBirth, join_code: code.trim().toUpperCase() }, captchaToken: captchaToken ?? undefined },
      });
      if (signupError) throw signupError;
      if (data.session) {
        router.push("/student");
        router.refresh();
      } else setConfirmation(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Inscription impossible.";
      setError(message.includes("saving new user") ? "Le code ou le nom d’utilisateur n’est plus disponible. Vérifie le nom choisi ou demande un nouveau code à ton enseignant." : message);
    } finally { setBusy(false); setCaptchaReset((value) => value + 1); }
  }

  if (confirmation) return <AuthCard title="Vérifie ton e-mail" description="Ton compte et ta place dans la classe sont prêts."><p className="text-sm text-muted-foreground">Ouvre le message envoyé à <span className="font-medium text-foreground">{email}</span>, puis connecte-toi avec cet e-mail ou le nom d’utilisateur <span className="font-medium text-foreground">{username}</span>.</p><Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Aller à la connexion</Link></AuthCard>;

  return <AuthCard title="Rejoindre une classe" description="Saisis le code fourni par ton enseignant.">
    <form onSubmit={createAccount} className="space-y-4">
      <Field label="Code de classe" placeholder="SW-A1B2C3" required value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setValidated(null); }} />
      {!validated ? <Button type="button" className="w-full" onClick={verifyCode} disabled={busy || code.trim().length < 6}>{busy ? "Vérification…" : "Vérifier le code"}</Button> : <>
        <div className="rounded-md border border-primary/30 bg-accent/40 p-3 text-sm"><p className="font-medium">{validated.class_name} · {validated.school_name}</p><p className="text-xs text-muted-foreground">Invitation validée : ton accès sera actif dès la création du compte.</p></div>
        <Field label="Ton nom" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Date de naissance" type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
        <Field label="Nom d’utilisateur" name="username" autoComplete="username" pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" minLength={3} maxLength={32} required value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
        <Field label="Ton e-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField label="Mot de passe" required minLength={12} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <TurnstileChallenge action="student_signup" onToken={setCaptchaToken} resetSignal={captchaReset} />
        <Button type="submit" className="w-full" disabled={busy || !name.trim() || !dateOfBirth || username.length < 3 || !email.trim() || password.length < 12 || Boolean(turnstileSiteKey && !captchaToken)}>{busy ? "Création…" : "Créer mon compte"}</Button>
      </>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  </AuthCard>;
}
