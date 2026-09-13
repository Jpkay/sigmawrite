"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { joinClassWithoutEmail } from "@/lib/actions/auth";
import { CLASS_INVITE_CONFIG, normalizeInviteCode, supportsNoEmailJoin } from "@/lib/invite-config";
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

  async function verifyCode(): Promise<ValidCode | null> {
    setBusy(true); setError("");
    try {
      const normalizedCode = normalizeInviteCode(code);
      if (normalizedCode.length < 6 || normalizedCode.length > CLASS_INVITE_CONFIG.acceptedLegacyCodeMaxLength) {
        throw new Error("Vérifie le code, puis réessaie. Si le problème continue, demande un nouveau code à ton enseignant.");
      }
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("validate_class_join_code", { p_code: normalizedCode });
      if (rpcError) throw new Error("Le code ne peut pas être vérifié pour le moment. Réessaie dans quelques minutes.");
      const row = (Array.isArray(data) ? data[0] : data) as ValidCode | null;
      if (!row?.class_name || !row.school_name) throw new Error("Ce code est invalide, expiré, révoqué ou complet. Demande un nouveau code à ton enseignant.");
      setCode(normalizedCode);
      setValidated(row);
      return row;
    } catch (reason) {
      setValidated(null);
      setError(reason instanceof Error ? reason.message : "Code invalide.");
      return null;
    }
    finally { setBusy(false); }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!validated) { await verifyCode(); return; }
    setBusy(true); setError("");
    try {
      if (turnstileSiteKey && !captchaToken) throw new Error("Termine la vérification anti-robot.");
      const normalizedCode = normalizeInviteCode(code);
      if (!email.trim() && !supportsNoEmailJoin(normalizedCode)) {
        throw new Error("Ce code ancien est trop long pour créer un compte sans e-mail. Demande à ton enseignant de générer un nouveau code.");
      }
      const currentInvite = await verifyCode();
      if (!currentInvite) return;
      setBusy(true);
      const supabase = createClient();
      if (!email.trim()) {
        // No inbox: the server creates the account with an internal address and the student signs in by username.
        const created = await joinClassWithoutEmail({ code: normalizedCode, displayName: name.trim(), username: username.trim().toLowerCase(), dateOfBirth, password, captchaToken });
        router.push(created.signedIn ? "/student" : "/login?joined=1"); router.refresh(); return;
      }
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: {
          data: { role: "student", display_name: name.trim(), username: username.trim().toLowerCase(), date_of_birth: dateOfBirth, join_code: normalizedCode },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/student`,
          captchaToken: captchaToken ?? undefined,
        },
      });
      if (signupError) throw signupError;
      if (data.session) {
        router.push("/student");
        router.refresh();
      } else setConfirmation(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Inscription impossible.";
      const normalizedMessage = message.toLowerCase();
      setError(normalizedMessage.includes("saving new user") || normalizedMessage.includes("join_code")
        ? "Le code a expiré, a été remplacé ou est complet, ou ce nom d’utilisateur est déjà pris. Vérifie le nom choisi puis demande un nouveau code à ton enseignant si nécessaire."
        : normalizedMessage.includes("already registered") || normalizedMessage.includes("already been registered")
          ? "Un compte utilise déjà cet e-mail. Connecte-toi ou réinitialise ton mot de passe."
          : message);
    } finally { setBusy(false); setCaptchaReset((value) => value + 1); }
  }

  if (confirmation) return <AuthCard title="Vérifie ton e-mail" description="Ton compte et ta place dans la classe sont prêts."><p className="text-sm text-muted-foreground">Ouvre le message envoyé à <span className="font-medium text-foreground">{email}</span>, puis connecte-toi avec cet e-mail ou le nom d’utilisateur <span className="font-medium text-foreground">{username}</span>.</p><Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Aller à la connexion</Link></AuthCard>;

  return <AuthCard title="Rejoindre une classe" description="Saisis le code fourni par ton enseignant.">
    <form onSubmit={createAccount} className="space-y-4">
      <Field label="Code de classe" placeholder="SW-A1B2C3" required autoComplete="off" maxLength={CLASS_INVITE_CONFIG.acceptedLegacyCodeMaxLength} value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setValidated(null); setError(""); }} />
      {!validated ? <Button type="button" className="w-full" onClick={verifyCode} disabled={busy || code.trim().length < 6}>{busy ? "Vérification…" : "Vérifier le code"}</Button> : <>
        <div className="rounded-md border border-primary/30 bg-accent/40 p-3 text-sm"><p className="font-medium">{validated.class_name} · {validated.school_name}</p><p className="text-xs text-muted-foreground">Invitation validée. Le code sera revérifié à la création du compte et l’autorisation scolaire sera enregistrée avec ton inscription.</p></div>
        <Field label="Ton nom" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Date de naissance" type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
        <Field label="Nom d’utilisateur" name="username" autoComplete="username" pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" minLength={3} maxLength={32} required value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
        <Field label="Ton e-mail (facultatif)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {!email.trim() && <p className="-mt-2 text-xs text-muted-foreground">Sans e-mail, tu te connecteras avec ton nom d’utilisateur. Note-le dans un endroit sûr : ton enseignant ou l’administration devra t’aider si tu oublies ton mot de passe.</p>}
        <PasswordField label="Mot de passe" required minLength={12} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <TurnstileChallenge action="student_signup" onToken={setCaptchaToken} resetSignal={captchaReset} />
        <Button type="submit" className="w-full" disabled={busy || !name.trim() || !dateOfBirth || username.length < 3 || password.length < 12 || Boolean(turnstileSiteKey && !captchaToken)}>{busy ? "Création…" : "Créer mon compte"}</Button>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </AuthCard>;
}
