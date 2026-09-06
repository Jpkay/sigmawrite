"use client";

import { useState } from "react";
import { Crown, EyeOff, Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { setLeagueVisibility, type ClassLeague } from "@/lib/actions/student";
import { cn } from "@/lib/utils";

export const TIER_LABELS: Record<string, { label: string; emoji: string; next: number | null }> = {
  bronze: { label: "Bronze", emoji: "🥉", next: 250 },
  argent: { label: "Argent", emoji: "🥈", next: 750 },
  or: { label: "Or", emoji: "🥇", next: 2000 },
  platine: { label: "Platine", emoji: "💠", next: 5000 },
  diamant: { label: "Diamant", emoji: "💎", next: null },
};

/** Weekly class league: rank by XP this week, streak as tiebreak, tier from cumulative XP (roadmap 6.6). */
export function LeagueCard({ league }: { league: NonNullable<ClassLeague> }) {
  const [visible, setVisible] = useState(league.myVisible);
  const [busy, setBusy] = useState(false);
  const top = league.rows.slice(0, 10);
  const me = league.me;
  const tier = me ? TIER_LABELS[me.tier] ?? TIER_LABELS.bronze : null;
  async function toggle() {
    setBusy(true);
    try { const result = await setLeagueVisibility({ visible: !visible }); setVisible(result.visible); } catch { /* keep state */ } finally { setBusy(false); }
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold"><Trophy className="size-4 text-primary" />Ligue de la classe · {league.className}</h2>
          <span className="text-xs text-muted-foreground">Semaine du {new Date(`${league.weekStart}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })}</span>
        </div>
        {me && tier && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-accent/40 px-3 py-2 text-sm">
            <span className="font-display text-lg font-bold">{tier.emoji} Ligue {tier.label}</span>
            <span className="text-muted-foreground">{tier.next ? `${Math.max(0, tier.next - me.totalXp)} XP avant la ligue suivante` : "Ligue la plus haute"}</span>
            <span className="ml-auto tabular-nums">Ta place cette semaine : <span className="font-semibold">{me.rank}<sup>{me.rank === 1 ? "re" : "e"}</sup></span> / {league.rows.length}</span>
          </div>
        )}
        <ol className="mt-4 divide-y divide-border/60">
          {top.map((row) => (
            <li key={row.studentId} className={cn("grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 py-2 text-sm", row.isMe && "rounded-md bg-primary/10 px-2 font-medium")}>
              <span className={cn("font-display text-base font-bold tabular-nums", row.rank <= 3 ? "text-primary" : "text-muted-foreground")}>{row.rank === 1 ? <Crown className="size-4" aria-label="1re place" /> : row.rank}</span>
              <span className="truncate">{row.name}{row.isMe ? " (toi)" : ""}<span className="ml-2 text-xs text-muted-foreground">{TIER_LABELS[row.tier]?.emoji}</span></span>
              <span className="flex items-center gap-1 tabular-nums text-muted-foreground" title="Série de jours"><Flame className="size-3.5 text-secondary" />{row.streak}</span>
              <span className="tabular-nums font-semibold">{row.weekXp} XP</span>
            </li>
          ))}
        </ol>
        {me && me.rank > 10 && <p className="mt-2 text-sm text-muted-foreground">… et toi en {me.rank}<sup>e</sup> place avec {me.weekXp} XP. Une lecture ou une dictée et tu remontes.</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Classement par XP de la semaine, puis par série. Le lundi, tout le monde repart à zéro ; la ligue, elle, se garde.</span>
          <button type="button" disabled={busy} onClick={() => void toggle()} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"><EyeOff className="size-3.5" />{visible ? "Cacher mon nom" : "Afficher mon nom"}</button>
        </div>
      </CardContent>
    </Card>
  );
}
