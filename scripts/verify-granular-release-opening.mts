/** Bounded hosted QA: open/reload the diagnostic; never submit an answer. */
import {strict as assert} from 'node:assert';
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import {publicAssessmentView} from '../src/lib/diagnostic/granular/service';
import {prepareParallelPublication} from '../src/lib/diagnostic/granular/publication-contract';

config({path: '.env.local', quiet: true});
const required = (name: string) => {const value = process.env[name]; assert.ok(value, `${name} required`); return value;};
const base = new URL(required('PLUME_VERIFY_URL')).origin;
assert.equal(new URL(base).protocol, 'https:');
const releaseKey = required('PLUME_VERIFY_RELEASE');
const expectedScope = Number(required('PLUME_VERIFY_SCOPE'));
assert.ok(Number.isSafeInteger(expectedScope) && expectedScope > 0);
const qa = JSON.parse(readFileSync(required('PLUME_VERIFY_QA_FILE'), 'utf8'));
assert.match(qa.username, /^doves\.granular\..*\.qa$/);
const db = createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {auth: {persistSession: false}});
const result = await db.from('granular_assessment_releases').select('id,status').eq('release_key', releaseKey).single();
if (result.error) throw Error(result.error.message);
assert.equal(result.data.status, 'published');
const bundle = await new SupabaseAssessmentStore(db).release(result.data.id);
assert.ok(bundle);
const proof = prepareParallelPublication(bundle);
assert.ok(proof.ready);
assert.equal(proof.assessmentTargets, expectedScope);
const sessions = async () => {
  const rows = await db.from('granular_assessment_sessions').select('id,student_id,release_id,state')
    .eq('student_id', qa.studentId).eq('release_id', result.data.id);
  if (rows.error) throw Error(rows.error.message);
  assert.ok(rows.data.length <= 1, 'Duplicate sessions for release');
  return rows.data;
};
const before = await sessions();
const user = await db.auth.admin.getUserById(qa.authUserId);
if (user.error) throw Error(user.error.message);
assert.ok(user.data.user.email);
const link = await db.auth.admin.generateLink({type: 'magiclink', email: user.data.user.email});
if (link.error) throw Error(link.error.message);
const cookies = new Map<string, string>();
const auth = createServerClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {cookies: {
  getAll: () => [...cookies].map(([name, value]) => ({name, value})),
  setAll: values => values.forEach(value => cookies.set(value.name, value.value)),
}});
const verified = await auth.auth.verifyOtp({token_hash: link.data.properties.hashed_token, type: 'magiclink'});
if (verified.error) throw Error(verified.error.message);
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const context = await browser.newContext();
  if (existsSync('tmp/plume-verification-bypass.json')) {
    const {secret} = JSON.parse(readFileSync('tmp/plume-verification-bypass.json', 'utf8'));
    await context.route('**/*', route => route.continue({headers: {...route.request().headers(),
      ...(new URL(route.request().url()).origin === base ? {'x-vercel-protection-bypass': secret} : {})}}));
  }
  await context.addCookies([...cookies].map(([name, value]) => ({name, value, domain: new URL(base).hostname, path: '/', secure: true, sameSite: 'Lax' as const})));
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/student/diagnostic', {waitUntil: 'domcontentloaded', timeout: 60000});
  let qaOnboarded = false;
  if (new URL(page.url()).pathname === '/student/onboarding' && process.env.PLUME_VERIFY_ONBOARD === 'true') {
    assert.equal(before.length, 0, 'Onboarding is only allowed for a fresh technical QA account');
    await page.getByRole('button', {name: 'Continuer', exact: true}).click();
    for (const name of [/Mangas/, /Animés/, /Football/]) await page.getByRole('button', {name}).click();
    await page.getByRole('button', {name: 'Commencer le diagnostic', exact: true}).click();
    await page.waitForURL('**/student/diagnostic', {timeout: 60000});
    qaOnboarded = true;
  }
  await page.getByRole('button', {name: /^(Commencer|Reprendre)$/}).waitFor({timeout: 60000});
  const opened = await sessions();
  assert.equal(opened.length, 1);
  const row = opened[0];
  const view = publicAssessmentView({id: row.id, studentId: row.student_id, releaseId: row.release_id, state: row.state}, bundle);
  assert.equal(view.coverage?.supportedSkillCount, expectedScope);
  assert.equal(view.phase, 'assessing');
  assert.equal(view.paused, true);
  if (before.length) assert.equal(row.id, before[0].id);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: /^(Commencer|Reprendre)$/}).waitFor({timeout: 60000});
  const reloaded = await sessions();
  assert.equal(reloaded[0].id, row.id);
  assert.deepEqual(reloaded[0].state.observations, row.state.observations);
  assert.deepEqual(errors, []);
  const report = {base, releaseKey, releaseId: row.release_id, sessionId: row.id,
    bundleChecksum: proof.bundleChecksum, supportedTargets: expectedScope,
    opened: true, reloadPreservedSession: true, qaOnboarded, answersSubmitted: 0, pageErrors: errors,
    limits: 'Technical QA opening and reload only; no completed sitting, lesson completion, calibration or real-student evidence.'};
  writeFileSync(required('PLUME_VERIFY_REPORT'), JSON.stringify(report, null, 2) + '\n', {mode: 0o600});
  console.log(JSON.stringify(report));
} finally {await browser.close();}
