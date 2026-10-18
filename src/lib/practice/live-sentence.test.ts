import { describe, expect, it, vi } from "vitest";
import { checkLiveSentence, liveSentencePrompt, liveSentenceSpec, subjectFor, themedPrompt } from "./live-sentence";
import { applyLiveSentences, liveSentencesEnabled, writeLiveSentence } from "./live-sentences";

const item = (config: Record<string, unknown>, id = "item-1") => ({ id, promptFr: "Avec le sujet « nous », écris « dribbler » au présent.", validatorType: "conjugator", validatorConfig: config });
const spec = (config: Record<string, unknown>, grade = 6) => liveSentenceSpec(item(config), "football", grade)!;

describe("live practice sentences: spec (F.2)", () => {
  it("takes verb, tense, person and the form from the bank item and the conjugation engine", () => {
    expect(spec({ verb: "dribbler", tense: "present", person: "1p" })).toMatchObject({ form: "dribblons", subject: "nous", maxWords: 18 });
    expect(spec({ verb: "aimer", tense: "present", person: "1s" }).subject).toBe("j’");
    expect(spec({ verb: "aller", tense: "passe_compose", person: "3s", gender: "f" })).toMatchObject({ form: "est allée", subject: "elle" });
    expect(spec({ verb: "finir", tense: "subjonctif_present", person: "3p" }).subject).toBe("qu’ils");
    expect(spec({ verb: "prendre", tense: "imperatif_present", person: "2p" }).subject).toBe("");
    expect(spec({ verb: "jouer", tense: "present", person: "3s" }, 4).maxWords).toBe(14);
  });

  it("leaves special items, other validators and unknown verbs to the bank", () => {
    expect(liveSentenceSpec(item({ verb: "voir", tense: "passe_compose", person: "1s", codBefore: { gender: "f" } }), "football", 6)).toBeNull();
    expect(liveSentenceSpec({ ...item({ verb: "voir", tense: "present", person: "1s" }), validatorType: "exact" }, "football", 6)).toBeNull();
    expect(liveSentenceSpec(item({ verb: "jouer", tense: "gerondif", person: "1s" }), "football", 6)).toBeNull();
    expect(liveSentenceSpec(item({ verb: "xyz", tense: "present", person: "1s" }), "football", 6)).toBeNull();
    expect(subjectFor("2s", "m", "es", "subjonctif_present")).toBe("que tu");
  });

  it("the prompt carries the form and the interest, nothing about the student", () => {
    const prompt = liveSentencePrompt(spec({ verb: "dribbler", tense: "present", person: "1p" }));
    expect(prompt.system).toContain("« nous dribblons »");
    expect(prompt.system).toContain("sans prénom");
    expect(JSON.parse(prompt.user)).toEqual({ verbe: "dribbler", temps: "présent", forme: "dribblons", sujet: "nous", univers: "football" });
  });
});

describe("live practice sentences: deterministic gates (F.2)", () => {
  const nous = spec({ verb: "dribbler", tense: "present", person: "1p" });
  it("accepts a clean sentence and blanks exactly the expected form", () => {
    const check = checkLiveSentence("Sous la pluie, nous dribblons jusqu'au point de penalty.", nous);
    expect(check).toMatchObject({ ok: true, blanked: "Sous la pluie, nous _____ jusqu’au point de penalty." });
    expect(themedPrompt(check.blanked!, nous, "Écris le verbe.")).toBe("« Sous la pluie, nous _____ jusqu’au point de penalty. »\nÉcris le verbe.");
  });

  it("handles elision, compound forms and the impératif", () => {
    expect(checkLiveSentence("Ce matin, j'aime le bruit des crampons sur le béton.", spec({ verb: "aimer", tense: "present", person: "1s" })).ok).toBe(true);
    expect(checkLiveSentence("Après le coup de sifflet, elle est allée saluer le gardien.", spec({ verb: "aller", tense: "passe_compose", person: "3s", gender: "f" })).blanked).toBe("Après le coup de sifflet, elle _____ saluer le gardien.");
    const imperative = spec({ verb: "prendre", tense: "imperatif_present", person: "2p" });
    expect(checkLiveSentence("Prenez le ballon et visez la lucarne.", imperative)).toMatchObject({ ok: true, blanked: "_____ le ballon et visez la lucarne." });
    expect(checkLiveSentence("Vite, prenez vos gourdes avant la mi-temps.", imperative).ok).toBe(true);
    expect(checkLiveSentence("Les joueurs prenez le ballon.", imperative).ok).toBe(false);
  });

  it("rejects planted errors 100% of the time", () => {
    const planted = [
      "Sous la pluie, ils dribblent jusqu'au but.", // wrong form
      "Sous la pluie, vous dribblons jusqu'au but.", // wrong subject
      "Nous dribblons, puis nous dribblons encore.", // form twice
      "Nous dribblons avec Mbappé jusqu'au but.", // real person / proper name
      "Nous dribblons 3 fois jusqu'au but.", // digits
      "Nous dribblons. Le gardien plonge trop tard.", // two sentences
      "Nous dribblons sous une mare de sang.", // safety lexicon
      "Nous dribblons.", // too short
      "Nous dribblons " + "très ".repeat(20) + "loin.", // too long
      "Va sur https://exemple.fr, nous dribblons.", // link
    ];
    for (const sentence of planted) expect(checkLiveSentence(sentence, nous).ok, sentence).toBe(false);
  });
});

