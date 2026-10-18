/**
 * "Explique avec tes mots" (roadmap 2026-10 D.5). The student's text has
 * already passed moderateOrReject. It is checked against the vetted
 * definition and its definition_validation entries (0092):
 *
 *  1. a deterministic pass decides clear cases (overlap with the vetted
 *     definition, an accepted paraphrase or a synonym; an explicit "je ne
 *     sais pas"; a known wrong answer);
 *  2. otherwise a constrained model check (injected `judge`) may decide,
 *     with a confidence floor;
 *  3. anything unsure is "uncertain": the answer is never graded wrong and
 *     the student gets a multiple-choice question instead.
 *
 * The model never sees the student's name and never decides spelling.
 */
export type ExplainVerdict = "correct" | "partial" | "wrong" | "uncertain";

export type ValidationEntry = { text: string; verdict: "correct" | "partial" | "wrong" };

export type ExplainReference = {
  word: string;
  definition: string;
  /** vocabulary_items.definition_validation: accepted / rejected paraphrases. */
  validation: ValidationEntry[];
  synonyms: string[];
  antonyms: string[];
};

export type JudgeInput = { word: string; definition: string; accepted: string[]; answer: string };
export type JudgeResult = { verdict: "correct" | "partial" | "wrong"; confidence: number } | null;
export type Judge = (input: JudgeInput) => Promise<JudgeResult>;

export type ExplainGrade = { verdict: ExplainVerdict; source: "rules" | "model" | "none"; reason: string };

