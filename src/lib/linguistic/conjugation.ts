/**
 * Deterministic French conjugation (Roadmap Phase 8, C1) — QC Gate 0.
 *
 * The LLM never authors conjugations; this does. Scoped to the past-narration
 * slice: présent, imparfait, passé composé (with auxiliary choice + être
 * agreement). Broad coverage (all verbs/tenses/moods) comes later from a lexicon
 * (Morphalou/Lexique, C2); until then this combines a regular-verb algorithm with
 * an explicit irregular table for the slice's verb set.
 *
 * Key correctness lever: imparfait is derived from the présent "nous" stem for
 * ALL verbs (être is the only exception, stem "ét-"), so -ger/-cer spelling and
 * irregular stems fall out automatically once présent is right.
 */

export type Person = "1s" | "2s" | "3s" | "1p" | "2p" | "3p";
export const PERSONS: Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"];
export type Tense = "present" | "imparfait" | "passe_compose";
export type Gender = "m" | "f";
export type Agreement = { gender?: Gender; number?: "s" | "p" };

const PERSON_INDEX: Record<Person, number> = {
  "1s": 0, "2s": 1, "3s": 2, "1p": 3, "2p": 4, "3p": 5,
};

// Irregular présent forms [je, tu, il, nous, vous, ils].
const IRREGULAR_PRESENT: Record<string, string[]> = {
  être: ["suis", "es", "est", "sommes", "êtes", "sont"],
  avoir: ["ai", "as", "a", "avons", "avez", "ont"],
  aller: ["vais", "vas", "va", "allons", "allez", "vont"],
  faire: ["fais", "fais", "fait", "faisons", "faites", "font"],
  prendre: ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
  venir: ["viens", "viens", "vient", "venons", "venez", "viennent"],
  partir: ["pars", "pars", "part", "partons", "partez", "partent"],
  sortir: ["sors", "sors", "sort", "sortons", "sortez", "sortent"],
  dire: ["dis", "dis", "dit", "disons", "dites", "disent"],
  voir: ["vois", "vois", "voit", "voyons", "voyez", "voient"],
};

const IRREGULAR_PP: Record<string, string> = {
  être: "été", avoir: "eu", aller: "allé", faire: "fait", prendre: "pris",
  venir: "venu", partir: "parti", sortir: "sorti", dire: "dit", voir: "vu",
};

// Verbs taking être as the passé-composé auxiliary (the slice's core set).
const ETRE_AUX = new Set([
  "aller", "venir", "arriver", "partir", "entrer", "sortir", "rester",
  "tomber", "naître", "mourir", "devenir", "revenir", "monter", "descendre",
  "retourner", "rentrer",
]);

const PRESENT_ENDINGS_ER = ["e", "es", "e", "ons", "ez", "ent"];
const PRESENT_ENDINGS_IR2 = ["is", "is", "it", "issons", "issez", "issent"];
const IMPARFAIT_ENDINGS = ["ais", "ais", "ait", "ions", "iez", "aient"];

export class UnsupportedVerbError extends Error {}

/** présent for one person. Handles -er (incl. -ger/-cer), group-2 -ir, irregulars. */
export function present(infinitive: string, person: Person): string {
  const verb = infinitive.toLowerCase();
  const i = PERSON_INDEX[person];

  if (IRREGULAR_PRESENT[verb]) return IRREGULAR_PRESENT[verb][i];

  if (verb.endsWith("er")) {
    const rad = verb.slice(0, -2);
    if (i === 3) {
      // nous: -ger keeps e (mangeons), -cer softens c→ç (commençons)
      if (rad.endsWith("g")) return rad + "eons";
      if (rad.endsWith("c")) return rad.slice(0, -1) + "çons";
    }
    return rad + PRESENT_ENDINGS_ER[i];
  }

  if (verb.endsWith("ir")) {
    // Treated as group 2 (finir-type); group-3 -ir verbs live in the table.
    const rad = verb.slice(0, -2);
    return rad + PRESENT_ENDINGS_IR2[i];
  }

  throw new UnsupportedVerbError(`present: unsupported verb "${infinitive}"`);
}

