"use client";

import { CheckCircle2, Snowflake, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WeekDay = { date: string; xp: number; goalCompleted: boolean; freezeUsed: boolean; isToday: boolean };
export type WeeklyRecap = { since: string; activeDays: number; goalDays: number; xp: number; securedNodes: string[]; reviews: number; readingSessions: number };

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const dayLabel = (date: string) => DAY_LABELS[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
const longDate = (date: string) => new Date(`${date}T00:00:00.000Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Seven-day activity strip: goal days filled, frozen days marked, today outlined (roadmap 6.2). */
export function WeekStrip({ week, goalXp, freezeAppliedFor }: { week: WeekDay[]; goalXp: number; freezeAppliedFor: string | null }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Cette semaine</h2>
          <span className="text-xs text-muted-foreground">{week.filter((day) => day.goalCompleted).length} objectif(s) atteint(s)</span>
        </div>
        <ol className="mt-4 grid grid-cols-7 gap-2" aria-label="Activité des sept derniers jours">
          {week.map((day) => {
            const ratio = Math.min(1, day.xp / Math.max(1, goalXp));
            return (
              <li key={day.date} className="flex flex-col items-center gap-1.5" aria-label={`${longDate(day.date)} : ${day.xp} XP${day.goalCompleted ? ", objectif atteint" : day.freezeUsed ? ", série protégée" : ""}`}>
                <div className={cn("relative grid size-10 place-items-center rounded-full border-2 font-display text-sm font-bold", day.goalCompleted ? "border-success bg-success text-white" : day.freezeUsed ? "border-secondary bg-secondary/15 text-secondary" : "border-border bg-muted/40 text-muted-foreground", day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                  {day.goalCompleted ? <CheckCircle2 className="size-5" aria-hidden /> : day.freezeUsed ? <Snowflake className="size-4" aria-hidden /> : <span className="tabular-nums">{day.xp > 0 ? day.xp : ""}</span>}
                  {!day.goalCompleted && !day.freezeUsed && day.xp > 0 && <span className="absolute inset-x-1 bottom-0.5 h-0.5 rounded-full bg-border"><span className="block h-full rounded-full bg-success" style={{ width: `${Math.round(ratio * 100)}%` }} /></span>}
                </div>
                <span className={cn("text-[11px] font-medium", day.isToday ? "text-foreground" : "text-muted-foreground")}>{dayLabel(day.date)}</span>
              </li>
            );
          })}
        </ol>
        {freezeAppliedFor && <p role="status" className="mt-4 flex items-center gap-2 rounded-md bg-secondary/10 px-3 py-2 text-sm text-secondary"><Snowflake className="size-4" />Ta série a été protégée {longDate(freezeAppliedFor)} grâce à un gel gagné.</p>}
        <p className="mt-3 text-xs text-muted-foreground">Chaque semaine complète te donne un gel de série (deux au maximum). Il se pose tout seul le jour où tu ne peux pas venir.</p>
      </CardContent>
    </Card>
  );
}

/** Student-facing weekly summary, same figures as the parent email (roadmap 6.4). */
export function WeeklyRecapCard({ recap }: { recap: WeeklyRecap }) {
  const rows = [
    { label: "XP gagnés", value: recap.xp },
    { label: "Jours actifs", value: recap.activeDays },
    { label: "Révisions", value: recap.reviews },
    { label: "Lectures", value: recap.readingSessions },
  ];
  return (
    <Card className="border-primary/30 bg-accent/30">
      <CardContent className="pt-6">
        <h2 className="font-semibold">Bilan des 7 derniers jours</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map((row) => <div key={row.label} className="flex items-baseline justify-between border-b border-border/60 pb-1"><dt className="text-sm text-muted-foreground">{row.label}</dt><dd className="font-display text-lg font-bold tabular-nums">{row.value}</dd></div>)}
        </dl>
        <p className="mt-3 text-sm">
          {recap.securedNodes.length > 0
            ? <>Compétences sécurisées : <span className="font-medium">{recap.securedNodes.slice(0, 3).join(", ")}{recap.securedNodes.length > 3 ? ` et ${recap.securedNodes.length - 3} autre(s)` : ""}</span>.</>
            : "Aucune compétence sécurisée cette semaine. Une session par jour suffit pour en débloquer."}
        </p>
      </CardContent>
    </Card>
  );
}

/** Badge shelf: newly earned badges get a short, reduced-motion-aware celebration once (roadmap 6.8). */
export function BadgeShelf({ badges, onSeen }: { badges: { key: string; label: string; description: string; emoji: string; awardedAt: string; isNew: boolean }[]; onSeen: () => void }) {
  const fresh = badges.filter((badge) => badge.isNew);
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between gap-3"><h2 className="font-semibold">Badges</h2><span className="text-xs text-muted-foreground">{badges.length} / 12</span></div>
        {fresh.length > 0 && (
          <div role="status" className="relative mt-3 overflow-hidden rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-sm">
            <Confetti />
            <p className="relative font-medium">Nouveau badge : {fresh.map((badge) => `${badge.emoji} ${badge.label}`).join(" · ")}</p>
            <button type="button" onClick={onSeen} className="relative mt-1 text-xs text-primary underline-offset-4 hover:underline">Merci, c’est vu</button>
          </div>
        )}
        {badges.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Ton premier badge arrive avec ta première compétence sécurisée.</p> : (
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {badges.map((badge) => <li key={badge.key} title={badge.description} className={cn("grid aspect-square place-items-center rounded-lg border text-2xl", badge.isNew ? "border-primary bg-primary/10" : "border-border bg-muted/40")} aria-label={`${badge.label} : ${badge.description}`}>{badge.emoji}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Pure-CSS confetti burst; disabled under prefers-reduced-motion. */
export function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, index) => index);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
      <style>{`@keyframes plume-confetti{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(90px) rotate(540deg);opacity:0}}`}</style>
      {pieces.map((index) => <span key={index} className="absolute top-0 block h-2 w-1.5 rounded-sm" style={{ left: `${(index * 53) % 100}%`, background: ["var(--primary)", "var(--secondary)", "var(--success)"][index % 3], animation: `plume-confetti ${1.4 + (index % 5) * 0.2}s ease-out ${(index % 6) * 0.08}s 1 both` }} />)}
    </div>
  );
}

/** Class cooperative goal: the class total only, never a ranking (roadmap 6.5). */
export function ClassGoalCard({ goal }: { goal: { className: string; targetXp: number; earnedXp: number; activeMembers: number; members: number } }) {
  const ratio = Math.min(1, goal.earnedXp / Math.max(1, goal.targetXp));
  const reached = goal.earnedXp >= goal.targetXp;
  return (
    <Card className={reached ? "border-success/50 bg-success/5" : undefined}>
      <CardContent className="pt-6">
        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" />Objectif de classe · {goal.className}</h2>
        <p className="mt-2 font-display text-2xl font-bold tabular-nums">{goal.earnedXp}<span className="text-base font-semibold text-muted-foreground"> / {goal.targetXp} XP cette semaine</span></p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={goal.targetXp} aria-valuenow={goal.earnedXp} aria-label="Objectif de classe"><div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{reached ? "Objectif atteint ensemble. Bravo à toute la classe." : `${goal.activeMembers} élève(s) sur ${goal.members} ont déjà contribué. Chaque XP compte, le tien aussi.`}</p>
      </CardContent>
    </Card>
  );
}
