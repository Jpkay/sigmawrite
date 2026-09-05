"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setClassGoal, type ClassGoalProgress } from "@/lib/actions/teacher";

const PRESETS = [500, 1000, 2000];

/** Teacher sets this week's cooperative XP target; only the class total is ever shown to students (roadmap 6.5). */
export function ClassGoalControl({ classId, initial, memberCount }: { classId: string; initial: ClassGoalProgress; memberCount: number }) {
  const [goal, setGoal] = useState(initial);
  const [custom, setCustom] = useState(initial?.targetXp ?? Math.max(50, memberCount * 60));
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function apply(target: number) {
    setMessage("");
    start(async () => {
      try { const result = await setClassGoal({ classId, targetXp: target }); setGoal((current) => ({ weekStart: result.weekStart, targetXp: result.targetXp, earnedXp: current?.earnedXp ?? 0, members: current?.members ?? memberCount, activeMembers: current?.activeMembers ?? 0 })); setMessage(`Objectif de la semaine : ${result.targetXp} XP.`); }
      catch (caught) { setMessage(caught instanceof Error ? caught.message : "Enregistrement impossible."); }
    });
  }
  const ratio = goal ? Math.min(1, goal.earnedXp / Math.max(1, goal.targetXp)) : 0;
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" />Objectif de classe de la semaine</h2>
        <p className="mt-1 text-sm text-muted-foreground">Un total d’XP à atteindre ensemble. Les élèves voient la progression de la classe, jamais un classement. Repère : environ 60 XP par élève et par semaine pour une pratique régulière.</p>
        {goal && <div className="mt-4"><div className="flex items-baseline justify-between text-sm"><span className="font-display text-xl font-bold tabular-nums">{goal.earnedXp} / {goal.targetXp} XP</span><span className="text-muted-foreground">{goal.activeMembers} / {goal.members} élève(s) actif(s)</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={goal.targetXp} aria-valuenow={goal.earnedXp}><div className="h-full rounded-full bg-success" style={{ width: `${Math.round(ratio * 100)}%` }} /></div></div>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => <Button key={preset} size="sm" variant={goal?.targetXp === preset ? "default" : "outline"} disabled={pending} onClick={() => apply(preset)}>{preset} XP</Button>)}
          <label className="ml-2 flex items-center gap-2 text-sm">Autre<input type="number" min={50} max={20000} step={50} value={custom} onChange={(event) => setCustom(Number(event.target.value))} className="h-9 w-24 rounded-md border border-input bg-background px-2" /></label>
          <Button size="sm" variant="outline" disabled={pending || custom < 50} onClick={() => apply(custom)}>Définir</Button>
        </div>
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}
