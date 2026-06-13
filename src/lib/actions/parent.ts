"use server";

import { requireRole } from "@/lib/auth";

/** Parent server actions (PRD §23). Auth+role verified before any work. */

const notImplemented = (name: string) => {
  throw new Error(`${name}: not implemented (Phase 5+)`);
};

export async function linkStudent() {
  await requireRole(["parent"]);
  return notImplemented("linkStudent");
}

export async function viewStudentProgress() {
  await requireRole(["parent"]);
  return notImplemented("viewStudentProgress");
}

export async function downloadReport() {
  await requireRole(["parent"]);
  return notImplemented("downloadReport");
}

export async function requestDataExport() {
  await requireRole(["parent"]);
  return notImplemented("requestDataExport");
}

export async function requestDataDeletion() {
  await requireRole(["parent"]);
  return notImplemented("requestDataDeletion");
}
