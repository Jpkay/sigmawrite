import { describe, expect, it } from "vitest";
import {
  ageBandForDifficultyBand,
  ageBandForGrade,
  coverageCountsFromRows,
  evaluateInterestCoverage,
  interestPromiseKept,
  INTEREST_COVERAGE_MINIMUMS,
  missingInterestCoverage,
  skillFamilyForStrand,
  type InterestCoverageCounts,
} from "./interest-coverage";
import { INTERESTS } from "./interests";

function full(interests: readonly string[]): InterestCoverageCounts {
  const counts: InterestCoverageCounts = { passages: {}, practice: {}, dictations: {} };
  for (const interest of interests) {
    counts.passages[interest] = { cm: 6, "6e_5e": 6, "4e_3e": 6 };
    counts.practice[interest] = { conjugaison: 20, orthographe: 20, grammaire: 20, vocabulaire: 20 };
    counts.dictations[interest] = { 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 };
  }
  return counts;
}

describe("interest coverage (E.2)", () => {
  it("maps grades, difficulty bands and strands to coverage cells", () => {
    expect(ageBandForGrade(4)).toBe("cm");
    expect(ageBandForGrade(7)).toBe("6e_5e");
    expect(ageBandForGrade(9)).toBe("4e_3e");
    expect(ageBandForGrade(10)).toBeNull();
    expect(ageBandForDifficultyBand("Foundation 5B")).toBe("cm");
    expect(ageBandForDifficultyBand("Secondary 8A")).toBe("4e_3e");
    expect(ageBandForDifficultyBand("Advanced 11-12")).toBeNull();
    expect(ageBandForDifficultyBand(null)).toBeNull();
    expect(skillFamilyForStrand("orthographe_grammaticale")).toBe("orthographe");
    expect(skillFamilyForStrand("comprehension_ecrite")).toBeNull();
  });

  it("aggregates content rows into interest × cell counts", () => {
    const counts = coverageCountsFromRows({
      passages: [
        { interest: "manga", difficultyBand: "Foundation 5A" },
        { interest: "manga", difficultyBand: "Secondary 7B" },
        { interest: null, difficultyBand: "Foundation 5A" },
        { interest: "manga", difficultyBand: "Advanced 11-12" },
      ],
      practice: [
        { interestKeys: ["football", "football"], strand: "conjugaison" },
        { interestKeys: ["football"], strand: "comprehension_ecrite" },
      ],
      dictations: [{ interests: ["manga"], gradeMin: 5, gradeMax: 6 }],
    });
    expect(counts.passages.manga).toEqual({ cm: 1, "6e_5e": 1 });
    expect(counts.practice.football).toEqual({ conjugaison: 1 });
    expect(counts.dictations.manga).toEqual({ 5: 1, 6: 1 });
  });

  it("passes only when every cell meets its minimum", () => {
    expect(missingInterestCoverage(full(["manga"]), { targets: ["manga"] })).toEqual([]);
    const counts = full(["manga"]);
    counts.passages.manga.cm = 4;
    counts.dictations.manga[9] = 0;
    expect(missingInterestCoverage(counts, { targets: ["manga"] })).toEqual([
      { interest: "manga", type: "passage", cell: "cm", have: 4, need: INTEREST_COVERAGE_MINIMUMS.passagesPerBand, missing: 2 },
      { interest: "manga", type: "dictation", cell: "9", have: 0, need: 3, missing: 3 },
    ]);
  });

  it("orders gaps by demand so generation fills popular interests first", () => {
    const gaps = missingInterestCoverage({ passages: {}, practice: {}, dictations: {} }, { targets: ["dance", "manga"], demand: { manga: 40, dance: 2 } });
    expect(gaps[0]).toMatchObject({ interest: "manga", type: "passage", cell: "cm", missing: 6 });
    expect(gaps.filter((gap) => gap.interest === "manga")).toHaveLength(3 + 4 + 6);
    expect(gaps.findIndex((gap) => gap.interest === "dance")).toBe(13);
  });

  it("can evaluate at group level by summing member interests", () => {
    const counts = full([]);
    counts.passages.manga = { cm: 3, "6e_5e": 6, "4e_3e": 6 };
    counts.passages.anime = { cm: 3 };
    const gaps = missingInterestCoverage(counts, { targets: ["manga_bd"], level: "group" });
    expect(gaps.some((gap) => gap.type === "passage")).toBe(false);
  });

  it("reports covered and uncovered interests", () => {
    const report = evaluateInterestCoverage(full(["manga"]), { targets: ["manga", "dance"] });
    expect(report.covered).toEqual(["manga"]);
    expect(report.uncovered).toEqual([{ interest: "dance", missingCells: 13, missingItems: 3 * 6 + 4 * 20 + 6 * 3 }]);
    expect(report.allCovered).toBe(false);
  });

  it("keeps the onboarding promise only when every offered interest is covered (E.6)", () => {
    const all = INTERESTS.map((interest) => interest.key);
    expect(interestPromiseKept(full(all))).toBe(true);
    expect(interestPromiseKept(full(all.slice(1)))).toBe(false);
    expect(interestPromiseKept(full(["manga"]), ["manga"])).toBe(true);
    expect(interestPromiseKept(full([]), [])).toBe(false);
  });
});
