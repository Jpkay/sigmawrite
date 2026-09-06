"use client";

import { useState, useTransition } from "react";
import { Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setClassLeagueEnabled } from "@/lib/actions/teacher";
import { TIER_LABELS } from "@/components/league";

type Row = { studentId: string; name: string; visible: boolean; weekXp: number; streak: number; totalXp: number; tier: string; rank: number };

/** Teacher view of the weekly league with the on/off switch (roadmap 6.6). Teachers always see real names. */
export function ClassLeagueControl({ classId, initial }: { classId: string; initial: { enabled: boolean; weekStart: string; rows: Row[] } }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function toggle() {
    setMessage("");
    start(async () => { try { const result = await setClassLeagueEnabled({ classId, enabled: !enabled }); setEnabled(result.enabled); setMessage(result.enabled ? "Ligue activée pour la classe." : "Ligue désactivée : les élèves ne voient plus de classement."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); } });
  }
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold"><Trophy className="size-4 text-primary" />Ligue de la semaine</h2>
          <Button size="sm" variant={enabled ? "outline" : "default"} disabled={pending} onClick={toggle}>{enabled ? "Désactiver la ligue" : "Activer la ligue"}</Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Classement par XP de la semaine puis par série de jours, limité à cette classe. Un élève peut cacher son nom aux autres ; vous voyez toujours les noms réels.</p>
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
        {enabled && initial.rows.length > 0 && (
          <ol className="mt-4 divide-y divide-border/60">
            {initial.rows.map((row) => <li key={row.studentId} className="grid grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-3 py-1.5 text-sm"><span className="font-display font-bold tabular-nums text-muted-foreground">{row.rank}</span><span className="truncate">{row.name}{!row.visible && <span className="ml-2 text-xs text-muted-foreground">(nom caché)</span>}</span><span className="text-xs">{TIER_LABELS[row.tier]?.emoji} {TIER_LABELS[row.tier]?.label}</span><span className="flex items-center gap-1 tabular-nums text-muted-foreground"><Flame className="size-3.5 text-secondary" />{row.streak}</span><span className="tabular-nums font-semibold">{row.weekXp} XP</span></li>)}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
