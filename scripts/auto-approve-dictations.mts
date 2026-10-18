import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { autoApproveDictation } from "@/lib/dictation/auto-approve";

/**
 * Runs dictées through the automatic gates (roadmap 2026-10, G.2) and marks
 * the passing ones auto_approved, then queues their audio (the hourly
 * dictation-audio job renders it; add --render to render now).
 *
 *   npm run dictations:auto-approve                 # every unpublished dictée
 *   npm run dictations:auto-approve -- --key flash-cm2-la-riviere --render
 *   npm run dictations:auto-approve -- --dry-run    # report only
 *
 * LanguageTool runs when LANGUAGETOOL_URL is set (recorded as skipped
 * otherwise); the model moderator runs when an AI provider key is set.
 */
loadEnv({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const db = createClient(url, key, { auth: { persistSession: false } });

let keys: string[];
if (value("--key")) keys = [value("--key")!];
else {
  const { data, error } = await db.from("dictations").select("key").in("review_status", ["needs_human_review", "rejected"]).order("key");
  if (error) throw new Error(error.message);
  keys = (data ?? []).map((row) => row.key as string);
}

const summary: Record<string, number> = {};
for (const dictationKey of keys) {
  if (flag("--dry-run")) {
    const { runDictationGates, DETERMINISTIC_DICTATION_GATES } = await import("@/lib/dictation/gates");
    const { candidateFromRecord, languageToolGate, moderationGate } = await import("@/lib/dictation/auto-approve");
    const { data, error } = await db.from("dictations").select("*").eq("key", dictationKey).single();
    if (error || !data) throw new Error(error?.message ?? dictationKey);
    const report = await runDictationGates(candidateFromRecord(data), [...DETERMINISTIC_DICTATION_GATES, languageToolGate(), moderationGate()]);
    console.log(JSON.stringify({ key: dictationKey, passed: report.passed, gates: report.gates.filter((gate) => gate.status !== "pass") }));
    summary[report.passed ? "would_approve" : "would_hold"] = (summary[report.passed ? "would_approve" : "would_hold"] ?? 0) + 1;
    continue;
  }
  const outcome = await autoApproveDictation(db, { key: dictationKey, renderAudio: flag("--render") });
  summary[outcome.status] = (summary[outcome.status] ?? 0) + 1;
  console.log(JSON.stringify({ key: dictationKey, status: outcome.status, failed: outcome.report?.gates.filter((gate) => gate.status === "fail").map((gate) => ({ gate: gate.gate, blocking: gate.blocking, details: gate.details })) ?? [], audio: outcome.audio }));
}
console.log(JSON.stringify({ total: keys.length, ...summary }));
