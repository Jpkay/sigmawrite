"use server";

import { requireRole } from "@/lib/auth";

/** Teacher server actions (PRD §23). Auth+role verified before any work. */

const notImplemented = (name: string) => {
  throw new Error(`${name}: not implemented (Phase 5)`);
};

export async function createClass() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("createClass");
}

export async function inviteStudents() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("inviteStudents");
}

export async function createAssignment() {
  await requireRole(["teacher"]);
  return notImplemented("createAssignment");
}

export async function viewClassProgress() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("viewClassProgress");
}

export async function createInterventionGroup() {
  await requireRole(["teacher"]);
  return notImplemented("createInterventionGroup");
}

export async function exportClassReport() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("exportClassReport");
}
