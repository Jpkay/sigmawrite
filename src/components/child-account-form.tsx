"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { linkStudent } from "@/lib/actions/parent";

export function ChildAccountForm({ language = "fr" }: { language?: "fr" | "en" }) {
  const en = language === "en";
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [grade, setGrade] = useState(7);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await linkStudent({ displayName, dateOfBirth, grade, password });
      setCredentials({ email: result.email, password: result.password });
    } catch { setError(en ? "The child account could not be created." : "Le compte enfant n'a pas pu être créé."); }
    finally { setBusy(false); }
  }

  if (!open) return <Button className="mb-6" variant="outline" onClick={() => setOpen(true)}><UserPlus /> {en ? "Create a child account" : "Créer le compte d’un enfant"}</Button>;
  return <Card className="mb-6"><CardContent className="pt-6">
    {credentials ? <div className="space-y-2"><p className="font-medium">{en ? "Account created and consent recorded" : "Compte créé et consentement enregistré"}</p><p className="text-sm text-muted-foreground">{en ? "Give these credentials to your child. They are shown only here." : "Transmettez ces identifiants à votre enfant. Ils ne seront affichés qu’ici."}</p><div className="rounded-md bg-muted p-3 font-mono text-sm"><p>{credentials.email}</p><p>{credentials.password}</p></div></div> : <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">{en ? "Child’s name" : "Nom de l’enfant"}</span><input className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "Date of birth" : "Date de naissance"}</span><input type="date" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "School grade" : "Classe scolaire"}</span><input type="number" min={5} max={12} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required value={grade} onChange={(event) => setGrade(Number(event.target.value))} /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">{en ? "Temporary password" : "Mot de passe provisoire"}</span><input type="password" minLength={8} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? (en ? "Creating…" : "Création…") : (en ? "Create and give consent" : "Créer et donner mon consentement")}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{en ? "Cancel" : "Annuler"}</Button></div>
    </form>}
  </CardContent></Card>;
}
