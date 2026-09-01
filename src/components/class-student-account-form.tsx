"use client";

import { useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { createManagedUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";

export function ClassStudentAccountForm({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [grade, setGrade] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string; emailDelivered: boolean } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setCredentials(null); setCopied(false);
    try {
      const result = await createManagedUser({
        role: "student",
        displayName,
        username,
        email,
        dateOfBirth,
        grade,
        schoolIds: [],
        classIds: [classId],
        teacherIds: [],
        studentIds: [],
      });
      setCredentials({ username: result.username, password: result.temporaryPassword, emailDelivered: result.emailDelivered });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Le compte n’a pas pu être créé."); }
    finally { setBusy(false); }
  }

  if (!open) return <div className="mb-5"><Button type="button" variant="outline" onClick={() => setOpen(true)}><UserPlus /> Créer le compte d’un élève</Button></div>;
  return (
    <section className="mb-7 border-y border-border bg-muted/20 px-4 py-5 sm:px-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Créer et inscrire un élève</h2><p className="mt-1 text-sm text-muted-foreground">Avec ou sans e-mail. L’élève recevra un nom d’utilisateur et un mot de passe temporaire.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Fermer</Button></div>
      {credentials ? <div role="status" className="mt-5"><p className="text-sm">{credentials.emailDelivered ? "Les identifiants ont aussi été envoyés par e-mail." : "Copiez ces identifiants et transmettez-les de façon sécurisée."} Le mot de passe devra être changé à la première connexion.</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-background p-4 font-mono text-sm"><div><p>{credentials.username}</p><p>{credentials.password}</p></div><Button type="button" size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(`${credentials.username}\n${credentials.password}`); setCopied(true); }}>{copied ? <Check /> : <Copy />}{copied ? "Copié" : "Copier"}</Button></div></div> : <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">Nom complet<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
        <label className="text-sm">Nom d’utilisateur <span className="text-muted-foreground">(facultatif)</span><input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" pattern="[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="Généré si vide" /></label>
        <label className="text-sm">E-mail <span className="text-muted-foreground">(facultatif)</span><input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="text-sm">Date de naissance<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" type="date" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label>
        <label className="text-sm">Niveau<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" type="number" min={5} max={12} required value={grade} onChange={(event) => setGrade(Number(event.target.value))} /></label>
        <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">L’inscription dans cette classe active immédiatement l’accès de l’élève.</p>
        {error && <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{error}</p>}
        <div className="sm:col-span-2 lg:col-span-3"><Button disabled={busy}>{busy ? "Création…" : email ? "Créer, inscrire et envoyer" : "Créer et inscrire"}</Button></div>
      </form>}
    </section>
  );
}
