import { describe, expect, it } from "vitest";
import { wordCountBand } from "@/lib/dictation/gates";
import { ageBandForGrade } from "@/lib/content/interest-coverage";
import { buildEditorialBrief, LENGTHS } from "./brief";
import { PASSAGE_BAND_FOR_GRADE } from "./passage-publisher";
import { chapterCountFor } from "./saga";
import { stylesFor } from "./styles";
import { gradeBandFor, TENSES_BY_BAND } from "./types";

describe("lycée band (2de–Terminale)", () => {
  it("maps grades 10–12 to the lycée band everywhere", () => {
    expect([10, 11, 12].map(gradeBandFor)).toEqual(["lycee", "lycee", "lycee"]);
    expect(gradeBandFor(9)).toBe("4e-3e");
    expect(ageBandForGrade(11)).toBe("lycee");
    expect(PASSAGE_BAND_FOR_GRADE[10]).toBe("Secondary 10A");
    expect(PASSAGE_BAND_FOR_GRADE[12]).toBe("Advanced 11-12");
  });
  it("builds a lycée brief with longer texts and every tense of 4e–3e", () => {
    const brief = buildEditorialBrief({ kind: "chapter", mode: "live", interests: ["football"], grade: 11, gradeBand: "lycee", styleKey: "hugo", targetTenses: ["subjonctif_present"] });
    expect(brief.gradeBand).toBe("lycee");
    expect(LENGTHS.chapter.lycee.min).toBeGreaterThan(LENGTHS.chapter["4e-3e"].min);
    expect(TENSES_BY_BAND.lycee).toEqual(expect.arrayContaining(TENSES_BY_BAND["4e-3e"]));
    expect(chapterCountFor("lycee")).toBe(10);
  });
  it("has author styles for chapters, passages and dictées", () => {
    for (const format of ["chapter", "passage", "dictation"] as const) expect(stylesFor("lycee", format).length).toBeGreaterThan(0);
  });
  it("lets lycée dictées be longer than 3e ones", () => {
    expect(wordCountBand({ kind: "flash", gradeMin: 11 })).toEqual({ min: 30, max: 130 });
    expect(wordCountBand({ kind: "flash", gradeMin: 9 })).toEqual({ min: 25, max: 100 });
  });
});
