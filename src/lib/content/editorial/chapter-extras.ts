/**
 * H.3 chapter extras, written by the author in the same call as the chapter:
 *  - one short multiple-choice comprehension question about the chapter
 *    (3 options, one right answer, a kind explanation);
 *  - an optional bonus scene: a few sentences, an extra moment of the story
 *    that the plot does not need, unlocked by a right first answer.
 *
 * Both are gated deterministically here (no model judgement). A question or
 * scene that fails a gate is dropped: the chapter is still published and the
 * student gets the vocabulary task / no bonus instead. Nothing here can block
 * a chapter.
 */
import { fallbackModeration } from "@/lib/safety/moderate-input";
import { checkAiTells } from "./ai-tells";
import { findUnknownNames, personalDataHits, safetyLexiconHits } from "./gates";
import { splitSentences, tokenize } from "./stylometry";

export type ComprehensionQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  /** One short, kind sentence saying where the chapter shows the answer. May be empty. */
  explanation: string;
  type: string;
};

export type RawQuestion = { questionText?: unknown; questionType?: unknown; choices?: unknown; correctAnswer?: unknown; explanation?: unknown };

export const EXTRAS_LIMITS = {
  question: { min: 10, max: 160 },
  option: { min: 1, max: 100 },
  explanation: { max: 220 },
  bonus: { minWords: 25, maxWords: 130, minSentences: 2, maxSentences: 8, maxChars: 1200 },
} as const;

