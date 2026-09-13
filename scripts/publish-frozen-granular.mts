/** Publish an already imported frozen bundle through the existing atomic RPC. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {prepareParallelPublication} from '../src/lib/diagnostic/granular/publication-contract';
import {verifyRelationalBank} from '../src/lib/diagnostic/granular/relational-bank';
import {uploadGranularPublication} from '../src/lib/diagnostic/granular/publication-upload';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import type {AssessmentBundle} from '../src/lib/diagnostic/granular/service';

const [mode, candidatePath, bankPath, releaseKey, uploadId] = process.argv.slice(2);
if (!['check','publish'].includes(mode) || !candidatePath || !bankPath || !releaseKey ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uploadId ?? '')) {
  throw Error('Expected check|publish <frozen candidate> <frozen bank> <release key> <stable upload UUID>');
}
config({path: process.env.DIAGNOSTIC_ENV_FILE ?? '.env.local', quiet: true});
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publisher = process.env.DIAGNOSTIC_BANK_PUBLISHER_PROFILE_ID;
if (!url || !key || !publisher) throw Error('Service environment and publisher profile are required');
const projectRef = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (new URL(url).hostname !== `${projectRef}.supabase.co`) throw Error('Linked database and service environment differ');
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
const bank = JSON.parse(readFileSync(bankPath, 'utf8'));
const db = createClient(url, key, {auth: {persistSession: false}});
const parent = await db.from('diagnostic_item_bank_releases')
  .select('id,taxonomy_release_id,manifest_checksum,status').eq('bank_key', bank.bank.key).single();
if (parent.error) throw Error(parent.error.message);
if (parent.data.status === 'withdrawn') throw Error('Bank is withdrawn');
const bundle: AssessmentBundle = {assessment: candidate.assessment, bank,
  taxonomyId: parent.data.taxonomy_release_id, bankId: parent.data.id,
  teachingContent: candidate.teachingContent,
  activities: candidate.activities.map((activity: object) => ({...activity, status: 'published'}))};
const proof = prepareParallelPublication(bundle);
if (!proof.ready || proof.bankChecksum !== parent.data.manifest_checksum) throw Error('Frozen publication preflight mismatch');
await verifyRelationalBank(db, bundle);
if (mode === 'publish') {
  const uploaded = await uploadGranularPublication(db, uploadId, {p_release_key: releaseKey,
    p_bundle: bundle, p_bundle_checksum: proof.bundleChecksum, p_preflight: proof, p_publisher: publisher});
  console.log(JSON.stringify({uploaded}));
  // The byte upload avoids REST body/timeout limits; this still executes the
  // same database transaction, permission checks and locked bank comparison.
  const sql = `begin; set local lock_timeout='10s'; set local statement_timeout='90s'; select public.finish_granular_publication_upload('${uploadId}'::uuid); commit;`;
  try {
    execFileSync('supabase', ['db','query','--linked',sql,'--output','json'], {stdio: ['ignore','pipe','pipe'], maxBuffer: 1000000});
  } catch {
    throw Error('Publication completion was not confirmed; retain the upload UUID and retry idempotently.');
  }
  const release = await db.from('granular_assessment_releases').select('id').eq('release_key', releaseKey).single();
  if (release.error) throw Error(release.error.message);
  const loaded = await new SupabaseAssessmentStore(db).release(release.data.id);
  if (!loaded || prepareParallelPublication(loaded).bundleChecksum !== proof.bundleChecksum) throw Error('Post-publication runtime verification failed; retry the same upload');
  console.log(JSON.stringify({releaseId: release.data.id, releaseKey, bundleChecksum: proof.bundleChecksum,
    assessmentTargets: proof.assessmentTargets, runtimeValidated: true}));
} else {
  console.log(JSON.stringify({ready: true, releaseKey, bundleChecksum: proof.bundleChecksum,
    assessmentTargets: proof.assessmentTargets, relationalBankVerified: true}));
}
