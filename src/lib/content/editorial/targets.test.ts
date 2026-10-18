import { describe, expect, it } from "vitest";
import { checkLemmaPresence, checkTensePresence, lemmaForms } from "./targets";

describe("target checks", () => {
  it("matches inflected forms of nouns, adjectives and verbs", () => {
    expect(lemmaForms("intrépide")).toContain("intrépides");
    expect(lemmaForms("courageux")).toContain("courageuse");
    expect(checkLemmaPresence("Les chevaux couraient.", ["cheval", "courir"]).every((r) => r.found)).toBe(true);
    expect(checkLemmaPresence("Elle était {{m:attentif|f:attentive}}.", ["attentif"])[0].found).toBe(true);
    expect(checkLemmaPresence("L'équipe gagna.", ["intrépide"])[0].found).toBe(false);
  });
  it("finds multi-word targets as consecutive words, with elision and plurals", () => {
    expect(checkLemmaPresence("Il tapota sa tempe. L'esprit critique tenait dans ce geste.", ["esprit critique"])[0]).toMatchObject({ found: true, form: "esprit critique" });
    expect(checkLemmaPresence("Leurs esprits critiques s'éveillaient.", ["esprit critique"])[0].found).toBe(true);
    expect(checkLemmaPresence("Un esprit vif, une critique sévère.", ["esprit critique"])[0].found).toBe(false);
  });
  it("verifies declared tense evidence with the conjugation engine, never on trust", () => {
    const text = "Le gardien plongea. Nous avions gagné.";
    const ok = checkTensePresence(text, ["passe_simple"], [{ form: "plongea", lemma: "plonger", tense: "passe_simple" }]);
    expect(ok[0].found).toBe(true);
    const lie = checkTensePresence("Le gardien plonge.", ["passe_simple"], [{ form: "plonge", lemma: "plonger", tense: "passe_simple" }]);
    expect(lie[0].found).toBe(false);
  });
  it("scans frequent verbs and finds compound tenses with an adverb in between", () => {
    const res = checkTensePresence("Il a déjà couru. Demain, elle partira.", ["passe_compose", "futur_simple"]);
    expect(res.map((r) => r.found)).toEqual([true, true]);
  });
});
