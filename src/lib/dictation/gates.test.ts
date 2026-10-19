import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  DETERMINISTIC_DICTATION_GATES, dictationTextSha256, lengthGate, linguisticValidatorGate, runDictationGates, structureGate, tagsGate,
  targetLemmaGate, tenseCurriculumGate, type DictationCandidate, type DictationGate,
} from "./gates";
import type { DictationTags } from "./tags";
import type { DictationMode } from "./modes";

type Authored = { key: string; title_fr: string; kind: DictationMode; grade_min: number; grade_max: number; target_node_keys: string[]; segments: string[] } & DictationTags;
const authored = (JSON.parse(readFileSync("generated/dictations-v1.json", "utf8")) as { dictations: Authored[] }).dictations;

const toCandidate = (entry: Authored): DictationCandidate => ({
  key: entry.key, title: entry.title_fr, kind: entry.kind, gradeMin: entry.grade_min, gradeMax: entry.grade_max, segments: entry.segments, targetNodeKeys: entry.target_node_keys,
  tags: { themes: entry.themes, interests: entry.interests, tenses: entry.tenses, target_lemmas: entry.target_lemmas, grammar_node_keys: entry.grammar_node_keys, cefr_band: entry.cefr_band },
});

const base = (extra: Partial<DictationCandidate> = {}): DictationCandidate => ({
  key: "test", title: "Test", kind: "flash", gradeMin: 6, gradeMax: 7,
  segments: ["Le matin, les enfants descendent vers la rivière.", "Ils portent des seaux et des filets.", "Les grenouilles sautent entre les pierres et disparaissent."],
  targetNodeKeys: ["accorder_sujet_verbe_ecrit"],
  tags: { themes: ["nature"], interests: ["animals"], tenses: ["present"], target_lemmas: ["rivière", "grenouille"], grammar_node_keys: [], cefr_band: "A2" },
  ...extra,
});

describe("authored dictées", () => {
  it.each(authored.map((entry) => [entry.key, entry] as const))("%s passes every blocking gate", async (_key, entry) => {
    const report = await runDictationGates(toCandidate(entry), DETERMINISTIC_DICTATION_GATES);
    expect(report.gates.filter((gate) => gate.blocking && gate.status === "fail")).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it("are all tagged with a theme and their tense nodes", () => {
    for (const entry of authored) {
      expect(entry.themes.length).toBeGreaterThan(0);
      expect(entry.grammar_node_keys.length).toBe(entry.tenses.length);
    }
  });
});

describe("gates reject planted problems", () => {
  it("structure: missing punctuation, digits and markup", async () => {
    const result = await structureGate.run(base({ segments: ["Il a 12 ans", "Le <b>chat</b> dort."] }));
    expect(result.status).toBe("fail");
    expect(result.details?.problems).toEqual(expect.arrayContaining(["segment_0_no_final_punctuation", "segment_0_digits", "segment_1_markup"]));
  });

  it("structure: a long sentence may be read in groups, but the last group must end the sentence", async () => {
    const grouped = await structureGate.run(base({ segments: ["Le soir, près du poêle, il nous montrait des planches", "où des enfants marchaient dans la neige."] }));
    expect(grouped.details?.problems ?? []).not.toContain("segment_0_no_final_punctuation");
    const unfinished = await structureGate.run(base({ segments: ["Le soir, il nous montrait des planches."] , }));
    expect(unfinished.details?.problems ?? []).toEqual([]);
    const dangling = await structureGate.run(base({ segments: ["Le soir, il nous montrait des planches.", "où des enfants marchaient"] }));
    expect(dangling.details?.problems).toContain("segment_1_no_final_punctuation");
  });

  it("length: CM dictées stay between 15 and 40 words, one sentence per segment", async () => {
    const tooShort = await lengthGate.run(base({ gradeMin: 4, gradeMax: 5, segments: ["Le chat dort."] }));
    expect(tooShort.status).toBe("fail");
    const twoSentences = await lengthGate.run(base({ gradeMin: 5, gradeMax: 6, segments: ["Le matin, les enfants descendent vers la rivière. Ils portent des seaux.", "Les grenouilles sautent entre les pierres et disparaissent dans l’eau."] }));
    expect(twoSentences.details?.problems).toContain("segment_0_several_sentences");
    expect((await lengthGate.run(base())).status).toBe("pass");
  });

  it("linguistic validator: gap modes need words to hide", async () => {
    expect((await linguisticValidatorGate.run(base({ kind: "trous" }))).status).toBe("pass");
    expect((await linguisticValidatorGate.run(base({ kind: "trous", segments: ["Oui."] }))).status).toBe("fail");
  });

  it("tags: unknown interest, unknown tense and no theme", async () => {
    const result = await tagsGate.run(base({ tags: { themes: [], interests: ["licornes"], tenses: ["aoriste" as never], target_lemmas: [], grammar_node_keys: [], cefr_band: null } }));
    expect(result.status).toBe("fail");
    expect((result.details?.problems as string[]).length).toBeGreaterThanOrEqual(3);
  });

  it("advisory gates record but do not block", async () => {
    const candidate = base({ tags: { ...base().tags, tenses: ["subjonctif_present"], target_lemmas: ["licorne"] } });
    expect((await tenseCurriculumGate.run(candidate)).status).toBe("fail");
    expect((await targetLemmaGate.run(candidate)).details?.missing).toEqual(["licorne"]);
    const report = await runDictationGates(candidate, DETERMINISTIC_DICTATION_GATES);
    expect(report.passed).toBe(true);
  });

  it("target lemmas match inflected forms", async () => {
    const candidate = base({ segments: ["Les chevaux et les journaux s’insinuaient partout dans les étals."], tags: { ...base().tags, target_lemmas: ["cheval", "journal", "insinuer", "étal"] } });
    expect((await targetLemmaGate.run(candidate)).status).toBe("pass");
  });
});

describe("runner", () => {
  it("binds the report to the text hash used in SQL", async () => {
    const report = await runDictationGates(base(), []);
    expect(report.textSha256).toBe(createHash("sha256").update(base().segments.join(" "), "utf8").digest("hex"));
    expect(dictationTextSha256("é")).toBe(createHash("sha256").update(Buffer.from("é", "utf8")).digest("hex"));
  });

  it("fails closed when a blocking gate throws, and accepts plugged-in gates", async () => {
    const broken: DictationGate = { name: "editorial", version: "h1", blocking: true, run: () => { throw new Error("down"); } };
    const report = await runDictationGates(base(), [broken]);
    expect(report.passed).toBe(false);
    expect(report.gates[0]).toMatchObject({ gate: "editorial", version: "h1", status: "fail" });
    const skipped: DictationGate = { name: "grammar", version: "1", blocking: true, run: () => ({ status: "skipped" }) };
    expect((await runDictationGates(base(), [skipped])).passed).toBe(true);
  });
});
