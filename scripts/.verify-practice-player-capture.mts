import { strict as assert } from "node:assert";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { chromium, type Page } from "playwright";
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
const readOnly = process.env.PLUME_VERIFY_READ_ONLY === "true";
const submitRetries = Number(process.env.PLUME_VERIFY_SUBMIT_RETRIES ?? "1");
assert.ok(Number.isInteger(submitRetries) && submitRetries >= 0 && submitRetries <= 1, "PLUME_VERIFY_SUBMIT_RETRIES must be 0 or 1");
const answer = "Je choisis volontairement une réponse fausse pour ce contrôle.";
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
let page: Page | null = null;
const submissionAlerts: string[] = [];
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
  await page.goto(`${base}/student/practice/${practiceNodeId}`);

  await page.getByRole("heading", { name: PRACTICE_PLAYER_COPY.lessonHeading, exact: true }).waitFor({ timeout: 60_000 });
  const start = page.getByRole("button", { name: /^Commencer les \d+ exercices$/u });
  const startLabel = (await start.innerText()).trim();
  await start.click();
  await page.getByRole("heading", { name: PRACTICE_PLAYER_COPY.exerciseHeading, exact: true }).waitFor({ timeout: 60_000 });
  const position = (await page.getByText(/^Exercice 1 sur \d+$/u).textContent())?.trim() ?? "";

  const hintButton = page.getByRole("button", { name: PRACTICE_PLAYER_COPY.hint, exact: true });
  await hintButton.click();
  const visibleHints = (await page.locator("div.border-l-2.border-secondary p").allInnerTexts()).map((text) => text.trim()).filter(Boolean);
  assert.ok(visibleHints.length > 0, "At least one derived hint must be visible");

  const expectedPlayerFragments = [
    PRACTICE_PLAYER_COPY.lessonHeading,
    PRACTICE_PLAYER_COPY.exerciseHeading,
    startLabel,
    position,
    ...visibleHints,
  ];
  const { data: playerJournal, error: playerJournalError } = await db.from("student_material_delivery_journal")
    .select("boundary,text_fragments")
    .eq("student_id", qa.studentId)
    .eq("boundary", "legacy:practice-player");
  if (playerJournalError) throw playerJournalError;
  const playerRows = playerJournal as Array<{ boundary: string; text_fragments: string[] }>;
  const missingByRow = playerRows.map((row) => expectedPlayerFragments.filter((fragment) => !row.text_fragments.includes(fragment)));
  const playerCaptureRecorded = missingByRow.some((missing) => missing.length === 0);
  const playerCaptureDiagnosis = {
    expected: expectedPlayerFragments,
    rowCount: playerRows.length,
    missingByRow,
  };

  if (readOnly) {
    const { data: existingAttempt, error: existingAttemptError } = await db.from("competency_attempts")
      .select("id,item_id,is_correct")
      .eq("student_id", qa.studentId)
      .eq("node_id", practiceNodeId)
      .eq("answer_text", answer)
      .order("attempted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingAttemptError) throw existingAttemptError;
    const { data: existingFeedback, error: existingFeedbackError } = await db.from("student_material_delivery_journal")
      .select("boundary,text_fragments")
      .eq("student_id", qa.studentId)
      .in("boundary", ["legacy:practice-feedback", "legacy:practice-feedback-display"]);
    if (existingFeedbackError) throw existingFeedbackError;
    const feedbackRows = existingFeedback as Array<{ boundary: string; text_fragments: string[] }>;
    const rawFeedback = existingAttempt
      ? feedbackRows.find((row) => row.boundary === "legacy:practice-feedback" && row.text_fragments.includes(existingAttempt.item_id))
      : undefined;
    const feedbackFr = rawFeedback?.text_fragments.find((fragment) => fragment !== existingAttempt?.item_id) ?? null;
    const formattedFeedbackRecorded = Boolean(feedbackFr && feedbackRows.some((row) =>
      row.boundary === "legacy:practice-feedback-display"
      && row.text_fragments.includes(PRACTICE_PLAYER_COPY.incorrect)
      && row.text_fragments.includes(feedbackFr)));
    const report = {
      base,
      practiceNodeId,
      accountKind: "non-demo-qa",
      readOnly: true,
      playerCaptureRecorded,
      playerCaptureDiagnosis,
      existingIncorrectCapture: {
        found: Boolean(existingAttempt),
        incorrect: existingAttempt?.is_correct === false,
        rawFeedbackRecorded: Boolean(rawFeedback),
        formattedFeedbackRecorded,
        feedbackFr,
      },
      attemptsSubmitted: 0,
      pageErrors,
    };
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } else {
    assert.ok(playerCaptureRecorded, `The pre-render player projection is incomplete: ${JSON.stringify(playerCaptureDiagnosis)}`);

    const answerBox = page.locator("textarea");
    assert.equal(await answerBox.count(), 1, "The bounded QA target must expose one text response");
    await answerBox.fill(answer);
    const outcome = page.getByText(PRACTICE_PLAYER_COPY.incorrect, { exact: true });
    const validate = page.getByRole("button", { name: PRACTICE_PLAYER_COPY.validate, exact: true });
    const learnerAlert = page.locator('main p[role="alert"]').filter({ hasText: /\S/u }).first();
    const waitForSubmitResult = () => Promise.race([
      outcome.waitFor({ timeout: 35_000 }).then(() => "outcome" as const),
      learnerAlert.waitFor({ timeout: 35_000 }).then(() => "alert" as const),
    ]);
    await validate.click();
    let submitResult = await waitForSubmitResult();
    if (submitResult === "alert") {
      submissionAlerts.push((await learnerAlert.innerText()).trim());
      const { count: attemptsAfterFailure, error: attemptsAfterFailureError } = await db.from("competency_attempts")
        .select("id", { count: "exact", head: true })
        .eq("student_id", qa.studentId)
        .eq("node_id", practiceNodeId);
      if (attemptsAfterFailureError) throw attemptsAfterFailureError;
      assert.equal(attemptsAfterFailure, attemptsBefore, "A failed response inserted an attempt; the verifier will not retry it");
      if (submitRetries === 0) throw new Error(`Practice submission returned a learner error: ${submissionAlerts[0]}`);
      await validate.waitFor({ state: "visible", timeout: 5_000 });
      assert.equal(await validate.isEnabled(), true, "The same retained answer is not retryable");
      await validate.click();
      await learnerAlert.waitFor({ state: "hidden", timeout: 5_000 });
      submitResult = await waitForSubmitResult();
      if (submitResult === "alert") {
        submissionAlerts.push((await learnerAlert.innerText()).trim());
        throw new Error(`Practice submission returned learner errors twice: ${submissionAlerts.join(" | ")}`);
      }
    }
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
      exactStringsRecorded: playerCaptureRecorded,
      diagnosis: playerCaptureDiagnosis,
    },
    submittedAttempt: {
      countDelta: 1,
      incorrect: true,
      feedbackFr,
      feedbackPanelText,
      rawFeedbackRecorded: true,
      formattedFeedbackRecorded: true,
      transientSubmitAlerts: submissionAlerts,
    },
    completionTriggered: false,
    completeHistoryClaimed: false,
    pageErrors,
  };
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  }
} catch (error) {
  const sanitize = (value: string) => value
    .replaceAll(user.data.user.email ?? "", "[redacted-email]")
    .replaceAll(qa.username, "[redacted-user]")
    .replace(/(access_token|refresh_token|token_hash)=[^\s&]+/giu, "$1=[redacted]")
    .slice(0, 8_000);
  const visibleMainText = page
    ? sanitize(await page.locator("main").innerText().catch(() => ""))
    : "";
  const visibleAlerts = page
    ? (await page.locator('main p[role="alert"]').filter({ hasText: /\S/u }).allInnerTexts().catch(() => [])).map(sanitize)
    : [];
  const { data: latestSessions, error: latestSessionsError } = await db.from("practice_learning_sessions")
    .select("status,started_at,expires_at,completed_at,planned_exercises,completed_exercises")
    .eq("student_id", qa.studentId)
    .eq("node_id", practiceNodeId)
    .order("started_at", { ascending: false })
    .limit(3);
  const { data: latestAttempts, error: latestAttemptsError } = await db.from("competency_attempts")
    .select("is_correct,attempted_at,exercise_position")
    .eq("student_id", qa.studentId)
    .eq("node_id", practiceNodeId)
    .order("attempted_at", { ascending: false })
    .limit(3);
  const failureReport = {
    base,
    practiceNodeId,
    accountKind: "non-demo-qa",
    readOnly,
    failedAt: new Date().toISOString(),
    error: sanitize(error instanceof Error ? error.message : String(error)),
    visibleMainText,
    visibleAlerts,
    latestSessions: latestSessionsError ? { error: latestSessionsError.message } : latestSessions,
    latestAttempts: latestAttemptsError ? { error: latestAttemptsError.message } : latestAttempts,
    submissionAlerts: submissionAlerts.map(sanitize),
  };
  writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
  console.error(JSON.stringify(failureReport));
  throw error;
} finally {
  await browser.close();
}
