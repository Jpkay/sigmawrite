"use client";

import { useSyncExternalStore } from "react";
import type { ReviewStatus } from "@/lib/types";
import { scoreTextDifficulty } from "@/lib/scoring/text-difficulty";
import { isDifficultyMismatch, type ContentCandidate } from "@/lib/ai/pipeline";

/**
 * Phase 2 admin content store (localStorage), mirroring `ai_generated_candidates`
 * and approved `text_versions`. The generation pipeline runs client-side with
 * the mock provider, so the whole review flow works with no backend. Production
 * routes this through the §23 server actions + Supabase + the real OpenAI
 * provider; the candidate shape matches the DB tables for a mechanical swap.
 */
const KEY = "rtl.content.v1";

const APPROVED: ReviewStatus[] = ["auto_approved", "human_approved", "benchmark_locked"];

function read(): ContentCandidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ContentCandidate[]) : [];
  } catch {
    return [];
  }
}

let snapshot: ContentCandidate[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): ContentCandidate[] {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot === null) snapshot = read();
  return snapshot;
}

const EMPTY: ContentCandidate[] = [];

function write(next: ContentCandidate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  snapshot = next;
  listeners.forEach((l) => l());
}

export function addCandidate(candidate: ContentCandidate) {
  write([candidate, ...getSnapshot()]);
}

export function getCandidate(id: string): ContentCandidate | undefined {
  return getSnapshot().find((c) => c.id === id);
}

export function setReviewStatus(id: string, status: ReviewStatus) {
  write(
    getSnapshot().map((c) => (c.id === id ? { ...c, reviewStatus: status } : c))
  );
}

/** Edit a candidate's body, re-run difficulty scoring, and reset to review. */
export function updateCandidateBody(id: string, body: string) {
  write(
    getSnapshot().map((c) => {
      if (c.id !== id) return c;
      const paragraphs = body.split(/\n\n+/).filter(Boolean);
      const difficulty = scoreTextDifficulty(paragraphs, {
        conceptCount: c.generated.knowledgeConcepts.length,
        newVocabCount: c.generated.targetVocabulary.length,
        inferenceQuestionCount: c.generated.questions.filter(
          (q) => q.questionType === "inference"
        ).length,
      });
      return {
        ...c,
        generated: { ...c.generated, body },
        difficulty,
        flags: {
          ...c.flags,
          difficultyMismatch: isDifficultyMismatch(
            c.input.targetReadingBand,
            difficulty.overall
          ),
        },
        reviewStatus: "needs_human_review" as ReviewStatus,
      };
    })
  );
}

export function isApproved(status: ReviewStatus): boolean {
  return APPROVED.includes(status);
}

export function useCandidates(): ContentCandidate[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => EMPTY
  );
}
