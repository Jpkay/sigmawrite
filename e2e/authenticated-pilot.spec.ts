import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.describe("seeded pilot role journeys", () => {
  test.skip(process.env.E2E_AUTHENTICATED !== "true", "requires isolated seeded Supabase");
  test.describe.configure({ mode: "serial" });

  async function login(page: Page, email: string, home: RegExp) {
    await page.goto("/login");
    await page.getByLabel("E-mail ou nom d’utilisateur").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(process.env.E2E_DEMO_PASSWORD ?? "Demo-2026-Strong!");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(home, { timeout: 15_000 });
  }

  test("student security, vocabulary and mobile shell are accessible", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await login(page, "demo.eleve@reading-to-learn.test", /\/student/);
    for (const route of ["/student/settings", "/student/vocabulary"]) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(axe.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
    }
  });

  test("parent can reach linked-child security and privacy", async ({ page }) => {
    await login(page, "parent.demo@reading-to-learn.test", /\/parent/);
    await page.goto("/parent/settings");
    await expect(page.getByText("Émettre un mot de passe temporaire")).toBeVisible();
    await page.goto("/parent/privacy");
    await expect(page.locator("main")).toBeVisible();
  });

  test("teacher can reach class operations", async ({ page }) => {
    await login(page, "prof.demo@reading-to-learn.test", /\/teacher/);
    await page.goto("/teacher/classes");
    await expect(page.getByRole("heading", { name: /classes/i })).toBeVisible();
  });

  test("administrator can record feedback-pilot agreement while provisioning a student", async ({ page }) => {
    await login(page, "admin.demo@reading-to-learn.test", /\/admin/);
    await page.goto("/admin/users");
    const feedbackOption = page.getByLabel("Inscrire au pilote de feedback pendant 30 jours");
    await expect(feedbackOption).toBeVisible();
    await feedbackOption.check();
    await expect(page.getByLabel("Accord donné par")).toHaveValue("student");
    await expect(page.getByText("Cet accord est distinct de l’accès scolaire normal.")).toBeVisible();
  });
});
