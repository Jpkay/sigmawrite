import { describe, expect, it } from "vitest";
import { buildWordSession, type BuildWordSessionInput, type DraftItem, type SessionWord } from "./builder";
import type { LexicalNeighbour } from "./distractors";

const word = (senseId: string, lemma: string, definition: string, extra: Partial<SessionWord> = {}): SessionWord => ({
  senseId, word: lemma, definition, forms: [lemma], partOfSpeech: "adj", domain: null,
  firstSeen: { sentence: null, interest: null }, examples: [], relations: [], audioUrl: null, ...extra,
});

const intrepide = word("s-intrepide", "intrépide", "Qui n'a pas peur du danger.", {
  forms: ["intrépide", "intrépides"],
  firstSeen: { sentence: "Le gardien intrépide plonge sur le ballon.", interest: "football" },
  examples: [
    { text: "La pilote intrépide traverse la tempête.", interest: "space" },
    { text: "Le héros intrépide affronte le dragon.", interest: "manga" },
  ],
  relations: [{ senseId: "s-courageux", type: "synonym", strength: 1 }, { senseId: "s-peureux", type: "antonym", strength: 1 }],
  audioUrl: "https://audio/intrepide.mp3",
});

const pool: LexicalNeighbour[] = [
  { senseId: "s-courageux", word: "courageux", definition: "Qui a du courage.", partOfSpeech: "adj", domain: null, sentences: [] },
  { senseId: "s-peureux", word: "peureux", definition: "Qui a peur de tout.", partOfSpeech: "adj", domain: null, sentences: [] },
  { senseId: "s-insipide", word: "insipide", definition: "Qui n'a pas de goût.", partOfSpeech: "adj", domain: null, sentences: ["Cette soupe insipide manque de sel."] },
  { senseId: "s-intrigant", word: "intrigant", definition: "Qui éveille la curiosité.", partOfSpeech: "adj", domain: null, sentences: ["Un message intrigant arrive dans la nuit."] },
  { senseId: "s-timide", word: "timide", definition: "Qui manque d'assurance avec les autres.", partOfSpeech: "adj", domain: null, sentences: ["Le nouvel élève timide reste au fond."] },
  { senseId: "s-rapide", word: "rapide", definition: "Qui va vite.", partOfSpeech: "adj", domain: null, sentences: ["Le train rapide file vers Paris."] },
];

const input = (overrides: Partial<BuildWordSessionInput> = {}): BuildWordSessionInput => ({
  seed: "seed", interests: ["manga", "football"], reviews: [], introductions: [],
  words: new Map([[intrepide.senseId, intrepide]]), pool, explainEnabled: true, maxItems: 8, ...overrides,
});

const formats = (items: DraftItem[]) => items.map((item) => item.view.format);

