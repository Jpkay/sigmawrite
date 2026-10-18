import { z } from "zod";
import { conjugate, type Gender, type Person, type Tense } from "@/lib/linguistic/conjugation";
import { fallbackModeration } from "@/lib/safety/moderate-input";
import { interestPhrase } from "@/lib/content/interests";
import { findUnknownNames, safetyLexiconHits } from "@/lib/content/editorial/gates";

/**
 * Roadmap F.2 (live): one short practice sentence set in the student's
 * interest, around a conjugation item of the bank. The model only writes the
 * setting. The verb, tense, person and the expected form come from the item
 * and the conjugation engine; deterministic gates check that the sentence
 * contains exactly that form after the right subject, then the form is
 * blanked. Grading is unchanged (the item's conjugator validator). Any failure
 * keeps the bank prompt.
 */

export const LIVE_SENTENCE_VERSION = "live-sentence-1";

export type LiveSentenceSpec = { verb: string; tense: Tense; person: Person; gender: Gender; form: string; subject: string; interest: string; maxWords: number };

const SUPPORTED: Tense[] = ["present", "imparfait", "passe_compose", "plus_que_parfait", "futur_simple", "futur_proche", "passe_recent", "passe_simple", "conditionnel_present", "subjonctif_present", "imperatif_present"];
const VOWEL = /^[aeéèêëiîïoôuûyh]/iu;

/** Subject written before the form, with French elision (j’, qu’). Empty for the impératif. */
export function subjectFor(person: Person, gender: Gender, form: string, tense: Tense): string {
  if (tense === "imperatif_present") return "";
  const pronoun = { "1s": VOWEL.test(form) ? "j’" : "je", "2s": "tu", "3s": gender === "f" ? "elle" : "il", "1p": "nous", "2p": "vous", "3p": gender === "f" ? "elles" : "ils" }[person];
  if (tense !== "subjonctif_present") return pronoun;
  return /^[ie]/u.test(pronoun) ? `qu’${pronoun}` : `que ${pronoun}`;
}

/**
 * Builds the spec for a bank conjugation item, or null when the item is not
 * a plain {verb, tense, person} conjugator item (COD agreement, auxiliary
 * choice and special uses keep their authored sentence).
 */
export function liveSentenceSpec(item: { validatorType: string; validatorConfig: Record<string, unknown> | null }, interest: string, grade: number): LiveSentenceSpec | null {
  const c = item.validatorConfig ?? {};
  if (item.validatorType !== "conjugator" || typeof c.verb !== "string" || typeof c.tense !== "string" || typeof c.person !== "string") return null;
  if (c.codBefore !== undefined || c.auxiliaryUse !== undefined || c.vouloirImperativeUse !== undefined) return null;
  const tense = c.tense as Tense;
  if (!SUPPORTED.includes(tense)) return null;
  const person = c.person as Person;
  const gender: Gender = c.gender === "f" ? "f" : "m";
  let form: string;
  try { form = conjugate(c.verb, tense, person, { gender }); } catch { return null; }
  return { verb: c.verb, tense, person, gender, form, subject: subjectFor(person, gender, form, tense), interest, maxWords: grade <= 5 ? 14 : 18 };
}

const TENSE_WORDS: Record<Tense, string> = {
  present: "présent", imparfait: "imparfait", passe_compose: "passé composé", plus_que_parfait: "plus-que-parfait", futur_simple: "futur simple",
  futur_proche: "futur proche", passe_recent: "passé récent", passe_simple: "passé simple", conditionnel_present: "conditionnel présent",
  subjonctif_present: "subjonctif présent", imperatif_present: "impératif présent",
};

export const liveSentenceSchema = z.object({ sentence: z.string().min(10).max(240) });

