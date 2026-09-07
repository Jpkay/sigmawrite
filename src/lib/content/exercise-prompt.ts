import { paragraphsFromText } from "./text-format";

/** Use authored paragraph boundaries, never guess where a passage ends. */
export function splitExercisePrompt(prompt: string) {
  const paragraphs = paragraphsFromText(prompt);
  if (paragraphs.length >= 3 && /^Lis le texte[.!:]$/u.test(paragraphs[0])) {
    return { instruction: paragraphs[0], passage: paragraphs.slice(1, -1), question: paragraphs.at(-1)!, paragraphs: [] };
  }
  return { instruction: null, passage: [], question: null, paragraphs };
}
