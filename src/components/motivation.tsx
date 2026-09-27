"use client";

import { CheckCircle2, Snowflake, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {MOTIVATION_COPY,activityDayLabel,activityDayText,weekGoalText,freezeText,securedNodeText,badgeCountText,newBadgeText,badgeAccessibleText,classGoalTitle,classGoalTarget,classGoalMessage} from "@/lib/diagnostic/granular/motivation-display";
import { cn } from "@/lib/utils";

export type WeekDay = { date: string; xp: number; goalCompleted: boolean; freezeUsed: boolean; isToday: boolean };
export type WeeklyRecap = { since: string; activeDays: number; goalDays: number; xp: number; securedNodes: string[]; reviews: number; readingSessions: number };

/** Seven-day activity strip: goal days filled, frozen days marked, today outlined (roadmap 6.2). */
export function WeekStrip({ week, goalXp, freezeAppliedFor }: { week: WeekDay[]; goalXp: number; freezeAppliedFor: string | null }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">{MOTIVATION_COPY.week}</h2>
          <span className="text-xs text-muted-foreground">{weekGoalText(week)}</span>
        </div>
        <ol className="mt-4 grid grid-cols-7 gap-2" aria-label={MOTIVATION_COPY.activity}>
          {week.map((day) => {
            const ratio = Math.min(1, day.xp / Math.max(1, goalXp));
            return (
              <li key={day.date} className="flex flex-col items-center gap-1.5" aria-label={activityDayText(day)}>
                <div className={cn("relative grid size-10 place-items-center rounded-full border-2 font-display text-sm font-bold", day.goalCompleted ? "border-success bg-success text-white" : day.freezeUsed ? "border-secondary bg-secondary/15 text-secondary" : "border-border bg-muted/40 text-muted-foreground", day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                  {day.goalCompleted ? <CheckCircle2 className="size-5" aria-hidden /> : day.freezeUsed ? <Snowflake className="size-4" aria-hidden /> : <span className="tabular-nums">{day.xp > 0 ? day.xp : ""}</span>}
                  {!day.goalCompleted && !day.freezeUsed && day.xp > 0 && <span className="absolute inset-x-1 bottom-0.5 h-0.5 rounded-full bg-border"><span className="block h-full rounded-full bg-success" style={{ width: `${Math.round(ratio * 100)}%` }} /></span>}
                </div>
                <span className={cn("text-[11px] font-medium", day.isToday ? "text-foreground" : "text-muted-foreground")}>{activityDayLabel(day.date)}</span>
              </li>
            );
          })}
        </ol>
        {freezeAppliedFor && <p role="status" className="mt-4 flex items-center gap-2 rounded-md bg-secondary/10 px-3 py-2 text-sm text-secondary"><Snowflake className="size-4" />{freezeText(freezeAppliedFor)}</p>}
        <p className="mt-3 text-xs text-muted-foreground">{MOTIVATION_COPY.freezeHelp}</p>
      </CardContent>
    </Card>
  );
}

/** Student-facing weekly summary, same figures as the parent email (roadmap 6.4). */
export function WeeklyRecapCard({ recap }: { recap: WeeklyRecap }) {
  const rows = [
    { label: MOTIVATION_COPY.xp, value: recap.xp },
    { label: MOTIVATION_COPY.days, value: recap.activeDays },
    { label: MOTIVATION_COPY.reviews, value: recap.reviews },
    { label: MOTIVATION_COPY.readings, value: recap.readingSessions },
  ];
  return (
    <Card className="border-primary/30 bg-accent/30">
      <CardContent className="pt-6">
        <h2 className="font-semibold">{MOTIVATION_COPY.recap}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map((row) => <div key={row.label} className="flex items-baseline justify-between border-b border-border/60 pb-1"><dt className="text-sm text-muted-foreground">{row.label}</dt><dd className="font-display text-lg font-bold tabular-nums">{row.value}</dd></div>)}
        </dl>
        <p className="mt-3 text-sm">
          {recap.securedNodes.length > 0
            ? <>{MOTIVATION_COPY.secured}<span className="font-medium">{securedNodeText(recap.securedNodes)}</span>.</>
            : MOTIVATION_COPY.noneSecured}
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
        <div className="flex items-baseline justify-between gap-3"><h2 className="font-semibold">{MOTIVATION_COPY.badges}</h2><span className="text-xs text-muted-foreground">{badgeCountText(badges.length)}</span></div>
        {fresh.length > 0 && (
          <div role="status" className="relative mt-3 overflow-hidden rounded-md border border-primary/40 bg-accent/40 px-3 py-2 text-sm">
            <Confetti />
            <p className="relative font-medium">{newBadgeText(badges)}</p>
            <button type="button" onClick={onSeen} className="relative mt-1 text-xs text-primary underline-offset-4 hover:underline">{MOTIVATION_COPY.seen}</button>
          </div>
        )}
        {badges.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{MOTIVATION_COPY.noBadges}</p> : (
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {badges.map((badge) => <li key={badge.key} title={badge.description} className={cn("grid aspect-square place-items-center rounded-lg border text-2xl", badge.isNew ? "border-primary bg-primary/10" : "border-border bg-muted/40")} aria-label={badgeAccessibleText(badge)}>{badge.emoji}</li>)}
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
        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" />{classGoalTitle(goal)}</h2>
        <p className="mt-2 font-display text-2xl font-bold tabular-nums">{goal.earnedXp}<span className="text-base font-semibold text-muted-foreground">{classGoalTarget(goal)}</span></p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={goal.targetXp} aria-valuenow={goal.earnedXp} aria-label={MOTIVATION_COPY.classGoal}><div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{classGoalMessage(goal)}</p>
      </CardContent>
    </Card>
  );
}
