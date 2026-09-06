import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Requires local scripts/fixtures/review-browser.sql; never enable against production.
test.describe("student previews in content review", () => {
  test.skip(process.env.E2E_REVIEW_PREVIEW !== "true", "requires local review fixtures");
  test("can try, reveal, edit and cancel without approving an exercise", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail ou nom d’utilisateur").fill("review-admin@local.test");
    await page.getByLabel("Mot de passe", { exact: true }).fill("Review1234!");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await page.waitForURL(/\/admin/);
    await page.goto("/admin/items/review");
    await page.getByRole("button", { name: "Voir le corrigé", exact: true }).waitFor();
    if (!await page.getByRole("radio").count()) await page.getByRole("button", { name: "Passer", exact: true }).click();
    await expect(page.getByText("On observe Marie de l’extérieur.", { exact: true })).toBeHidden();
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Vérifier ma réponse", exact: true }).click();
    await expect(page.getByText("Pas encore — essaie à nouveau.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Réessayer", exact: true }).click();
    await page.getByRole("radio").last().click();
    await page.getByRole("button", { name: "Vérifier ma réponse", exact: true }).click();
    await expect(page.getByText("Bonne réponse.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Voir le corrigé", exact: true }).click();
    await expect(page.getByText("On observe Marie de l’extérieur.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Modifier l’exercice", exact: true }).click();
    const prompt = page.getByRole("textbox", { name: "Énoncé", exact: true });
    const originalPrompt = await prompt.inputValue();
    await prompt.fill(`${originalPrompt} `);
    await page.getByRole("button", { name: "Enregistrer et voir l’aperçu" }).click();
    await expect(page.getByText("Modifications enregistrées. L’exercice reste à approuver.")).toBeVisible();
    await page.getByRole("button", { name: "Approuver et continuer", exact: true }).click();
    await expect(page.getByRole("button", { name: "Précédent", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Annuler la décision", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("radio")).toHaveCount(3);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
    await page.goto("/admin/content/review");
    await expect(page.getByRole("button", { name: "Voir le corrigé", exact: true }).first()).toBeVisible();
    await page.goto("/admin/dictations");
    await expect(page.getByRole("button", { name: "Voir la transcription", exact: true })).toBeVisible();
  });
});
