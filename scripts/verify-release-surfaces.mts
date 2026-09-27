/** Non-mutating public release smoke checks; never submit an inquiry or run a job. */
import {strict as assert} from 'node:assert';
import {readFileSync, writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base = new URL(process.env.PLUME_VERIFY_URL!).origin;
assert.equal(new URL(base).protocol, 'https:');
const reportPath = process.env.PLUME_VERIFY_REPORT;
assert.ok(reportPath);
const {secret} = JSON.parse(readFileSync('tmp/plume-verification-bypass.json', 'utf8'));
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  await context.route('**/*', route => route.continue({headers: {...route.request().headers(),
    ...(new URL(route.request().url()).origin === base ? {'x-vercel-protection-bypass': secret} : {})}}));
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 60000});
  assert.equal(response?.status(), 200);
  await page.locator('h1').waitFor();
  const homeTitle = await page.locator('h1').innerText();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.goto(base + '/schools', {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.getByRole('heading', {name: 'Chaque voix mérite les mots pour porter.', exact: true}).waitFor();
  await page.getByLabel('E-mail professionnel', {exact: true}).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  const job = await context.request.get(base + '/api/jobs/passage-automation', {headers: {'x-vercel-protection-bypass': secret}});
  assert.equal(job.status(), 401);
  assert.deepEqual(await job.json(), {error: 'unauthorized'});
  await page.goto(base + '/admin/schools', {waitUntil: 'domcontentloaded', timeout: 60000});
  assert.equal(new URL(page.url()).pathname, '/login');
  assert.deepEqual(errors, []);
  const report = {base, homeTitle, schoolsRendered: true, mobileOverflow: false, anonymousJobStatus: 401,
    adminSchoolAccessDenied: true, inquirySubmissions: 0, jobsTriggered: 0, pageErrors: errors,
    limits: 'Public rendering and unauthenticated authorization only. Valid inquiry submission, email delivery and authenticated admin workflow are not exercised. Turnstile server-secret configuration is a separate gate.'};
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally {await browser.close();}
