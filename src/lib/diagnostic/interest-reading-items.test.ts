import { expect, it } from "vitest";
import { buildInterestReadingItems } from "./interest-reading-items";
import { generatedItemSchema } from "@/lib/ai/item-generation/schemas";
import { readingRubricSchema } from "@/lib/content/reading-rubric";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import { splitExercisePrompt } from "@/lib/content/exercise-prompt";
it("covers six real interests and five skills with self-contained, structured practice", () => {
  const items = buildInterestReadingItems();
  expect(items).toHaveLength(30);
  expect(new Set(items.map((entry) => entry.key)).size).toBe(30);
  expect(new Set(items.map(({ item }) => item.nodeKey)).size).toBe(5);
  for (const { item } of items) {
    expect(generatedItemSchema.safeParse(item).success).toBe(true);
    expect(readingRubricSchema.safeParse(item.validatorConfig?.readingRubric).success).toBe(true);
    const theme = (item.validatorConfig?.interestKeys as string[])[0];
    expect(INTEREST_BY_KEY[theme]).toBeTruthy();
    expect(splitExercisePrompt(item.promptFr).passage.join(" ")).toContain("récit fictif");
    expect(splitExercisePrompt(item.promptFr).question).toBeTruthy();
  }
});
