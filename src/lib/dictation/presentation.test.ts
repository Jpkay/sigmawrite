import { expect, it } from "vitest";
import { dictationStepByStep } from "./presentation";

it("uses step-by-step mode for CM1–CM2", () => {
  expect(dictationStepByStep({ grade: 4, kind: "flash", recentAccuracies: [] })).toBe(true);
  expect(dictationStepByStep({ grade: 5, kind: "trous", recentAccuracies: [0.95, 0.9] })).toBe(true);
});

it("uses it for older students only while they struggle", () => {
  expect(dictationStepByStep({ grade: 7, kind: "flash", recentAccuracies: [] })).toBe(false);
  expect(dictationStepByStep({ grade: 7, kind: "flash", recentAccuracies: [0.5] })).toBe(false);
  expect(dictationStepByStep({ grade: 7, kind: "flash", recentAccuracies: [0.5, 0.55, 0.9] })).toBe(false);
  expect(dictationStepByStep({ grade: 7, kind: "flash", recentAccuracies: [0.5, 0.55, 0.6] })).toBe(true);
});

it("never for the brevet format", () => {
  expect(dictationStepByStep({ grade: 9, kind: "brevet", recentAccuracies: [0.2, 0.2] })).toBe(false);
});
