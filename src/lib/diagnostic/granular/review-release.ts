import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
import {parseParallelReviewPolicy} from "./parallel-review-policy";
import type {AssessmentBundle} from "./service";

/** A completed sitting is reviewed against its original published snapshot.
 * Current teaching/pool rules govern new assessment delivery, not historical
 * answers. Require the original publication permission and live parent status;
 * this path must never authorize starting or scoring a new assessment. */
export async function loadPublishedReviewRelease(db: SupabaseClient, id: string): Promise<AssessmentBundle | null> {
  const {data: release, error} = await db.from("granular_assessment_releases")
    .select("bundle,content_checksum,taxonomy_release_id,bank_release_id")
    .eq("id", id).eq("status", "published").maybeSingle();
  if (error) throw Error(error.message);
  if (!release?.bundle || checksum(release.bundle) !== release.content_checksum) return null;
  const bundle = release.bundle as AssessmentBundle;
  if (bundle.taxonomyId !== release.taxonomy_release_id || bundle.bankId !== release.bank_release_id) return null;
  const [taxonomy, bank, permission] = await Promise.all([
    db.from("taxonomy_releases").select("manifest_checksum")
      .eq("id", release.taxonomy_release_id).eq("status", "published").maybeSingle(),
    db.from("diagnostic_item_bank_releases").select("manifest_checksum")
      .eq("id", release.bank_release_id).eq("taxonomy_release_id", release.taxonomy_release_id)
      .eq("status", "published").maybeSingle(),
    db.from("granular_bank_publication_permissions").select("preflight,bank_checksum,taxonomy_checksum")
      .eq("bank_release_id", release.bank_release_id).eq("bundle_checksum", release.content_checksum).maybeSingle(),
  ]);
  const failure = taxonomy.error ?? bank.error ?? permission.error;
  if (failure) throw Error(failure.message);
  if (!taxonomy.data || !bank.data || !permission.data) return null;
  const approval = permission.data.preflight;
  if (!approval || approval.version !== "french-granular-parallel-publication-v1" || approval.ready !== true
    || approval.bundleChecksum !== release.content_checksum
    || approval.bankChecksum !== bundle.assessment.bankChecksum
    || approval.taxonomyChecksum !== bundle.assessment.taxonomyChecksum
    || permission.data.bank_checksum !== bank.data.manifest_checksum
    || permission.data.taxonomy_checksum !== taxonomy.data.manifest_checksum
    || permission.data.bank_checksum !== bundle.assessment.bankChecksum
    || permission.data.taxonomy_checksum !== bundle.assessment.taxonomyChecksum) return null;
  try {
    if (approval.policyChecksum !== checksum(parseParallelReviewPolicy(bundle.assessment.reviewPolicy))) return null;
  } catch { return null; }
  return bundle;
}
