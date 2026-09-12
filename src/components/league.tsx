"use client";

import { useState } from "react";
import { Crown, EyeOff, Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { setLeagueVisibility, type ClassLeague } from "@/lib/actions/student";
import { cn } from "@/lib/utils";

import {TIER_LABELS,LEAGUE_COPY,leagueDisplay,leagueRowName,leagueXp} from "@/lib/diagnostic/granular/league-display";
export {TIER_LABELS} from "@/lib/diagnostic/granular/league-display";

/** Weekly class league: rank by XP this week, streak as tiebreak, tier from cumulative XP (roadmap 6.6). */
export function LeagueCard({ league }: { league: NonNullable<ClassLeague> }) {
  const [visible, setVisible] = useState(league.myVisible);
  const [busy, setBusy] = useState(false);
  const top = league.rows.slice(0, 10);
  const display=leagueDisplay(league)!;
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
          <h2 className="flex items-center gap-2 font-semibold"><Trophy className="size-4 text-primary" />{display.title}</h2>
          <span className="text-xs text-muted-foreground">{display.week}</span>
        </div>
        {me && tier && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-accent/40 px-3 py-2 text-sm">
            <span className="font-display text-lg font-bold">{display.tier}</span>
            <span className="text-muted-foreground">{display.next}</span>
            <span className="ml-auto tabular-nums">{LEAGUE_COPY.place}<span className="font-semibold">{me.rank}<sup>{me.rank === 1 ? "re" : "e"}</sup></span> / {league.rows.length}</span>
          </div>
        )}
        <ol className="mt-4 divide-y divide-border/60">
          {top.map((row) => (
            <li key={row.studentId} className={cn("grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 py-2 text-sm", row.isMe && "rounded-md bg-primary/10 px-2 font-medium")}>
              <span className={cn("font-display text-base font-bold tabular-nums", row.rank <= 3 ? "text-primary" : "text-muted-foreground")}>{row.rank === 1 ? <Crown className="size-4" aria-label={LEAGUE_COPY.first} /> : row.rank}</span>
              <span className="truncate">{leagueRowName(row)}<span className="ml-2 text-xs text-muted-foreground">{TIER_LABELS[row.tier]?.emoji}</span></span>
              <span className="flex items-center gap-1 tabular-nums text-muted-foreground" title={LEAGUE_COPY.streak}><Flame className="size-3.5 text-secondary" />{row.streak}</span>
              <span className="tabular-nums font-semibold">{leagueXp(row.weekXp)}</span>
            </li>
          ))}
        </ol>
        {me && me.rank > 10 && <p className="mt-2 text-sm text-muted-foreground">{display.outsideTop}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{LEAGUE_COPY.help}</span>
          <button type="button" disabled={busy} onClick={() => void toggle()} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"><EyeOff className="size-3.5" />{visible ? LEAGUE_COPY.hide : LEAGUE_COPY.show}</button>
        </div>
      </CardContent>
    </Card>
  );
}
