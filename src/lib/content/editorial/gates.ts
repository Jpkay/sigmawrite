import { fallbackModeration } from "@/lib/safety/moderate-input";
import type { FrenchGrammarChecker, GrammarMatch } from "@/lib/linguistic/types";
import { AI_TELL_THRESHOLDS, checkAiTells, unicodeWordBoundaries, type AiTellReport } from "./ai-tells";
import type { EditorialBrief } from "./brief";
import { wordNgrams } from "./corpus";
import { HERO_PLACEHOLDER } from "./types";
import { checkLemmaPresence, checkTensePresence, textVariants, type TenseEvidence } from "./targets";
import { measureStyle, splitSentences, styleFit, tokenize } from "./stylometry";
import { STYLE_LIBRARY, type StyleCard } from "./styles";
import { plainSpaces } from "./typography";

/**
 * Automatic checks before a student sees anything (roadmap F.3, "code checks"
 * role of H.10). No model judgement here:
 *  - hard gates (moderation, safety, personal data, copying, markers, length cap)
 *    can never be overridden: failing after the rewrite means fallback;
 *  - required gates (targets, grammar) must pass to publish, a rewrite may fix them;
 *  - signals (AI tells, style fit, readability) feed the editor-in-chief.
 */

export type GateLevel = "hard" | "required" | "signal";
export type GateResult = { gate: string; level: GateLevel; passed: boolean; detail: string; data?: unknown };

export type GateDeps = {
  /** Moderation of generated content (provider-backed in production). Fails closed when it throws. */
  moderate?: (text: string) => Promise<{ allowed: boolean; categories: string[] }>;
  /** LanguageTool when configured; skipped (and reported) otherwise. */
  grammar?: FrenchGrammarChecker | null;
  /** The student's real first name / nickname: must never appear (we only ever send placeholders). */
  forbiddenNames?: string[];
  /** Character names allowed by the saga outline. */
  allowedNames?: string[];
};

export type GateInput = {
  template: string;
  brief: EditorialBrief;
  style: StyleCard;
  tenseEvidence?: TenseEvidence[];
};

export type GateReport = {
  results: GateResult[];
  hardFailed: boolean;
  requiredFailed: boolean;
  aiTells: AiTellReport;
  styleFit: number;
  wordCount: number;
};

