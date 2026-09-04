"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  advanceContentReuseRollout,
  returnContentReuseToShadow,
} from "@/lib/actions/reuse";
import type { ReuseCalibrationReport } from "@/lib/content/reuse/runtime";

const modeLabel = {
  off: "Désactivé",
  shadow: "Observation",
  trial: "Essai limité",
  live: "Actif",
} as const;

const decisionLabel: Record<ReuseCalibrationReport["decision"], string> = {
  disabled: "Le réutilisateur est désactivé.",
  keep_shadow: "Continuer l’observation : preuves insuffisantes.",
  eligible_for_trial: "Les critères permettent un essai limité.",
  keep_trial: "Continuer l’essai limité : preuves insuffisantes.",
  eligible_for_live: "Les résultats de l’essai permettent le passage en production.",
  return_to_shadow: "Les résultats complets ne passent pas les seuils : retour à l’observation conseillé.",
  monitor_live: "Continuer la surveillance : preuves récentes insuffisantes.",
  live_healthy: "Les résultats en production restent dans les seuils attendus.",
  rollback_recommended: "Les résultats en production ont régressé : retour à l’observation conseillé.",
};

const percent = (value: number | null) => value == null ? "—" : `${Math.round(value * 100)} %`;

export function ReuseRolloutManager({ report }: { report: ReuseCalibrationReport }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const canAdvance = report.decision === "eligible_for_trial" || report.decision === "eligible_for_live";
  const canReturn = report.policy.mode === "trial" || report.policy.mode === "live";

  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-7">
    <Card><CardContent className="grid gap-5 pt-6 md:grid-cols-[1fr_auto] md:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Politique v{report.policy.version}</h2>
          <Badge variant={report.policy.mode === "live" ? "success" : "secondary"}>{modeLabel[report.policy.mode]}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{decisionLabel[report.decision]}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Seuil actif {percent(report.policy.minimumScore)} · cohorte d’essai {report.policy.trialCohortPercent} % · {report.eligibleOutcomeCount} résultats de réutilisation observables
        </p>
      </div>
      {canAdvance && <Button disabled={busy} onClick={() => void act(advanceContentReuseRollout)}>
        {report.decision === "eligible_for_trial" ? "Démarrer l’essai limité" : "Promouvoir en production"}
      </Button>}
    </CardContent></Card>

    <section>
      <h2 className="font-semibold">Preuves par seuil</h2>
      <div className="mt-3 overflow-x-auto border-y border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>
            <th className="py-3 pr-4 font-medium">Seuil</th><th className="py-3 pr-4 font-medium">Correspondances</th>
            <th className="py-3 pr-4 font-medium">Choisies</th><th className="py-3 pr-4 font-medium">Terminées</th>
            <th className="py-3 pr-4 font-medium">Complétion</th><th className="py-3 pr-4 font-medium">Réussite</th>
            <th className="py-3 font-medium">Décision</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{report.evidence.map((row) => <tr key={row.threshold}>
            <td className="py-3 pr-4">{percent(row.threshold)}</td><td className="py-3 pr-4">{row.observations}</td>
            <td className="py-3 pr-4">{row.chosen}</td><td className="py-3 pr-4">{row.completed}</td>
            <td className="py-3 pr-4">{percent(row.completionRate)}</td><td className="py-3 pr-4">{percent(row.averageSuccess)}</td>
            <td className="py-3"><Badge variant={row.eligible ? "success" : "secondary"}>{row.eligible ? "Admissible" : "Attendre"}</Badge></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    {canReturn && <Card><CardContent className="pt-6">
      <h2 className="font-semibold">Retour immédiat à l’observation</h2>
      <p className="mt-1 text-sm text-muted-foreground">Le classement historique redevient immédiatement la seule recommandation visible. La raison et les preuves sont conservées.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Raison du retour à l’observation"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Décrivez le signal observé (10 caractères minimum)"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button variant="destructive" disabled={busy || reason.trim().length < 10} onClick={() => void act(() => returnContentReuseToShadow({ reason }))}>
          Revenir à l’observation
        </Button>
      </div>
    </CardContent></Card>}
    {message && <p role="status" className="text-sm text-destructive">{message}</p>}
  </div>;
}
