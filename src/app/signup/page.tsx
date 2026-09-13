"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { TurnstileChallenge, turnstileSiteKey } from "@/components/turnstile-challenge";
import { normalizeInviteCode } from "@/lib/invite-config";
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
  const [teacherValidation, setTeacherValidation] = useState<{ code: string; school: string } | null>(null);
  const [teacherCodeError, setTeacherCodeError] = useState("");
  const [checkingTeacherCode, setCheckingTeacherCode] = useState(false);
  const teacherCodeRequest = useRef(0);

  async function checkTeacherCode(rawCode = teacherCode): Promise<string | null> {
    const code = normalizeInviteCode(rawCode);
    const requestId = teacherCodeRequest.current + 1;
    teacherCodeRequest.current = requestId;
    setTeacherValidation(null); setTeacherCodeError("");
    if (code.length < 4) {
      setTeacherCodeError("Saisissez le code complet fourni par l’administration.");
      return null;
    }
    setCheckingTeacherCode(true);
    let response: { data: unknown; error: { message?: string } | null };
    try {
      response = await createClient().rpc("validate_teacher_code", { p_code: code });
    } catch {
      if (requestId === teacherCodeRequest.current) {
        setCheckingTeacherCode(false);
        setTeacherCodeError("Le code ne peut pas être vérifié pour le moment. Réessayez dans quelques minutes.");
      }
      return null;
    }
    if (requestId !== teacherCodeRequest.current) return null;
    setCheckingTeacherCode(false);
    const { data, error: rpcError } = response;
    if (rpcError) {
      setTeacherCodeError("Le code ne peut pas être vérifié pour le moment. Réessayez dans quelques minutes.");
      return null;
    }
    const row = (Array.isArray(data) ? data[0] : data) as { school_name?: string } | null;
    if (row?.school_name) {
      const school = row.school_name as string;
      setTeacherCode(code);
      setTeacherValidation({ code, school });
      return school;
    }
    setTeacherCodeError("Ce code est invalide ou a été remplacé. Demandez le code actif à l’administration de votre établissement.");
    return null;
  }
  const [captchaReset, setCaptchaReset] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (turnstileSiteKey && !captchaToken) throw new Error("Terminez la vérification anti-robot.");
      if (role === "teacher") {
        const school = await checkTeacherCode();
        if (!school) throw new Error("Un code établissement actif est requis pour créer un compte enseignant.");
      }
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { role, display_name: name.trim(), teacher_code: role === "teacher" ? normalizeInviteCode(teacherCode) : undefined }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/consent`, captchaToken: captchaToken ?? undefined },
      });
      if (error) throw error;
      if (role === "teacher" && data.session && data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", data.user.id).maybeSingle();
        if (profile?.role !== "teacher") {
          await supabase.auth.signOut();
          throw new Error("Le code établissement a été remplacé pendant l’inscription. Demandez le code actif à l’administration puis réessayez avec une autre adresse e-mail.");
        }
      }
      if (data.session) router.push("/consent");
      else setConfirmationSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Inscription impossible. Vérifiez la configuration Supabase.";
      const normalizedMessage = message.toLowerCase();
      setError(
        role === "teacher" && (normalizedMessage.includes("teacher_code_invalid") || normalizedMessage.includes("saving new user"))
          ? "Le code établissement est invalide ou a été remplacé. Demandez le code actif à l’administration puis réessayez."
          : normalizedMessage.includes("already registered") || normalizedMessage.includes("already been registered")
            ? "Un compte utilise déjà cet e-mail. Connectez-vous ou réinitialisez votre mot de passe."
            : message
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
            onChange={(e) => { setRole(e.target.value as "parent" | "teacher"); setError(null); }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="parent">Un parent</option>
            <option value="teacher">Un enseignant</option>
          </select>
        </label>
        {role === "teacher" && (
          <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Field
            label="Code établissement"
            required
            autoComplete="off"
            value={teacherCode}
            onChange={(e) => { teacherCodeRequest.current += 1; setTeacherCode(e.target.value.toUpperCase()); setTeacherValidation(null); setTeacherCodeError(""); setCheckingTeacherCode(false); }}
          /></div><Button type="button" variant="outline" className="h-12" disabled={checkingTeacherCode || teacherCode.trim().length < 4} onClick={() => { void checkTeacherCode(); }}>{checkingTeacherCode ? "Vérification…" : "Vérifier"}</Button></div>
        )}
        {role === "teacher" && <p className={`-mt-2 text-xs ${teacherValidation ? "text-success" : teacherCodeError ? "text-destructive" : "text-muted-foreground"}`} role="status">{teacherValidation ? `Établissement reconnu : ${teacherValidation.school}` : teacherCodeError || "Un même code actif peut servir à plusieurs enseignants de l’établissement."}</p>}
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
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || checkingTeacherCode || Boolean(turnstileSiteKey && !captchaToken)}>
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
