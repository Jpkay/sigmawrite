import { z } from "zod";
import { FRENCH_BACKGROUNDS } from "@/lib/types";
import { INTEREST_BY_KEY } from "@/lib/content/interests";

export const onboardingSchema = z.object({
  grade: z.number().int().min(5).max(12),
  frenchBackground: z.enum(FRENCH_BACKGROUNDS),
  interests: z.array(z.string().min(1).max(64)).min(3).max(20)
    .refine((values) => values.every((value) => value in INTEREST_BY_KEY), "Centre d’intérêt inconnu."),
  studentType: z.enum(["french_first_language", "french_second_language", "heritage", "bilingual", "allophone", "immersion"]).optional(),
  homeLanguage: z.string().trim().max(100).optional(),
  exposures: z.array(z.enum(["home", "school", "class_only", "immersion", "self_study"])).max(5).optional(),
  exposure: z.enum(["home", "school", "class_only", "immersion", "self_study"]).optional(),
  goalType: z.enum(["catch_up", "improve_writing", "grammar_spelling", "prepare_delf", "prepare_ap_ib", "enter_french_school", "literature_class"]).optional(),
  targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
});

export function onboardingTarget(input: z.infer<typeof onboardingSchema>) {
  const studentType = input.studentType ?? (input.frenchBackground === "native" ? "french_first_language" : input.frenchBackground === "bilingual" ? "bilingual" : "french_second_language");
  const usesCefr = ["french_second_language", "allophone", "immersion"].includes(studentType) && !!input.targetLevel;
  // A class goal is not a claim about the student's current proficiency.
  // Only use a CEFR target when one was explicitly supplied by an older client.
  return {
    framework: usesCefr ? "cefr" : "native_grade",
    level: usesCefr ? input.targetLevel! : String(input.grade),
    grade: usesCefr ? null : input.grade,
  };
}
