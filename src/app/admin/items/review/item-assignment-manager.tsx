"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import { assignDiagnosticItemReviews } from "@/lib/actions/items";
import type { DiagnosticItemAssignmentOverview } from "@/lib/db/items";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ItemAssignmentManager({ overview }: { overview: DiagnosticItemAssignmentOverview }) {
  const router = useRouter();
  const [selected, setSelected] = useState(overview.reviewers.map((reviewer) => reviewer.id));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function assign() {
    setBusy(true);
    setMessage("");
    try {
      const result = await assignDiagnosticItemReviews({ reviewerIds: selected });
      setMessage(result.assigned > 0
        ? `${result.assigned} exercice${result.assigned === 1 ? "" : "s"} attribué${result.assigned === 1 ? "" : "s"}.`
        : "Tous les exercices en attente sont déjà attribués.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "L’attribution n’a pas abouti.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mb-7 border-y border-border py-5" aria-labelledby="diagnostic-assignment-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2"><UsersRound className="size-5 text-primary" /><h2 id="diagnostic-assignment-title" className="text-lg font-semibold">Attribuer la revue aux éducateurs</h2></div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{overview.unassigned} exercice{overview.unassigned === 1 ? "" : "s"} sans responsable. L’attribution répartit chaque catégorie équitablement et conserve une file alternée pour chaque évaluateur.</p>
      </div>
      <Button disabled={busy || overview.unassigned === 0 || selected.length === 0} onClick={() => void assign()}>{busy ? "Attribution…" : "Attribuer les exercices restants"}</Button>
    </div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {overview.reviewers.map((reviewer) => <label key={reviewer.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3">
        <span className="flex min-w-0 items-center gap-3"><input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected.includes(reviewer.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, reviewer.id] : current.filter((id) => id !== reviewer.id))} /><span className="truncate text-sm font-medium">{reviewer.name}</span></span>
        <span className="flex shrink-0 gap-1"><Badge variant="outline">{reviewer.assigned} à faire</Badge><Badge variant="secondary">{reviewer.submitted} faits</Badge></span>
      </label>)}
    </div>
    {overview.reviewers.length === 0 && <p className="mt-4 text-sm text-destructive">Activez au moins un évaluateur avant d’attribuer les exercices.</p>}
    {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
  </section>;
}
