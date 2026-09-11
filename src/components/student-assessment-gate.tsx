"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasStudentBackend, retryStudentHydration, useStudentState } from "@/lib/student-store";

const ALWAYS_AVAILABLE = new Set([
  "/student/onboarding",
  "/student/diagnostic",
  "/student/diagnostic/review",
  "/student/settings",
]);
const PILOT_PREVIEW_AVAILABLE = new Set(["/student/frontier"]);

export function studentAssessmentRedirect(input: {
  pathname: string;
  onboarded: boolean;
  diagnosticComplete: boolean;
  diagnosticProvisional?: boolean;
  granularDiagnosticReady?: boolean;
}) {
  if (ALWAYS_AVAILABLE.has(input.pathname)) return null;
  if (!input.onboarded) return "/student/onboarding";
  if (input.granularDiagnosticReady) return null;
  if (input.diagnosticProvisional) {
    return PILOT_PREVIEW_AVAILABLE.has(input.pathname) ? null : "/student/diagnostic";
  }
  if (!input.diagnosticComplete) return "/student/diagnostic";
  return null;
}

export function StudentAssessmentGate({ children, ownerKey }: { children: React.ReactNode; ownerKey?: string }) {
  const state = useStudentState(ownerKey);
  const pathname = usePathname();
  const router = useRouter();
  const destination = state.hydrated
    ? studentAssessmentRedirect({
      pathname,
      onboarded: state.onboarded,
      // A legacy reading result must not unlock the v2 learning area. The live
      // backend exposes all four graph sections only after v2 finalization.
      diagnosticComplete: hasStudentBackend
        ? Object.keys(state.diagnosticSectionProfile).length === 4
        : Boolean(state.diagnostic),
      diagnosticProvisional: state.diagnosticProvisional,
      granularDiagnosticReady: state.granularDiagnosticReady,
    })
    : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  // This server-rendered route independently checks ownership, access and a
  // completed session. It does not need the legacy student-store hydration.
  if (pathname === "/student/diagnostic/review") return children;

  if (state.hydrationError) {
    return <div role="alert" className="space-y-3">
      <p>Impossible de charger ton parcours pour le moment. Réessaie pour retrouver tes résultats et tes leçons.</p>
      <button type="button" className="rounded-md border border-input px-4 py-2 text-sm font-medium" onClick={() => void retryStudentHydration()}>Réessayer</button>
    </div>;
  }
  if (!state.hydrated || destination) {
    return <p className="text-sm text-muted-foreground">Préparation de ton parcours…</p>;
  }
  return children;
}
