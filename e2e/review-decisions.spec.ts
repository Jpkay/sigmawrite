import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

// Explicit opt-in against the local Supabase fixture, never a hosted database.
test.describe("review decisions across batches", () => {
  test.skip(process.env.E2E_REVIEW_DECISIONS !== "true", "requires local review fixtures");
  test.describe.configure({ mode: "serial" });
  for (const startPage of [1, 2]) {
    test(`saves decisions, handles a duplicate, and drains the queue from page ${startPage}`, async ({ page, baseURL }) => {
      test.setTimeout(180_000);
      expect(new URL(baseURL!).hostname).toBe("localhost");
      execFileSync("psql", ["-h", "127.0.0.1", "-p", "55322", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", "scripts/fixtures/review-decisions.sql"], { env: { ...process.env, PGPASSWORD: "postgres" } });
      await page.goto("/login");
      await page.getByLabel("E-mail ou nom d’utilisateur").fill("review-admin@local.test");
      await page.getByLabel("Mot de passe", { exact: true }).fill("Review1234!");
      await page.getByRole("button", { name: "Se connecter", exact: true }).click();
      await page.waitForURL(/\/admin/);
      await page.goto(`/admin/items/review?page=${startPage}`);
      const seen = new Set<string>();
      let duplicateRejected = false;
      for (let index = 0; index < 27; index++) {
        const prompt = page.getByRole("region", { name: "Aperçu élève", exact: true }).getByText(/^Exercice/);
        await expect(prompt).toBeVisible();
        const text = (await prompt.textContent())!;
        const duplicate = text.startsWith("Exercice en double");
        if (!duplicate) { expect(seen.has(text)).toBe(false); seen.add(text); }
        const rejectsDuplicate = duplicate && !duplicateRejected;
        if (rejectsDuplicate) {
          await page.getByRole("button", { name: "Approuver et continuer", exact: true }).click();
          await expect(page.getByRole("main").getByRole("alert")).toHaveText(/Un exercice identique existe déjà/);
          await expect(prompt).toHaveText(text);
          await page.getByRole("button", { name: "Signaler un problème", exact: true }).click();
          await page.getByLabel("Précisions", { exact: true }).fill("Doublon confirmé dans la banque de test.");
          await page.getByRole("button", { name: "Envoyer le signalement", exact: true }).click();
          await expect(page.getByRole("button", { name: "Envoyer le signalement", exact: true })).toHaveCount(0);
          duplicateRejected = true;
          await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
        } else {
          await page.getByRole("button", { name: "Approuver et continuer", exact: true }).click();
        }
        // Wait for the saved decision and next exercise, without navigation clicks.
        if (index < 26) {
          if (!rejectsDuplicate) await expect(prompt).not.toHaveText(text);
          await expect(page.getByRole("button", { name: "Approuver et continuer", exact: true })).toBeEnabled();
        }
      }
      expect(seen.size).toBe(25);
      expect(duplicateRejected).toBe(true);
      await expect(page.getByText("Tous les exercices de cette sélection ont été examinés.", { exact: true })).toBeVisible();
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
      const persisted = execFileSync("psql", ["-h", "127.0.0.1", "-p", "55322", "-U", "postgres", "-d", "postgres", "-Atc", "select review_status || ':' || count(*) from competency_items where primary_node_id='57000000-0000-4000-8000-000000000001' group by review_status order by review_status"], { env: { ...process.env, PGPASSWORD: "postgres" }, encoding: "utf8" });
      expect(persisted.trim()).toBe("human_approved:26\nrejected:1");
    });
  }
});
