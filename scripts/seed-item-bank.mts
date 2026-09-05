import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { GeneratedItem, GateResults } from "@/lib/ai/item-generation/schemas";

loadEnv({ path: ".env.local", quiet: true });
const path = process.argv[2];
if (!path) throw new Error("JSON bank path required");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");

const db = createClient(url, key, { auth: { persistSession: false } });
type Stored = GeneratedItem & {
  qcGates?: GateResults;
  reviewStatus?: GateResults["verdict"];
  generationModel?: string;
  promptVersion?: string;
  generationType?: "human" | "ai" | "ai_human_reviewed";
};
const items = JSON.parse(readFileSync(path, "utf8")) as Stored[];
const nodeKeys = [...new Set(items.map((item) => item.nodeKey))];
const { data: nodes, error: nodeError } = await db.from("competency_nodes").select("id,key").in("key", nodeKeys);
if (nodeError) throw new Error(nodeError.message);
const nodeByKey = new Map((nodes ?? []).map((node) => [node.key as string, node.id as string]));
const nodeIds = [...nodeByKey.values()];

const { data: existing, error: existingError } = await db.from("competency_items")
  .select("id,primary_node_id,prompt_fr").in("primary_node_id", nodeIds).limit(1_000);
if (existingError) throw new Error(existingError.message);
const compositeKey = (nodeId: string, prompt: string) => `${nodeId}\u0000${prompt}`;
const seen = new Set((existing ?? []).map((row) => compositeKey(row.primary_node_id as string, row.prompt_fr as string)));
const missing = items.flatMap((item) => {
  const nodeId = nodeByKey.get(item.nodeKey);
  if (!nodeId || seen.has(compositeKey(nodeId, item.promptFr))) return [];
  seen.add(compositeKey(nodeId, item.promptFr));
  return [{ item, nodeId }];
});

function chunks<T>(rows: T[], size: number) {
  return Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size));
}

const insertedRows: Array<{ id: string; primary_node_id: string; prompt_fr: string }> = [];
for (const batch of chunks(missing, 100)) {
  const { data, error } = await db.from("competency_items").insert(batch.map(({ item, nodeId }) => ({
    primary_node_id: nodeId,
    strand: item.strand,
    modality: item.modality,
    learner_mode: item.learnerMode,
    response_type: item.responseType,
    prompt_fr: item.promptFr,
    instructions_fr: item.instructionsFr ?? null,
    correct_answer: item.correctAnswer ?? null,
    acceptable_answers: item.acceptableAnswers ?? [],
    validator_type: item.validatorType,
    validator_config: item.validatorConfig ?? null,
    cefr_level: item.cefrLevel ?? null,
    difficulty: item.difficulty ?? 50,
    generation_type: item.generationType ?? "ai",
    generation_model: item.generationModel ?? (item.generationType === "human" ? "human" : "glm-5.2"),
    prompt_version: item.promptVersion ?? "item-generation-v1",
    qc_gates: item.qcGates ?? {},
    review_status: item.reviewStatus ?? "auto_approved",
  }))).select("id,primary_node_id,prompt_fr");
  if (error) throw new Error(error.message);
  insertedRows.push(...((data ?? []) as typeof insertedRows));
}

const insertedByKey = new Map(insertedRows.map((row) => [compositeKey(row.primary_node_id, row.prompt_fr), row.id]));
const choiceRows = missing.flatMap(({ item, nodeId }) => {
  const itemId = insertedByKey.get(compositeKey(nodeId, item.promptFr));
  if (!itemId) return [];
  return (item.choices ?? []).map((choice, position) => ({
    item_id: itemId,
    choice_text: choice.text,
    is_correct: choice.correct,
    position,
    feedback_fr: choice.feedbackFr ?? null,
  }));
});
for (const batch of chunks(choiceRows, 500)) {
  const { error } = await db.from("competency_item_choices").insert(batch);
  if (error) throw new Error(error.message);
}

console.log(JSON.stringify({ ok: true, inserted: insertedRows.length, total: items.length }));
