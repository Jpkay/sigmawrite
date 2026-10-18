import { describe, expect, it } from "vitest";
import { mannerOf } from "./copy";
import { buildVocabularyTask, findOccurrence, publicTask } from "./micro-task";
import { proposeSagas, schoolTermStart, storyInterests, styleTeaser, stylesReadThisTerm, type StyleOption } from "./picker";
import { chapterUnlock, checkEnding, countWords, dayStartIso, endingWordUsed, pickEndingWords } from "./rules";

const STYLES: StyleOption[] = [
  { key: "verne", name: "Jules Verne", teaser: "des machines" },
  { key: "daudet", name: "Alphonse Daudet", teaser: "un conteur" },
  { key: "malot", name: "Hector Malot", teaser: "un héros débrouillard" },
  { key: "renard", name: "Jules Renard", teaser: "des phrases courtes" },
  { key: "segur", name: "la comtesse de Ségur", teaser: "des bêtises" },
];

describe("à la manière de", () => {
  it("elides before a vowel and keeps articles", () => {
    expect(mannerOf("Jules Verne")).toBe("à la manière de Jules Verne");
    expect(mannerOf("Alphonse Daudet")).toBe("à la manière d’Alphonse Daudet");
    expect(mannerOf("Hector Malot")).toBe("à la manière d’Hector Malot");
    expect(mannerOf("la comtesse de Ségur")).toBe("à la manière de la comtesse de Ségur");
    expect(mannerOf("un romancier jeunesse d'aujourd'hui")).toBe("à la manière d’un romancier jeunesse d'aujourd'hui");
  });
});

