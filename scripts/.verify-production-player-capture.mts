import { strict as assert } from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { chromium, type Page } from "playwright";
import { EXERCISE_CONTROL_COPY } from "../src/lib/content/exercise-control-copy";
import { PRODUCTION_PLAYER_COPY } from "../src/lib/diagnostic/granular/production-player-display";

config({ path: ".env.local", quiet: true });

const required = (name: string) => {
  const value = process.env[name];
  assert.ok(value, `${name} is required`);
  return value;
};

const base = required("PLUME_VERIFY_URL").replace(/\/$/u, "");
const reportPath = required("PLUME_VERIFY_REPORT");
const productionNodeId = required("PLUME_VERIFY_PRODUCTION_NODE");
const qaPath = process.env.PLUME_VERIFY_QA_FILE ?? "tmp/plume-granular-capture-qa.json";
const qa = JSON.parse(readFileSync(qaPath, "utf8")) as {
  authUserId: string;
  studentId: string;
  username: string;
};
assert.ok(!/demo/i.test(qa.username), "A non-demo QA account is required");

const db = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const user = await db.auth.admin.getUserById(qa.authUserId);
if (user.error) throw user.error;
assert.ok(user.data.user.email, "QA account email is required");
const link = await db.auth.admin.generateLink({ type: "magiclink", email: user.data.user.email });
if (link.error) throw link.error;
const cookies = new Map<string, string>();
const signed = createServerClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
  cookies: {
    getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
    setAll: (values) => values.forEach(({ name, value }) => cookies.set(name, value)),
  },
});
const auth = await signed.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
if (auth.error) throw auth.error;

const submissionCount = async () => {
  const { count, error } = await db.from("independent_production_submissions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", qa.studentId);
  if (error) throw error;
  return count ?? 0;
};
const submissionsBefore = await submissionCount();
const browser = await chromium.launch({ channel: "chrome", headless: true });
let page: Page | null = null;

try {
  const context = await browser.newContext();
  if (existsSync("tmp/plume-verification-bypass.json")) {
    const bypass = JSON.parse(readFileSync("tmp/plume-verification-bypass.json", "utf8")) as { secret: string };
    await context.route("**/*", (route) => {
      const sameOrigin = new URL(route.request().url()).origin === new URL(base).origin;
      return route.continue({
        headers: {
          ...route.request().headers(),
          ...(sameOrigin ? { "x-vercel-protection-bypass": bypass.secret } : {}),
        },
      });
    });
  }
  await context.addCookies([...cookies].map(([name, value]) => ({
    name,
    value,
    domain: new URL(base).hostname,
    path: "/",
    secure: new URL(base).protocol === "https:",
    sameSite: "Lax" as const,
  })));

  page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${base}/student/production/${productionNodeId}`);
  await page.getByText(PRODUCTION_PLAYER_COPY.eyebrow, { exact: true }).waitFor({ timeout: 60_000 });

  const sourceText = async (locator: ReturnType<Page["locator"]>) =>
    ((await locator.textContent()) ?? "").trim();
  const heading = await sourceText(page.locator("header h1"));
  const description = await sourceText(page.locator("header p.text-muted-foreground"));
  const prompt = await sourceText(page.locator("div.border-l-2.border-primary p.font-medium"));
  const objective = await sourceText(page.getByText(/^Objectif : \d+–\d+$/u));
  const rangeHelp = await sourceText(page.getByText(/^Écris entre \d+ et \d+ mots\.$/u));
  const wordCount = await sourceText(page.getByText(/^\d+ mots?$/u));
  const genreLabels = await page.locator('[role="radiogroup"] [role="radio"]').allTextContents();
  const placeholder = await page.locator("textarea").getAttribute("placeholder");
  assert.ok(heading && prompt && objective && rangeHelp && wordCount && placeholder, "The production task did not render completely");

  const expected = [
    ...Object.values(PRODUCTION_PLAYER_COPY),
    EXERCISE_CONTROL_COPY.accentsLabel,
    ...EXERCISE_CONTROL_COPY.accents,
    heading,
    ...(description ? [description] : []),
    prompt,
    ...genreLabels.map((label) => label.trim()).filter(Boolean),
    placeholder,
    wordCount,
    objective,
    rangeHelp,
  ];
  const { data: journal, error: journalError } = await db.from("student_material_delivery_journal")
    .select("text_fragments")
    .eq("student_id", qa.studentId)
    .eq("boundary", "legacy:production-task");
  if (journalError) throw journalError;
  const rows = journal as Array<{ text_fragments: string[] }>;
  const missingByRow = rows.map((row) => expected.filter((fragment) => !row.text_fragments.includes(fragment)));
  const exactTaskCaptureRecorded = missingByRow.some((missing) => missing.length === 0);
  assert.ok(exactTaskCaptureRecorded, `The production-player projection is incomplete: ${JSON.stringify({ expected, missingByRow })}`);
  assert.equal(await submissionCount(), submissionsBefore, "The read-only production verifier must not store writing");
  assert.deepEqual(pageErrors, []);

  const report = {
    base,
    productionNodeId,
    accountKind: "non-demo-qa",
    mode: "task-render-only",
    exactTaskCaptureRecorded,
    journalRows: rows.length,
    expectedFragments: expected,
    missingByRow,
    submissionCountDelta: 0,
    pageErrors,
    completeHistoryClaimed: false,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  const sanitize = (value: string) => value
    .replaceAll(user.data.user.email ?? "", "[redacted-email]")
    .replaceAll(qa.username, "[redacted-user]")
    .replace(/(access_token|refresh_token|token_hash)=[^\s&]+/giu, "$1=[redacted]")
    .slice(0, 8_000);
  const report = {
    base,
    productionNodeId,
    accountKind: "non-demo-qa",
    mode: "task-render-only",
    failedAt: new Date().toISOString(),
    error: sanitize(error instanceof Error ? error.message : String(error)),
    visibleMainText: page ? sanitize(await page.locator("main").innerText().catch(() => "")) : "",
    submissionCountDelta: (await submissionCount()) - submissionsBefore,
    completeHistoryClaimed: false,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report));
  throw error;
} finally {
  await browser.close();
}