const STOP = new Set([
  "dans", "avec", "pour", "sans", "sous", "vers", "chez", "mais", "donc", "puis", "alors", "comme", "quand", "parce", "elle", "elles", "ils", "nous", "vous",
  "leur", "leurs", "son", "ses", "sa", "ton", "tes", "mon", "mes", "cette", "ces", "celui", "celle", "tout", "tous", "toute", "toutes", "très", "plus", "moins",
  "être", "avoir", "fait", "faire", "était", "avait", "sont", "ont", "est", "qui", "que", "quoi", "dont", "où", "une", "des", "les", "aux", "du", "de", "la", "le",
  "un", "il", "tu", "je", "on", "se", "ne", "pas", "par", "sur", "en", "et", "ou", "au", "ce", "ça", "lui", "toi", "moi", "rien", "encore", "aussi", "bien",
]);

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").replace(/[’']/gu, "'").replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/gu, " ").trim();
const stripMarkers = (text: string) => text.replace(/\{\{HEROS\}\}/gu, "le héros").replace(/\{\{m:([^|{}]*)\|f:[^{}]*\}\}/gu, "$1");
const contentWords = (text: string) => tokenize(fold(stripMarkers(text))).map((t) => t.replace(/^[a-z]'/u, "")).filter((t) => t.length >= 4 && !STOP.has(t));
/** Crude French stem: the first 5 letters (courait / courir, gardienne / gardien). */
const stem = (word: string) => word.slice(0, Math.min(word.length, 5));
const MARKERS_OK = (text: string) => !/[{}]/u.test(text.replace(/\{\{HEROS\}\}/gu, "").replace(/\{\{m:[^|{}]*\|f:[^{}]*\}\}/gu, ""));

function nameProblems(text: string, forbiddenNames: string[]): string[] {
  const plain = stripMarkers(text);
  const problems: string[] = [];
  if (fallbackModeration(plain).allowed === false) problems.push("moderation_rules");
  if (safetyLexiconHits(plain).length) problems.push("safety_lexicon");
  if (personalDataHits(plain).length) problems.push("personal_data");
  const hasForbidden = forbiddenNames.some((name) => name.trim().length >= 2 && new RegExp(`(^|[^\\p{L}])${name.trim().replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}($|[^\\p{L}])`, "iu").test(text));
  if (hasForbidden) problems.push("student_name");
  if (!MARKERS_OK(text)) problems.push("markers");
  return problems;
}

/**
 * Gate for the comprehension question: well-formed, three distinct options,
 * the right answer among them, the answer stated in the chapter (most of its
 * content words appear in the text), length limits, safety rules.
 */
export function gateComprehension(raw: RawQuestion | null | undefined, body: string, options: { forbiddenNames?: string[] } = {}): { question: ComprehensionQuestion | null; reasons: string[] } {
  if (!raw || typeof raw !== "object") return { question: null, reasons: ["missing"] };
  const reasons: string[] = [];
  const question = typeof raw.questionText === "string" ? raw.questionText.trim().replace(/\s+/gu, " ") : "";
  const choices = Array.isArray(raw.choices) ? raw.choices.map((c) => (typeof c === "string" ? c.trim().replace(/\s+/gu, " ").replace(/\.$/u, "") : "")) : [];
  const answer = typeof raw.correctAnswer === "string" ? raw.correctAnswer.trim().replace(/\s+/gu, " ").replace(/\.$/u, "") : "";
  const explanation = typeof raw.explanation === "string" ? raw.explanation.trim().replace(/\s+/gu, " ") : "";
  if (question.length < EXTRAS_LIMITS.question.min || question.length > EXTRAS_LIMITS.question.max) reasons.push("question_length");
  if (!question.endsWith("?")) reasons.push("question_mark");
  if (choices.length !== 3) reasons.push("three_options");
  if (choices.some((c) => c.length < EXTRAS_LIMITS.option.min || c.length > EXTRAS_LIMITS.option.max)) reasons.push("option_length");
  const folded = choices.map(fold);
  if (new Set(folded).size !== folded.length || folded.some((c) => !c)) reasons.push("options_not_distinct");
  const correctIndex = folded.indexOf(fold(answer));
  if (!answer || correctIndex < 0 || folded.filter((c) => c === fold(answer)).length !== 1) reasons.push("answer_not_in_options");
  if (explanation.length > EXTRAS_LIMITS.explanation.max) reasons.push("explanation_length");
  if (correctIndex >= 0) {
    const words = contentWords(choices[correctIndex]);
    const text = new Set(contentWords(body).map(stem));
    const found = words.filter((word) => text.has(stem(word))).length;
    // Short answers ("Le gardien") need their one word; longer ones at least half of their content words.
    if (words.length === 0 || found < Math.max(1, Math.ceil(words.length / 2))) reasons.push("answer_not_in_chapter");
  }
  reasons.push(...nameProblems([question, ...choices, explanation].join("\n"), options.forbiddenNames ?? []));
  if (reasons.length) return { question: null, reasons };
  const type = typeof raw.questionType === "string" ? raw.questionType : "literal";
  return { question: { question, options: choices, correctIndex, explanation, type }, reasons: [] };
}

/**
 * Gate for the bonus scene: a few sentences (length caps), hero markers well
 * formed, no student name, no new named character outside the saga cast or
 * the chapter, safety rules, no AI-tell phrase or moral ending.
 */
export function gateBonusScene(raw: string | null | undefined, body: string, options: { forbiddenNames?: string[]; allowedNames?: string[] } = {}): { scene: string | null; reasons: string[] } {
  const scene = (raw ?? "").trim().replace(/[ \t]+/gu, " ").replace(/\n{3,}/gu, "\n\n");
  if (!scene) return { scene: null, reasons: ["missing"] };
  const reasons: string[] = [];
  const limits = EXTRAS_LIMITS.bonus;
  const plain = stripMarkers(scene);
  const words = tokenize(plain).filter((t) => !t.endsWith("'")).length;
  const sentences = splitSentences(plain).length;
  if (scene.length > limits.maxChars || words < limits.minWords || words > limits.maxWords) reasons.push("length");
  if (sentences < limits.minSentences || sentences > limits.maxSentences) reasons.push("sentences");
  reasons.push(...nameProblems(scene, options.forbiddenNames ?? []));
  // Names already in the chapter (or in the outline's cast) are fine; a brand-new named character is not.
  const chapterNames = stripMarkers(body).match(/\p{Lu}\p{Ll}{2,}/gu) ?? [];
  const unknown = findUnknownNames(plain.replace(/le héros/gu, ""), [...(options.allowedNames ?? []), ...chapterNames]);
  if (unknown.length) reasons.push("new_names");
  const tells = checkAiTells(plain).findings.filter((finding) => finding.code.startsWith("phrase:") || finding.code === "habit:moral");
  if (tells.length) reasons.push("ai_tells");
  if (reasons.length) return { scene: null, reasons };
  return { scene, reasons: [] };
}

export type ChapterExtras = { comprehension: ComprehensionQuestion | null; bonusScene: string | null; reasons: string[] };

/**
 * Gates both extras, then moderates what is left with the provider when one
 * is given. Provider errors drop the extras (fail closed); the chapter itself
 * is untouched.
 */
export async function gateChapterExtras(input: { body: string; questions?: RawQuestion[] | null; bonusScene?: string | null }, options: { forbiddenNames?: string[]; allowedNames?: string[]; moderate?: (text: string) => Promise<{ allowed: boolean; categories: string[] }> } = {}): Promise<ChapterExtras> {
  const q = gateComprehension(input.questions?.[0] ?? null, input.body, options);
  const b = gateBonusScene(input.bonusScene ?? null, input.body, options);
  const reasons = [...q.reasons.map((r) => `question:${r}`), ...b.reasons.map((r) => `bonus:${r}`)];
  let comprehension = q.question;
  let bonusScene = b.scene;
  if (options.moderate && (comprehension || bonusScene)) {
    const text = [comprehension ? [comprehension.question, ...comprehension.options, comprehension.explanation].join("\n") : "", bonusScene ?? ""].filter(Boolean).join("\n\n");
    try {
      const verdict = await options.moderate(stripMarkers(text));
      if (!verdict.allowed) { comprehension = null; bonusScene = null; reasons.push(`moderation:${verdict.categories.join(",")}`); }
    } catch {
      comprehension = null; bonusScene = null; reasons.push("moderation:error");
    }
  }
  return { comprehension, bonusScene, reasons };
}

/** Row for story_chapter_extras, or null when nothing passed. */
export function extrasRow(chapterId: string, extras: ChapterExtras): { chapter_id: string; comprehension: ComprehensionQuestion | null; bonus_scene: string | null; gate_reasons: string[] } | null {
  if (!extras.comprehension && !extras.bonusScene) return null;
  return { chapter_id: chapterId, comprehension: extras.comprehension, bonus_scene: extras.bonusScene, gate_reasons: extras.reasons.slice(0, 20) };
}
