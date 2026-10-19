import "server-only";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { completeText } from "@/lib/content/editorial/llm";
import { editorialGateDeps, editorialLLM } from "@/lib/content/editorial/runtime";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import { LIVE_SENTENCE_VERSION } from "./live-sentence";
import { applyLiveSentences, liveSentencesEnabled } from "./live-sentences";

/**
 * F.2: themes the first conjugation items of a practice page in the
 * student's interests (PRACTICE_LIVE_SENTENCES=true; off by default because
 * it spends model budget on a student page). Fails closed to the bank prompts.
 */
export async function withLiveThemedSentences<P extends { items: Array<{ id: string; promptFr: string; validatorType: string; validatorConfig: Record<string, unknown> | null }> }>(practice: P, studentId: string | null | undefined): Promise<P> {
  if (!liveSentencesEnabled() || !studentId || practice.items.length === 0) return practice;
  const llm = editorialLLM();
  if (!llm) return practice;
  try {
    const db = createServiceClient();
    const [{ data: interestRows }, { data: student }] = await Promise.all([
      db.from("student_interests").select("interest_key").eq("student_id", studentId),
      db.from("students").select("current_grade").eq("id", studentId).maybeSingle(),
    ]);
    const interests = (interestRows ?? []).map((row) => row.interest_key as string).filter((key) => key in INTEREST_BY_KEY);
    const grade = Math.min(12, Math.max(4, Number(student?.current_grade ?? 6) || 6));
    const moderate = editorialGateDeps().moderate;
    const items = await applyLiveSentences(practice.items, { interests, grade }, {
      findCached: async (itemId, interest) => {
        const { data } = await db.from("live_practice_sentences").select("id,prompt_fr,served_count").eq("item_id", itemId).eq("interest", interest)
          .eq("review_status", "auto_approved").order("served_count", { ascending: true }).limit(1).maybeSingle();
        if (!data) return null;
        void db.from("live_practice_sentences").update({ served_count: Number(data.served_count ?? 0) + 1 }).eq("id", data.id).then(() => undefined, () => undefined);
        return data.prompt_fr as string;
      },
      generate: async (prompt) => {
        const result = await completeText(llm, { role: "practice_writer", system: prompt.system, user: prompt.user, json: true, temperature: 0.9, maxTokens: 300 });
        return { text: result.text, model: result.model };
      },
      moderate: moderate ? async (text) => {
        const verdict = await Promise.race([moderate(text), new Promise<{ allowed: boolean }>((resolve) => setTimeout(() => resolve({ allowed: false }), 8000))]);
        return verdict.allowed;
      } : undefined,
      save: async (record) => {
        await db.from("live_practice_sentences").insert({
          item_id: record.itemId, interest: record.interest, sentence: record.sentence, prompt_fr: record.promptFr, expected_form: record.expectedForm,
          model: record.model, pipeline_version: LIVE_SENTENCE_VERSION, gate_results: record.gates,
        });
      },
      schedule: (work) => after(work),
      timeoutMs: Number(process.env.PRACTICE_LIVE_TIMEOUT_MS ?? 4000),
    });
    return { ...practice, items };
  } catch {
    return practice;
  }
}
