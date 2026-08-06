"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type ValidCode = { class_name: string; school_name: string; school_consent_enabled: boolean };

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validated, setValidated] = useState<ValidCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);

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
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { role: "student", display_name: name.trim(), date_of_birth: dateOfBirth, join_code: code.trim().toUpperCase() } },
      });
      if (signupError) throw signupError;
      if (data.session) {
        router.push("/student");
        router.refresh();
      } else setConfirmation(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Inscription impossible.";
      setError(message.includes("saving new user") ? "Le code n'est plus disponible. Demande un nouveau code à ton enseignant." : message);
    } finally { setBusy(false); }
  }

  if (confirmation) return <AuthCard title="Vérifie ton e-mail" description="Ton compte et ta place dans la classe sont prêts."><p className="text-sm text-muted-foreground">Ouvre le message envoyé à <span className="font-medium text-foreground">{email}</span>, puis connecte-toi.</p><Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Aller à la connexion</Link></AuthCard>;

  return <AuthCard title="Rejoindre une classe" description="Saisis le code fourni par ton enseignant.">
    <form onSubmit={createAccount} className="space-y-4">
      <Field label="Code de classe" placeholder="SW-A1B2C3" required value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setValidated(null); }} />
      {!validated ? <Button type="button" className="w-full" onClick={verifyCode} disabled={busy || code.trim().length < 6}>{busy ? "Vérification…" : "Vérifier le code"}</Button> : <>
        <div className="rounded-md border border-primary/30 bg-accent/40 p-3 text-sm"><p className="font-medium">{validated.class_name} · {validated.school_name}</p><p className="text-xs text-muted-foreground">{validated.school_consent_enabled ? "Le consentement est géré par l'établissement." : "Un consentement familial ou personnel sera nécessaire."}</p></div>
        <Field label="Ton nom" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Date de naissance" type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
        <Field label="Ton e-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Mot de passe" type="password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" className="w-full" disabled={busy || !name.trim() || !dateOfBirth || !email.trim() || password.length < 12}>{busy ? "Création…" : "Créer mon compte"}</Button>
      </>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  </AuthCard>;
}
