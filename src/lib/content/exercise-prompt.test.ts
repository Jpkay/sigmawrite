import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExercisePrompt } from "@/components/exercise-prompt";
import { paragraphsFromText } from "./text-format";
import { splitExercisePrompt } from "./exercise-prompt";

describe("exercise prompt presentation", () => {
  it("separates all authored reading exercises without losing passage paragraphs", () => {
    const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as { items: { item: { promptFr: string } }[] };
    const reading = bank.items.filter(({ item }) => item.promptFr.startsWith("Lis le texte."));
    expect(reading.length).toBeGreaterThan(0);
    for (const { item } of reading) {
      const result = splitExercisePrompt(item.promptFr);
      expect(result.instruction).toBe("Lis le texte.");
      expect(result.passage.length).toBeGreaterThan(0);
      expect(result.question).toBeTruthy();
      expect([result.instruction, ...result.passage, result.question]).toEqual(paragraphsFromText(item.promptFr));
    }
  });
  it("handles escaped breaks while retaining questions inside a passage", () => {
    expect(splitExercisePrompt("Lis le texte.\\n\\nPourquoi partir ? Lina hésite.\\n\\nElle reste.\\n\\nQue décide Lina ?")).toMatchObject({ instruction: "Lis le texte.", passage: ["Pourquoi partir ? Lina hésite.", "Elle reste."], question: "Que décide Lina ?" });
  });
  it("preserves unstructured prompts instead of guessing their boundaries", () => {
    const prompt = "Lis le texte. Lina hésite. Que décide Lina ?";
    expect(splitExercisePrompt(prompt)).toMatchObject({ instruction: null, passage: [], question: null, paragraphs: [prompt] });
    expect(splitExercisePrompt("Transforme la phrase.\n\nLina lit.").paragraphs).toEqual(["Transforme la phrase.", "Lina lit."]);
  });
  it("renders separately labeled instruction, passage and question regions", () => {
    const html = renderToStaticMarkup(createElement(ExercisePrompt, { promptFr: "Lis le texte.\n\nLina lit.\n\nQue fait Lina ?", instructionsFr: "Réponds en une phrase." }));
    expect(html).toContain('aria-label="Consigne"');
    expect(html).toContain('aria-label="Texte à lire"');
    expect(html).toContain('aria-label="Question"');
    expect(html.indexOf("Lis le texte.")).toBeLessThan(html.indexOf("Lina lit."));
    expect(html.indexOf("Lina lit.")).toBeLessThan(html.indexOf("Que fait Lina ?"));
    expect(html).toContain("Réponds en une phrase.");
  });
});
