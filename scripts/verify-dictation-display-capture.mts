/** Technical QA route visits only: verify catalog/session copy, never submit a dictation. */
import {strict as assert} from 'node:assert';
import {readFileSync, writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {DICTATION_COPY} from '../src/lib/diagnostic/granular/dictation-display';
config({path: '.env.local', quiet: true});
const required = (name: string) => {const value = process.env[name]; assert.ok(value, `${name} required`); return value;};
const base = new URL(required('PLUME_VERIFY_URL')).origin;
assert.equal(new URL(base).protocol, 'https:');
const qa = JSON.parse(readFileSync(required('PLUME_VERIFY_QA_FILE'), 'utf8'));
assert.match(qa.username, /^doves\.granular\..*\.qa$/);
const db = createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {auth: {persistSession: false}});
async function submittedCount() {
  const result = await db.from('dictation_attempts').select('id', {count: 'exact', head: true}).eq('student_id', qa.studentId).not('submitted_at', 'is', null);
  if (result.error) throw result.error;
  return result.count;
}
const before = await submittedCount();
const user = await db.auth.admin.getUserById(qa.authUserId);
if (user.error) throw user.error;
const link = await db.auth.admin.generateLink({type: 'magiclink', email: user.data.user.email!});
if (link.error) throw link.error;
const cookies = new Map<string, string>();
const auth = createServerClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {cookies: {
  getAll: () => [...cookies].map(([name, value]) => ({name, value})),
  setAll: values => values.forEach(value => cookies.set(value.name, value.value)),
}});
const verified = await auth.auth.verifyOtp({token_hash: link.data.properties.hashed_token, type: 'magiclink'});
if (verified.error) throw verified.error;
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  const {secret} = JSON.parse(readFileSync('tmp/plume-verification-bypass.json', 'utf8'));
  await context.route('**/*', route => route.continue({headers: {...route.request().headers(),
    ...(new URL(route.request().url()).origin === base ? {'x-vercel-protection-bypass': secret} : {})}}));
  await context.addCookies([...cookies].map(([name, value]) => ({name, value, domain: new URL(base).hostname, path: '/', secure: true, sameSite: 'Lax' as const})));
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/student/dictee', {waitUntil: 'domcontentloaded', timeout: 60000});
  const start = page.getByRole('link', {name: DICTATION_COPY.start, exact: true}).first();
  await start.waitFor({timeout: 60000}).catch(async error => {
    console.log(JSON.stringify({path: new URL(page.url()).pathname, mainText: (await page.locator('main').innerText()).slice(0, 2000), pageErrors: errors}));
    throw error;
  });
  const titles = await page.locator('h2').allTextContents();
  const catalog = await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id', qa.studentId).eq('boundary', 'legacy:dictation-catalog');
  if (catalog.error) throw catalog.error;
  assert.ok(catalog.data.some(row => [...titles, DICTATION_COPY.notAttempted, DICTATION_COPY.catalogError].every(text => row.text_fragments.includes(text))));
  const path = await start.getAttribute('href'); assert.ok(path);
  await start.click();
  await page.getByRole('button', {name: DICTATION_COPY.listenAll, exact: true}).waitFor({timeout: 60000});
  const title = await page.locator('h1').innerText();
  const session = await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id', qa.studentId).eq('boundary', 'legacy:dictation');
  if (session.error) throw session.error;
  const expected = [title, DICTATION_COPY.listenAll, DICTATION_COPY.beginWriting, DICTATION_COPY.transcriptPlaceholder, ...DICTATION_COPY.introSteps];
  assert.ok(session.data.some(row => expected.every(text => row.text_fragments.includes(text))));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.equal(await submittedCount(), before);
  assert.deepEqual(errors, []);
  const report = {base, catalogTitles: titles.length, catalogDisplayCaptured: true, sessionDisplayCaptured: true, dictationPath: path,
    answersSubmitted: 0, submittedCountUnchanged: true, mobileOverflow: false, pageErrors: errors,
    limits: 'Catalog and initial player display on technical QA. One unsubmitted attempt may be created. No scoring, justification, playback or complete-history claim.'};
  writeFileSync(required('PLUME_VERIFY_REPORT'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {await browser.close();}