/** Content never allowed in student texts, whatever the moderation provider says. */
const SAFETY_LEXICON: Array<{ category: string; pattern: RegExp }> = [
  { category: "gore", pattern: /\b(?:égorg|éventr|décapit|démembr|tripes à l'air|mare de sang|giclée? de sang)\w*/iu },
  { category: "sexual", pattern: /\b(?:sexe|sexuel\w*|porno\w*|érotique\w*|baiser langoureux)\b/iu },
  { category: "drugs_alcohol", pattern: /\b(?:drogue\w*|cannabis|cocaïne|héroïne en poudre|whisky|vodka|cigarettes?|vapoter|vapote)\b/iu },
  { category: "self_harm", pattern: /\b(?:suicid|se tuer|se faire du mal|scarif)\w*/iu },
  { category: "weapons_real", pattern: /\b(?:kalachnikov|fusil d'assaut|pistolet automatique|bombe artisanale|grenade)\b/iu },
  { category: "slur", pattern: /\b(?:connard|salope|pute|enculé|négro|bougnoule|pédé|gogol|attardé mental)\b/iu },
  { category: "horror_minor", pattern: /\b(?:cadavre d'enfant|enfant mort|kidnapp\w* un enfant)\b/iu },
];

/** Safety lexicon categories found in a text (also used by live practice sentences). */
export function safetyLexiconHits(text: string): string[] {
  return SAFETY_LEXICON.filter((rule) => unicodeWordBoundaries(rule.pattern).test(text)).map((rule) => rule.category);
}

const PERSONAL_DATA = [
  { category: "contact", pattern: /\b\+?\d[\d .()-]{7,}\d\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|https?:\/\//iu },
  { category: "address", pattern: /\b\d{1,4},? (?:rue|avenue|boulevard|impasse|allée|chemin) /iu },
  { category: "real_school", pattern: /\b(?:collège|lycée|école) (?:Jean|Victor|Jules|Louis|Marie|Paul|Saint|Sainte|Pierre|Jacques)\b/u },
];

/** Personal-data categories found in a text (contact, address, real school). */
export function personalDataHits(text: string): string[] {
  return PERSONAL_DATA.filter((rule) => rule.pattern.test(text)).map((rule) => rule.category);
}

/** Common capitalised words that are not names (sentence starters, places generic, interjections). */
const NOT_NAMES = new Set(["Il", "Elle", "Ils", "Elles", "On", "Tu", "Je", "Nous", "Vous", "Le", "La", "Les", "Un", "Une", "Des", "Mais", "Et", "Puis", "Alors", "Quand", "Ce", "Cette", "Son", "Sa", "Ses", "Ton", "Ta", "Tes", "Mon", "Ma", "Mes", "Oh", "Ah", "Eh", "Hé", "Non", "Oui", "Si", "Dans", "Sur", "Sous", "Au", "Aux", "Du", "De", "En", "Pour", "Par", "Avec", "Sans", "Pourquoi", "Comment", "Où", "Qui", "Que", "Quoi", "Là", "Ici", "Tout", "Tous", "Rien", "Personne", "Monsieur", "Madame", "Mademoiselle", "Maître", "Capitaine", "Docteur", "Coach", "Papa", "Maman", "Grand-mère", "Grand-père", "Mamie", "Papi", "Dieu", "Noël", "Paris", "France", "Lune", "Terre", "Soleil", "Mars", "Atlantique", "Méditerranée"]);

export function findUnknownNames(text: string, allowed: string[]): string[] {
  const allowedSet = new Set(allowed.map((n) => n.toLocaleLowerCase("fr")));
  const unknown = new Set<string>();
  for (const sentence of splitSentences(text)) {
    const tokens = sentence.replace(/^[—–«\s]+/u, "").split(/\s+/u);
    tokens.forEach((raw, index) => {
      const word = raw.replace(/^[«"(—–-]+|[»"),.;:!?…]+$/gu, "").replace(/['’].*$/u, "");
      if (index === 0 || !/^\p{Lu}\p{Ll}{2,}/u.test(word)) return;
      if (NOT_NAMES.has(word) || allowedSet.has(word.toLocaleLowerCase("fr"))) return;
      unknown.add(word);
    });
  }
  return [...unknown];
}

/** Grammar matches that are real errors (spelling, agreement, conjugation), ignoring style and names. */
export function blockingGrammarMatches(text: string, matches: GrammarMatch[], allowedNames: string[]): GrammarMatch[] {
  const allowed = new Set(allowedNames.map((n) => n.toLocaleLowerCase("fr")));
  return matches.filter((m) => {
    if (["STYLE", "TYPOGRAPHY", "REDUNDANCY", "CASING", "PUNCTUATION", "MISC"].includes(m.category)) return false;
    if (m.issueType && ["style", "typographical", "whitespace", "locale-violation"].includes(m.issueType)) return false;
    const fragment = text.slice(m.offset, m.offset + m.length);
    if (/^\p{Lu}/u.test(fragment) && (allowed.has(fragment.toLocaleLowerCase("fr")) || m.category === "TYPOS")) return false;
    return true;
  });
}

let corpusGrams: Set<string> | null = null;
function corpusNgrams(): Set<string> {
  if (corpusGrams) return corpusGrams;
  corpusGrams = new Set();
  for (const card of STYLE_LIBRARY) for (const excerpt of card.excerpts) for (const gram of wordNgrams(excerpt.text, 7)) corpusGrams.add(gram);
  return corpusGrams;
}

/** Provider moderation must answer within this delay per attempt (3 attempts), else the hard gate fails closed. */
export const MODERATION_TIMEOUT_MS = Number(process.env.EDITORIAL_MODERATION_TIMEOUT_MS ?? 15_000);
const MODERATION_ATTEMPTS = 3;

async function moderateWithTimeout(moderate: NonNullable<GateDeps["moderate"]>, text: string, timeoutMs: number): Promise<{ allowed: boolean; categories: string[] }> {
  for (let attempt = 0; attempt < MODERATION_ATTEMPTS; attempt += 1) {
    // Short growing pause between attempts: the model behind moderation has occasional slow or malformed answers.
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(2_000, Math.ceil(timeoutMs / 10)) * attempt));
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        moderate(text),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("moderation_timeout")), timeoutMs); }),
      ]);
    } catch { /* retried, then fails closed */ } finally { if (timer) clearTimeout(timer); }
  }
  return { allowed: false, categories: ["moderation_unavailable"] };
}

