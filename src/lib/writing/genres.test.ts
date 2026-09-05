import { describe, expect, it } from "vitest";
import { genrePrompt, genresForGrade, genreSpec } from "./genres";

describe("writing genres by grade", () => {
  it("offers narration early and argumentation from 4e", () => {
    expect(genresForGrade(6)).toContain("recit");
    expect(genresForGrade(6)).not.toContain("argumentation");
    expect(genresForGrade(8)).toContain("argumentation");
    expect(genresForGrade(9)[0]).toBe("argumentation");
  });
  it("grows the length band with the genre", () => {
    expect(genreSpec("recit").maximumWords).toBeGreaterThan(100);
    expect(genreSpec("argumentation").minimumWords).toBeGreaterThan(genreSpec("recit").minimumWords);
  });
  it("keeps the verb-form target inside the genre prompt", () => {
    const prompt = genrePrompt("lettre", "employer_passe_compose_en_contexte", "Employer le passé composé en contexte");
    expect(prompt).toMatch(/Lettre de 80 à 160 mots/u);
    expect(prompt).toMatch(/employer le passé composé/u);
  });
});
