import { chromium } from "@playwright/test";
import { strict as assert } from "node:assert";
import { CONJUGATION_TEACHING } from "../../src/lib/diagnostic/granular/conjugation-teaching";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [lessonIndex, lesson] of CONJUGATION_TEACHING.entries()) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }), errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4179");
    await page.getByRole("button", { name: "Commencer", exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem("granular-ui-fixture") !== null);
    await page.evaluate(({ id, title }) => {
      const view = JSON.parse(localStorage.getItem("granular-ui-fixture")!);
      view.phase = "learning"; view.paused = true; view.question = null; view.pendingItemId = null;
      view.learningActivities = [{ skillId: "conjugation-fixture", activityId: "fixture-lesson", kind: "instruction", action: "learn", titleFr: title, href: "/student/diagnostic", estimatedMinutes: 5, contentId: id }];
      localStorage.setItem("granular-ui-fixture", JSON.stringify(view)); localStorage.setItem("conjugation-teaching", id);
      localStorage.setItem("teaching-conflict", "1"); localStorage.setItem("teaching-network", "1");
    }, { id: lesson.id, title: lesson.titleFr });
    await page.reload(); await page.getByRole("button", { name: "Commencer cette activité", exact: true }).click();
    await page.getByRole("heading", { name: lesson.titleFr, exact: true }).waitFor();
    await page.getByText(lesson.boundaryFr, { exact: true }).waitFor();
    for (const step of lesson.steps) await page.getByText(step.exampleFr, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `/tmp/granular-conjugation-lesson-${lessonIndex}.png`, fullPage: true });
    await page.getByRole("button", { name: "À moi d’essayer", exact: true }).click();
    for (const [index, exercise] of lesson.practice.entries()) {
      await page.getByText(exercise.promptFr, { exact: true }).waitFor();
      if (index === 0) {
        await page.getByRole("button", { name: "Un indice", exact: true }).click();
        await page.getByText(exercise.hintFr, { exact: true }).waitFor();
      }
      await page.getByLabel("Ta réponse", { exact: true }).fill(index === 0 ? "réponse incorrecte" : exercise.answerFr);
      await page.getByRole("button", { name: "Vérifier ma réponse", exact: true }).click();
      await page.getByText(index === 0 ? "Regarde la correction." : "Oui, c’est ça !", { exact: true }).waitFor();
      await page.getByText(exercise.explanationFr, { exact: true }).waitFor();
      if (index === 0) { await page.reload(); await page.getByText(exercise.explanationFr, { exact: true }).waitFor(); }
      await page.getByRole("button", { name: index === lesson.practice.length - 1 ? "Terminer l’entraînement" : "Exercice suivant", exact: true }).click();
    }
    await page.getByRole("status").filter({ hasText: "Ton entraînement est enregistré" }).waitFor();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("granular-ui-fixture")!));
    assert.equal(state.teaching, null); assert.deepEqual(state.results, []); assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Six conjugation lessons / 40 exercises passed: mobile layout, examples, hints, corrections, reload and completion. Browser fixture only; no authenticated backend or mastery claim.");
} finally { await browser.close(); }