/** The model receives the item's verb, form and subject — never anything about the student but an interest key. */
export function liveSentencePrompt(spec: LiveSentenceSpec) {
  const start = spec.subject ? `« ${spec.subject}${spec.subject.endsWith("’") ? "" : " "}${spec.form} »` : `« ${spec.form} » (impératif, sans sujet)`;
  return {
    system: `Tu écris UNE phrase d'exercice de conjugaison pour un élève de 9 à 15 ans qui aime : ${interestPhrase(spec.interest)}.
La phrase se passe dans cet univers (un détail concret qu'un passionné reconnaîtrait), sans personne réelle, sans marque, sans club, sans titre existant, sans prénom.
Elle contient exactement une fois le groupe ${start}, écrit tel quel, et aucune autre forme du verbe « ${spec.verb} ».
${spec.subject ? `Le sujet du verbe est le pronom « ${spec.subject.replace(/’$/u, "")} », placé juste avant le verbe.` : "Le verbe ouvre la phrase."}
Au plus ${spec.maxWords} mots, une seule phrase, pas de chiffres, ton chaleureux, rien d'effrayant.
Réponds uniquement en JSON : { "sentence": "..." }.`,
    user: JSON.stringify({ verbe: spec.verb, temps: TENSE_WORDS[spec.tense], forme: spec.form, sujet: spec.subject || null, univers: spec.interest }),
  };
}

const normalizeQuotes = (text: string) => text.normalize("NFC").replace(/['ʼ`]/gu, "’").replace(/\s+/gu, " ").trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

export type LiveSentenceCheck = { ok: boolean; reasons: string[]; sentence: string; blanked: string | null };

/** Deterministic gates; `blanked` is the sentence with the expected form replaced by a gap. */
export function checkLiveSentence(raw: string, spec: LiveSentenceSpec): LiveSentenceCheck {
  const sentence = normalizeQuotes(raw).replace(/^[«"“]\s*|\s*[»"”]$/gu, "");
  const reasons: string[] = [];
  const words = sentence.split(/[\s’]+/u).filter((w) => /\p{L}/u.test(w));
  if (words.length < 4 || words.length > spec.maxWords + 2) reasons.push(`longueur ${words.length} mots`);
  if (/[\n\r]/u.test(raw) || (sentence.slice(0, -1).match(/[.!?…]\s+\p{Lu}/gu)?.length ?? 0) > 0) reasons.push("plus d'une phrase");
  if (/\d|https?:|www\.|@|[{}<>[\]]/u.test(sentence)) reasons.push("chiffres, liens ou balises");
  const moderation = fallbackModeration(sentence);
  if (!moderation.allowed) reasons.push(`modération : ${moderation.categories.join(",")}`);
  const safety = safetyLexiconHits(sentence);
  if (safety.length) reasons.push(`sécurité : ${safety.join(",")}`);
  const names = findUnknownNames(sentence, []);
  if (names.length) reasons.push(`noms propres : ${names.join(", ")}`);
  // The expected form, as whole words, exactly once.
  // The lead may be an apostrophe (j’ai, qu’il) — the subject check below says whether it belongs there.
  const formPattern = new RegExp(`(^|[^\\p{L}-])(${escape(spec.form)})(?=$|[^\\p{L}’-])`, "giu");
  const hits = [...sentence.matchAll(formPattern)];
  if (hits.length !== 1) reasons.push(hits.length ? "forme répétée" : `forme attendue « ${spec.form} » absente`);
  else if (spec.subject) {
    const before = sentence.slice(0, (hits[0].index ?? 0) + hits[0][1].length).toLocaleLowerCase("fr");
    const subject = spec.subject.toLocaleLowerCase("fr");
    const expected = subject.endsWith("’") ? subject : `${subject} `;
    if (!before.endsWith(expected) || !(before.length === expected.length || /[^\p{L}]$/u.test(before.slice(0, before.length - expected.length)))) reasons.push(`le sujet « ${spec.subject} » doit précéder la forme`);
  } else if (!/^(|.*[,;:—–]\s*)$/u.test(sentence.slice(0, (hits[0].index ?? 0) + hits[0][1].length))) {
    reasons.push("l'impératif doit ouvrir la phrase ou suivre une virgule");
  }
  const ok = reasons.length === 0;
  const blanked = ok ? sentence.replace(formPattern, (_m, lead: string) => `${lead}_____`) : null;
  return { ok, reasons, sentence, blanked };
}

/** Prompt shown to the student: the themed sentence with its gap, then the bank instruction. */
export function themedPrompt(blanked: string, spec: LiveSentenceSpec, bankPrompt: string): string {
  return `« ${blanked.charAt(0).toLocaleUpperCase("fr")}${blanked.slice(1)} »\n${bankPrompt || `Conjugue « ${spec.verb} » au ${TENSE_WORDS[spec.tense]}.`}`;
}
