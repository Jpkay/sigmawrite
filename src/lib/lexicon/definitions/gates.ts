/**
 * Deterministic quality gates for automatic word definitions. Pure functions:
 * no model, no database. A generated item must pass every blocking gate here
 * AND the independent model verification before it is accepted.
 */
import { INTERESTS } from "../../content/interests";
import { tokenizeFrench } from "../baseline";
import {
  DEFINITION_MAX_WORDS,
  EXAMPLE_MAX_WORDS,
  type CloseWords,
  type DefinitionValidationCriterion,
  type GateResult,
  type GeneratedDefinition,
  type ReleaseLemma,
} from "./types";

export const INTEREST_KEYS: ReadonlySet<string> = new Set(INTERESTS.map((interest) => interest.key));

/** Lower-case, NFC, typographic apostrophe → ', ligatures expanded (Lexique writes "soeur"). */
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("fr")
    .replaceAll("’", "'")
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae")
    .trim();
}

const OE_EXCEPTIONS = /^(moell|coexist|coeffic|coerc|aloe|canoe)/u;

/** Lexique writes "soeur", "coeur": display the ligature (except moelle, coexister…). */
export function displaySpelling(lemma: string): string {
  if (OE_EXCEPTIONS.test(lemma)) return lemma;
  return lemma.replace(/oe/g, "œ").replace(/Oe/g, "Œ");
}

/**
 * Words never offered as distractors or close words to children, whatever
 * their frequency in the lexicon (vulgar, sexual, insults).
 */
export const DISTRACTOR_BLOCKLIST: ReadonlySet<string> = new Set([
  "merde", "merdique", "pisser", "chier", "putain", "pute", "con", "conne", "connard", "connasse", "connerie",
  "salaud", "salope", "bordel", "cul", "foutre", "enculer", "enculé", "bite", "couille", "couilles", "nique",
  "niquer", "baiser", "baise", "sexe", "sexuel", "sexuelle", "sexy", "porno", "pornographie", "pédé", "gouine",
  "bâtard", "chiotte", "chiottes", "emmerder", "emmerdeur", "foutu", "branler", "bander", "seins", "sein",
  "drogue", "cocaïne", "héroïne", "shit", "joint", "fric", "flic", "pétasse", "pouffiasse", "garce", "négro",
  "nègre", "bougnoule", "violer", "viol", "violeur", "gueule", "dégueulasse", "suicide", "suicider", "youpin", "crétin", "débile", "abruti", "imbécile", "idiot", "connement", "crever",
]);

export function isBlockedWord(word: string): boolean {
  return DISTRACTOR_BLOCKLIST.has(normalizeForMatch(word));
}

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

/** Word count as a reader sees it ("l’arbre" = 1, "peut-être" = 1). */
export function countWords(text: string): number {
  return tokenizeFrench(text).length;
}

