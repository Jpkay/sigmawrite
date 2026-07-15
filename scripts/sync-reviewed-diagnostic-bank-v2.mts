import { readFileSync, writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GateResults, GeneratedItem } from "../src/lib/ai/item-generation/schemas";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
  type CanonicalDiagnosticBankItem,
} from "../src/lib/diagnostic/item-bank";
import { stableUuid } from "../src/lib/lexicon/baseline";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";

loadEnv({ path: process.env.DIAGNOSTIC_ENV_FILE ?? ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment is required.");
const db = createClient(url, key, { auth: { persistSession: false } });
const output = process.argv[2] ?? "generated/diagnostic-bank-v2.json";
const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const source = JSON.parse(readFileSync(output, "utf8")) as CanonicalDiagnosticBankArtifact;
const fail = (message?: string) => { if (message) throw new Error(message); };
if (
  source.taxonomy.releaseKey !== taxonomy.release.key
  || source.taxonomy.checksum !== taxonomy.manifest.contentChecksum
) {
  throw new Error("Diagnostic bank workspace is pinned to a different taxonomy artifact.");
}

const { data: release, error: releaseError } = await db.from("diagnostic_item_bank_releases")
  .select("id,status")
  .eq("bank_key", source.bank.key)
  .single();
fail(releaseError?.message);
if (["published", "withdrawn"].includes(release!.status as string)) {
  throw new Error("A published or withdrawn diagnostic bank cannot be synchronized.");
}
const { data: membershipRows, error: membershipError } = await db
  .from("diagnostic_item_bank_memberships")
  .select("item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty")
  .eq("bank_release_id", release!.id);
fail(membershipError?.message);
const memberships = (membershipRows ?? []) as Array<Record<string, unknown>>;
const itemIds = memberships.map((row) => row.item_id as string);
const nodeIds = [...new Set(memberships.map((row) => row.node_id as string))];
const evidenceIds = [...new Set(memberships.map((row) => row.mastery_evidence_id as string))];
const [itemRows, choiceRows, nodeRows, evidenceRows] = await Promise.all([
  selectInBatches(db, "competency_items", "id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,cefr_level,qc_gates,review_status,reviewer_profile_id,reviewed_at", "id", itemIds),
  selectInBatches(db, "competency_item_choices", "item_id,choice_text,is_correct,position,feedback_fr", "item_id", itemIds),
  selectInBatches(db, "competency_nodes", "id,key", "id", nodeIds),
  selectInBatches(db, "competency_mastery_evidence", "id,evidence_key", "id", evidenceIds),
]);
const itemById = new Map(itemRows.map((row) => [row.id as string, row]));
const nodeKeyById = new Map(nodeRows.map((row) => [row.id as string, row.key as string]));
const evidenceKeyById = new Map(evidenceRows.map((row) => [row.id as string, row.evidence_key as string]));
const choicesByItem = new Map<string, Array<Record<string, unknown>>>();
for (const choice of choiceRows) {
  const values = choicesByItem.get(choice.item_id as string) ?? [];
  values.push(choice);
  choicesByItem.set(choice.item_id as string, values);
}
const membershipByItem = new Map(memberships.map((row) => [row.item_id as string, row]));

const synchronized = source.items.map((entry) => {
  const itemId = stableUuid("sigmawrite-diagnostic-item", `${source.bank.key}:${entry.itemKey}`);
  const membership = membershipByItem.get(itemId);
  const stored = itemById.get(itemId);
  if (!membership && !stored) return entry; // Newly generated replacement, not staged yet.
  if (!membership && stored && ["rejected", "retired"].includes(String(stored.review_status))) {
    // Import deliberately removes rejected memberships from the mutable draft.
    // Keep the tombstone in the working artifact until its replacement makes
    // the filtered candidate publishable; no live metadata is needed for it.
    return { ...entry, reviewStatus: "rejected" as const };
  }
  if (!membership || !stored) throw new Error(`Incomplete staged item ${entry.itemKey}.`);
  if (nodeKeyById.get(membership.node_id as string) !== entry.item.nodeKey) {
    throw new Error(`Staged item ${entry.itemKey} targets a different node.`);
  }
  const storedChoices = [...(choicesByItem.get(itemId) ?? [])]
    .sort((left, right) => Number(left.position) - Number(right.position));
  const choices = storedChoices.length
    ? storedChoices.map((choice, index) => ({
      text: choice.choice_text as string,
      correct: Boolean(choice.is_correct),
      misconceptionKey: entry.item.choices?.[index]?.misconceptionKey,
      feedbackFr: (choice.feedback_fr as string | null) ?? undefined,
    }))
    : undefined;
  const reviewStatus = stored.review_status === "retired"
    ? "rejected"
    : stored.review_status as CanonicalDiagnosticBankItem["reviewStatus"];
  const item: GeneratedItem = {
    nodeKey: entry.item.nodeKey,
    strand: stored.strand as string,
    modality: stored.modality as GeneratedItem["modality"],
    learnerMode: stored.learner_mode as GeneratedItem["learnerMode"],
    responseType: stored.response_type as GeneratedItem["responseType"],
    promptFr: stored.prompt_fr as string,
    instructionsFr: (stored.instructions_fr as string | null) ?? undefined,
    correctAnswer: (stored.correct_answer as string | null) ?? undefined,
    acceptableAnswers: (stored.acceptable_answers ?? []) as string[],
    validatorType: stored.validator_type as GeneratedItem["validatorType"],
    validatorConfig: (stored.validator_config as Record<string, unknown> | null) ?? undefined,
    choices,
    cefrLevel: (stored.cefr_level as GeneratedItem["cefrLevel"] | null) ?? undefined,
    difficulty: Number(membership.difficulty),
  };
  return {
    ...entry,
    item,
    evidenceKey: evidenceKeyById.get(membership.mastery_evidence_id as string) ?? entry.evidenceKey,
    evidenceExpectation: membership.evidence_expectation as CanonicalDiagnosticBankItem["evidenceExpectation"],
    sectionKey: membership.section_key as CanonicalDiagnosticBankItem["sectionKey"],
    promptFamily: membership.prompt_family as string,
    difficultyTier: membership.difficulty_tier as CanonicalDiagnosticBankItem["difficultyTier"],
    qcGates: stored.qc_gates as GateResults,
    reviewStatus,
    review: reviewStatus === "human_approved"
      && typeof stored.reviewer_profile_id === "string"
      && typeof stored.reviewed_at === "string"
      ? {
          reviewerProfileId: stored.reviewer_profile_id,
          reviewedAt: stored.reviewed_at,
        }
      : undefined,
  } satisfies CanonicalDiagnosticBankItem;
});

const publishableItems = synchronized.filter((entry) => entry.reviewStatus !== "rejected");
const candidate = {
  ...source,
  generatedAt: new Date().toISOString(),
  items: publishableItems,
  manifest: undefined,
};
const candidateValidation = validateCanonicalDiagnosticBank(candidate, taxonomy.taxonomy);
// Keep rejected records in the working artifact until replacements make the
// filtered bank publishable; this preserves their item keys for later syncs.
const finalItems = candidateValidation.valid ? publishableItems : synchronized;
const finalArtifact = { ...source, generatedAt: candidate.generatedAt, items: finalItems };
const finalValidation = validateCanonicalDiagnosticBank(finalArtifact, taxonomy.taxonomy);
writeFileSync(output, `${JSON.stringify({ ...finalArtifact, manifest: finalValidation.manifest }, null, 2)}\n`, "utf8");

const statusCounts = Object.fromEntries(
  ["human_approved", "auto_approved", "needs_human_review", "rejected"].map((status) => [
    status,
    finalItems.filter((entry) => entry.reviewStatus === status).length,
  ]),
);
process.stdout.write(`${JSON.stringify({
  output,
  valid: finalValidation.valid,
  issues: finalValidation.issues,
  sections: finalValidation.sections,
  statusCounts,
  rejectedPruned: candidateValidation.valid && synchronized.length !== finalItems.length,
}, null, 2)}\n`);

async function selectInBatches(
  client: SupabaseClient,
  table: string,
  columns: string,
  column: string,
  values: string[],
) {
  const rows: Array<Record<string, unknown>> = [];
  for (let offset = 0; offset < values.length; offset += 100) {
    const { data, error } = await client.from(table).select(columns).in(column, values.slice(offset, offset + 100));
    fail(error?.message);
    rows.push(...((data ?? []) as Array<Record<string, unknown>>));
  }
  return rows;
}
