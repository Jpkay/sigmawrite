import { describe, expect, it } from "vitest";
import { buildGranularConjugationBank } from "./conjugation";
const bank = buildGranularConjugationBank();
describe("verb-by-tense candidate bank", () => {
 it("has independent être and avoir nodes for every covered tense", () => {
  expect(bank.skills).toHaveLength(110);
  for (const verb of ["etre", "avoir"]) for (const tense of ["present", "imparfait", "passe_compose", "futur_simple", "passe_simple", "conditionnel_present", "subjonctif_present"]) {
    expect(bank.skills.some(s => s.id === `produire_${verb}_${tense}`)).toBe(true);
  }
 });
 it("uses independently checked key examples", () => {
  const expected = { "produire_etre_present:1p": "sommes", "produire_avoir_present:2p": "avez", "produire_etre_imparfait:1s": "étais", "produire_avoir_passe_compose:1s": "ai eu", "produire_etre_passe_simple:3p": "furent", "produire_avoir_imperatif_present:2s": "aie" };
  for (const [id, answer] of Object.entries(expected)) expect(bank.items.find(i => i.id === id)?.correctAnswer).toBe(answer);
 });
 it("provides distinct forms, unique item identities, and no invented review approvals", () => {
  expect(new Set(bank.items.map(i => i.id)).size).toBe(bank.items.length);
  for (const skill of bank.skills) expect(bank.items.filter(i => i.skillId === skill.id).length).toBeGreaterThanOrEqual(3);
  expect(bank.items.every(i => i.reviewStatus === "draft")).toBe(true);
 });
 it("does not reject a valid feminine agreement when the pronoun leaves gender unspecified", () => {
  expect(bank.items.find(i => i.id === "produire_aller_passe_compose:1s")?.acceptableAnswers).toContain("suis allée");
  expect(bank.items.find(i => i.id === "produire_aller_passe_compose:3s")?.acceptableAnswers).toEqual([]);
 });
});