describe("live practice sentences: orchestration (F.2)", () => {
  const nousItem = item({ verb: "dribbler", tense: "present", person: "1p" });
  const deps = (over: Partial<Parameters<typeof applyLiveSentences>[2]> = {}) => ({
    findCached: vi.fn(async () => null as string | null),
    generate: vi.fn(async () => ({ text: JSON.stringify({ sentence: "Sous la pluie, nous dribblons jusqu'au point de penalty." }), model: "mock" })),
    moderate: vi.fn(async () => true),
    save: vi.fn(async () => undefined),
    schedule: vi.fn(),
    ...over,
  });

  it("is off unless PRACTICE_LIVE_SENTENCES=true", () => {
    expect(liveSentencesEnabled({})).toBe(false);
    expect(liveSentencesEnabled({ PRACTICE_LIVE_SENTENCES: "true" })).toBe(true);
  });

  it("themes the first conjugation items, saves the sentence and keeps other items untouched", async () => {
    const d = deps();
    const other = { id: "x", promptFr: "QCM", validatorType: "exact", validatorConfig: null };
    const out = await applyLiveSentences([other, nousItem], { interests: ["football"], grade: 6 }, d);
    expect(out[0]).toBe(other);
    expect(out[1].promptFr).toContain("nous _____");
    expect(d.save).toHaveBeenCalledWith(expect.objectContaining({ itemId: "item-1", interest: "football", expectedForm: "dribblons" }));
  });

  it("reuses a cached sentence without calling the model", async () => {
    const d = deps({ findCached: vi.fn(async () => "« Nous _____ vite. »\nÉcris le verbe.") });
    const out = await applyLiveSentences([nousItem], { interests: ["football"], grade: 6 }, d);
    expect(out[0].promptFr).toBe("« Nous _____ vite. »\nÉcris le verbe.");
    expect(d.generate).not.toHaveBeenCalled();
  });

  it("falls back to the bank prompt on a failed gate, moderation refusal, bad JSON or provider error", async () => {
    for (const d of [
      deps({ generate: vi.fn(async () => ({ text: JSON.stringify({ sentence: "Ils dribblent jusqu'au but adverse." }), model: "m" })) }),
      deps({ moderate: vi.fn(async () => false) }),
      deps({ generate: vi.fn(async () => ({ text: "pas du json", model: "m" })) }),
      deps({ generate: vi.fn(async () => { throw new Error("down"); }) }),
    ]) {
      const out = await applyLiveSentences([nousItem], { interests: ["football"], grade: 6 }, d);
      expect(out[0].promptFr).toBe(nousItem.promptFr);
      expect(d.save).not.toHaveBeenCalled();
    }
  });

  it("does not make the student wait: a slow sentence is finished in the background", async () => {
    let release: () => void = () => {};
    const slow = new Promise<void>((resolve) => { release = resolve; });
    const d = deps({ generate: vi.fn(async () => { await slow; return { text: JSON.stringify({ sentence: "Sous la pluie, nous dribblons jusqu'au point de penalty." }), model: "m" }; }) });
    const schedule = vi.fn((work: () => Promise<void>) => { void work; });
    const out = await applyLiveSentences([nousItem], { interests: ["football"], grade: 6 }, { ...d, schedule, timeoutMs: 5 });
    expect(out[0].promptFr).toBe(nousItem.promptFr);
    expect(schedule).toHaveBeenCalledTimes(1);
    release();
    await schedule.mock.calls[0][0]();
    expect(d.save).toHaveBeenCalledTimes(1);
  });

  it("does nothing without interests", async () => {
    const d = deps();
    expect(await applyLiveSentences([nousItem], { interests: [], grade: 6 }, d)).toEqual([nousItem]);
    expect(await writeLiveSentence(spec({ verb: "dribbler", tense: "present", person: "1p" }), "i", "", { ...d, generate: vi.fn(async () => ({ text: "{}", model: "m" })) })).toBeNull();
  });
});
