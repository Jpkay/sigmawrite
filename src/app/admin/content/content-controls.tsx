"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentLibraryItem } from "@/lib/db/content";
import { lockBenchmarkTextVersion, retireTextVersion } from "@/lib/actions/admin";

export function ContentControls({ item }: { item: ContentLibraryItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(kind: "lock" | "retire") {
    setBusy(true); setError("");
    try {
      if (kind === "lock") await lockBenchmarkTextVersion({ id: item.id });
      else await retireTextVersion({ id: item.id });
      router.refresh();
    } catch { setError("Échec"); }
    finally { setBusy(false); }
  }
  return <div className="flex items-center gap-2">
    {item.reviewStatus !== "benchmark_locked" && <button disabled={busy} onClick={() => run("lock")} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Verrouiller comme référence</button>}
    <button disabled={busy} onClick={() => run("retire")} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Retirer</button>
    {error && <span className="text-xs text-destructive">{error}</span>}
  </div>;
}