describe("saga picker (H.1, H.6)", () => {
  const now = new Date("2026-10-18T10:00:00Z");

  it("uses French trimesters", () => {
    expect(schoolTermStart(now).toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(schoolTermStart(new Date("2027-02-10T00:00:00Z")).toISOString().slice(0, 10)).toBe("2027-01-01");
    expect(schoolTermStart(new Date("2027-05-10T00:00:00Z")).toISOString().slice(0, 10)).toBe("2027-04-01");
  });

  it("counts a style as read this term only once a chapter was read", () => {
    const history = [
      { styleKey: "verne", chaptersRead: 3, lastReadAt: "2026-10-01T00:00:00Z", createdAt: "2026-09-20T00:00:00Z" },
      { styleKey: "daudet", chaptersRead: 0, lastReadAt: null, createdAt: "2026-10-02T00:00:00Z" },
      { styleKey: "malot", chaptersRead: 5, lastReadAt: "2026-06-01T00:00:00Z", createdAt: "2026-05-20T00:00:00Z" },
    ];
    expect(stylesReadThisTerm(history, now)).toEqual(["verne"]);
  });

  it("proposes 2–3 sagas with distinct styles, new styles first", () => {
    const history = [{ styleKey: "verne", chaptersRead: 7, lastReadAt: "2026-10-10T00:00:00Z", createdAt: "2026-10-01T00:00:00Z" }];
    const proposals = proposeSagas({ interests: ["football", "space"], styles: STYLES, history, now, seed: "student-1" });
    expect(proposals).toHaveLength(3);
    expect(new Set(proposals.map((p) => p.styleKey)).size).toBe(3);
    expect(proposals.map((p) => p.styleKey)).not.toContain("verne");
    expect(proposals.every((p) => p.newStyle)).toBe(true);
    expect(new Set(proposals.map((p) => p.interest))).toEqual(new Set(["football", "space"]));
    expect(proposals[0].manner).toMatch(/^à la manière d/u);
    expect(proposals.find((p) => p.interest === "football")?.emoji).toBe("⚽");
  });

  it("rotates so a student meets at least 4 styles across a term of sagas", () => {
    const history: Array<{ styleKey: string; chaptersRead: number; lastReadAt: string; createdAt: string }> = [];
    for (let saga = 0; saga < 4; saga += 1) {
      const day = new Date(Date.UTC(2026, 8, 5 + saga * 14));
      const [first] = proposeSagas({ interests: ["football"], styles: STYLES, history, now: day, seed: "student-2" });
      history.push({ styleKey: first.styleKey, chaptersRead: 7, lastReadAt: day.toISOString(), createdAt: day.toISOString() });
    }
    expect(stylesReadThisTerm(history, new Date("2026-11-30T00:00:00Z")).length).toBeGreaterThanOrEqual(4);
  });

  it("prefers styles present in the fallback pool when live generation is off", () => {
    const proposals = proposeSagas({ interests: ["football"], styles: STYLES, history: [], now, seed: "s", poolStyles: { football: ["renard"] } });
    expect(proposals[0].styleKey).toBe("renard");
  });

  it("keeps only interests that fallback chapters can carry (exact or same group)", () => {
    expect(storyInterests(["football", "basketball", "space"], ["football"])).toEqual(["football", "basketball"]);
    expect(storyInterests(["space"], [])).toEqual([]);
    expect(storyInterests(["space", "space"], null)).toEqual(["space"]);
  });

  it("extracts a short taste of the style", () => {
    expect(styleTeaser("Cette aventure était écrite à la manière de Jules Verne : des machines, des chiffres précis. Et plus.")).toBe("des machines, des chiffres précis");
  });
});

describe("micro-task (H.3)", () => {
  const paragraphs = ["Le vestiaire sentait la boue. Le gardien, un grand intrépide aux genoux couronnés, siffla.", "Tu sortis le premier."];

  it("finds the sentence and the written form", () => {
    expect(findOccurrence(paragraphs, ["intrépide"])).toEqual({ sentence: "Le gardien, un grand intrépide aux genoux couronnés, siffla.", form: "intrépide" });
    expect(findOccurrence(paragraphs, ["absent"])).toBeNull();
  });

  it("builds a three-option meaning question with the vetted definition", () => {
    const task = buildVocabularyTask({
      paragraphs,
      candidates: [
        { word: "absent", forms: [], definition: "qui n'est pas là", senseId: "s0", due: true },
        { word: "intrépide", forms: ["intrépides"], definition: "qui n'a pas peur du danger.", senseId: "s1", due: true },
      ],
      distractors: ["qui parle très fort", "qui n'a pas peur du danger", "qui marche lentement", "qui ne dort jamais"],
      seed: "chapter-1",
    });
    expect(task).not.toBeNull();
    expect(task!.word).toBe("intrépide");
    expect(task!.options).toHaveLength(3);
    expect(task!.options[task!.correctIndex]).toBe("qui n'a pas peur du danger");
    expect(new Set(task!.options).size).toBe(3);
    expect(task!.prompt).toContain("« intrépide »");
    const shown = publicTask(task!, null);
    expect(shown).not.toHaveProperty("correctIndex");
    expect(JSON.stringify(shown)).not.toContain("s1");
    expect(publicTask(task!, { optionIndex: 0, correct: task!.correctIndex === 0 }).answered?.correctIndex).toBe(task!.correctIndex);
  });

  it("gives up when there are not enough distractors", () => {
    expect(buildVocabularyTask({ paragraphs, candidates: [{ word: "intrépide", forms: [], definition: "qui n'a pas peur", senseId: null, due: false }], distractors: ["une seule"], seed: "x" })).toBeNull();
  });
});

describe("daily unlock (H.5)", () => {
  it("opens one chapter a day, a bonus one after the daily mission, never blocks chapter 1 or a chapter already read", () => {
    expect(chapterUnlock({ chapterIndex: 1, alreadyRead: false, readsToday: 5, goalCompletedToday: false }).locked).toBe(false);
    expect(chapterUnlock({ chapterIndex: 3, alreadyRead: false, readsToday: 0, goalCompletedToday: false })).toEqual({ locked: false, bonus: false });
    expect(chapterUnlock({ chapterIndex: 3, alreadyRead: false, readsToday: 1, goalCompletedToday: false })).toEqual({ locked: true, bonus: false });
    expect(chapterUnlock({ chapterIndex: 3, alreadyRead: false, readsToday: 1, goalCompletedToday: true })).toEqual({ locked: false, bonus: true });
    expect(chapterUnlock({ chapterIndex: 4, alreadyRead: false, readsToday: 2, goalCompletedToday: true }).locked).toBe(true);
    expect(chapterUnlock({ chapterIndex: 4, alreadyRead: true, readsToday: 9, goalCompletedToday: false }).locked).toBe(false);
  });

  it("skipping days costs nothing: the allowance does not depend on past days", () => {
    expect(chapterUnlock({ chapterIndex: 5, alreadyRead: false, readsToday: 0, goalCompletedToday: false }).locked).toBe(false);
    expect(dayStartIso(new Date("2026-10-18T23:59:00Z"))).toBe("2026-10-18T00:00:00.000Z");
  });
});

describe("alternative ending (H.4)", () => {
  it("accepts inflected forms of the target words", () => {
    expect(endingWordUsed("Les pirates intrépides sautèrent.", "intrépide")).toBe(true);
    expect(endingWordUsed("Elle explora la grotte.", "explorer")).toBe(true);
    expect(endingWordUsed("L’écume brillait.", "écume")).toBe(true);
    expect(endingWordUsed("Un chat dormait.", "intrépide")).toBe(false);
  });

  it("checks length and the three words", () => {
    const words = ["intrépide", "vestiaire", "écume"];
    const short = checkEnding("Un intrépide gardien quitta le vestiaire dans l’écume.", words, { minimumWords: 60, maximumWords: 120 });
    expect(short.wordsUsed).toEqual([true, true, true]);
    expect(short.lengthOk).toBe(false);
    expect(short.ready).toBe(false);
    const long = `${"Le match reprit sous la pluie fine. ".repeat(10)}Un intrépide gardien quitta le vestiaire dans l’écume.`;
    expect(checkEnding(long, words, { minimumWords: 60, maximumWords: 120 }).ready).toBe(true);
    expect(countWords("Il était une fois — trois mots ?")).toBe(6);
  });

  it("picks the saga's own words first, then rich words of the chapters, never names", () => {
    const paragraphs = ["Lina traversa la passerelle. La passerelle grinçait sous la tempête.", "Monsieur Fogg observait l’horizon embrumé avec inquiétude."];
    const words = pickEndingWords(["vestiaire", "Vestiaire", "x"], paragraphs);
    expect(words[0]).toBe("vestiaire");
    expect(words).toHaveLength(3);
    expect(words).toContain("passerelle");
    expect(words.join(" ")).not.toMatch(/Lina|Fogg|Monsieur/u);
  });
});