/** Imparfait stem: présent "nous" minus -ons (être is the sole exception). */
export function imparfaitStem(infinitive: string): string {
  const verb = infinitive.toLowerCase();
  if (verb === "être") return "ét";
  const nous = present(verb, "1p");
  if (!nous.endsWith("ons")) {
    throw new UnsupportedVerbError(`imparfaitStem: "${infinitive}" nous=${nous}`);
  }
  return nous.slice(0, -3);
}

export function imparfait(infinitive: string, person: Person): string {
  const verb = infinitive.toLowerCase();
  const ending = IMPARFAIT_ENDINGS[PERSON_INDEX[person]];
  if (verb === "être") return "ét" + ending;

  // Regular -er needs -ger/-cer euphony, which depends on the ending's vowel:
  // soft g/c is kept before a/o (mangeais, commençais) but the plain letter is
  // used before i (mangions, commencions). The présent-nous stem can't capture
  // this, so handle it explicitly here.
  if (verb.endsWith("er") && !IRREGULAR_PRESENT[verb]) {
    const rad = verb.slice(0, -2);
    const beforeI = ending.startsWith("i");
    if (rad.endsWith("g")) return rad + (beforeI ? "" : "e") + ending;
    if (rad.endsWith("c")) return (beforeI ? rad : rad.slice(0, -1) + "ç") + ending;
    return rad + ending;
  }

  // Everything else (group-2 -ir, irregulars) derives cleanly from présent-nous.
  return imparfaitStem(verb) + ending;
}

/** Participe passé. Regular -er → é, group-2 -ir → i, else irregular table. */
export function participePasse(infinitive: string): string {
  const verb = infinitive.toLowerCase();
  if (IRREGULAR_PP[verb]) return IRREGULAR_PP[verb];
  if (verb.endsWith("er")) return verb.slice(0, -2) + "é";
  if (verb.endsWith("ir")) return verb.slice(0, -2) + "i";
  throw new UnsupportedVerbError(`participePasse: unsupported "${infinitive}"`);
}

export function auxiliaryOf(infinitive: string): "avoir" | "être" {
  return ETRE_AUX.has(infinitive.toLowerCase()) ? "être" : "avoir";
}

/** Apply gender/number agreement to a participe passé (allé → allée/allés/allées). */
export function agreePp(pp: string, agr: Agreement): string {
  const g = agr.gender ?? "m";
  const n = agr.number ?? "s";
  let out = pp;
  if (g === "f") out += "e";
  if (n === "p") out += "s";
  return out;
}

/**
 * Passé composé. Auxiliary (présent) + participe passé. Être-aux agrees with the
 * subject; avoir-aux is invariable unless a preceding COD is supplied
 * (config.codBefore) — the advanced accord-du-participe-passé rule.
 */
export function passeCompose(
  infinitive: string,
  person: Person,
  opts: { gender?: Gender; codBefore?: Agreement } = {}
): string {
  const aux = auxiliaryOf(infinitive);
  const auxForm = present(aux, person);
  let pp = participePasse(infinitive);

  if (aux === "être") {
    const number: "s" | "p" = person.endsWith("p") ? "p" : "s";
    pp = agreePp(pp, { gender: opts.gender, number });
  } else if (opts.codBefore) {
    pp = agreePp(pp, opts.codBefore);
  }
  return `${auxForm} ${pp}`;
}

/** Unified dispatcher matching item validator_config {verb,tense,person,...}. */
export function conjugate(
  infinitive: string,
  tense: Tense,
  person: Person,
  agreement?: { gender?: Gender; codBefore?: Agreement }
): string {
  switch (tense) {
    case "present":
      return present(infinitive, person);
    case "imparfait":
      return imparfait(infinitive, person);
    case "passe_compose":
      return passeCompose(infinitive, person, agreement);
  }
}
