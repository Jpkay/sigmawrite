"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, Brain, MessageSquareText, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadStudentNotifications, markStudentNotificationsRead, type StudentNotification } from "@/lib/actions/student";
import { hasStudentBackend } from "@/lib/student-store";
import { cn } from "@/lib/utils";

const KIND_META: Record<string, { icon: typeof Bell; label: string; href?: string; cta?: string }> = {
  retrieval_due: { icon: Brain, label: "Révision", href: "/student/memory", cta: "Réviser" },
  weekly_recap: { icon: Trophy, label: "Bilan", href: "/student", cta: "Voir" },
  teacher_comment: { icon: MessageSquareText, label: "Enseignant" },
  assignment: { icon: BookOpen, label: "À faire", href: "/student", cta: "Ouvrir" },
};

const when = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

export function StudentInbox() {
  const [rows, setRows] = useState<StudentNotification[] | null>(hasStudentBackend ? null : []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStudentBackend) return;
    let active = true;
    loadStudentNotifications({}).then((value) => { if (active) setRows(value); }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Chargement impossible."); });
    return () => { active = false; };
  }, []);
  const unread = (rows ?? []).filter((row) => !row.readAt).length;
  async function markAll() {
    try { await markStudentNotificationsRead({}); setRows((current) => (current ?? []).map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() }))); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Action impossible."); }
  }
  async function markOne(id: string) {
    setRows((current) => (current ?? []).map((row) => (row.id === id ? { ...row, readAt: row.readAt ?? new Date().toISOString() } : row)));
    try { await markStudentNotificationsRead({ ids: [id] }); } catch { /* optimistic; the list reloads on next visit */ }
  }
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (rows === null) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{unread > 0 ? `${unread} non lu(s)` : "Tout est lu."}</p>{unread > 0 && <Button variant="outline" size="sm" onClick={markAll}>Tout marquer comme lu</Button>}</div>
      {rows.length === 0 && <Card><CardContent className="pt-6 text-sm text-muted-foreground">Aucun message pour l’instant. Tes rappels de révision arriveront ici.</CardContent></Card>}
      <ul className="grid gap-3">
        {rows.map((row) => {
          const meta = KIND_META[row.kind] ?? { icon: Bell, label: "Message" };
          const Icon = meta.icon;
          return (
            <li key={row.id}>
              <Card className={cn(!row.readAt && "border-primary/40 bg-accent/30")}>
                <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", row.readAt ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}><Icon className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">{meta.label} · {when(row.createdAt)}{!row.readAt && <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">nouveau</span>}</p>
                    <p className="mt-1 text-[15px]">{row.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {meta.href && <Link href={meta.href} onClick={() => markOne(row.id)} className={buttonVariants({ size: "sm" })}>{meta.cta ?? "Ouvrir"}</Link>}
                    {!row.readAt && <Button variant="ghost" size="sm" onClick={() => markOne(row.id)}>Lu</Button>}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
