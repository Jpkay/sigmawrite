import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./user-management-console.tsx", import.meta.url), "utf8");

describe("teacher signup help text", () => {
  it("requires a valid school code and offers administrator-managed onboarding without promising a parent fallback", () => {
    expect(source).toContain("doit saisir le code valide de son école");
    expect(source).toContain("L’administration peut aussi créer son compte ici");
    expect(source).not.toContain("sans code valide, le compte est créé comme parent");
  });
});
