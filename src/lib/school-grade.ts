/** The app stores a school year (5–12), independently of French proficiency. */
export function mypYearForGrade(grade: number | null | undefined): number | null {
  return grade != null && Number.isInteger(grade) && grade >= 6 && grade <= 10
    ? grade - 5
    : null;
}

export function schoolGradeLabel(grade: number, language: "fr" | "en" = "fr"): string {
  const mypYear = mypYearForGrade(grade);
  const frenchClass: Record<number, string> = {
    5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e", 10: "2de", 11: "1re", 12: "Terminale",
  };
  const schoolGrade = language === "fr" && frenchClass[grade]
    ? `${frenchClass[grade]} · Grade ${grade}`
    : `Grade ${grade}`;
  return mypYear === null ? schoolGrade : `${schoolGrade} · MYP ${mypYear}`;
}

export function frenchPathwayLabel(background: string | null | undefined): "FLA" | "FLL" | null {
  if (background === "native" || background === "french_first_language") return "FLL";
  if (["french_second_language", "allophone", "immersion"].includes(background ?? "")) return "FLA";
  return null;
}

export function studentSchoolGradeLabel(
  grade: number | null | undefined,
  background: string | null | undefined,
  language: "fr" | "en" = "fr",
): string | null {
  if (grade == null) return null;
  const pathway = frenchPathwayLabel(background);
  const schoolGrade = schoolGradeLabel(grade, language);
  return pathway ? `${pathway} · ${schoolGrade}` : schoolGrade;
}
