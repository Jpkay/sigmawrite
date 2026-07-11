import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local", quiet: true });
process.env.AI_PROVIDER = process.env.REAL_AI_PROVIDER ?? process.env.AI_PROVIDER ?? "mock";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const { getAIEmbeddingInfo, getAIProvider } = await import("../src/lib/ai/index.ts");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: rows, error } = await db.from("text_versions").select("id,title,body").in("review_status", ["human_approved", "benchmark_locked"]).is("embedding", null);
if (error) throw new Error(error.message);
let updated = 0;
for (const row of rows ?? []) {
  const embedding = await getAIProvider().embed({ text: `${row.title}\n\n${row.body}` });
  const result = await db.from("text_versions").update({ embedding: `[${embedding.join(",")}]`, embedding_model: getAIEmbeddingInfo().model }).eq("id", row.id);
  if (result.error) throw new Error(result.error.message);
  updated += 1;
}
console.log(JSON.stringify({ ok: true, updated, model: getAIEmbeddingInfo().model }));
