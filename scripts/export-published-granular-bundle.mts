/** Export through the normal runtime validator; never relabel a draft as published. */
import {writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import {prepareParallelPublication} from '../src/lib/diagnostic/granular/publication-contract';

const [releaseKey, output] = process.argv.slice(2);
if (!releaseKey || !output) throw Error('Expected <published release key> <new output path>');
config({path: process.env.DIAGNOSTIC_ENV_FILE ?? '.env.local', quiet: true});
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('Supabase service environment is required');
const db = createClient(url, key, {auth: {persistSession: false}});
const result = await db.from('granular_assessment_releases').select('id,status')
  .eq('release_key', releaseKey).single();
if (result.error) throw Error(result.error.message);
if (result.data.status !== 'published') throw Error('Release is not published');
const bundle = await new SupabaseAssessmentStore(db).release(result.data.id);
if (!bundle) throw Error('Runtime release validation failed');
const proof = prepareParallelPublication(bundle);
if (!proof.ready) throw Error('Published bundle is not ready');
const exported = {...bundle, sourceKind: 'runtime_validated_published_bundle',
  releaseId: result.data.id, releaseKey, checksum: proof.bundleChecksum};
writeFileSync(output, JSON.stringify(exported) + '\n', {flag: 'wx', mode: 0o600});
console.log(JSON.stringify({output, releaseId: result.data.id, releaseKey,
  bundleChecksum: proof.bundleChecksum, assessmentTargets: proof.assessmentTargets,
  instructionGaps: proof.instructionGapSkillIds.length,
  freshCheckGaps: proof.freshCheckGapSkillIds.length}));
