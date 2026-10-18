import { conjugate, participePasse, agreePp, PERSONS, type Tense } from "@/lib/linguistic/conjugation";
import { renderHero } from "./hero";
import type { TenseKey } from "./types";

/**
 * Deterministic checks of learning targets (roadmap F.3). The model may
 * *declare* where it used a word or a tense; only the conjugation engine and
 * the morphology rules below decide whether the declaration is true.
 */

const ENGINE_TENSES: TenseKey[] = ["present", "imparfait", "passe_compose", "futur_simple", "passe_simple", "conditionnel_present", "subjonctif_present", "imperatif_present", "plus_que_parfait"];
/** Verbs whose engine output is reliable for every tense it accepts (no stem alternations it ignores). */
const BLOCKED_VERBS = new Set(["appeler", "jeter", "acheter", "lever", "mener", "peser", "geler", "écrire", "décrire", "inscrire"]);
/** Frequent verbs scanned automatically, in addition to the declared evidence. */
export const SCAN_VERBS = [
  "être", "avoir", "aller", "faire", "dire", "pouvoir", "vouloir", "savoir", "voir", "venir", "devoir", "prendre", "partir", "sortir", "mettre", "courir", "dormir", "attendre", "découvrir", "rejoindre",
  "finir", "choisir", "réussir", "grandir", "remplir", "réfléchir", "agir", "parler", "marcher", "regarder", "trouver", "donner", "penser", "passer", "arriver", "entrer", "rester", "tomber", "jouer", "chercher",
  "écouter", "porter", "montrer", "demander", "laisser", "crier", "lancer", "manger", "sauter", "tourner", "gagner", "tirer", "pousser", "fermer", "aimer", "rentrer", "monter", "descendre", "attraper", "glisser",
  "frapper", "danser", "chanter", "dessiner", "rêver", "traverser", "grimper", "garder", "commencer", "continuer", "oublier", "raconter", "répéter", "souffler", "murmurer", "hurler", "siffler", "toucher", "lâcher", "tomber",
  "briller", "cacher", "compter", "décider", "dessiner", "échapper", "envoyer", "essayer", "filer", "fixer", "gratter", "hésiter", "imaginer", "lever", "marquer", "noter", "observer", "plonger", "posséder", "quitter",
  "ramasser", "reculer", "remarquer", "retrouver", "sembler", "serrer", "soulever", "suivre", "taper", "trembler", "voler", "voyager",
].filter((verb, index, all) => all.indexOf(verb) === index && !BLOCKED_VERBS.has(verb));

