import type { SupabaseClient } from "@supabase/supabase-js";
import { contentSlug } from "@/lib/content/workflow";
import { paragraphsFromText } from "@/lib/content/text-format";
import { scoreTextDifficulty } from "@/lib/scoring/text-difficulty";
import type { DifficultyBand } from "@/lib/types";

/**
 * Roadmap H.16 / E.3: turns an auto_approved `editorial_reading_text`
 * candidate into a real reading passage (texts + text_versions + questions +
 * target vocabulary) through the service-only SQL function
 * `publish_editorial_passage` (migration 20261018180000), which re-checks the
 * evidence and writes everything atomically. Editorial passages are served to
 * every student by the existing reading flow (no cohort limit); the H.15 audit
 * withdraws them with `withdraw_editorial_passage`.
 */

/**
 * Difficulty band stored on the version. The interest coverage check reads the
 * school grade from this label (src/lib/content/interest-coverage.ts), so it
 * follows the brief's grade, not the readability estimate.
 */
export const PASSAGE_BAND_FOR_GRADE: Record<number, DifficultyBand> = {
  4: "Foundation 5A", 5: "Foundation 5B", 6: "Foundation 6A", 7: "Secondary 7A", 8: "Secondary 8A", 9: "Secondary 9A", 10: "Secondary 10A", 11: "Advanced 11-12", 12: "Advanced 11-12",
};

export type EditorialPassagePayload = {
  title: string;
  body: string;
  grade: number;
  questions: Array<{ questionType?: string }>;
  targetLemmas?: Array<{ lemma: string; kind?: string }>;
};

export type PassageMetrics = {
  slug: string; wordCount: number; difficultyBand: DifficultyBand;
  lexical: number; syntax: number; knowledge: number; inference: number; stamina: number; overall: number;
};

/** Deterministic measures sent with the publication (no model involved). */
export function passageMetrics(payload: EditorialPassagePayload): PassageMetrics {
  const difficulty = scoreTextDifficulty(paragraphsFromText(payload.body), {
    conceptCount: 1,
    newVocabCount: (payload.targetLemmas ?? []).filter((l) => l.kind === "new").length,
    inferenceQuestionCount: payload.questions.filter((q) => q.questionType === "inference").length,
  });
  const grade = Math.min(12, Math.max(4, Math.round(Number(payload.grade) || 6)));
  return {
    slug: contentSlug(payload.title).slice(0, 60),
    wordCount: difficulty.features.wordCount,
    difficultyBand: PASSAGE_BAND_FOR_GRADE[grade],
    lexical: difficulty.lexical, syntax: difficulty.syntax, knowledge: difficulty.knowledge,
    inference: difficulty.inference, stamina: difficulty.stamina, overall: difficulty.overall,
  };
}

export type PassagePublication = { candidateId: string; textVersionId: string | null; created: boolean; error?: string };
export type PassageEmbedder = { embed: (text: string) => Promise<number[]>; model: string };

/** Publishes one candidate. Idempotent; throws when the evidence does not hold. */
export async function publishEditorialPassage(db: SupabaseClient, candidateId: string, embedder?: PassageEmbedder | null): Promise<PassagePublication> {
  const { data: candidate, error } = await db.from("ai_generated_candidates").select("payload,candidate_type").eq("id", candidateId).single();
  if (error || !candidate) throw new Error(error?.message ?? "editorial_candidate_not_found");
  if (candidate.candidate_type !== "editorial_reading_text") throw new Error("editorial_candidate_not_found");
  const payload = candidate.payload as EditorialPassagePayload;
  const { data, error: rpcError } = await db.rpc("publish_editorial_passage", { p_candidate_id: candidateId, p_metrics: passageMetrics(payload) });
  if (rpcError) throw new Error(rpcError.message);
  const result = (data ?? {}) as { textVersionId?: string; created?: boolean };
  const textVersionId = result.textVersionId ?? null;
  // Embedding feeds semantic duplicate checks; it is best effort and never blocks publication.
  if (embedder && textVersionId && result.created) {
    try {
      const vector = await embedder.embed(`${payload.title}\n\n${payload.body}`);
      await db.from("text_versions").update({ embedding: `[${vector.join(",")}]`, embedding_model: embedder.model }).eq("id", textVersionId);
    } catch { /* duplicates checks simply skip this version */ }
  }
  return { candidateId, textVersionId, created: Boolean(result.created) };
}

/** Sweeps candidates that were approved but not yet materialised (e.g. a crash between the two steps). */
export async function publishPendingEditorialPassages(db: SupabaseClient, options: { limit?: number; embedder?: PassageEmbedder | null } = {}): Promise<PassagePublication[]> {
  const { data, error } = await db.rpc("pending_editorial_passages", { p_limit: options.limit ?? 10 });
  if (error) throw new Error(error.message);
  const ids = ((data ?? []) as Array<string | { pending_editorial_passages?: string }>).map((row) => (typeof row === "string" ? row : row.pending_editorial_passages ?? "")).filter(Boolean);
  const results: PassagePublication[] = [];
  for (const id of ids) {
    try { results.push(await publishEditorialPassage(db, id, options.embedder)); } catch (cause) {
      results.push({ candidateId: id, textVersionId: null, created: false, error: cause instanceof Error ? cause.message.slice(0, 200) : "error" });
    }
  }
  return results;
}
