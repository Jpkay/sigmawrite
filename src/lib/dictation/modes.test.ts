import { describe, expect, it } from "vitest";
import { buildTemplate, distractorsFor, publicTemplate, reconstruct } from "./modes";

describe("dictée à trous / à choix", () => {
  const segment = "Ils portent des seaux et des filets.";
  it("hides about a third of the words, homophones first, deterministically", () => {
    const template = buildTemplate(segment, 0);
    expect(template.blanks.length).toBe(2);
    expect(template.blanks.map((b) => b.answer)).toContain("et");
    expect(buildTemplate(segment, 0)).toEqual(template);
  });
  it("never exposes answers in the public template", () => {
    const template = buildTemplate(segment, 0);
    const visible = publicTemplate(template, true);
    for (const blank of template.blanks) {
      expect(visible.tokens[blank.index]).toBeNull();
      const choices = visible.blanks.find((b) => b.index === blank.index)!.choices!;
      expect(choices).toContain(blank.answer);
      expect(choices.length).toBeGreaterThanOrEqual(2);
    }
    expect(JSON.stringify(publicTemplate(template, false))).not.toContain('"choices":[');
  });
  it("builds rule-based distractors", () => {
    expect(distractorsFor("et")).toContain("est");
    expect(distractorsFor("mangé")).toContain("manger");
    expect(distractorsFor("chantent")).toContain("chante");
    expect(distractorsFor("Les")).toContain("Le");
  });
  it("reconstructs the segment with punctuation from fills", () => {
    const template = buildTemplate("Les enfants jouent, puis rentrent.", 0);
    const fills = Object.fromEntries(template.blanks.map((b) => [b.index, b.answer]));
    expect(reconstruct(template, fills)).toBe("Les enfants jouent, puis rentrent.");
  });
});
