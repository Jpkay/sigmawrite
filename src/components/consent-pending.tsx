"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { giveStudentConsent } from "@/lib/actions/consent";

export function ConsentPending({ canSelfConsent }: { canSelfConsent: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setBusy(true); setError("");
    try { await giveStudentConsent({}); router.refresh(); }
    catch { setError("Le consentement n'a pas pu être enregistré."); }
    finally { setBusy(false); }
  }
  return <><PageHeader title="Accès en attente" description="Ta confidentialité passe avant les activités." /><Card><CardContent className="space-y-4 pt-6"><p>Ton compte est prêt, mais aucun consentement actif ne couvre encore ton utilisation de l&apos;application.</p>{canSelfConsent ? <><p className="text-sm text-muted-foreground">Comme tu as au moins 15 ans, tu peux lire la politique et donner ton propre consentement.</p><Button onClick={accept} disabled={busy}><ShieldCheck /> {busy ? "Enregistrement…" : "J'ai lu et j'accepte"}</Button></> : <p className="text-sm text-muted-foreground">Demande à ton parent ou à ton établissement de valider le consentement. Tu pourras ensuite revenir ici.</p>}<p className="text-sm"><Link href="/privacy" className="text-primary hover:underline">Lire la politique de confidentialité</Link></p>{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card></>;
}
