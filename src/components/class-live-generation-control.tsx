"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { setClassLiveGeneration } from "@/lib/actions/editorial-admin";

/** F.4: a teacher turns live story generation off for the class; students then read pre-checked library texts. */
export function ClassLiveGenerationControl({ classId, initialEnabled }: { classId: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function toggle() {
    setMessage("");
    start(async () => {
      try {
        const result = await setClassLiveGeneration({ classId, enabled: !enabled });
        setEnabled(result.enabled);
        setMessage(result.enabled ? "Histoires écrites en direct activées." : "Histoires en direct désactivées : la classe lit des textes de la bibliothèque, déjà vérifiés.");
      } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action impossible."); }
    });
  }
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Histoires écrites en direct</h2>
          <Button size="sm" variant={enabled ? "outline" : "default"} disabled={pending} onClick={toggle} aria-pressed={enabled}>{enabled ? "Désactiver pour la classe" : "Activer pour la classe"}</Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Les chapitres du mode histoire sont écrits automatiquement et vérifiés avant chaque lecture. Désactivé, chaque élève reçoit des chapitres préparés à l’avance par le même processus.</p>
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}
