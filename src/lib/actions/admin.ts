"use server";

import { requireRole } from "@/lib/auth";

/** Admin / content-review server actions (PRD §23). Staff roles only. */

const notImplemented = (name: string) => {
  throw new Error(`${name}: not implemented (Phase 2+)`);
};

export async function createSkill() {
  await requireRole(["platform_admin"]);
  return notImplemented("createSkill");
}

export async function createKnowledgeConcept() {
  await requireRole(["platform_admin"]);
  return notImplemented("createKnowledgeConcept");
}

export async function generateTextCandidate() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("generateTextCandidate");
}

export async function reviewTextCandidate() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("reviewTextCandidate");
}

export async function approveTextVersion() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("approveTextVersion");
}

export async function retireTextVersion() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("retireTextVersion");
}

export async function runDifficultyScoring() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("runDifficultyScoring");
}

export async function runModeration() {
  await requireRole(["platform_admin", "content_reviewer"]);
  return notImplemented("runModeration");
}

export async function activatePromptVersion() {
  await requireRole(["platform_admin"]);
  return notImplemented("activatePromptVersion");
}
