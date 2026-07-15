import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankItem,
  type CanonicalDiagnosticBankArtifact,
} from "../src/lib/diagnostic/item-bank";
import { stableUuid } from "../src/lib/lexicon/baseline";
import { stableJson } from "../src/lib/taxonomy/validate";

loadEnv({ path: process.env.DIAGNOSTIC_ENV_FILE ?? ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment is required.");
const db = createClient(url, key, { auth: { persistSession: false } });
const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const bank = JSON.parse(readFileSync(process.argv[2] ?? "generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
const validation = validateCanonicalDiagnosticBank(bank, taxonomy.taxonomy);
const fail = (message?: string) => { if (message) throw new Error(message); };
if (bank.taxonomy.releaseKey !== taxonomy.release.key || bank.taxonomy.checksum !== taxonomy.manifest.contentChecksum) {
  throw new Error("Diagnostic bank is pinned to a different taxonomy artifact.");
}
const { data: taxonomyRelease, error: taxonomyError } = await db.from("taxonomy_releases")
  .select("id,status,manifest_checksum")
  .eq("release_key", bank.taxonomy.releaseKey)
  .single();
fail(taxonomyError?.message);
if (taxonomyRelease!.manifest_checksum !== bank.taxonomy.checksum) throw new Error("Database taxonomy checksum does not match the bank.");

let release = await db.from("diagnostic_item_bank_releases")
  .select("id,status,manifest_checksum")
  .eq("bank_key", bank.bank.key)
  .maybeSingle();
fail(release.error?.message);
if (
  release.data?.manifest_checksum
  && release.data.manifest_checksum !== validation.manifest.checksum
  && release.data.status !== "draft"
) {
  throw new Error("Existing diagnostic bank key has a different checksum.");
}
if (!release.data) {
  release = await db.from("diagnostic_item_bank_releases").insert({
    bank_key: bank.bank.key,
    version: bank.bank.version,
    taxonomy_release_id: taxonomyRelease!.id,
    status: "draft",
    manifest: validation.manifest,
    manifest_checksum: validation.manifest.checksum,
    validation_report: { valid: validation.valid, issues: validation.issues, sections: validation.sections },
  }).select("id,status,manifest_checksum").single();
  fail(release.error?.message);
}
if (["published", "withdrawn"].includes(release.data!.status as string)) {
  process.stdout.write(`${JSON.stringify({ ok: true, unchanged: true, bankReleaseId: release.data!.id })}\n`);
  process.exit(0);
}

const importableItems = bank.items.filter((entry) =>
  entry.reviewStatus !== "rejected" && entry.qcGates.verdict !== "rejected"
);
const { data: pinnedRecords, error: pinnedRecordError } = await db.from("taxonomy_release_memberships")
  .select("record_type,record_id,stable_key")
  .eq("release_id", taxonomyRelease!.id)
  .in("record_type", ["competency_node", "mastery_evidence"]);
fail(pinnedRecordError?.message);
const nodeByKey = new Map((pinnedRecords ?? [])
  .filter((row) => row.record_type === "competency_node")
  .map((row) => [row.stable_key as string, row.record_id as string]));
const evidenceByStableKey = new Map((pinnedRecords ?? [])
  .filter((row) => row.record_type === "mastery_evidence")
  .map((row) => [row.stable_key as string, row.record_id as string]));

const importConcurrency = Math.max(
  1,
  Math.min(12, Number(process.env.DIAGNOSTIC_IMPORT_CONCURRENCY ?? 6)),
);
await mapWithConcurrency(importableItems, importConcurrency, async (entry) => {
  const nodeId = nodeByKey.get(entry.item.nodeKey);
  if (!nodeId) throw new Error(`Unknown node ${entry.item.nodeKey}`);
  const itemId = stableUuid("sigmawrite-diagnostic-item", `${bank.bank.key}:${entry.itemKey}`);
  let stored = await db.from("competency_items").select(
    "id,primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,cefr_level,qc_gates,review_status,reviewer_profile_id,reviewed_at,competency_item_choices(choice_text,is_correct,position,feedback_fr)",
  ).eq("id", itemId).maybeSingle();
  fail(stored.error?.message);
  if (!stored.data) {
    stored = await db.from("competency_items").insert({
      id: itemId,
      primary_node_id: nodeId,
      strand: entry.item.strand,
      modality: entry.item.modality,
      learner_mode: entry.item.learnerMode,
      response_type: entry.item.responseType,
      prompt_fr: entry.item.promptFr,
      instructions_fr: entry.item.instructionsFr ?? null,
      correct_answer: entry.item.correctAnswer ?? null,
      acceptable_answers: entry.item.acceptableAnswers,
      validator_type: entry.item.validatorType,
      validator_config: entry.item.validatorConfig ?? null,
      difficulty: entry.item.difficulty ?? 50,
      cefr_level: entry.item.cefrLevel ?? null,
      generation_type: entry.reviewStatus === "human_approved" ? "ai_human_reviewed" : "ai",
      generation_model: process.env.LLM_MODEL ?? "unknown",
      prompt_version: "diagnostic-bank-v2",
      qc_gates: entry.qcGates,
      review_status: entry.reviewStatus,
      reviewer_profile_id: entry.review?.reviewerProfileId ?? null,
      reviewed_at: entry.review?.reviewedAt ?? null,
    }).select("id").single();
    fail(stored.error?.message);
    if (entry.item.choices?.length) {
      const { error: choiceError } = await db.from("competency_item_choices").insert(
        entry.item.choices.map((choice, position) => ({
          item_id: stored.data!.id,
          choice_text: choice.text,
          is_correct: choice.correct,
          position,
          feedback_fr: choice.feedbackFr ?? null,
        })),
      );
      fail(choiceError?.message);
    }
  } else {
    try {
      assertStoredItemMatches(entry, nodeId, stored.data);
    } catch (error) {
      const mayRefreshUnreviewedDraft = release.data!.status === "draft"
        && stored.data.review_status !== "human_approved"
        && entry.reviewStatus !== "human_approved";
      if (!mayRefreshUnreviewedDraft) throw error;
      const { error: refreshError } = await db.from("competency_items").update({
        primary_node_id: nodeId,
        strand: entry.item.strand,
        modality: entry.item.modality,
        learner_mode: entry.item.learnerMode,
        response_type: entry.item.responseType,
        prompt_fr: entry.item.promptFr,
        instructions_fr: entry.item.instructionsFr ?? null,
        correct_answer: entry.item.correctAnswer ?? null,
        acceptable_answers: entry.item.acceptableAnswers,
        validator_type: entry.item.validatorType,
        validator_config: entry.item.validatorConfig ?? null,
        difficulty: entry.item.difficulty ?? 50,
        cefr_level: entry.item.cefrLevel ?? null,
        generation_type: entry.reviewStatus === "human_approved" ? "ai_human_reviewed" : "ai",
        generation_model: process.env.LLM_MODEL ?? "local-authoring",
        prompt_version: "diagnostic-bank-v2",
        qc_gates: entry.qcGates,
        review_status: entry.reviewStatus,
        reviewer_profile_id: entry.review?.reviewerProfileId ?? null,
        reviewed_at: entry.review?.reviewedAt ?? null,
      }).eq("id", stored.data.id);
      fail(refreshError?.message);
      const { error: deleteChoiceError } = await db.from("competency_item_choices")
        .delete().eq("item_id", stored.data.id);
      fail(deleteChoiceError?.message);
      if (entry.item.choices?.length) {
        const { error: choiceError } = await db.from("competency_item_choices").insert(
          entry.item.choices.map((choice, position) => ({
            item_id: stored.data!.id,
            choice_text: choice.text,
            is_correct: choice.correct,
            position,
            feedback_fr: choice.feedbackFr ?? null,
          })),
        );
        fail(choiceError?.message);
      }
    }
  }
  const evidenceId = evidenceByStableKey.get(`${entry.item.nodeKey}:${entry.evidenceKey}`);
  if (!evidenceId) throw new Error(`Unknown evidence ${entry.item.nodeKey}:${entry.evidenceKey}`);
  const { error: membershipError } = await db.from("diagnostic_item_bank_memberships").upsert({
    bank_release_id: release.data!.id,
    item_id: stored.data!.id,
    node_id: nodeId,
    mastery_evidence_id: evidenceId,
    section_key: entry.sectionKey,
    evidence_expectation: entry.evidenceExpectation,
    modality: entry.item.modality,
    prompt_family: entry.promptFamily,
    difficulty_tier: entry.difficultyTier,
    difficulty: entry.item.difficulty ?? 50,
  }, { onConflict: "bank_release_id,item_id" });
  fail(membershipError?.message);
});

const expectedItemIds = new Set(importableItems.map((entry) =>
  stableUuid("sigmawrite-diagnostic-item", `${bank.bank.key}:${entry.itemKey}`)
));
const { data: existingMemberships, error: existingMembershipError } = await db
  .from("diagnostic_item_bank_memberships")
  .select("item_id")
  .eq("bank_release_id", release.data!.id);
fail(existingMembershipError?.message);
const staleItemIds = (existingMemberships ?? [])
  .map((row) => row.item_id as string)
  .filter((itemId) => !expectedItemIds.has(itemId));
for (let offset = 0; offset < staleItemIds.length; offset += 100) {
  const { error: deleteError } = await db.from("diagnostic_item_bank_memberships")
    .delete()
    .eq("bank_release_id", release.data!.id)
    .in("item_id", staleItemIds.slice(offset, offset + 100));
  fail(deleteError?.message);
}

const nextStatus = validation.valid ? "validating" : "draft";
const { error: updateError } = await db.from("diagnostic_item_bank_releases").update({
  status: nextStatus,
  manifest: validation.manifest,
  manifest_checksum: validation.manifest.checksum,
  validation_report: { valid: validation.valid, issues: validation.issues, sections: validation.sections },
}).eq("id", release.data!.id).eq("status", "draft");
fail(updateError?.message);
const publisher = process.env.DIAGNOSTIC_BANK_PUBLISHER_PROFILE_ID;
if (publisher) {
  if (!validation.valid) throw new Error("Diagnostic bank cannot be published until every section passes.");
  if (taxonomyRelease!.status !== "published") throw new Error("Taxonomy must be published before its diagnostic bank.");
  const releaseReview = readFileSync("docs/french-diagnostic-bank-v2-release.md", "utf8");
  if (
    !releaseReview.includes("**Decision:** approve")
    || !releaseReview.includes(`**Approved checksum:** \`${validation.manifest.checksum}\``)
  ) {
    throw new Error("Checksum-bound diagnostic bank approval is not recorded.");
  }
  const { error: publishError } = await db.from("diagnostic_item_bank_releases").update({
    status: "published", published_by: publisher, published_at: new Date().toISOString(),
  }).eq("id", release.data!.id).eq("status", "validating");
  fail(publishError?.message);
}
process.stdout.write(`${JSON.stringify({ ok: true, bankReleaseId: release.data!.id, status: publisher ? "published" : nextStatus, validation })}\n`);

async function mapWithConcurrency<T>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
) {
  let cursor = 0;
  await Promise.all(Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        await worker(values[index]);
      }
    },
  ));
}

