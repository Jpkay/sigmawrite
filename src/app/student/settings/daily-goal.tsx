"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadStudentMotivation, setDailyXpGoal } from "@/lib/actions/student";
import { DAILY_XP_GOALS, type DailyXpGoal } from "@/lib/motivation";
import { hasStudentBackend } from "@/lib/student-store";

const GOAL_LABELS: Record<DailyXpGoal, string> = { 10: "Tranquille · ~10 min", 15: "Régulier · ~15 min", 20: "Ambitieux · ~20 min" };

/** Settable daily XP goal (roadmap 6.2). Persisted server-side, so it follows the student across devices. */
export function DailyGoalSettings() {
  const [goal, setGoal] = useState<DailyXpGoal>(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hasStudentBackend) return;
    let active = true;
    loadStudentMotivation({}).then((value) => { if (active && (DAILY_XP_GOALS as readonly number[]).includes(value.goalXp)) setGoal(value.goalXp as DailyXpGoal); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  async function choose(next: DailyXpGoal) {
    setError(""); setMessage(""); setBusy(true);
    try { await setDailyXpGoal({ goal: next }); setGoal(next); setMessage(`Objectif quotidien : ${next} XP.`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Modification impossible."); }
    finally { setBusy(false); }
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="flex items-center gap-2 font-semibold"><Target className="size-4 text-success" />Objectif quotidien</h2>
        <p className="mt-1 text-sm text-muted-foreground">Un XP vaut à peu près une minute de travail concentré. Une lecture, une leçon ou une dictée suffit pour l’atteindre.</p>
        <fieldset className="mt-4" disabled={busy}>
          <legend className="sr-only">Objectif quotidien en XP</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {DAILY_XP_GOALS.map((value) => (
              <Button key={value} type="button" variant={goal === value ? "default" : "outline"} aria-pressed={goal === value} onClick={() => choose(value)} className="h-auto flex-col items-start gap-0.5 py-2.5">
                <span className="font-display text-lg font-bold">{value} XP</span>
                <span className="text-xs font-normal opacity-80">{GOAL_LABELS[value]}</span>
              </Button>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="mt-3 text-sm text-[color:var(--success)]">{message}</p>}
      </CardContent>
    </Card>
  );
}
