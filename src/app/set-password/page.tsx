"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AuthCard, Field } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { invitedUserHome, sessionTokensFromAuthFragment } from "@/lib/auth-invite";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const client = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    const db = createClient();
    client.current = db;
    void (async () => {
      const existing = await db.auth.getSession();
      let session = existing.data.session;
      let sessionError = existing.error;

      if (!session && window.location.hash) {
        const tokens = sessionTokensFromAuthFragment(window.location.hash);
        if (tokens) {
          const established = await db.auth.setSession(tokens);
          session = established.data.session;
          sessionError = established.error;
        }
      }

      if (sessionError || !session) {
        setError("Ce lien d’activation est invalide ou a expiré. Demandez une nouvelle invitation.");
        return;
      }

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      setReady(true);
    })();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Choisissez un mot de passe d’au moins 12 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setBusy(true);
    try {
      const db = client.current;
      if (!db || !ready) throw new Error("Le lien d’activation n’est pas encore prêt.");
      const { data: current, error: sessionError } = await db.auth.getUser();
      if (sessionError || !current.user) throw sessionError ?? new Error("Session introuvable.");
      const { data, error: updateError } = await db.auth.updateUser({
        password,
        data: { ...current.user.user_metadata, password_set: true },
      });
      if (updateError || !data.user) throw updateError ?? new Error("Session introuvable.");
      router.replace(invitedUserHome(data.user.user_metadata?.role));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le mot de passe n’a pas pu être enregistré.");
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Finaliser votre accès"
      description="Choisissez votre mot de passe personnel pour sécuriser votre compte SigmaWrite."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Nouveau mot de passe"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Field
          label="Confirmer le mot de passe"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!ready && !error && <p role="status" className="text-sm text-muted-foreground">Vérification du lien…</p>}
        <Button type="submit" className="w-full" disabled={busy || !ready}>
          {busy ? "Enregistrement…" : "Enregistrer et continuer"}
        </Button>
      </form>
    </AuthCard>
  );
}