function assertStoredItemMatches(
  entry: CanonicalDiagnosticBankItem,
  nodeId: string,
  stored: Record<string, unknown>,
) {
  const choices = (stored.competency_item_choices ?? []) as Array<Record<string, unknown>>;
  const expected = {
    primaryNodeId: nodeId,
    strand: entry.item.strand,
    modality: entry.item.modality,
    learnerMode: entry.item.learnerMode,
    responseType: entry.item.responseType,
    promptFr: entry.item.promptFr,
    instructionsFr: entry.item.instructionsFr ?? null,
    correctAnswer: entry.item.correctAnswer ?? null,
    acceptableAnswers: entry.item.acceptableAnswers,
    validatorType: entry.item.validatorType,
    validatorConfig: entry.item.validatorConfig ?? null,
    difficulty: entry.item.difficulty ?? 50,
    cefrLevel: entry.item.cefrLevel ?? null,
    qcGates: entry.qcGates,
    reviewStatus: entry.reviewStatus,
    review: entry.review ?? null,
    choices: (entry.item.choices ?? []).map((choice, position) => ({
      text: choice.text,
      correct: choice.correct,
      position,
      feedbackFr: choice.feedbackFr ?? null,
    })),
  };
  const actual = {
    primaryNodeId: stored.primary_node_id,
    strand: stored.strand,
    modality: stored.modality,
    learnerMode: stored.learner_mode,
    responseType: stored.response_type,
    promptFr: stored.prompt_fr,
    instructionsFr: stored.instructions_fr,
    correctAnswer: stored.correct_answer,
    acceptableAnswers: stored.acceptable_answers,
    validatorType: stored.validator_type,
    validatorConfig: stored.validator_config,
    difficulty: Number(stored.difficulty),
    cefrLevel: stored.cefr_level,
    qcGates: stored.qc_gates,
    reviewStatus: stored.review_status,
    review: stored.reviewer_profile_id && stored.reviewed_at
      ? { reviewerProfileId: stored.reviewer_profile_id, reviewedAt: stored.reviewed_at }
      : null,
    choices: choices
      .sort((left, right) => Number(left.position) - Number(right.position))
      .map((choice) => ({
        text: choice.choice_text,
        correct: choice.is_correct,
        position: Number(choice.position),
        feedbackFr: choice.feedback_fr,
      })),
  };
  if (stableJson(actual) !== stableJson(expected)) {
    throw new Error(
      `Stored item ${entry.itemKey} differs from the reviewed artifact. Export the current review state before importing again.`,
    );
  }
}
