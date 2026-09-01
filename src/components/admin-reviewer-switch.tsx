"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enableAdminReviewerMode } from "@/lib/actions/reviews";

export function AdminReviewerSwitch({ reviewerActive }: { reviewerActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function switchMode() {
    setBusy(true);
    setError("");
    try {
      if (!reviewerActive) await enableAdminReviewerMode();
      router.push("/review");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le mode évaluateur est indisponible.");
      setBusy(false);
    }
  }

  return <div>
    <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => void switchMode()} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <BookOpenCheck />}
      {busy ? "Ouverture…" : "Mode évaluateur"}
    </Button>
    {error && <p role="alert" className="mt-1 px-1 text-xs text-destructive">{error}</p>}
  </div>;
}