describe("buildWordSession (D.1–D.5)", () => {
  it("reviews both traces of a word with one 'type it from its definition' item", () => {
    const [item] = buildWordSession(input({ reviews: [{ senseId: intrepide.senseId, facets: ["spelling", "meaning"], retrievability: 0.8, lapses: 0, status: "en_route" }] }));
    expect(item.view.format).toBe("type_from_definition");
    expect(item.secret.facets).toEqual(["spelling", "meaning"]);
    expect(item.secret.expected).toBe("intrépide");
    // The client view never carries the answer of a recall item.
    expect(JSON.stringify(item.view)).not.toContain("intrépide");
  });

  it("gives a nearly forgotten spelling the easiest recall (hear and type) and marks it as a rescue", () => {
    const [item] = buildWordSession(input({ reviews: [{ senseId: intrepide.senseId, facets: ["spelling"], retrievability: 0.4, lapses: 1, status: "a_revoir" }] }));
    expect(item.view.format).toBe("hear_and_type");
    expect(item.secret.rescue).toBe(true);
    expect(item.retry?.view.format).not.toBe("hear_and_type");
    expect(item.rescue?.view.format).toBe("rebuild_letters");
  });

  it("fails closed to typing from the definition when no audio exists", () => {
    const silent = { ...intrepide, audioUrl: null, firstSeen: { sentence: null, interest: null }, examples: [] };
    const [item] = buildWordSession(input({ words: new Map([[silent.senseId, silent]]), reviews: [{ senseId: silent.senseId, facets: ["spelling"], retrievability: 0.3, lapses: 2, status: null }] }));
    expect(item.view.format).toBe("type_from_definition");
    expect(item.secret.facets).toEqual(["spelling"]);
  });

  it("builds a typed gap in a sentence from the student's interest, expecting the form used there", () => {
    const silent = { ...intrepide, audioUrl: null, examples: [{ text: "Les ninjas intrépides sautent du toit.", interest: "manga" }] };
    const items = Array.from({ length: 6 }, (_, index) => buildWordSession(input({ seed: `s${index}`, words: new Map([[silent.senseId, silent]]), reviews: [{ senseId: silent.senseId, facets: ["spelling"], retrievability: 0.8, lapses: 0, status: null }] }))[0]);
    const gap = items.find((item) => item.view.format === "gap_fill_typed");
    expect(gap).toBeDefined();
    expect(gap!.secret.expected).toBe("intrépides");
    expect(gap!.view.interest).toBe("manga");
  });

  it("meaning items use close but wrong options and never a synonym as a wrong answer", () => {
    const items = Array.from({ length: 12 }, (_, index) => buildWordSession(input({ seed: `m${index}`, reviews: [{ senseId: intrepide.senseId, facets: ["meaning"], retrievability: 0.75, lapses: 0, status: null }] }))[0]);
    const seen = new Set(items.map((item) => item.view.format));
    expect([...seen].every((format) => ["judge_usage", "synonym_antonym", "type_from_definition"].includes(format))).toBe(true);
    const judge = items.find((item) => item.view.format === "judge_usage")!;
    expect(judge).toBeDefined();
    if (judge.view.format === "judge_usage") {
      expect(judge.view.options).toHaveLength(2);
      const wrong = judge.view.options.find((option) => option.id !== judge.secret.correct)!;
      expect(wrong.label).toMatch(/intrépide/u);
      expect(judge.secret.novelContext).toBe(true);
    }
    const rescue = items[0].rescue!;
    expect(rescue.view.format).toBe("pick_definition");
    if (rescue.view.format === "pick_definition") {
      expect(rescue.view.options.map((option) => option.label)).not.toContain("Qui a du courage.");
    }
  });

  it("offers 'explain in your own words' for a well-known meaning, and as the harder variant", () => {
    const [known] = buildWordSession(input({ reviews: [{ senseId: intrepide.senseId, facets: ["meaning"], retrievability: 0.95, lapses: 0, status: "presque" }] }));
    expect(known.view.format).toBe("explain_own_words");
    const [usual] = buildWordSession(input({ reviews: [{ senseId: intrepide.senseId, facets: ["meaning"], retrievability: 0.7, lapses: 0, status: null }] }));
    expect(usual.harder?.view.format).toBe("explain_own_words");
    const [off] = buildWordSession(input({ explainEnabled: false, reviews: [{ senseId: intrepide.senseId, facets: ["meaning"], retrievability: 0.95, lapses: 0, status: null }] }));
    expect(off.view.format).not.toBe("explain_own_words");
  });

  it("introduces a word in context, with its definition, an interest example and letters to rebuild", () => {
    const [item] = buildWordSession(input({ introductions: [intrepide.senseId] }));
    expect(item.view.format).toBe("introduce");
    if (item.view.format !== "introduce") return;
    expect(item.view.context?.word).toBe("intrépide");
    expect(item.view.context?.before).toBe("Le gardien ");
    expect(item.view.definition).toBe("Qui n'a pas peur du danger.");
    expect(item.view.example?.interest).toBe("manga");
    expect([...item.view.letters].sort().join("")).toBe([..."intrépide"].sort().join(""));
    expect(item.view.letters.join("")).not.toBe("intrépide");
    expect(item.secret.context?.interest).toBe("football");
  });

  it("groups 4–6 spelling words with audio into one mini-dictée", () => {
    const words = new Map(Array.from({ length: 5 }, (_, index) => {
      const entry = word(`s${index}`, `mot${index}`, `Définition ${index}.`, { audioUrl: `https://audio/${index}.mp3` });
      return [entry.senseId, entry] as const;
    }));
    const items = buildWordSession(input({ words, reviews: [...words.keys()].map((senseId, index) => ({ senseId, facets: ["spelling" as const], retrievability: 0.7 + index / 100, lapses: 0, status: null })) }));
    expect(formats(items)).toEqual(["mini_dictation"]);
    expect(items[0].parts).toHaveLength(5);
    expect(items[0].parts!.every((part) => part.secret.format === "mini_dictation" && part.retry?.view.format === "type_from_definition")).toBe(true);
  });

  it("ends on the easiest review and spreads introductions out", () => {
    const words = new Map(Array.from({ length: 4 }, (_, index) => {
      const entry = word(`r${index}`, `mot${index}`, `Définition ${index}.`);
      return [entry.senseId, entry] as const;
    }));
    words.set(intrepide.senseId, intrepide);
    const items = buildWordSession(input({
      words,
      reviews: [0, 1, 2, 3].map((index) => ({ senseId: `r${index}`, facets: ["meaning" as const], retrievability: [0.3, 0.9, 0.5, 0.6][index], lapses: 0, status: null })),
      introductions: [intrepide.senseId],
      explainEnabled: false,
    }));
    expect(items.at(-1)!.view.senseId).toBe("r1");
    expect(items[0].view.format).toBe("introduce");
  });

  it("respects the item budget", () => {
    const words = new Map(Array.from({ length: 10 }, (_, index) => {
      const entry = word(`b${index}`, `mot${index}`, `Définition ${index}.`);
      return [entry.senseId, entry] as const;
    }));
    const items = buildWordSession(input({ words, maxItems: 4, reviews: [...words.keys()].map((senseId) => ({ senseId, facets: ["meaning" as const], retrievability: 0.5, lapses: 0, status: null })) }));
    expect(items).toHaveLength(4);
  });
});
