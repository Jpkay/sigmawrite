import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

/** Replaces the curriculum mapping table with the committed release (roadmap 4.1). */
loadEnv({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");
const db = createClient(url, key, { auth: { persistSession: false } });
const file = JSON.parse(readFileSync(process.argv[2] ?? "generated/curriculum-mappings-v1.json", "utf8")) as { checksum: string; mappings: { nodeKey: string; framework: string; code: string; labelFr: string; source: string }[] };
const { error: clearError } = await db.from("curriculum_mappings").delete().neq("release_checksum", file.checksum);
if (clearError) throw new Error(clearError.message);
for (let i = 0; i < file.mappings.length; i += 200) {
  const batch = file.mappings.slice(i, i + 200).map((m) => ({ node_key: m.nodeKey, framework: m.framework, code: m.code, label_fr: m.labelFr, source: m.source, release_checksum: file.checksum }));
  const { error } = await db.from("curriculum_mappings").upsert(batch, { onConflict: "node_key,framework,code" });
  if (error) throw new Error(error.message);
}
console.log(JSON.stringify({ ok: true, checksum: file.checksum, mappings: file.mappings.length }));
