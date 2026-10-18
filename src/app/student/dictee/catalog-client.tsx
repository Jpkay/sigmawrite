"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, PenLine, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { loadDictationCatalog, type DictationCatalogEntry } from "@/lib/actions/student";
import {
  DICTATION_COPY,
  DICTATION_KIND_LABELS,
  dictationCatalogError,
  dictationCatalogMeta,
  dictationGradeRange,
  suggestedDictations,
} from "@/lib/diagnostic/granular/dictation-display";
import { hasStudentBackend } from "@/lib/student-store";

export function DictationCatalog() {
  const [rows, setRows] = useState<DictationCatalogEntry[] | null>(hasStudentBackend ? null : []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStudentBackend) return;
    let active = true;
    loadDictationCatalog({}).then((value) => { if (active) setRows(value); }).catch(() => { if (active) setError(dictationCatalogError()); });
    return () => { active = false; };
  }, []);
  return <DictationCatalogView rows={rows} error={error} />;
}

export function DictationCatalogView({ rows, error }: { rows: DictationCatalogEntry[] | null; error: string }) {
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (rows === null) return <p className="text-sm text-muted-foreground">{DICTATION_COPY.catalogLoading}</p>;
  if (rows.length === 0) return <Card><CardContent className="pt-6 text-sm text-muted-foreground">{DICTATION_COPY.catalogEmpty}</CardContent></Card>;
  const suggested = suggestedDictations(rows);
  const offerChoice = suggested.length >= 2;
  const rest = offerChoice ? rows.filter((row) => row.suggested == null) : rows;
  return (
    <div className="space-y-8">
      {offerChoice && (
        <section aria-labelledby="dictation-suggestions">
          <h2 id="dictation-suggestions" className="font-display text-xl font-semibold">{DICTATION_COPY.suggestionsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{DICTATION_COPY.suggestionsHelp}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {suggested.map((row) => <DictationCard key={row.id} row={row} highlighted />)}
          </div>
        </section>
      )}
      {rest.length > 0 && (
        <section aria-labelledby={offerChoice ? "dictation-all" : undefined}>
          {offerChoice && <h2 id="dictation-all" className="mb-4 font-display text-lg font-semibold">{DICTATION_COPY.allTitle}</h2>}
          <div className="grid gap-4 lg:grid-cols-2">
            {rest.map((row) => <DictationCard key={row.id} row={row} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function DictationCard({ row, highlighted = false }: { row: DictationCatalogEntry; highlighted?: boolean }) {
  return (
    <Card className={highlighted ? "border-primary/50 bg-card-elevated" : row.kind === "brevet" ? "border-primary/40" : undefined}>
      <CardContent className="flex h-full flex-col pt-6">
        <div className="flex flex-wrap items-center gap-2"><Badge>{DICTATION_KIND_LABELS[row.kind]}</Badge><Badge variant="outline">{dictationGradeRange(row.gradeMin, row.gradeMax)}</Badge><span className="text-xs text-muted-foreground">{dictationCatalogMeta(row)}</span></div>
        <h3 className="mt-3 text-xl font-semibold">{row.title}</h3>
        {row.chips && row.chips.length > 0 && <ul aria-label="Thèmes" className="mt-2 flex flex-wrap gap-1.5">{row.chips.map((chip) => <li key={chip} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{chip}</li>)}</ul>}
        {row.focus && <p className="mt-2 text-sm text-muted-foreground">{row.focus}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">{row.lastScore != null ? <><Trophy className="size-4 text-success" />{DICTATION_COPY.lastScore} <span className="font-semibold text-foreground tabular-nums">{row.lastScore}/10</span></> : <><Headphones className="size-4" />{DICTATION_COPY.notAttempted}</>}</p>
          <Link href={`/student/dictee/${row.id}`} className={buttonVariants()}><PenLine className="size-4" />{row.attempts > 0 ? DICTATION_COPY.retry : DICTATION_COPY.start}</Link>
        </div>
      </CardContent>
    </Card>
  );
}
