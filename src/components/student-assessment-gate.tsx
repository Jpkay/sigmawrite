"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasStudentBackend, useStudentState } from "@/lib/student-store";

const ALWAYS_AVAILABLE = new Set([
  "/student/onboarding",
  "/student/diagnostic",
  "/student/settings",
]);
const PILOT_PREVIEW_AVAILABLE = new Set(["/student/frontier"]);

export function studentAssessmentRedirect(input: {
  pathname: string;
  onboarded: boolean;
  diagnosticComplete: boolean;
  diagnosticProvisional?: boolean;
}) {
  if (ALWAYS_AVAILABLE.has(input.pathname)) return null;
  if (!input.onboarded) return "/student/onboarding";
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
    })
    : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (!state.hydrated || destination) {
    return <p className="text-sm text-muted-foreground">Préparation de ton parcours…</p>;
  }
  return children;
}
