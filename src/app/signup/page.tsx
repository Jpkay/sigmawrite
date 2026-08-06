"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, display_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/consent` },
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
        <Field
          label="Mot de passe"
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
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
