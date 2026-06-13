"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAssignment } from "@/lib/actions/teacher";

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2";

export function AssignmentForm({
  classes,
  texts,
}: {
  classes: { id: string; name: string }[];
  texts: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [textSlug, setTextSlug] = useState(texts[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Aucune classe : créez une classe pour assigner des lectures.
        </CardContent>
      </Card>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await createAssignment({
        classId,
        textSlug,
        title: title || texts.find((t) => t.slug === textSlug)?.title || "Lecture",
        instructions,
        dueAt,
      });
      setTitle("");
      setInstructions("");
      setDueAt("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Classe</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Texte</span>
            <select value={textSlug} onChange={(e) => setTextSlug(e.target.value)} className={inputCls}>
              {texts.map((t) => (
                <option key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Titre (optionnel)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Lecture de la semaine" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Échéance (optionnel)</span>
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Consignes (optionnel)</span>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} placeholder="Lis le texte et réponds aux questions." />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              <Plus /> {busy ? "Création…" : "Assigner la lecture"}
            </Button>
            {err && <span className="ml-3 text-sm text-destructive">{err}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
