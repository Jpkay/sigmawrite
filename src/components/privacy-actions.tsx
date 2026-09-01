"use client";

import { useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  giveConsent,
  revokeConsent,
  requestDataExport,
  requestDataDeletion,
} from "@/lib/actions/parent";

/** Per-child privacy controls (PRD §10): consent, data export, deletion request. */
export function PrivacyActions({ studentId, name, language="fr" }: { studentId: string; name: string; language?:"fr"|"en" }) {
  const en=language==="en";
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : en ? "Error." : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await giveConsent({ studentId });
              setMsg(en?"Family authorization recorded.":"Autorisation familiale enregistrée.");
            })
          }
        >
          <ShieldCheck /> {en?"Authorize family access":"Autoriser l’accès familial"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run(async () => {
            await revokeConsent({ studentId });
            setMsg(en?"Family authorization revoked. Active school enrollment, if any, remains authoritative.":"Autorisation familiale retirée. Une inscription scolaire active, le cas échéant, reste valable.");
          })}
        >
          {en?"Revoke family authorization":"Retirer l’autorisation familiale"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const data = await requestDataExport(studentId);
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `donnees-${name.replace(/\s+/g, "-").toLowerCase()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setMsg(en?"Export downloaded.":"Export téléchargé.");
            })
          }
        >
          <Download /> {en?"Export data":"Exporter les données"}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await requestDataDeletion(studentId);
              setMsg(en?"Deletion request recorded. The controller will process it.":"Demande de suppression enregistrée. L'établissement la traitera.");
            })
          }
        >
          <Trash2 /> {en?"Request deletion":"Demander la suppression"}
        </Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