const ELISION = /^(?:l|d|j|m|t|s|n|qu|c|jusqu|lorsqu|puisqu)['’]/u;

export function normalizeWord(word: string): string {
  return word.normalize("NFC").toLocaleLowerCase("fr").replace(/’/gu, "'").replace(ELISION, "");
}

export function wordsOf(text: string): string[] {
  return (text.normalize("NFC").toLocaleLowerCase("fr").replace(/’/gu, "'").match(/[\p{L}]+(?:['-][\p{L}]+)*/gu) ?? []).map(normalizeWord);
}

/** All forms of a verb the engine can produce, mapped to the tenses that produce them. */
const FORM_CACHE = new Map<string, Map<string, Set<TenseKey>>>();
export function verbForms(lemma: string): Map<string, Set<TenseKey>> {
  const cached = FORM_CACHE.get(lemma);
  if (cached) return cached;
  const forms = new Map<string, Set<TenseKey>>();
  const add = (form: string, tense: TenseKey) => {
    const key = form.toLocaleLowerCase("fr").replace(/’/gu, "'");
    if (!forms.has(key)) forms.set(key, new Set());
    forms.get(key)!.add(tense);
  };
  FORM_CACHE.set(lemma, forms);
  if (BLOCKED_VERBS.has(lemma)) return forms;
  for (const tense of ENGINE_TENSES) {
    for (const person of PERSONS) {
      for (const gender of ["m", "f"] as const) {
        try {
          add(conjugate(lemma, tense as Tense, person, tense === "passe_compose" || tense === "plus_que_parfait" ? { gender } : undefined), tense);
        } catch { /* unsupported combination: skip */ }
      }
    }
  }
  return forms;
}

/** Nominal/adjectival inflections of a lemma (deterministic French morphology). */
export function nominalForms(lemma: string): Set<string> {
  const l = lemma.toLocaleLowerCase("fr");
  const out = new Set([l, `${l}s`, `${l}x`]);
  const swap = (from: RegExp, ...to: string[]) => { if (from.test(l)) for (const t of to) out.add(l.replace(from, t)); };
  if (!l.endsWith("e")) { out.add(`${l}e`); out.add(`${l}es`); }
  swap(/al$/u, "aux", "ale", "ales");
  swap(/ail$/u, "aux");
  swap(/eau$/u, "eaux");
  swap(/eux$/u, "euse", "euses");
  swap(/eur$/u, "euse", "euses", "rice", "rices");
  swap(/teur$/u, "trice", "trices");
  swap(/if$/u, "ive", "ives");
  swap(/er$/u, "ère", "ères");
  swap(/en$/u, "enne", "ennes");
  swap(/on$/u, "onne", "onnes");
  swap(/et$/u, "ette", "ettes");
  swap(/el$/u, "elle", "elles");
  swap(/s$/u, "se", "ses");
  return out;
}

export function lemmaForms(lemma: string): Set<string> {
  const forms = nominalForms(lemma);
  if (/(?:er|ir|re|oir)$/u.test(lemma)) {
    for (const form of verbForms(lemma).keys()) for (const part of form.split(/\s+/u)) if (part.length > 2) forms.add(part);
    try { const pp = participePasse(lemma); for (const g of ["m", "f"] as const) for (const n of ["s", "p"] as const) forms.add(agreePp(pp, { gender: g, number: n })); } catch { /* unsupported */ }
  }
  return forms;
}

/** Renders both hero genders so agreement markers never hide a target. */
export function textVariants(template: string): string[] {
  return [renderHero(template, { name: "Camille", gender: "f" }), renderHero(template, { name: "Camille", gender: "m" })];
}

export type LemmaPresence = { lemma: string; found: boolean; form?: string };

export function checkLemmaPresence(template: string, lemmas: string[]): LemmaPresence[] {
  const words = new Set(textVariants(template).flatMap(wordsOf));
  return lemmas.map((lemma) => {
    const form = [...lemmaForms(lemma.toLocaleLowerCase("fr"))].find((candidate) => words.has(candidate));
    return { lemma, found: Boolean(form), form };
  });
}

export type TenseEvidence = { form: string; lemma: string; tense: TenseKey };
export type TensePresence = { tense: TenseKey; found: boolean; evidence: Array<{ form: string; lemma: string; source: "declared" | "scan" }> };

function containsForm(text: string, form: string): boolean {
  const words = wordsOf(text);
  const parts = wordsOf(form);
  if (parts.length === 0) return false;
  if (parts.length === 1) return words.includes(parts[0]);
  // Compound tenses: auxiliary then participle within 3 words ("a déjà couru", "n'avait pas vu").
  for (let i = 0; i < words.length; i += 1) {
    if (words[i] !== parts[0]) continue;
    if (words.slice(i + 1, i + 5).includes(parts[parts.length - 1])) return true;
  }
  return false;
}

/** Verifies declared tense evidence with the engine, and scans frequent verbs for more. */
export function checkTensePresence(template: string, tenses: TenseKey[], declared: TenseEvidence[] = []): TensePresence[] {
  const variants = textVariants(template);
  const text = variants.join("\n");
  const results: TensePresence[] = tenses.map((tense) => ({ tense, found: false, evidence: [] }));
  const byTense = new Map(results.map((r) => [r.tense, r]));
  for (const item of declared) {
    const target = byTense.get(item.tense);
    if (!target) continue;
    const lemma = item.lemma.toLocaleLowerCase("fr").trim().replace(/^(?:se |s')/u, "");
    const forms = verbForms(lemma);
    const declaredForm = item.form.toLocaleLowerCase("fr").replace(/’/gu, "'").replace(/^(?:je |j'|tu |il |elle |on |nous |vous |ils |elles )/u, "").trim();
    const engineTenses = forms.get(declaredForm);
    if (engineTenses?.has(item.tense) && containsForm(text, declaredForm)) target.evidence.push({ form: declaredForm, lemma, source: "declared" });
  }
  const words = wordsOf(text);
  const bigrams = new Set(words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`));
  const single = new Set(words);
  for (const verb of SCAN_VERBS) {
    for (const [form, formTenses] of verbForms(verb)) {
      const present = form.includes(" ") ? bigrams.has(form) || containsForm(text, form) : single.has(form);
      if (!present) continue;
      // Simple forms of être/avoir are usually auxiliaries of a compound tense: never scan-evidence.
      if ((verb === "être" || verb === "avoir") && !form.includes(" ")) continue;
      // Ambiguous forms (finit = présent or passé simple) only count when unambiguous.
      if (formTenses.size !== 1) continue;
      const [tense] = [...formTenses];
      const target = byTense.get(tense);
      if (target && target.evidence.length < 6) target.evidence.push({ form, lemma: verb, source: "scan" });
    }
  }
  for (const r of results) r.found = r.evidence.length > 0;
  return results;
}
