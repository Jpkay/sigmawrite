import { describe, expect, it } from "vitest";
import { evaluateAuditWindow, isSampled } from "./audit";
import { normalizeForComparison, verifyDictationAudio, wordErrorRate } from "./audio-check";
import { assertNoPersonalData, buildEditorialBrief } from "./brief";
import { dictationChecks, segmentDictation } from "./dictation";
import { bridgeSentence, pickFallback } from "./fallback";
import { resolveLiveGeneration } from "./kill-switch";
import { planFallbackJobs, planLibraryJobs } from "./library-runner";
import { resolveRoleModels } from "./llm";
import { judge } from "./team";
import { appendToSummary, sanitizeOutline } from "./saga";
import { pickStyle, studentExcerpt, getStyleCard } from "./styles";
import { normalizeFrenchTypography } from "./typography";
import { editorialContractSchema, interestsSystemClause } from "@/lib/generation/editorial-contract";
import type { GateReport } from "./gates";

describe("brief (F.1)", () => {
  it("keeps at most 2 new and 5 due words, and only tenses of the band", () => {
    const brief = buildEditorialBrief({ kind: "chapter", mode: "live", interests: ["manga"], grade: 4, gradeBand: "cm", styleKey: "renard",
      newLemmas: ["a", "b", "c"].map((x) => ({ lemma: `mot${x}`, kind: "new" as const })), dueLemmas: Array.from({ length: 8 }, (_, i) => ({ lemma: `due${String.fromCharCode(97 + i)}`, kind: "due" as const })),
      targetTenses: ["subjonctif_present", "imparfait"] });
    expect(brief.targetLemmas.filter((l) => l.kind === "new")).toHaveLength(2);
    expect(brief.targetLemmas.filter((l) => l.kind === "due")).toHaveLength(5);
    expect(brief.targetTenses).toEqual(["imparfait"]);
    expect(brief.hero?.placeholder).toBe("{{HEROS}}");
  });
  it("refuses a prompt containing the student's name", () => {
    expect(() => assertNoPersonalData(JSON.stringify({ hero: "Inès" }), ["Inès"])).toThrow("personal_data_in_prompt");
    expect(() => assertNoPersonalData("{{HEROS}} court", ["Inès"])).not.toThrow();
  });
  it("contract block enforces the word limits and has no first-name field", () => {
    const ok = { interests: ["manga"], targetLemmas: { new: ["a"], due: ["b"] }, targetTenses: ["imparfait"], gradeBand: "cm", readabilityTarget: { maxAverageSentenceWords: 12, maxSentenceWords: 24 }, mode: "live", heroPlaceholder: "{{HEROS}}" };
    expect(editorialContractSchema.parse(ok)).toBeTruthy();
    expect(() => editorialContractSchema.parse({ ...ok, targetLemmas: { new: ["a", "b", "c"], due: [] } })).toThrow();
    expect(() => editorialContractSchema.parse({ ...ok, studentFirstName: "Inès" })).toThrow();
    expect(interestsSystemClause(["manga", "basket"])).toContain("manga, basket");
  });
});

describe("switches (F.4)", () => {
  const base = { settings: { liveEnabled: true, liveMode: "live" as const, autoSwitchReason: null }, classSwitches: [true], providerConfigured: true, flagEnabled: true };
  it("resolves global, class, quality and provider switches", () => {
    expect(resolveLiveGeneration(base)).toEqual({ live: true, reason: "ok" });
    expect(resolveLiveGeneration({ ...base, flagEnabled: false }).reason).toBe("flag_off");
    expect(resolveLiveGeneration({ ...base, providerConfigured: false }).reason).toBe("provider_unconfigured");
    expect(resolveLiveGeneration({ ...base, settings: { ...base.settings, liveEnabled: false } }).reason).toBe("global_off");
    expect(resolveLiveGeneration({ ...base, settings: { ...base.settings, liveMode: "library_only" } }).reason).toBe("quality_auto_switch");
    expect(resolveLiveGeneration({ ...base, classSwitches: [true, false] }).reason).toBe("class_off");
  });
});

