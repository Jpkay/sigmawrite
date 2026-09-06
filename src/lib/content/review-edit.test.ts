import { expect, it } from "vitest";
import { reviewEditSchema } from "./review-edit";
const value = { id: "00000000-0000-4000-8000-000000000001", promptFr: "Quelle phrase est correcte ?", correctAnswer: null, choices: [
  { id: "00000000-0000-4000-8000-000000000002", text: "Il joue.", correct: true, feedbackFr: null },
  { id: "00000000-0000-4000-8000-000000000003", text: "Il jouent.", correct: false, feedbackFr: null },
] };
it("requires one answer key and distinct choice identities and text", () => {
  expect(reviewEditSchema.safeParse(value).success).toBe(true);
  expect(reviewEditSchema.safeParse({ ...value, choices: value.choices.map((choice) => ({ ...choice, correct: true })) }).success).toBe(false);
  expect(reviewEditSchema.safeParse({ ...value, choices: [value.choices[0], value.choices[0]] }).success).toBe(false);
  expect(reviewEditSchema.safeParse({ ...value, choices: value.choices.map((choice) => ({ ...choice, text: "Même proposition" })) }).success).toBe(false);
});
