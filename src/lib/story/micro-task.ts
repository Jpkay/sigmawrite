/**
 * H.3: the micro-task that opens the next chapter. Deterministic, no model:
 * a word of the chapter (today's due words first), the sentence where it
 * appears, and three meanings taken from the vetted lexicon — or, every
 * other chapter, the comprehension question the author wrote with the
 * chapter (gated by code). The student's answer opens the branch they
 * picked; it is never a gate they can fail. A right first answer unlocks the
 * chapter's bonus scene when there is one.
 */
import { normalizeWord, sentences, wordTokens } from "@/lib/vocabulary/matching";

export type TaskCandidate = {
  word: string;
  /** Normalised surface forms that count as this word in the text. */
  forms: string[];
  definition: string;
  senseId: string | null;
  /** A due word of the student's memory plan (its answer is recorded as embedded evidence). */
  due: boolean;
};

export type VocabularyTask = {
  kind: "vocabulary";
  word: string;
  /** The form as written in the chapter ("intrépides"). */
  form: string;
  sentence: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  senseId: string | null;
  due: boolean;
};

/** H.3: a comprehension question written with the chapter and gated by code (chapter-extras.ts). */
export type ComprehensionTask = {
  kind: "comprehension";
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Shown only once the student has answered. */
  explanation: string;
};

export type StoryTask = VocabularyTask | ComprehensionTask;

/** Revealed after the (first and only) answer: never before. */
export type TaskReveal = { optionIndex: number; correct: boolean; correctIndex: number; explanation: string | null; bonus: string[] | null };

/** What the browser receives: never the answer, the explanation or the bonus scene before an answer. */
export type PublicStoryTask =
  | { kind: "vocabulary"; word: string; form: string; sentence: string; prompt: string; options: string[]; answered: TaskReveal | null }
  | { kind: "comprehension"; prompt: string; options: string[]; answered: TaskReveal | null };

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 16777619) >>> 0;
  return value;
}

const clean = (definition: string) => definition.trim().replace(/\s+/gu, " ").replace(/\.$/u, "");

/** The first sentence of the chapter that contains one of the forms, and the form as written. */
export function findOccurrence(paragraphs: string[], forms: string[]): { sentence: string; form: string } | null {
  const wanted = new Set(forms.map(normalizeWord));
  for (const paragraph of paragraphs) {
    for (const sentence of sentences(paragraph)) {
      const raw = sentence.split(/\s+/u);
      for (const token of raw) {
        const normalized = wordTokens(token)[0];
        if (normalized && wanted.has(normalized)) return { sentence: sentence.slice(0, 400), form: token.replace(/^[«"(“]+|[.,;:!?»")”…]+$/gu, "").replace(/^(?:l|d|j|m|t|s|n|c|qu)['’]/iu, "") };
      }
    }
  }
  return null;
}

export function buildVocabularyTask(input: { paragraphs: string[]; candidates: TaskCandidate[]; distractors: string[]; seed: string }): VocabularyTask | null {
  for (const candidate of input.candidates) {
    const definition = clean(candidate.definition);
    if (definition.length < 4) continue;
    const occurrence = findOccurrence(input.paragraphs, [candidate.word, ...candidate.forms]);
    if (!occurrence) continue;
    const others = [...new Set(input.distractors.map(clean))]
      .filter((other) => other.length >= 4 && other.toLocaleLowerCase("fr") !== definition.toLocaleLowerCase("fr"))
      .sort((a, b) => hash(`${input.seed}:${a}`) - hash(`${input.seed}:${b}`))
      .slice(0, 2);
    if (others.length < 2) continue;
    const correctIndex = hash(`${input.seed}:${candidate.word}`) % 3;
    const options = [...others];
    options.splice(correctIndex, 0, definition);
    return {
      kind: "vocabulary", word: candidate.word, form: occurrence.form, sentence: occurrence.sentence,
      prompt: `Dans ce passage, que veut dire « ${occurrence.form} » ?`,
      options, correctIndex, senseId: candidate.senseId, due: candidate.due,
    };
  }
  return null;
}

/** The comprehension question as a task. The stored order of options is kept (it was gated as written). */
export function buildComprehensionTask(question: { question: string; options: string[]; correctIndex: number; explanation?: string | null }): ComprehensionTask | null {
  if (question.options.length !== 3 || question.correctIndex < 0 || question.correctIndex > 2 || !question.question) return null;
  return { kind: "comprehension", prompt: question.question, options: [...question.options], correctIndex: question.correctIndex, explanation: question.explanation?.trim() ?? "" };
}

/** H.3 alternation: even chapters ask about the story, odd ones about a word; the other kind stands in when one is missing. */
export function preferredTaskKind(chapterIndex: number): StoryTask["kind"] {
  return chapterIndex % 2 === 0 ? "comprehension" : "vocabulary";
}

export function publicTask(task: StoryTask, answer: { optionIndex: number; correct: boolean; bonus?: string[] | null } | null): PublicStoryTask {
  const answered: TaskReveal | null = answer
    ? { optionIndex: answer.optionIndex, correct: answer.correct, correctIndex: task.correctIndex, explanation: task.kind === "comprehension" ? task.explanation || null : null, bonus: answer.correct ? answer.bonus ?? null : null }
    : null;
  if (task.kind === "comprehension") return { kind: "comprehension", prompt: task.prompt, options: task.options, answered };
  return { kind: "vocabulary", word: task.word, form: task.form, sentence: task.sentence, prompt: task.prompt, options: task.options, answered };
}
