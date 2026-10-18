import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Roadmap 2026-10 D.7 + D.2: "Mon trésor de mots" and a "Rappel éclair" burst on a phone. */
test.describe("student words", () => {
  test.skip(process.env.E2E_AUTHENTICATED !== "true", "requires isolated seeded Supabase");

  async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("E-mail ou nom d’utilisateur").fill("demo.eleve@reading-to-learn.test");
    await page.getByLabel("Mot de passe", { exact: true }).fill(process.env.E2E_DEMO_PASSWORD ?? "Demo-2026-Strong!");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/student/, { timeout: 15_000 });
  }

  async function accessible(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
  }

  test("the treasure groups words by interest with where they were first met, and the rappel éclair never shows due counts", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await login(page);
    await page.goto("/student/vocabulary");
    await page.waitForLoadState("networkidle");
    // The seeded demo student may still be sent to the diagnostic by the assessment gate;
    // the word pages are then not reachable yet, and only the shell is checked.
    const treasure = page.getByRole("heading", { name: "Mon trésor de mots" });
    if (!(await treasure.isVisible())) {
      await expect(page).toHaveURL(/\/student\/(diagnostic|onboarding)/);
      await accessible(page);
      return;
    }
    await expect(page.getByText("Rappel éclair", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Football/ })).toBeVisible();
    await expect(page.getByText("La raison principale est l'opportunité économique.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\d+ à réviser/);
    await accessible(page);

    await page.getByRole("link", { name: /C’est parti/ }).click();
    await expect(page).toHaveURL(/\/student\/vocabulary\/rappel/);
    await expect(page.getByText(/Nouveau mot|Rappel éclair|Tes mots sont au chaud|diagnostic/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/en retard|\d+ à réviser/);
    if (await page.getByText("Nouveau mot").count()) {
      await expect(page.getByText("Tu l’as rencontré ici")).toBeVisible();
      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(page.getByText("Ce que ça veut dire")).toBeVisible();
      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(page.getByText("Remets les lettres dans l’ordre")).toBeVisible();
    }
    await accessible(page);
  });
});
