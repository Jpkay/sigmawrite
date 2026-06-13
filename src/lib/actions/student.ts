"use server";

import { requireRole } from "@/lib/auth";

/**
 * Student server actions (PRD §23). Each verifies auth+role server-side
 * before doing anything — Server Actions are reachable as direct requests
 * (PRD §12). Bodies are filled in starting Phase 1.
 */

const notImplemented = (name: string) => {
  throw new Error(`${name}: not implemented (Phase 1+)`);
};

export async function startDiagnostic() {
  await requireRole(["student"]);
  return notImplemented("startDiagnostic");
}

export async function submitDiagnosticAnswer() {
  await requireRole(["student"]);
  return notImplemented("submitDiagnosticAnswer");
}

export async function completeDiagnostic() {
  await requireRole(["student"]);
  return notImplemented("completeDiagnostic");
}

export async function selectInterests() {
  await requireRole(["student"]);
  return notImplemented("selectInterests");
}

export async function startReadingSession() {
  await requireRole(["student"]);
  return notImplemented("startReadingSession");
}

export async function submitAnswer() {
  await requireRole(["student"]);
  return notImplemented("submitAnswer");
}

export async function submitSummary() {
  await requireRole(["student"]);
  return notImplemented("submitSummary");
}

export async function completeReadingSession() {
  await requireRole(["student"]);
  return notImplemented("completeReadingSession");
}

export async function submitRetrievalAttempt() {
  await requireRole(["student"]);
  return notImplemented("submitRetrievalAttempt");
}