describe("audit (H.15)", () => {
  it("samples deterministically around the configured rate", () => {
    const ids = Array.from({ length: 4000 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    const rate = ids.filter((id) => isSampled(id, "2026-10-18")).length / ids.length;
    expect(rate).toBeGreaterThan(0.008);
    expect(rate).toBeLessThan(0.025);
    expect(isSampled(ids[0], "2026-10-18")).toBe(isSampled(ids[0], "2026-10-18"));
  });
  it("switches to library on a quality drop or report spike, never on low volume", () => {
    expect(evaluateAuditWindow({ audited: Array(30).fill(3.2), publishedChapters: 500, reports: 0, fallbacks: 0 }).some((a) => a.kind === "quality_drop" && a.switchToLibrary)).toBe(true);
    expect(evaluateAuditWindow({ audited: Array(30).fill(4.4), publishedChapters: 500, reports: 20, fallbacks: 0 }).some((a) => a.kind === "report_spike")).toBe(true);
    expect(evaluateAuditWindow({ audited: [2, 2], publishedChapters: 5, reports: 3, fallbacks: 0 })).toEqual([]);
    expect(evaluateAuditWindow({ audited: Array(30).fill(4.4), publishedChapters: 100, reports: 0, fallbacks: 20 }).find((a) => a.kind === "fallback_rate")?.switchToLibrary).toBe(false);
  });
});

describe("fallback chapters (H.14)", () => {
  const pool = [
    { id: "a", interest: "football", gradeBand: "6e-5e", styleKey: "dumas", title: "A", body: "x", choices: [], usedCount: 3 },
    { id: "b", interest: "football", gradeBand: "6e-5e", styleKey: "verne", title: "B", body: "x", choices: [], usedCount: 9 },
    { id: "c", interest: "manga", gradeBand: "6e-5e", styleKey: "verne", title: "C", body: "x", choices: [], usedCount: 0 },
  ];
  it("prefers the same style, then interest, never reuses one in a saga", () => {
    expect(pickFallback(pool, { interest: "football", gradeBand: "6e-5e", styleKey: "verne" }, [])?.id).toBe("b");
    expect(pickFallback(pool, { interest: "football", gradeBand: "6e-5e", styleKey: "verne" }, ["b"])?.id).toBe("c");
    expect(pickFallback(pool, { interest: "football", gradeBand: "cm", styleKey: "verne" }, [])).toBeNull();
  });
  it("bridges with a template sentence", () => {
    expect(bridgeSentence("Suivre le gardien.", 0)).toContain("suivre le gardien");
  });
});

describe("dictées (H.17/H.18)", () => {
  it("segments long sentences and checks read-aloud constraints", () => {
    const text = "Le soir tombait sur le studio, et la plume du dessinateur grattait encore le papier pendant que la pluie frappait la vitre.";
    const segments = segmentDictation(text, "cm");
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.join(" ")).toBe(text);
    const check = dictationChecks("— Viens ! Il avait 12 ans.", ["— Viens !", "Il avait 12 ans."], "cm", { min: 15, max: 40 });
    expect(check.passed).toBe(false);
    expect(check.issues).toEqual(expect.arrayContaining(["chiffres à écrire en lettres", "dialogue à tirets, difficile à dicter"]));
  });
  it("compares the STT transcript, ignoring spoken punctuation", async () => {
    expect(wordErrorRate(normalizeForComparison("Le chat dort."), normalizeForComparison("le chat dort, point"))).toBe(0);
    const speech = { synthesizeSpeechPlan: async () => ({ audio: new Uint8Array(200), mimeType: "audio/mpeg", provider: "mock", model: "m", voice: "v" }) };
    const ok = await verifyDictationAudio(["Le chat dort."], speech, { model: "stt", transcribe: async () => "Le chat dort, point final." });
    expect(ok.status).toBe("passed");
    const bad = await verifyDictationAudio(["Le verre est vert."], speech, { model: "stt", transcribe: async () => "Le ver est vers." });
    expect(bad.status).toBe("failed");
    expect(bad.attempts).toHaveLength(2);
    expect((await verifyDictationAudio(["x"], speech, null)).status).toBe("skipped");
  });
});

describe("styles, saga and models", () => {
  it("rotates styles so a student meets several authors", () => {
    const history: string[] = [];
    for (let i = 0; i < 4; i += 1) history.push(pickStyle("6e-5e", "chapter", history).key);
    expect(new Set(history).size).toBe(4);
    expect(studentExcerpt(getStyleCard("moderne-humour-famille"))).toBeNull();
    expect(studentExcerpt(getStyleCard("renard"))?.text.length).toBeGreaterThan(100);
  });
  it("keeps outlines inside the curriculum and the summary bounded", () => {
    const outline = sanitizeOutline({ title: "t", logline: "l", setting: "s", heroRole: "h", cast: [], stages: [{ chapter: 1, beat: "b", tension: 1 }, { chapter: 12, beat: "b", tension: 1 }], endings: [], tensePlan: [{ chapter: 1, tenses: ["subjonctif_present", "imparfait"] }], motifs: [], avoid: [] }, "cm", 7);
    expect(outline.stages).toHaveLength(1);
    expect(outline.tensePlan[0].tenses).toEqual(["imparfait"]);
    let summary = "";
    for (let i = 1; i <= 30; i += 1) summary = appendToSummary(summary, i, "Une phrase assez longue pour remplir la mémoire de la saga au fil des chapitres.", "Choix");
    expect(summary.split(/\s+/u).length).toBeLessThan(400);
    expect(summary.startsWith("Ch. 1")).toBe(true);
  });
  it("maps roles to strong writers and fast reviewers on OpenRouter, overridable by env", () => {
    const models = resolveRoleModels({ AI_PROVIDER: "glm", OPENROUTER_API_KEY: "k" });
    expect(models.author).toBe("anthropic/claude-opus-5.5");
    expect(models.reviewer_proof).toBe("google/gemini-3.8-flash");
    expect(resolveRoleModels({ AI_PROVIDER: "glm", OPENROUTER_API_KEY: "k", EDITORIAL_MODEL_AUTHOR: "x/y" }).author).toBe("x/y");
  });
  it("plans library jobs from coverage gaps and fills the fallback pool", () => {
    const jobs = planLibraryJobs([{ interest: "manga", type: "passage", cell: "6e_5e", missing: 2 }, { interest: "manga", type: "dictation", cell: "4", missing: 1 }, { interest: "manga", type: "practice", cell: "conjugaison", missing: 5 }], { limit: 10 });
    expect(jobs.map((j) => [j.kind, j.gradeBand])).toEqual([["passage", "6e-5e"], ["passage", "6e-5e"], ["dictation", "cm"]]);
    expect(planFallbackJobs(["manga"], [], 2, 10)).toHaveLength(8);
  });
});

describe("editor-in-chief rules", () => {
  const gates = (overrides: Partial<GateReport> = {}): GateReport => ({ results: [], hardFailed: false, requiredFailed: false, aiTells: { score: 0, findings: [], metrics: { words: 200, sentenceCv: 0.6, lexicalRange: 0.7, repetition: 0, clicheShare: 0 } }, styleFit: 1, wordCount: 200, ...overrides });
  const brief = buildEditorialBrief({ kind: "chapter", mode: "live", interests: ["manga"], grade: 6, gradeBand: "6e-5e", styleKey: "verne", targetTenses: ["imparfait"] });
  const reviews = { rubric: { voice: 5, concreteness: 5, rhythm: 5, dialogue: 5, showDontTell: 5, surprise: 5, noMoralizing: 5, vocabulary: 5, language: 5 }, rubricMean: 5, styleNotes: [], targets: null, proof: { languageScore: 5, issues: [] }, safety: { safe: true, ageAppropriate: true, concerns: [] }, dictation: null, errors: [] };
  it("never publishes past a hard gate or a missing safety review, whatever the scores", () => {
    expect(judge("live", brief, gates({ hardFailed: true }), reviews, { rubric: 4, floor: 3.6 }).publishable).toBe(false);
    expect(judge("live", brief, gates(), { ...reviews, safety: null }, { rubric: 4, floor: 3.6 }).publishable).toBe(false);
    expect(judge("live", brief, gates(), reviews, { rubric: 4, floor: 3.6 }).meetsBar).toBe(true);
  });
});

describe("typography", () => {
  it("applies French typography without touching markers", () => {
    expect(normalizeFrenchTypography('"Oui" : {{m:prêt|f:prête}}...')).toBe("« Oui » : {{m:prêt|f:prête}}…".replace(" :", " :"));
  });
});