export const EXPLAIN_RULES = {
  correctCoverage: 0.5,
  correctCoverageWithTwo: 0.34,
  partialCoverage: 0.25,
  wrongMatch: 0.75,
  modelConfidence: 0.75,
  /** A "wrong" from the model needs more confidence than a "correct". */
  modelWrongConfidence: 0.85,
  maxLength: 400,
} as const;

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLocaleLowerCase("fr");
const STOPWORDS = new Set(fold("a à au aux avec ce ces cet cette c d de des du elle elles en et est etre être eu il ils je j l la le les leur leurs lui m ma mais me mes moi mon n ne nous on ou où par pas pour qu que qui s sa se ses si son sur t ta te tes toi ton tu un une vous y ça cela celui celle ceux quand comme plus tres très fait faire chose quelque quelqu quelqun quelquun personne veut dire signifie veux c'est cest ont sont avoir etait était").split(/\s+/u));
const NEGATIONS = new Set(["ne", "n", "pas", "jamais", "aucun", "aucune", "rien", "plus", "non"]);
const DONT_KNOW = /^(?:je\s+(?:ne\s+)?sais\s+pas|j['’]?\s*sais\s+pas|sais\s+pas|aucune\s+id[ée]e|je\s+(?:ne\s+)?(?:connais|comprends)\s+pas|\?+|non|rien|euh+|bof)[\s.!?]*$/iu;


export function tokens(text: string): string[] {
  return fold(text).replace(/[’']/gu, " ").split(/[^a-z0-9-]+/u).flatMap((token) => token.split("-")).filter(Boolean);
}

const SUFFIXES = ["ement", "aient", "ment", "euse", "tion", "ive", "ion", "ait", "ant", "ent", "eux", "if", "er", "ez", "ee", "e"];

/** Crude French stem: plural, feminine and common endings removed, then a 5-letter prefix. */
export function stem(token: string): string {
  const plain = token.replace(/(?:x|s)$/u, "");
  const suffix = SUFFIXES.find((ending) => plain.endsWith(ending) && plain.length - ending.length >= 4);
  return (suffix ? plain.slice(0, -suffix.length) : plain).slice(0, 5);
}

export function contentStems(text: string): Set<string> {
  return new Set(tokens(text).filter((token) => token.length > 1 && !STOPWORDS.has(token) && !NEGATIONS.has(token)).map(stem));
}

const hasNegation = (text: string) => tokens(text).some((token) => NEGATIONS.has(token) && token !== "plus");

function overlap(answer: Set<string>, reference: Set<string>) {
  let shared = 0;
  for (const value of reference) if (answer.has(value)) shared++;
  return { shared, coverage: reference.size ? shared / reference.size : 0 };
}

/** definition_validation is loosely typed jsonb: strings (accepted) or {text|answer, verdict|label}. */
export function parseValidation(raw: unknown): ValidationEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ValidationEntry[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) { out.push({ text: entry.trim(), verdict: "correct" }); continue; }
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const text = [record.text, record.answer, record.paraphrase].find((value) => typeof value === "string" && value.trim()) as string | undefined;
    const label = String(record.verdict ?? record.label ?? record.status ?? "correct").toLowerCase();
    const verdict = ["wrong", "rejected", "incorrect", "faux"].includes(label) ? "wrong" : ["partial", "partly_correct", "partiel"].includes(label) ? "partial" : "correct";
    if (text) out.push({ text: text.trim(), verdict });
  }
  return out;
}

/** Deterministic pass. Returns null when it cannot decide. */
export function ruleGrade(answer: string, reference: ExplainReference): ExplainGrade | null {
  const text = answer.trim().slice(0, EXPLAIN_RULES.maxLength);
  if (!text) return { verdict: "uncertain", source: "rules", reason: "empty" };
  if (DONT_KNOW.test(text)) return { verdict: "wrong", source: "rules", reason: "dont_know" };
  const target = stem(fold(reference.word));
  const answerStems = contentStems(text);
  answerStems.delete(target);
  if (!answerStems.size) return { verdict: "uncertain", source: "rules", reason: "only_the_word" };
  const negated = hasNegation(text);

  // A single synonym is a good explanation ("intrépide : courageux").
  for (const synonym of reference.synonyms) {
    const synonymStems = contentStems(synonym);
    if (synonymStems.size && [...synonymStems].every((value) => answerStems.has(value)) && !negated) {
      return { verdict: "correct", source: "rules", reason: "synonym" };
    }
  }
  for (const antonym of reference.antonyms) {
    const antonymStems = contentStems(antonym);
    if (antonymStems.size && [...antonymStems].every((value) => answerStems.has(value))) {
      // "pas peureux" is right, "peureux" is the opposite: let the model decide when negated.
      if (negated) return null;
      return answerStems.size <= antonymStems.size + 1 ? { verdict: "wrong", source: "rules", reason: "antonym" } : null;
    }
  }
  for (const entry of reference.validation.filter((value) => value.verdict === "wrong")) {
    const { coverage } = overlap(answerStems, contentStems(entry.text));
    const reverse = overlap(contentStems(entry.text), answerStems).coverage;
    if (coverage >= EXPLAIN_RULES.wrongMatch && reverse >= EXPLAIN_RULES.wrongMatch && hasNegation(entry.text) === negated) {
      return { verdict: "wrong", source: "rules", reason: "known_wrong" };
    }
  }
  // A near-exact match of a teacher-validated paraphrase is trusted as is.
  for (const entry of reference.validation.filter((value) => value.verdict !== "wrong")) {
    const stems = contentStems(entry.text);
    stems.delete(target);
    if (stems.size && hasNegation(entry.text) === negated && overlap(answerStems, stems).coverage >= EXPLAIN_RULES.wrongMatch && overlap(stems, answerStems).coverage >= EXPLAIN_RULES.wrongMatch) {
      return { verdict: entry.verdict, source: "rules", reason: "validated_paraphrase" };
    }
  }
  const references = [
    { text: reference.definition, verdict: "correct" as const },
    ...reference.validation.filter((value) => value.verdict !== "wrong"),
  ].flatMap((entry) => [entry, ...clauses(entry.text).map((text) => ({ text, verdict: entry.verdict }))]);
  let best: { verdict: "correct" | "partial"; score: number } | null = null;
  let conflict = false;
  for (const entry of references) {
    const stems = contentStems(entry.text);
    stems.delete(target);
    if (!stems.size) continue;
    const { shared, coverage } = overlap(answerStems, stems);
    if (hasNegation(entry.text) !== negated) { if (shared > 0) conflict = true; continue; } // "qui a peur" vs "qui n'a pas peur"
    const strong = coverage >= EXPLAIN_RULES.correctCoverage || (shared >= 2 && coverage >= EXPLAIN_RULES.correctCoverageWithTwo);
    // An overlap-only partial is left to the model; a teacher-validated partial paraphrase is trusted.
    const decided = strong ? (entry.verdict === "partial" ? "partial" : "correct") : null;
    if (decided && (!best || coverage > best.score || (decided === "correct" && best.verdict === "partial"))) best = { verdict: decided, score: coverage };
  }
  if (best?.verdict === "correct") return { verdict: "correct", source: "rules", reason: "matches_definition" };
  if (best?.verdict === "partial" && !conflict) return { verdict: "partial", source: "rules", reason: "validated_partial" };
  return null;
}

/** Clauses of a definition ("qui ne dure pas longtemps, qui disparaît vite"). */
function clauses(text: string): string[] {
  const parts = text.split(/[,;:]|\s(?:et|ou)\s/iu).map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [];
}

/** Partial overlap the rules saw, used when the model is unavailable. */
function rulePartial(answer: string, reference: ExplainReference): boolean {
  const answerStems = contentStems(answer);
  answerStems.delete(stem(fold(reference.word)));
  if (!hasNegation(answer) && reference.antonyms.some((antonym) => { const stems = contentStems(antonym); return stems.size > 0 && [...stems].every((value) => answerStems.has(value)); })) return false;
  const stems = contentStems(reference.definition);
  const { shared, coverage } = overlap(answerStems, stems);
  return shared >= 1 && coverage >= EXPLAIN_RULES.partialCoverage && hasNegation(answer) === hasNegation(reference.definition);
}

export async function gradeExplanation(answer: string, reference: ExplainReference, judge: Judge | null): Promise<ExplainGrade> {
  const ruled = ruleGrade(answer, reference);
  if (ruled && ruled.verdict !== "uncertain") return ruled;
  if (ruled?.reason === "empty") return ruled;
  if (judge) {
    try {
      const result = await judge({
        word: reference.word,
        definition: reference.definition,
        accepted: [...reference.validation.filter((entry) => entry.verdict === "correct").map((entry) => entry.text), ...reference.synonyms].slice(0, 8),
        answer: answer.trim().slice(0, EXPLAIN_RULES.maxLength),
      });
      if (result) {
        const floor = result.verdict === "wrong" ? EXPLAIN_RULES.modelWrongConfidence : EXPLAIN_RULES.modelConfidence;
        if (result.confidence >= floor) return { verdict: result.verdict, source: "model", reason: "model" };
      }
    } catch {
      // Fail closed: an unavailable check is never a wrong answer.
    }
  }
  if (rulePartial(answer, reference)) return { verdict: "partial", source: "rules", reason: "partial_overlap" };
  return { verdict: "uncertain", source: "none", reason: ruled?.reason ?? "undecided" };
}
