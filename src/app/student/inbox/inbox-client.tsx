"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, Brain, MessageSquareText, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadStudentNotifications, markStudentNotificationsRead, type StudentNotification } from "@/lib/actions/student";
import { hasStudentBackend } from "@/lib/student-store";
import {INBOX_COPY,inboxKind,inboxUnread,inboxDate} from "@/lib/diagnostic/granular/inbox-display";
import { cn } from "@/lib/utils";

const KIND_ICONS:Record<string,typeof Bell>={retrieval_due:Brain,weekly_recap:Trophy,teacher_comment:MessageSquareText,assignment:BookOpen};

export function StudentInbox({copy}:{copy:typeof INBOX_COPY}) {
  const [rows, setRows] = useState<StudentNotification[] | null>(hasStudentBackend ? null : []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStudentBackend) return;
    let active = true;
    loadStudentNotifications({}).then((value) => { if (active) setRows(value); }).catch(() => { if (active) setError(copy.loadError); });
    return () => { active = false; };
  }, [copy.loadError]);
  const unread = (rows ?? []).filter((row) => !row.readAt).length;
  async function markAll() {
    try { await markStudentNotificationsRead({}); setRows((current) => (current ?? []).map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() }))); }
    catch { setError(copy.actionError); }
  }
  async function markOne(id: string) {
    try {
      await markStudentNotificationsRead({ ids: [id] });
      setRows((current) => (current ?? []).map((row) => (row.id === id ? { ...row, readAt: row.readAt ?? new Date().toISOString() } : row)));
    } catch { setError(copy.actionError); }
  }
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (rows === null) return <p className="text-sm text-muted-foreground">{copy.loading}</p>;
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{inboxUnread(unread)}</p>{unread > 0 && <Button variant="outline" size="sm" onClick={markAll}>{copy.markAll}</Button>}</div>
      {rows.length === 0 && <Card><CardContent className="pt-6 text-sm text-muted-foreground">{copy.empty}</CardContent></Card>}
      <ul className="grid gap-3">
        {rows.map((row) => {
          const meta = inboxKind(row.kind);
          const Icon = KIND_ICONS[row.kind]??Bell;
          return (
            <li key={row.id}>
              <Card className={cn(!row.readAt && "border-primary/40 bg-accent/30")}>
                <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", row.readAt ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}><Icon className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">{meta.label} · {inboxDate(row.createdAt)}{!row.readAt && <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{copy.new}</span>}</p>
                    <p className="mt-1 text-[15px]">{row.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {meta.href && <Link href={meta.href} onClick={() => markOne(row.id)} className={buttonVariants({ size: "sm" })}>{meta.cta ?? copy.open}</Link>}
                    {!row.readAt && <Button variant="ghost" size="sm" onClick={() => markOne(row.id)}>{copy.read}</Button>}
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
