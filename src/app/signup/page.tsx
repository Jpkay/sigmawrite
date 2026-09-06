"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { createClient } from "@/lib/supabase/client";

/** Adults (parents, teachers) self-register. Students join via a class code. */
export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"parent" | "teacher">("parent");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherSchool, setTeacherSchool] = useState<string | null>(null);
  const [teacherCodeError, setTeacherCodeError] = useState("");

  async function checkTeacherCode(code: string) {
    setTeacherSchool(null); setTeacherCodeError("");
    if (code.trim().length < 4) return;
    const { data } = await createClient().rpc("validate_teacher_code", { p_code: code.trim() });
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.school_name) setTeacherSchool(row.school_name as string); else setTeacherCodeError("Code inconnu. Demandez-le à l’administration de votre établissement.");
  }
  const [captchaReset, setCaptchaReset] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (turnstileSiteKey && !captchaToken) throw new Error("Terminez la vérification anti-robot.");
      if (role === "teacher" && !teacherSchool) throw new Error("Un code établissement valide est requis pour un compte enseignant.");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, display_name: name, teacher_code: role === "teacher" ? teacherCode.trim() : undefined }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/consent`, captchaToken: captchaToken ?? undefined },
      });
      if (error) throw error;
      if (data.session) router.push("/consent");
      else setConfirmationSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Inscription impossible. Vérifiez la configuration Supabase."
      );
    } finally {
      setLoading(false);
      setCaptchaReset((value) => value + 1);
    }
  }

  return (
    <AuthCard
      title={confirmationSent ? "Confirmez votre adresse" : "Créer un compte"}
      description={confirmationSent ? `Nous avons envoyé un lien à ${email}. Ouvrez-le sur cet appareil pour terminer l’inscription.` : "Pour les parents et les enseignants. Les élèves rejoignent avec un code de classe."}
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {confirmationSent ? <div role="status" className="space-y-4 text-sm"><p>Le lien peut prendre quelques minutes. Vérifiez aussi les courriers indésirables.</p><Button type="button" variant="outline" className="w-full" onClick={() => setConfirmationSent(false)}>Corriger l’adresse</Button></div> : <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Je suis…</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "parent" | "teacher")}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="parent">Un parent</option>
            <option value="teacher">Un enseignant</option>
          </select>
        </label>
        {role === "teacher" && (
          <Field
            label="Code établissement"
            required
            autoComplete="off"
            value={teacherCode}
            onChange={(e) => { setTeacherCode(e.target.value.toUpperCase()); void checkTeacherCode(e.target.value); }}
          />
        )}
        {role === "teacher" && <p className={`-mt-2 text-xs ${teacherSchool ? "text-success" : teacherCodeError ? "text-destructive" : "text-muted-foreground"}`} role="status">{teacherSchool ? `Établissement reconnu : ${teacherSchool}` : teacherCodeError || "Fourni par l’administration de votre établissement."}</p>}
        <Field
          label="Nom complet"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Mot de passe"
          required
          minLength={12}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TurnstileChallenge action="adult_signup" onToken={setCaptchaToken} resetSignal={captchaReset} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || Boolean(turnstileSiteKey && !captchaToken)}>
          {loading ? "Création…" : "Créer le compte"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Un élève&nbsp;?{" "}
          <Link href="/join" className="text-primary hover:underline">
            Rejoindre avec un code de classe
          </Link>
        </p>
      </form>}
    </AuthCard>
  );
}
