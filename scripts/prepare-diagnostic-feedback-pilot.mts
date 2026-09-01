import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
} from "../src/lib/diagnostic/protocol";

loadEnv({ path: process.env.DIAGNOSTIC_ENV_FILE ?? ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedProjectRef = process.env.SUPABASE_PROJECT_REF;
if (!url || !key) throw new Error("Supabase service environment is required.");
const target = new URL(url);
const actualProjectRef = target.hostname.endsWith(".supabase.co")
  ? target.hostname.split(".")[0]
  : null;
if (expectedProjectRef && actualProjectRef && expectedProjectRef !== actualProjectRef) {
  throw new Error("SUPABASE_PROJECT_REF does not match the target URL; refusing pilot preparation.");
}

const db = createClient(url, key, { auth: { persistSession: false } });
const [{ data: taxonomy, error: taxonomyError }, { data: bank, error: bankError }] = await Promise.all([
  db.from("taxonomy_releases").select("id,status").eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY).in("status", ["validating", "published"]).maybeSingle(),
  db.from("diagnostic_item_bank_releases").select("id,status,taxonomy_release_id").eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY).in("status", ["draft", "validating"]).maybeSingle(),
]);
if (taxonomyError || bankError) throw new Error(taxonomyError?.message ?? bankError?.message);
if (!taxonomy || !bank || bank.taxonomy_release_id !== taxonomy.id) {
  throw new Error("The feedback-pilot taxonomy and diagnostic bank are not installed together.");
}

const { data: readiness, error: readinessError } = await db.rpc("diagnostic_pilot_bank_readiness", {
  p_taxonomy_release_id: taxonomy.id,
  p_bank_release_id: bank.id,
});
if (readinessError) throw new Error(readinessError.message);
const report = readiness as { ready?: boolean; sections?: Array<{ key?: string; ready?: boolean }> } | null;
if (!report?.ready || report.sections?.some((section) => !section.ready)) {
  throw new Error(`The feedback-pilot bank is not structurally ready: ${JSON.stringify(report)}`);
}

const { error: settingError } = await db.from("diagnostic_pilot_settings").upsert({
  singleton: true,
  enabled: true,
  updated_at: new Date().toISOString(),
}, { onConflict: "singleton" });
if (settingError) throw new Error(settingError.message);

process.stdout.write(`${JSON.stringify({
  ok: true,
  enabled: true,
  taxonomyReleaseId: taxonomy.id,
  bankReleaseId: bank.id,
  sections: report.sections,
})}\n`);
