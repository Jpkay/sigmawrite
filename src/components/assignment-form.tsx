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
  dictations = [],
  classes,
  texts,
  nodes,
  language = "fr",
}: {
  classes: { id: string; name: string }[];
  texts: { slug: string; title: string }[];
  nodes: { id: string; label: string }[];
  dictations?: { id: string; title: string; kind: string; gradeMin: number; gradeMax: number; wordCount: number }[];
  language?: "fr" | "en";
}) {
  const en=language==="en";
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [textSlug, setTextSlug] = useState(texts[0]?.slug ?? "");
  const [targetType, setTargetType] = useState<"text" | "competency_node" | "dictation">("text");
  const [dictationId, setDictationId] = useState(dictations[0]?.id ?? "");
  const [nodeId, setNodeId] = useState(nodes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {en?"No class: create one before assigning work.":"Aucune classe : créez une classe pour assigner des lectures."}
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
        targetType, textSlug: targetType === "text" ? textSlug : undefined, targetNodeId: targetType === "competency_node" ? nodeId : undefined, targetDictationId: targetType === "dictation" ? dictationId : undefined,
        title: title || (targetType === "text" ? texts.find((t) => t.slug === textSlug)?.title : targetType === "dictation" ? `${en ? "Dictée challenge" : "Défi dictée"} : ${dictations.find((d) => d.id === dictationId)?.title ?? ""}` : nodes.find((node) => node.id === nodeId)?.label) || (en?"Activity":"Activité"),
        instructions,
        dueAt,
      });
      setTitle("");
      setInstructions("");
      setDueAt("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : en?"Error.":"Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{en?"Class":"Classe"}</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type</span>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value as "text" | "competency_node" | "dictation")} className={`${inputCls} appearance-none pr-10`}><option className="bg-zinc-950" value="text">{en?"Reading":"Lecture"}</option><option className="bg-zinc-950" value="competency_node">{en?"Competency micro-session":"Micro-session de compétence"}</option>{dictations.length > 0 && <option className="bg-zinc-950" value="dictation">{en?"Class dictée challenge":"Défi dictée de classe"}</option>}</select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{en?"Text":"Texte"}</span>
            {targetType === "text" ? <select value={textSlug} onChange={(e) => setTextSlug(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
              {texts.map((t) => (
                <option className="bg-zinc-950" key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select> : targetType === "dictation" ? <select value={dictationId} onChange={(e) => setDictationId(e.target.value)} className={`${inputCls} appearance-none pr-10`}>{dictations.map((d) => <option className="bg-zinc-950" key={d.id} value={d.id}>{d.title} · {d.wordCount} mots</option>)}</select> : <select value={nodeId} onChange={(e) => setNodeId(e.target.value)} className={`${inputCls} appearance-none pr-10`}>{nodes.map((node) => <option className="bg-zinc-950" key={node.id} value={node.id}>{node.label}</option>)}</select>}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{en?"Title (optional)":"Titre (optionnel)"}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder={en?"Weekly reading":"Lecture de la semaine"} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{en?"Due date (optional)":"Échéance (optionnel)"}</span>
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">{en?"Instructions (optional)":"Consignes (optionnel)"}</span>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} placeholder={en?"Read the text and answer the questions.":"Lis le texte et réponds aux questions."} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              <Plus /> {busy?(en?"Creating…":"Création…"):(en?"Assign activity":"Assigner l’activité")}
            </Button>
            {err && <span className="ml-3 text-sm text-destructive">{err}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
