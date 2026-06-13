"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";

type Assignment = {
  id: string;
  text_slug: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
};

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMPTY: Assignment[] = [];
let snap: Assignment[] | null = null;
let loading = false;
const listeners = new Set<() => void>();

async function load() {
  if (loading) return;
  loading = true;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { data } = await createClient()
      .from("assignments")
      .select("id, text_slug, title, instructions, due_at")
      .order("due_at", { ascending: true, nullsFirst: false });
    snap = (data as Assignment[] | null) ?? [];
  } catch {
    snap = [];
  }
  listeners.forEach((l) => l());
}

function useStudentAssignments(): Assignment[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      if (configured && snap === null) load();
      return () => listeners.delete(cb);
    },
    () => snap ?? EMPTY,
    () => EMPTY
  );
}

/** "À faire" — assignments for the student's enrolled classes (PRD §N). */
export function StudentAssignments() {
  const assignments = useStudentAssignments();
  if (assignments.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <ClipboardList className="size-5 text-primary" /> À faire
      </h2>
      <div className="space-y-2">
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">
                  {SEED_TEXT_BY_ID[a.text_slug]?.title ?? a.text_slug}
                  {a.due_at ? ` · échéance ${a.due_at}` : ""}
                </p>
              </div>
              {SEED_TEXT_BY_ID[a.text_slug] && (
                <Link
                  href={`/student/read/${a.text_slug}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Commencer
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
