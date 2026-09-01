import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getTaxonomyV3PracticeReviewData } from "@/lib/db/items";

loadEnv({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");

const db = createClient(url, key, { auth: { persistSession: false } });
const result = await getTaxonomyV3PracticeReviewData({ limit: 500 }, db);
console.log(JSON.stringify({
  queue: result.filteredTotal,
  returned: result.items.length,
  progress: result.progress,
  first: result.items.slice(0, 3).map((item) => ({
    node: item.nodeKey,
    prompt: item.promptFr,
    difficulty: item.difficulty,
  })),
}, null, 2));
