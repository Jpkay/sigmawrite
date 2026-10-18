import { describe, expect, it } from "vitest";
import { buildEditorialBrief } from "./brief";
import { runGates, type GateDeps } from "./gates";
import { getStyleCard } from "./styles";
import type { FrenchGrammarChecker } from "@/lib/linguistic/types";

const built = buildEditorialBrief({
  kind: "chapter", mode: "live", interests: ["football"], grade: 6, gradeBand: "6e-5e",
  newLemmas: [{ lemma: "intrépide", kind: "new" }], dueLemmas: [{ lemma: "vestiaire", kind: "due" }],
  targetTenses: ["passe_simple"], styleKey: "verne", narration: "tu", heroGender: "f",
});
const brief = { ...built, lengthWords: { min: 130, max: 220 } };
const style = getStyleCard("verne");

const GOOD = `Le vestiaire sentait le camphre et la boue sèche. Tu comptas les crampons alignés sous le banc : vingt-deux, pas un de plus. Dehors, la pluie tambourinait sur la tôle comme un millier de doigts impatients.

L'entraîneur entra, son carnet sous le bras, et posa sur la table un ballon dont le cuir avait viré au gris. « Celui-là a joué la finale de 1998 », dit-il sans sourire. Personne ne le crut, mais tout le monde le regarda.

Tu pris le ballon. Il pesait plus lourd que prévu, gorgé d'eau, et tu sentis sous ton pouce une couture qui avait lâché. Le gardien, un grand intrépide aux genoux couronnés, siffla entre ses dents.

À sept heures douze, la sirène retentit. Tu sortis le premier. La pelouse fumait sous les projecteurs, et quelque part dans les tribunes, un parapluie jaune s'ouvrit tout seul.`;

const okGrammar: FrenchGrammarChecker = { check: async (text) => ({ text, language: "fr", matches: [], clean: true }) };
const deps: GateDeps = { moderate: async () => ({ allowed: true, categories: [] }), grammar: okGrammar, forbiddenNames: ["Inès"], allowedNames: [] };
const run = (template: string, extra: Partial<GateDeps> = {}) => runGates({ template, brief, style }, { ...deps, ...extra });
const blocked = (r: Awaited<ReturnType<typeof run>>) => r.hardFailed || r.requiredFailed;

describe("deterministic gates (F.3)", () => {
  it("passes a clean chapter with its targets", async () => {
    const report = await run(GOOD);
    const failing = report.results.filter((r) => r.level !== "signal" && !r.passed);
    expect(failing).toEqual([]);
    expect(report.results.find((r) => r.gate === "target_tenses")?.passed).toBe(true);
  });

  const planted: Array<[string, string, Partial<GateDeps>?]> = [
    ["missing new word", GOOD.replace("un grand intrépide", "un grand gaillard")],
    ["missing tense (all présent)", GOOD.replace(/comptas/gu, "comptes").replace(/entra/gu, "entre").replace(/posa/gu, "pose").replace(/crut/gu, "croit").replace(/regarda/gu, "regarde").replace(/pris/gu, "prends").replace(/sentis/gu, "sens").replace(/siffla/gu, "siffle").replace(/retentit/gu, "retentit").replace(/sortis/gu, "sors").replace(/s'ouvrit/gu, "s'ouvre").replace("dit-il", "dit-il").replace(/retentit/gu, "sonne")],
    ["student's real name", GOOD.replace("Le gardien", "Inès, le gardien")],
    ["email address", `${GOOD}\nÉcris-moi à coach@example.com.`],
    ["unsafe content", GOOD.replace("siffla entre ses dents", "fuma une cigarette")],
    ["copied public-domain sequence", `${GOOD}\n${getStyleCard("verne").excerpts[0]?.text ?? ""}`],
    ["far too long", `${GOOD}\n\n${GOOD}\n\n${GOOD}`],
    ["malformed hero marker", GOOD.replace("Tu sortis", "{{HERO Tu sortis")],
    ["grammar error reported by LanguageTool", GOOD, { grammar: { check: async (text) => ({ text, language: "fr", matches: [{ message: "Accord", offset: 10, length: 4, ruleId: "AGREEMENT", category: "GRAMMAR", replacements: [] }], clean: false }) } }],
    ["moderation refuses", GOOD, { moderate: async () => ({ allowed: false, categories: ["violence"] }) }],
    ["moderation unavailable", GOOD, { moderate: async () => { throw new Error("down"); } }],
  ];
  for (const [label, text, extra] of planted) {
    it(`rejects a text with a planted error: ${label}`, async () => {
      expect(blocked(await run(text, extra))).toBe(true);
    });
  }
});

describe("moderation latency guard", () => {
  it("fails closed when the provider never answers, after one retry", async () => {
    let calls = 0;
    const report = await runGates({ template: GOOD, brief, style }, { ...deps, moderate: () => { calls += 1; return new Promise(() => {}); } }, { moderationTimeoutMs: 5 });
    expect(report.results.find((r) => r.gate === "moderation")).toMatchObject({ passed: false, detail: "moderation_unavailable" });
    expect(calls).toBe(2);
  });
  it("the line editor's pre-check skips provider moderation but keeps the local rules", async () => {
    let calls = 0;
    const report = await runGates({ template: GOOD, brief, style }, { ...deps, moderate: async () => { calls += 1; return { allowed: true, categories: [] }; } }, { moderation: false });
    expect(calls).toBe(0);
    expect(report.results.find((r) => r.gate === "moderation")?.passed).toBe(true);
  });
});
