"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, PenLine, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { loadDictationCatalog, type DictationCatalogEntry } from "@/lib/actions/student";
import { hasStudentBackend } from "@/lib/student-store";

const KIND_LABELS: Record<DictationCatalogEntry["kind"], string> = { flash: "Dictée flash", trous: "Dictée à trous", choix: "Dictée à choix", negociee: "Dictée négociée", brevet: "Dictée type brevet" };
const GRADE_LABELS: Record<number, string> = { 4: "CM1", 5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e" };
const gradeRange = (min: number, max: number) => (min === max ? GRADE_LABELS[min] : `${GRADE_LABELS[min]} – ${GRADE_LABELS[max]}`);

export function DictationCatalog() {
  const [rows, setRows] = useState<DictationCatalogEntry[] | null>(hasStudentBackend ? null : []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStudentBackend) return;
    let active = true;
    loadDictationCatalog({}).then((value) => { if (active) setRows(value); }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Chargement impossible."); });
    return () => { active = false; };
  }, []);
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (rows === null) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (rows.length === 0) return <Card><CardContent className="pt-6 text-sm text-muted-foreground">Aucune dictée publiée pour l’instant. Elles arrivent dès qu’un enseignant les a relues.</CardContent></Card>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.id} className={row.kind === "brevet" ? "border-primary/40" : undefined}>
          <CardContent className="flex h-full flex-col pt-6">
            <div className="flex flex-wrap items-center gap-2"><Badge>{KIND_LABELS[row.kind]}</Badge><Badge variant="outline">{gradeRange(row.gradeMin, row.gradeMax)}</Badge><span className="text-xs text-muted-foreground">{row.wordCount} mots · ~{row.estimatedMinutes} min</span></div>
            <h2 className="mt-3 text-xl font-semibold">{row.title}</h2>
            {row.focus && <p className="mt-1 text-sm text-muted-foreground">{row.focus}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">{row.lastScore != null ? <><Trophy className="size-4 text-success" />Dernier score : <span className="font-semibold text-foreground tabular-nums">{row.lastScore}/10</span></> : <><Headphones className="size-4" />Pas encore faite</>}</p>
              <Link href={`/student/dictee/${row.id}`} className={buttonVariants()}><PenLine className="size-4" />{row.attempts > 0 ? "Refaire" : "Commencer"}</Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
