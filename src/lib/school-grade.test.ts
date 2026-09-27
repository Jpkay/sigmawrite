import { describe, expect, it } from "vitest";
import { frenchPathwayLabel, mypYearForGrade, schoolGradeLabel, studentSchoolGradeLabel } from "./school-grade";

describe("school grade display", () => {
  it("shows the MYP year only for school grades within the MYP span", () => {
    expect(mypYearForGrade(5)).toBeNull();
    expect(mypYearForGrade(6)).toBe(1);
    expect(mypYearForGrade(7)).toBe(2);
    expect(mypYearForGrade(8)).toBe(3);
    expect(mypYearForGrade(10)).toBe(5);
    expect(mypYearForGrade(11)).toBeNull();
    expect(mypYearForGrade(7.5)).toBeNull();
    expect(schoolGradeLabel(11)).toBe("1re · Grade 11");
    expect(schoolGradeLabel(7)).toBe("5e · Grade 7 · MYP 2");
  });

  it("pairs a known French pathway with the enrolled school grade", () => {
    expect(studentSchoolGradeLabel(7, "french_second_language", "en")).toBe("FLA · Grade 7 · MYP 2");
    expect(studentSchoolGradeLabel(8, "native", "en")).toBe("FLL · Grade 8 · MYP 3");
    expect(frenchPathwayLabel("bilingual")).toBeNull();
    expect(studentSchoolGradeLabel(8, "bilingual", "en")).toBe("Grade 8 · MYP 3");
    expect(studentSchoolGradeLabel(null, "native", "en")).toBeNull();
  });
});
