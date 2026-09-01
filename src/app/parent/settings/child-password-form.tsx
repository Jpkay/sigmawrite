"use client";

import { useState } from "react";
import { resetChildPassword } from "@/lib/actions/parent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ChildPasswordForm({
  students,
  language = "fr",
}: {
  students: Array<{ id: string; name: string }>;
  language?: "fr" | "en";
}) {
  const en = language === "en";
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [credentials, setCredentials] = useState<{ username: string; password: string; emailDelivered: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setCredentials(null);
    setBusy(true);
    try {
      const result = await resetChildPassword({ studentId });
      setCredentials(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : en ? "Unable to update." : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="font-semibold">{en ? "Issue a temporary password" : "Émettre un mot de passe temporaire"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {en ? "The student must replace it at the next login." : "L’élève devra le remplacer à sa prochaine connexion."}
        </p>
        {students.length ? (
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <label className="text-sm">
              {en ? "Child" : "Enfant"}
              <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-input px-3">
                {students.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
              </select>
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {credentials && (
              <div role="status" className="rounded-md bg-muted p-4">
                <p className="text-sm font-medium">{credentials.emailDelivered ? (en ? "Sent by email" : "Envoyé par e-mail") : (en ? "Share these credentials securely" : "Transmettez ces identifiants de façon sécurisée")}</p>
                <p className="mt-2 font-mono text-sm">{credentials.username}</p>
                <p className="font-mono text-sm">{credentials.password}</p>
              </div>
            )}
            <Button disabled={busy}>{busy ? (en ? "Creating…" : "Création…") : (en ? "Create temporary password" : "Créer un mot de passe temporaire")}</Button>
          </form>
        ) : <p className="mt-4 text-sm text-muted-foreground">{en ? "No linked child." : "Aucun enfant lié."}</p>}
      </CardContent>
    </Card>
  );
}
