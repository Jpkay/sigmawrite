/** Actual isolated Next application, cookies and server actions. The retry test
 * drops a response only after the real server has processed its request. */
import { chromium, expect } from "@playwright/test";
import { strict as assert } from "node:assert";
import type { AssessmentSession } from "../session";
export async function runNativeBrowserJourney(password: string, advanceClock: (milliseconds: number) => void, inspectState: () => Promise<AssessmentSession>) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:56300/login?next=/student/diagnostic");
    await page.getByLabel("E-mail ou nom d’utilisateur").fill("first@native-test.invalid");
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/student\/diagnostic/, { timeout: 60_000 });
    await page.getByRole("button", { name: "Commencer", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Question 1", exact: true })).toBeVisible();
    const textAnswer = page.getByLabel("Ta réponse", { exact: true });
    if (await textAnswer.count()) await textAnswer.fill("fixture");
    else await page.getByRole("radio", { name: "fixture", exact: true }).check();
    const support = page.locator('input[name="textual-support"]');
    if (await support.count()) await page.getByRole("radio", { name: /^Le repère de ce texte de test est/ }).check();
    let replay: { body: string; action: string; contentType: string } | null = null;
    let dropped = false;
    await page.route("**/student/diagnostic", async route => {
      const request = route.request(), body = request.postData() ?? "";
      if (!dropped && request.method() === "POST" && body.includes('"type":"answer"')) {
        dropped = true;
        replay = { body, action: request.headers()["next-action"], contentType: request.headers()["content-type"] };
        const responses = await Promise.all([route.fetch(), route.fetch()]);
        for (const response of responses) assert.equal(response.status(), 200, "Both concurrent submissions must reach the real server before losing their responses");
        await route.abort("failed");
      } else await route.continue();
    });
    advanceClock(30_000);
    await page.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Ta réponse est conservée" })).toBeVisible();
    const acceptedBeforeRetry = await inspectState();
    assert.equal(acceptedBeforeRetry.observations.length, 1);
    if (await textAnswer.count()) await expect(textAnswer).toHaveValue("fixture");
    else await expect(page.getByRole("radio", { name: "fixture", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Question 2", exact: true })).toBeVisible();
    assert.deepEqual((await inspectState()).observations, acceptedBeforeRetry.observations, "Retry must not duplicate or change accepted evidence");
    await page.unroute("**/student/diagnostic");
    console.log("Concurrent real submissions and lost responses recovered through the UI; accepted answer remained unique.");
    await page.getByRole("button", { name: "Faire une pause", exact: true }).click();
    advanceClock(3 * 60 * 60 * 1000);
    await page.reload();
    await page.getByRole("button", { name: "Reprendre", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Question 2", exact: true })).toBeVisible();
    advanceClock(30_000);
    await page.getByRole("button", { name: "Je ne sais pas", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Question 3", exact: true })).toBeVisible();
    const resultsHeading = page.getByRole("heading", { name: "Tes acquis et tes prochaines étapes", exact: true });
    for (let number = 3; number <= 75; number++) {
      await expect(page.getByRole("heading", { name: `Question ${number}`, exact: true }).or(resultsHeading)).toBeVisible();
      if (await resultsHeading.isVisible()) break;
      const correct = number % 6 === 0;
      if (await textAnswer.count()) await textAnswer.fill(correct ? "fixture" : "incorrect");
      else await page.getByRole("radio", { name: correct ? "fixture" : "Autre réponse de test 1", exact: true }).check();
      if (await support.count()) await page.getByRole("radio", { name: /^Le repère de ce texte de test est/ }).check();
      advanceClock(30_000);
      await page.getByRole("button", { name: "Valider", exact: true }).click();
      if (number % 20 === 0) console.log(`Browser saved ${number} diagnostic responses/skips through actual server actions.`);
    }
    await expect(page.getByRole("heading", { name: "Tes acquis et tes prochaines étapes", exact: true })).toBeVisible();
    await page.reload();
    const lessonButton = page.getByRole("button", { name: "Commencer cette activité", exact: true }).first();
    const lessonTitle = await lessonButton.locator("xpath=ancestor::li[1]").locator("p").first().textContent();
    assert.ok(lessonTitle);
    await lessonButton.click();
    await page.getByRole("button", { name: "À moi d’essayer", exact: true }).click();
    await page.getByLabel("Ta réponse", { exact: true }).fill("fixture");
    await page.getByRole("button", { name: "Vérifier ma réponse", exact: true }).click();
    await page.getByRole("button", { name: "Terminer l’entraînement", exact: true }).click();
    await page.locator("li").filter({ has: page.getByText(lessonTitle, { exact: true }) }).getByRole("button", { name: "Vérifier ce point", exact: true }).click();
    if (await textAnswer.count()) await textAnswer.fill("fixture");
    else await page.getByRole("radio", { name: "fixture", exact: true }).check();
    if (await support.count()) await page.getByRole("radio", { name: /^Le repère de ce texte de test est/ }).check();
    await page.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(page.getByText("Ta réponse est enregistrée et ton bilan a été mis à jour.", { exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: "/tmp/granular-native-next-question.png", fullPage: true });
    assert.ok(replay, "Capture a real action request for ownership verification");
    const captured = replay as { body: string; action: string; contentType: string };
    const beforeForeignRequest = await inspectState();
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto("http://127.0.0.1:56300/login?next=/student/diagnostic");
    await otherPage.getByLabel("E-mail ou nom d’utilisateur").fill("second@native-test.invalid");
    await otherPage.getByLabel("Mot de passe", { exact: true }).fill(password);
    await otherPage.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(otherPage).toHaveURL(/\/student\/diagnostic/, { timeout: 60_000 });
    await expect(otherPage.getByRole("button", { name: "Commencer", exact: true })).toBeVisible({ timeout: 60_000 });
    const foreign = await otherContext.request.post("http://127.0.0.1:56300/student/diagnostic", {
      headers: { "next-action": captured.action, "content-type": captured.contentType, origin: "http://127.0.0.1:56300" }, data: captured.body,
    });
    const foreignBody = await foreign.text();
    assert.ok(foreignBody.includes("Diagnostic introuvable."), "A valid second student cannot use the first student's session identifier");
    assert.deepEqual(await inspectState(), beforeForeignRequest, "Foreign action must not change the owner's state");
    await otherContext.close();
    console.log("Real server action rejected another authorized student's session request without changing the owner's state.");
    console.log("Actual Next browser login, assessment, pause/reload/resume, results, lesson, practice and independent-check update passed with an isolated accelerated assessment clock.");
  } finally { await browser.close(); }
}
