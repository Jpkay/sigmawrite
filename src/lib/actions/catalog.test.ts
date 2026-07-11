import { describe,expect,it } from "vitest";
import { vocabularyDifficultyFromFrequency } from "@/lib/content/vocabulary-frequency";
describe("vocabularyDifficultyFromFrequency",()=>{it("assigns rarer words a higher difficulty",()=>{expect(vocabularyDifficultyFromFrequency(0.5)).toBeGreaterThan(vocabularyDifficultyFromFrequency(50));});});