/** Tokens split further on apostrophes and hyphens, normalised for matching. */
export function matchTokens(text: string): string[] {
  const out: string[] = [];
  for (const token of tokenizeFrench(text)) {
    const normalized = normalizeForMatch(token);
    out.push(normalized);
    const parts = normalized.split(/['\-]/u).filter((part) => part.length > 0);
    if (parts.length > 1) out.push(...parts);
  }
  return out;
}

// Longest first. Used only to compare words of the same family.
const SUFFIXES = [
  "issements", "issement", "ationnelle", "ationnel", "ements", "ement", "ations", "ation", "itions", "ition",
  "atrices", "atrice", "ateurs", "ateur", "euses", "euse", "eurs", "eur", "rices", "rice", "iques", "ique",
  "ables", "able", "ibles", "ible", "istes", "iste", "ismes", "isme", "ites", "ite", "ances", "ance",
  "ences", "ence", "antes", "ante", "ants", "ant", "ees", "ee", "es", "eres", "ere", "ers", "er", "ir",
  "oir", "re", "ages", "age", "ettes", "ette", "eaux", "eau", "elles", "elle", "ments", "ment", "ives", "ive",
  "ifs", "if", "eux", "euse", "e", "s", "x",
];

const WEAK_SUFFIXES = new Set(["", "s", "x", "e", "es"]);

function stemWithSuffix(word: string): { stem: string; suffix: string } {
  const base = stripAccents(normalizeForMatch(word)).replace(/[^a-z]/g, "");
  for (const suffix of SUFFIXES) {
    if (base.endsWith(suffix) && base.length - suffix.length >= 4) return { stem: base.slice(0, -suffix.length), suffix };
  }
  return { stem: base, suffix: "" };
}

/** Rough family stem: accent-free, one suffix removed while at least 4 letters remain. */
export function familyStem(word: string): string {
  return stemWithSuffix(word).stem;
}

/** A stem strong enough to compare: 5+ letters, or 4 letters left by a derivational suffix (pass-age, pass-er). */
function comparableStem(word: string): string | null {
  const { stem, suffix } = stemWithSuffix(word);
  if (stem.length >= 5) return stem;
  if (stem.length === 4 && !WEAK_SUFFIXES.has(suffix)) return stem;
  return null;
}

export type FamilyContext = { lemma: string; forms: Iterable<string>; family?: Iterable<string> };

/** Builds a predicate that says whether a token belongs to the word's family. */
export function familyMatcher(context: FamilyContext): (token: string) => boolean {
  const exact = new Set<string>();
  const stems = new Set<string>();
  const add = (word: string) => {
    const normalized = normalizeForMatch(word);
    if (!normalized) return;
    exact.add(normalized);
    exact.add(stripAccents(normalized));
    for (const part of normalized.split(/[\s'\-]+/u)) {
      if (part.length >= 3) exact.add(part);
    }
    const stem = comparableStem(normalized);
    if (stem) stems.add(stem);
  };
  add(context.lemma);
  for (const form of context.forms) add(form);
  for (const word of context.family ?? []) add(word);
  const lemmaStem = familyStem(context.lemma);
  const lemmaBase = stripAccents(normalizeForMatch(context.lemma));
  return (token: string) => {
    const normalized = normalizeForMatch(token);
    if (!normalized) return false;
    const base = stripAccents(normalized);
    if (exact.has(normalized) || exact.has(base)) return true;
    const stem = comparableStem(normalized);
    if (stem && stems.has(stem)) return true;
    // Derived words that keep the whole word or stem: courage → courageux, courageusement.
    if (lemmaStem.length >= 5 && base.startsWith(lemmaStem)) return true;
    if (lemmaBase.length >= 5 && base.startsWith(lemmaBase)) return true;
    // Prefixed derivatives: battre → abattre, débattre.
    if (lemmaBase.length >= 5 && base.endsWith(lemmaBase)) return true;
    // The base word inside a derived lemma: courageux ← courage.
    if (base.length >= 5 && lemmaBase.startsWith(base)) return true;
    return false;
  };
}

export function familyWordsIn(text: string, isFamily: (token: string) => boolean): string[] {
  return [...new Set(matchTokens(text).filter(isFamily))];
}

/**
 * French typography normalisation, applied before the checks: typographic
 * apostrophe, narrow no-break space before ; : ! ?, no-break spaces inside
 * « », single spaces, ellipsis character.
 */
export function normalizeTypography(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/(\p{L})'(?=\p{L})/gu, "$1’")
    .replace(/\.\.\./g, "…")
    .replace(/[   ]*([;:!?])/g, " $1")
    .replace(/«[   ]*/g, "« ")
    .replace(/[   ]*»/g, " »")
    .replace(/[   ]+([,.)…])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim()
    .replace(/^ /, "");
}

/** Problems that normalisation cannot fix. Empty array = typography is fine. */
export function typographyIssues(text: string): string[] {
  const issues: string[] = [];
  if (!/^[«\p{Lu}0-9À-Ý]/u.test(text)) issues.push("must start with a capital letter");
  if (!/[.!?…]\s?»?$/u.test(text)) issues.push("must end with final punctuation");
  if (/["“”*_#`<>{}\[\]|\\]/u.test(text)) issues.push("forbidden character (straight quotes, markdown or brackets)");
  if (/\p{Extended_Pictographic}/u.test(text)) issues.push("no emoji");
  if ((text.match(/«/g) ?? []).length !== (text.match(/»/g) ?? []).length) issues.push("unbalanced « »");
  if (/\s[,.]/u.test(text)) issues.push("space before comma or period");
  if (/[,;:]\S/u.test(text.replace(/\d[,.:]\d/g, ""))) issues.push("missing space after punctuation");
  if (/\.\s*\./u.test(text)) issues.push("double period");
  return issues;
}

/** Grade estimate from lemma frequency (per million words): 4 = CM1 … 9 = 3e. */
export function gradeFromFrequency(frequencyPerMillion: number): number {
  if (frequencyPerMillion >= 250) return 4;
  if (frequencyPerMillion >= 100) return 5;
  if (frequencyPerMillion >= 50) return 6;
  if (frequencyPerMillion >= 25) return 7;
  if (frequencyPerMillion >= 10) return 8;
  return 9;
}

export const GRADE_LABELS: Record<number, string> = { 4: "CM1", 5: "CM2", 6: "6e", 7: "5e", 8: "4e", 9: "3e" };

const GRAMMATICAL_POS = /^(ART|PRO|PRE|CON|AUX|ADJ:(pos|dem|int|ind|num))/;

/** Lemmas that are not sent to the model at all, with the reason recorded. */
export function lemmaEligibility(lemma: Pick<ReleaseLemma, "lemma" | "normalizedLemma" | "partOfSpeech">): { eligible: true } | { eligible: false; reason: string } {
  const value = lemma.normalizedLemma;
  if (value.length < 2 || !/\p{L}{2}/u.test(value)) return { eligible: false, reason: "fragment" };
  if (/['’]$/u.test(value) || /\s/u.test(value) || /^(\p{L}+)(-\1)+$/u.test(value)) return { eligible: false, reason: "fragment" };
  if (lemma.partOfSpeech && GRAMMATICAL_POS.test(lemma.partOfSpeech)) return { eligible: false, reason: "grammatical" };
  if (lemma.partOfSpeech === "ONO") return { eligible: false, reason: "interjection" };
  return { eligible: true };
}

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps). */
export function editDistance(left: string, right: string, max = Number.POSITIVE_INFINITY): number {
  if (Math.abs(left.length - right.length) > max) return max + 1;
  const rows = left.length + 1;
  const cols = right.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[rows - 1][cols - 1];
}

/**
 * Words spelled almost like the lemma (distance ≤ 2, accents count as one
 * edit), outside its family. Same part of speech first, then closer, then more
 * frequent. These make spelling and meaning distractors that cannot be
 * eliminated by shape alone.
 */
export function orthographicNeighbors(target: ReleaseLemma, candidates: ReleaseLemma[], limit = 5): string[] {
  const value = normalizeForMatch(target.normalizedLemma);
  if (value.length < 3) return [];
  const isFamily = familyMatcher({ lemma: target.lemma, forms: target.forms });
  const maxDistance = value.length <= 5 ? 1 : 2;
  return candidates
    .filter((candidate) => candidate.normalizedLemma !== target.normalizedLemma && lemmaEligibility(candidate).eligible && !isBlockedWord(candidate.normalizedLemma))
    .map((candidate) => ({ candidate, distance: editDistance(value, normalizeForMatch(candidate.normalizedLemma), maxDistance) }))
    .filter(({ candidate, distance }) => distance <= maxDistance && !isFamily(candidate.normalizedLemma))
    .sort((left, right) =>
      Number(right.candidate.partOfSpeech === target.partOfSpeech) - Number(left.candidate.partOfSpeech === target.partOfSpeech)
      || left.distance - right.distance
      || right.candidate.frequencyPerMillion - left.candidate.frequencyPerMillion
      || left.candidate.normalizedLemma.localeCompare(right.candidate.normalizedLemma, "fr"))
    .slice(0, limit)
    .map(({ candidate }) => displaySpelling(candidate.lemma));
}

/**
 * Keeps only close words whose spelling exists in the licensed lexicon (AI
 * never decides spelling), that are not the word itself or its family, and
 * that the verifier did not reject. Returns the vetted spelling.
 */
export function vetCloseWords(words: string[], options: { knownLemmas: ReadonlyMap<string, string>; isFamily: (token: string) => boolean; rejected?: Iterable<string>; limit?: number }): string[] {
  const rejected = new Set([...(options.rejected ?? [])].map(normalizeForMatch));
  const out: string[] = [];
  for (const word of words) {
    const normalized = normalizeForMatch(word);
    const known = options.knownLemmas.get(normalized);
    if (!known || rejected.has(normalized) || isBlockedWord(normalized) || options.isFamily(normalized) || out.includes(displaySpelling(known))) continue;
    out.push(displaySpelling(known));
    if (out.length >= (options.limit ?? 6)) break;
  }
  return out;
}

export type GateContext = {
  lemma: ReleaseLemma;
  /** All known lemma spellings, normalised → display (full lexicon when available). */
  knownLemmas: ReadonlyMap<string, string>;
  orthographic: string[];
};

export type GatedItem = {
  gates: GateResult[];
  passed: boolean;
  definition: string;
  examples: Array<{ text: string; interest: string | null; form: string }>;
  validation: DefinitionValidationCriterion[];
  relatedTopics: string[];
  closeWords: CloseWords;
  isFamily: (token: string) => boolean;
};

function gate(gates: GateResult[], name: string, problems: string[]) {
  gates.push(problems.length === 0 ? { gate: name, status: "pass" } : { gate: name, status: "fail", details: problems.join("; ") });
}

/** Runs every deterministic gate on a generated (teachable) item and returns the cleaned item. */
export function runDeterministicGates(generated: GeneratedDefinition, context: GateContext): GatedItem {
  const gates: GateResult[] = [];
  const isFamily = familyMatcher({ lemma: context.lemma.lemma, forms: context.lemma.forms, family: generated.family });
  const formSet = new Set([context.lemma.normalizedLemma, ...context.lemma.forms].map(normalizeForMatch));

  const definition = normalizeTypography(generated.definition ?? "");
  const definitionWords = countWords(definition);
  gate(gates, "definition_length", definition.length === 0 ? ["missing"] : definitionWords > DEFINITION_MAX_WORDS ? [`${definitionWords} words > ${DEFINITION_MAX_WORDS}`] : definitionWords < 2 ? ["too short"] : []);
  const circular = familyWordsIn(definition, isFamily);
  gate(gates, "definition_non_circular", circular.length ? [`uses the word or its family: ${circular.join(", ")}`] : []);
  gate(gates, "definition_typography", definition ? typographyIssues(definition) : ["missing"]);

  const examples = generated.examples.map((example) => ({
    text: normalizeTypography(example.text),
    interest: example.interest && INTEREST_KEYS.has(example.interest) ? example.interest : null,
    form: normalizeForMatch(example.form),
  }));
  const exampleProblems: string[] = [];
  if (examples.length < 2 || examples.length > 3) exampleProblems.push(`${examples.length} examples (2–3 expected)`);
  if (new Set(examples.map((example) => normalizeForMatch(example.text))).size !== examples.length) exampleProblems.push("duplicate examples");
  if (!examples.some((example) => example.interest)) exampleProblems.push("no example tagged with a student interest");
  gate(gates, "examples_count_and_interest", exampleProblems);
  const formProblems: string[] = [];
  const typoProblems: string[] = [];
  examples.forEach((example, index) => {
    const tokens = matchTokens(example.text);
    const used = tokens.find((token) => formSet.has(token));
    const multiword = context.lemma.normalizedLemma.includes(" ") && normalizeForMatch(example.text).includes(normalizeForMatch(context.lemma.normalizedLemma));
    if (!used && !multiword) formProblems.push(`example ${index + 1} has no form of « ${context.lemma.lemma} »`);
    const words = countWords(example.text);
    if (words > EXAMPLE_MAX_WORDS) typoProblems.push(`example ${index + 1}: ${words} words > ${EXAMPLE_MAX_WORDS}`);
    for (const issue of typographyIssues(example.text)) typoProblems.push(`example ${index + 1}: ${issue}`);
  });
  gate(gates, "examples_contain_inflected_form", formProblems);
  gate(gates, "examples_typography", typoProblems);

  const validation: DefinitionValidationCriterion[] = [];
  const validationProblems: string[] = [];
  if (!generated.validation) {
    validationProblems.push("missing");
  } else {
    for (const idea of generated.validation.keyIdeas) {
      const keywords = [...new Set(idea.keywords.map((keyword) => normalizeForMatch(keyword)).filter((keyword) => keyword && !familyWordsIn(keyword, isFamily).length))];
      if (idea.required && keywords.length < 2) validationProblems.push(`key idea « ${idea.idea} » needs 2+ keywords outside the word family`);
      validation.push({ kind: "key_idea", idea: normalizeTypography(idea.idea), keywords, required: idea.required });
    }
    if (!validation.some((criterion) => criterion.kind === "key_idea" && criterion.required)) validationProblems.push("no required key idea");
    for (const paraphrase of generated.validation.acceptedParaphrases) {
      const text = normalizeTypography(paraphrase);
      if (familyWordsIn(text, isFamily).length) { validationProblems.push(`paraphrase « ${text} » uses the word family`); continue; }
      if (countWords(text) > 25) { validationProblems.push("paraphrase too long"); continue; }
      validation.push({ kind: "accepted_paraphrase", text });
    }
    if (!validation.some((criterion) => criterion.kind === "accepted_paraphrase")) validationProblems.push("no accepted paraphrase");
    for (const misconception of generated.validation.misconceptions) validation.push({ kind: "misconception", text: normalizeTypography(misconception) });
  }
  gate(gates, "definition_validation_shape", validationProblems);

  const relatedTopics = [...new Set([...generated.relatedTopics, ...examples.map((example) => example.interest)].filter((key): key is string => Boolean(key) && INTEREST_KEYS.has(key as string)))].slice(0, 6);
  const closeWords: CloseWords = {
    synonyms: vetCloseWords(generated.synonyms, { knownLemmas: context.knownLemmas, isFamily }),
    antonyms: vetCloseWords(generated.antonyms, { knownLemmas: context.knownLemmas, isFamily }),
    semantic: vetCloseWords(generated.semanticNeighbors, { knownLemmas: context.knownLemmas, isFamily, rejected: [...generated.synonyms, ...generated.antonyms] }),
    orthographic: context.orthographic.filter((word) => !isFamily(word)),
  };
  return {
    gates,
    passed: gates.every((result) => result.status === "pass"),
    definition,
    examples,
    validation,
    relatedTopics,
    closeWords,
    isFamily,
  };
}
