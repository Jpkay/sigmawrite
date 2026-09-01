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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string; email: string | null; emailDelivered: boolean } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await linkStudent({ displayName, dateOfBirth, grade, username, email });
      setCredentials({ username: result.username, password: result.password, email: result.email, emailDelivered: result.emailDelivered });
    } catch { setError(en ? "The child account could not be created." : "Le compte enfant n'a pas pu être créé."); }
    finally { setBusy(false); }
  }

  if (!open) return <Button className="mb-6" variant="outline" onClick={() => setOpen(true)}><UserPlus /> {en ? "Create a child account" : "Créer le compte d’un enfant"}</Button>;
  return <Card className="mb-6"><CardContent className="pt-6">
    {credentials ? <div className="space-y-2"><p className="font-medium">{en ? "Account created and consent recorded" : "Compte créé et consentement enregistré"}</p><p className="text-sm text-muted-foreground">{credentials.emailDelivered ? (en ? "The credentials were emailed. Save this copy before closing." : "Les identifiants ont été envoyés par e-mail. Conservez cette copie avant de fermer.") : (en ? "Give these one-time credentials to your child. They are shown only here." : "Transmettez ces identifiants temporaires à votre enfant. Ils ne seront affichés qu’ici.")}</p><div className="rounded-md bg-muted p-3 font-mono text-sm"><p>{credentials.username}</p><p>{credentials.password}</p>{credentials.email&&<p className="mt-2 text-xs text-muted-foreground">{credentials.email}</p>}</div><p className="text-xs text-muted-foreground">{en ? "A new password is required at first login." : "Un nouveau mot de passe sera exigé à la première connexion."}</p></div> : <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">{en ? "Child’s name" : "Nom de l’enfant"}</span><input className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "Date of birth" : "Date de naissance"}</span><input type="date" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "School grade" : "Classe scolaire"}</span><input type="number" min={5} max={12} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" required value={grade} onChange={(event) => setGrade(Number(event.target.value))} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "Username (optional)" : "Nom d’utilisateur (facultatif)"}</span><input autoComplete="off" pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder={en ? "Generated if empty" : "Généré si vide"} /></label>
      <label><span className="mb-1 block text-sm font-medium">{en ? "Child’s email (optional)" : "E-mail de l’enfant (facultatif)"}</span><input type="email" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? (en ? "Creating…" : "Création…") : (en ? "Create and give consent" : "Créer et donner mon consentement")}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{en ? "Cancel" : "Annuler"}</Button></div>
    </form>}
  </CardContent></Card>;
}