export type GateOptions = {
  /** false for the line editor's pre-check: findings only, the final text is always moderated. */
  moderation?: boolean;
  moderationTimeoutMs?: number;
};

export async function runGates(input: GateInput, deps: GateDeps = {}, options: GateOptions = {}): Promise<GateReport> {
  const { brief, style } = input;
  const template = input.template;
  const [femaleRender] = textVariants(template);
  const plain = plainSpaces(femaleRender);
  const results: GateResult[] = [];
  const push = (gate: string, level: GateLevel, passed: boolean, detail: string, data?: unknown) => results.push({ gate, level, passed, detail, data });

  // Hard: moderation (deterministic rules first, then the provider; provider errors fail closed).
  const rules = fallbackModeration(plain);
  let moderation = { allowed: rules.allowed, categories: rules.categories };
  const providerModeration = options.moderation !== false;
  if (moderation.allowed && deps.moderate && providerModeration) {
    moderation = await moderateWithTimeout(deps.moderate, plain, options.moderationTimeoutMs ?? MODERATION_TIMEOUT_MS);
  }
  push("moderation", "hard", moderation.allowed, moderation.allowed ? (providerModeration ? "ok" : "règles locales (pré-contrôle)") : moderation.categories.join(","));

  const safety = safetyLexiconHits(plain);
  push("safety_lexicon", "hard", safety.length === 0, safety.join(",") || "ok");

  const personal = personalDataHits(plain);
  const forbidden = (deps.forbiddenNames ?? []).filter((name) => name.trim().length >= 2 && new RegExp(`(^|[^\\p{L}])${name.trim().replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}($|[^\\p{L}])`, "iu").test(template));
  push("personal_data", "hard", personal.length === 0 && forbidden.length === 0, [...personal, ...forbidden.map(() => "student_name")].join(",") || "ok");

  const stray = template.replace(/\{\{HEROS\}\}/gu, "").replace(/\{\{m:[^|{}]*\|f:[^{}]*\}\}/gu, "");
  const markersOk = !/[{}]/u.test(stray) && (brief.hero === null || brief.narration !== "il" || template.includes(HERO_PLACEHOLDER));
  push("markers", "hard", markersOk, markersOk ? "ok" : "marqueurs de héros mal formés ou absents");

  const grams = wordNgrams(plain, 7);
  const copied = [...grams].filter((gram) => corpusNgrams().has(gram));
  push("copying", "hard", copied.length === 0, copied.length ? `${copied.length} séquence(s) de 7 mots copiées du corpus` : "ok", copied.slice(0, 5));

  const words = tokenize(plain).filter((t) => !t.endsWith("'")).length;
  const { min, max } = brief.lengthWords;
  push("length_cap", "hard", words <= Math.ceil(max * 1.25), `${words} mots (plafond ${Math.ceil(max * 1.25)})`);
  push("length_band", "required", words >= Math.floor(min * 0.85) && words <= Math.ceil(max * 1.15), `${words} mots (cible ${min}–${max})`);

  // Required: learning targets, checked deterministically.
  const lemmas = checkLemmaPresence(template, brief.targetLemmas.map((l) => l.lemma));
  const missingLemmas = lemmas.filter((l) => !l.found).map((l) => l.lemma);
  push("target_lemmas", "required", missingLemmas.length === 0, missingLemmas.length ? `absents : ${missingLemmas.join(", ")}` : "tous présents", lemmas);
  const tenses = checkTensePresence(template, brief.targetTenses, input.tenseEvidence);
  const missingTenses = tenses.filter((t) => !t.found).map((t) => t.tense);
  push("target_tenses", "required", missingTenses.length === 0, missingTenses.length ? `temps non vérifiés : ${missingTenses.join(", ")}` : "vérifiés par le conjugueur", tenses);

  // Required: grammar (LanguageTool) when configured.
  if (deps.grammar) {
    try {
      const check = await deps.grammar.check(plain, { language: "fr" });
      const blocking = blockingGrammarMatches(plain, check.matches, deps.allowedNames ?? []);
      push("languagetool", "required", blocking.length === 0, blocking.length ? blocking.slice(0, 5).map((m) => `${plain.slice(m.offset, m.offset + m.length)} → ${m.message}`).join(" | ") : "ok", blocking.slice(0, 10));
    } catch (error) {
      // The grammar service being down must not let unchecked text through in library mode.
      push("languagetool", brief.mode === "library" ? "required" : "signal", false, `indisponible : ${error instanceof Error ? error.message : "erreur"}`);
    }
  } else {
    push("languagetool", "signal", true, "non configuré (LANGUAGETOOL_URL absent)");
  }

  // Signals.
  const unknownNames = findUnknownNames(plain.replace(/Camille/gu, ""), deps.allowedNames ?? []);
  push("names", "signal", unknownNames.length === 0, unknownNames.length ? `noms hors distribution : ${unknownNames.join(", ")}` : "ok", unknownNames);
  const profile = measureStyle(plain);
  push("readability", "signal", profile.sentenceLength.mean <= brief.readabilityTarget.maxAverageSentenceWords * 1.15 && profile.sentenceLength.p90 <= brief.readabilityTarget.maxSentenceWords * 1.2,
    `phrases : moyenne ${profile.sentenceLength.mean}, 90e centile ${profile.sentenceLength.p90} (cible ≤ ${brief.readabilityTarget.maxAverageSentenceWords} / ${brief.readabilityTarget.maxSentenceWords})`);
  const aiTells = checkAiTells(plain);
  const threshold = brief.mode === "library" ? AI_TELL_THRESHOLDS.library : AI_TELL_THRESHOLDS.live;
  push("ai_tells", "signal", aiTells.score < threshold, `score ${aiTells.score} (seuil ${threshold})${aiTells.findings.length ? ` : ${aiTells.findings.slice(0, 4).map((f) => f.label).join(" ; ")}` : ""}`, aiTells.findings);
  const fit = style.measured ? styleFit(profile, style.measured, { maxSentenceMean: brief.readabilityTarget.maxAverageSentenceWords }) : { score: 1, deviations: [] };
  push("style_measures", "signal", fit.score >= 0.5, `accord avec la carte mesurée : ${fit.score}`, fit.deviations);

  return {
    results,
    hardFailed: results.some((r) => r.level === "hard" && !r.passed),
    requiredFailed: results.some((r) => r.level === "required" && !r.passed),
    aiTells,
    styleFit: fit.score,
    wordCount: words,
  };
}

/** Short French notes for the rewrite step: what the code checks want fixed. */
export function gateNotes(report: GateReport): string[] {
  return report.results.filter((r) => !r.passed).map((r) => `[${r.gate}] ${r.detail}`);
}
