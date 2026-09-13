import { strict as assert } from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { chromium } from "playwright";
import { PRACTICE_PLAYER_COPY } from "../src/lib/diagnostic/granular/practice-player-display";

config({ path: ".env.local", quiet: true });

const required = (name: string) => {
  const value = process.env[name];
  assert.ok(value, `${name} is required`);
  return value;
};
const base = required("PLUME_VERIFY_URL").replace(/\/$/u, "");
const reportPath = required("PLUME_VERIFY_REPORT");
const practiceNodeId = process.env.PLUME_VERIFY_PRACTICE_NODE ?? "7633d589-b98f-59ee-918f-0670c1d8f813";
const qa = JSON.parse(readFileSync("tmp/plume-granular-capture-qa.json", "utf8")) as {
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

const { count: attemptsBefore, error: beforeError } = await db.from("competency_attempts")
  .select("id", { count: "exact", head: true })
  .eq("student_id", qa.studentId)
  .eq("node_id", practiceNodeId);
if (beforeError) throw beforeError;

const browser = await chromium.launch({ channel: "chrome", headless: true });
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

  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${base}/student/practice/${practiceNodeId}`);

  await page.getByRole("heading", { name: PRACTICE_PLAYER_COPY.lessonHeading, exact: true }).waitFor({ timeout: 60_000 });
  const start = page.getByRole("button", { name: /^Commencer les \d+ exercices$/u });
  const startLabel = (await start.innerText()).trim();
  await start.click();
  await page.getByRole("heading", { name: PRACTICE_PLAYER_COPY.exerciseHeading, exact: true }).waitFor({ timeout: 60_000 });
  const position = (await page.getByText(/^Exercice 1 sur \d+$/u).innerText()).trim();

  const hintButton = page.getByRole("button", { name: PRACTICE_PLAYER_COPY.hint, exact: true });
  await hintButton.click();
  const visibleHints = (await page.locator("div.border-l-2.border-secondary p").allInnerTexts()).map((text) => text.trim()).filter(Boolean);
  assert.ok(visibleHints.length > 0, "At least one derived hint must be visible");

  const answer = "Je choisis volontairement une réponse fausse pour ce contrôle.";
  const answerBox = page.locator("textarea");
  assert.equal(await answerBox.count(), 1, "The bounded QA target must expose one text response");
  await answerBox.fill(answer);
  await page.getByRole("button", { name: PRACTICE_PLAYER_COPY.validate, exact: true }).click();
  const outcome = page.getByText(PRACTICE_PLAYER_COPY.incorrect, { exact: true });
  await outcome.waitFor({ timeout: 60_000 });
  const feedbackPanelText = (await outcome.locator("..").innerText()).trim();
  const feedbackFr = (await outcome.locator("..").locator("p.text-muted-foreground").first().innerText()).trim();
  assert.ok(feedbackFr, "The wrong response must return a visible validator correction");

  const { count: attemptsAfter, error: afterError } = await db.from("competency_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", qa.studentId)
    .eq("node_id", practiceNodeId);
  if (afterError) throw afterError;
  assert.equal(attemptsAfter, (attemptsBefore ?? 0) + 1, "Exactly one QA attempt must be stored");
  const { data: attempt, error: attemptError } = await db.from("competency_attempts")
    .select("id,item_id,is_correct,answer_text")
    .eq("student_id", qa.studentId)
    .eq("node_id", practiceNodeId)
    .eq("answer_text", answer)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();
  if (attemptError) throw attemptError;
  assert.equal(attempt.is_correct, false);

  const boundaries = ["legacy:practice", "legacy:practice-player", "legacy:practice-feedback", "legacy:practice-feedback-display"];
  const { data: journal, error: journalError } = await db.from("student_material_delivery_journal")
    .select("boundary,text_fragments")
    .eq("student_id", qa.studentId)
    .in("boundary", boundaries);
  if (journalError) throw journalError;
  const rows = journal as Array<{ boundary: string; text_fragments: string[] }>;
  const contains = (boundary: string, fragments: string[]) => rows.some((row) =>
    row.boundary === boundary && fragments.every((fragment) => row.text_fragments.includes(fragment)));
  assert.ok(contains("legacy:practice-player", [
    PRACTICE_PLAYER_COPY.lessonHeading,
    PRACTICE_PLAYER_COPY.exerciseHeading,
    startLabel,
    position,
    ...visibleHints,
  ]), "The pre-render player projection must contain every checked display string");
  assert.ok(contains("legacy:practice-feedback-display", [PRACTICE_PLAYER_COPY.incorrect, feedbackFr]), "Formatted feedback must be journaled exactly");
  const feedbackRecorded = rows.some((row) => row.boundary === "legacy:practice-feedback"
    && row.text_fragments.includes(attempt.item_id)
    && row.text_fragments.includes(feedbackFr));
  assert.ok(feedbackRecorded, "Validator feedback must be journaled with the item");
  assert.deepEqual(pageErrors, []);

  const report = {
    base,
    practiceNodeId,
    accountKind: "non-demo-qa",
    pageCapture: {
      boundary: "legacy:practice-player",
      lessonHeading: PRACTICE_PLAYER_COPY.lessonHeading,
      startLabel,
      position,
      derivedHints: visibleHints,
      exactStringsRecorded: true,
    },
    submittedAttempt: {
      countDelta: 1,
      incorrect: true,
      feedbackFr,
      feedbackPanelText,
      rawFeedbackRecorded: true,
      formattedFeedbackRecorded: true,
    },
    completionTriggered: false,
    completeHistoryClaimed: false,
    pageErrors,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
