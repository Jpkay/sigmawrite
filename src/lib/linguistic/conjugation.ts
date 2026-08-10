/**
 * Deterministic French conjugation (Roadmap Phase 8, C1) — QC Gate 0.
 *
 * The LLM never authors conjugations; this does. Covers présent, imparfait,
 * passé composé, futur simple, futur proche, conditionnel présent, subjonctif
 * présent, impératif présent and plus-que-parfait (compound tenses with
 * auxiliary choice + agreement). Broad verb coverage (full lexicon) comes later
 * from Morphalou/Lexique (C2); until then this combines a regular-verb
 * algorithm with an explicit irregular table for the high-frequency verb set.
 *
 * Key correctness lever: imparfait is derived from the présent "nous" stem for
 * ALL verbs (être is the only exception, stem "ét-"), so -ger/-cer spelling and
 * irregular stems fall out automatically once présent is right.
 */

export type Person = "1s" | "2s" | "3s" | "1p" | "2p" | "3p";
export const PERSONS: Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"];
export type Tense =
  | "present"
  | "imparfait"
  | "passe_compose"
  | "futur_simple"
  | "futur_proche"
  | "passe_simple"
  | "conditionnel_present"
  | "subjonctif_present"
  | "imperatif_present"
  | "plus_que_parfait";
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
  pouvoir: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
  vouloir: ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
  savoir: ["sais", "sais", "sait", "savons", "savez", "savent"],
  devoir: ["dois", "dois", "doit", "devons", "devez", "doivent"],
};

const IRREGULAR_PP: Record<string, string> = {
  être: "été", avoir: "eu", aller: "allé", faire: "fait", prendre: "pris",
  venir: "venu", partir: "parti", sortir: "sorti", dire: "dit",
  voir: "vu", pouvoir: "pu", vouloir: "voulu", savoir: "su", devoir: "dû",
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
const FUTUR_ENDINGS = ["ai", "as", "a", "ons", "ez", "ont"];
const SUBJONCTIF_ENDINGS_SINGULAR_3P = ["e", "es", "e", "ent"];

// Irregular futur/conditionnel stems (the stem always ends in -r).
const FUTUR_STEMS: Record<string, string> = {
  être: "ser", avoir: "aur", aller: "ir", faire: "fer", venir: "viendr",
  voir: "verr", pouvoir: "pourr", vouloir: "voudr", savoir: "saur",
  devoir: "devr",
};

// Fully irregular subjonctif paradigms [je, tu, il, nous, vous, ils].
const IRREGULAR_SUBJONCTIF: Record<string, string[]> = {
  être: ["sois", "sois", "soit", "soyons", "soyez", "soient"],
  avoir: ["aie", "aies", "ait", "ayons", "ayez", "aient"],
  aller: ["aille", "ailles", "aille", "allions", "alliez", "aillent"],
  faire: ["fasse", "fasses", "fasse", "fassions", "fassiez", "fassent"],
  pouvoir: ["puisse", "puisses", "puisse", "puissions", "puissiez", "puissent"],
  savoir: ["sache", "saches", "sache", "sachions", "sachiez", "sachent"],
  vouloir: ["veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent"],
};

// Irregular impératif [tu, nous, vous].
const IRREGULAR_IMPERATIF: Record<string, string[]> = {
  être: ["sois", "soyons", "soyez"],
  avoir: ["aie", "ayons", "ayez"],
  savoir: ["sache", "sachons", "sachez"],
  vouloir: ["veuille", "veuillons", "veuillez"],
};

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

  if (verb.endsWith("oir")) {
    // -oir verbs are all irregular; anything not in the table is unsupported
    // (otherwise "pouvoir" would be wrongly conjugated as group 2).
    throw new UnsupportedVerbError(`present: unsupported -oir verb "${infinitive}"`);
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
 * Compound tense: auxiliary (présent or imparfait) + participe passé. Être-aux
 * agrees with the subject; avoir-aux is invariable unless a preceding COD is
 * supplied (opts.codBefore) — the advanced accord-du-participe-passé rule.
 */
function compound(
  infinitive: string,
  person: Person,
  auxTense: "present" | "imparfait",
  opts: { gender?: Gender; codBefore?: Agreement } = {}
): string {
  const aux = auxiliaryOf(infinitive);
  const auxForm =
    auxTense === "present" ? present(aux, person) : imparfait(aux, person);
  let pp = participePasse(infinitive);

  if (aux === "être") {
    const number: "s" | "p" = person.endsWith("p") ? "p" : "s";
    pp = agreePp(pp, { gender: opts.gender, number });
  } else if (opts.codBefore) {
    pp = agreePp(pp, opts.codBefore);
  }
  return `${auxForm} ${pp}`;
}

/** Passé composé: auxiliaire au présent + participe passé. */
export function passeCompose(
  infinitive: string,
  person: Person,
  opts: { gender?: Gender; codBefore?: Agreement } = {}
): string {
  return compound(infinitive, person, "present", opts);
}

/** Plus-que-parfait: auxiliaire à l'imparfait + participe passé. */
export function plusQueParfait(
  infinitive: string,
  person: Person,
  opts: { gender?: Gender; codBefore?: Agreement } = {}
): string {
  return compound(infinitive, person, "imparfait", opts);
}

/** Futur-simple stem (always ends in -r): irregular table, else the infinitive
 * (-re verbs drop the final e). */
export function futurStem(infinitive: string): string {
  const verb = infinitive.toLowerCase();
  if (FUTUR_STEMS[verb]) return FUTUR_STEMS[verb];
  if (verb.endsWith("oir")) {
    throw new UnsupportedVerbError(`futurStem: unsupported -oir verb "${infinitive}"`);
  }
  if (verb.endsWith("er") || verb.endsWith("ir")) return verb;
  if (verb.endsWith("re")) return verb.slice(0, -1);
  throw new UnsupportedVerbError(`futurStem: unsupported verb "${infinitive}"`);
}

export function futurSimple(infinitive: string, person: Person): string {
  return futurStem(infinitive) + FUTUR_ENDINGS[PERSON_INDEX[person]];
}

/** Conditionnel présent: futur stem + imparfait endings. */
export function conditionnelPresent(infinitive: string, person: Person): string {
  return futurStem(infinitive) + IMPARFAIT_ENDINGS[PERSON_INDEX[person]];
}

/**
 * Subjonctif présent. Regular derivation: je/tu/il/ils from the présent-ils
 * stem (+e/es/e/ent); nous/vous coincide with the imparfait. Fully irregular
 * paradigms live in the table.
 */
export function subjonctifPresent(infinitive: string, person: Person): string {
  const verb = infinitive.toLowerCase();
  if (IRREGULAR_SUBJONCTIF[verb]) {
    return IRREGULAR_SUBJONCTIF[verb][PERSON_INDEX[person]];
  }
  if (person === "1p" || person === "2p") return imparfait(verb, person);

  const ils = present(verb, "3p");
  if (!ils.endsWith("ent")) {
    throw new UnsupportedVerbError(`subjonctifPresent: "${infinitive}" ils=${ils}`);
  }
  const stem = ils.slice(0, -3);
  const idx = { "1s": 0, "2s": 1, "3s": 2, "3p": 3 }[person];
  return stem + SUBJONCTIF_ENDINGS_SINGULAR_3P[idx];
}

/**
 * Impératif présent — exists only for 2s/1p/2p. Regular forms come from the
 * présent; -er verbs (and aller) drop the final s in 2s (parle, va).
 */
export function imperatifPresent(infinitive: string, person: Person): string {
  const verb = infinitive.toLowerCase();
  if (person !== "2s" && person !== "1p" && person !== "2p") {
    throw new UnsupportedVerbError(
      `imperatifPresent: person "${person}" has no imperative form`
    );
  }
  const idx = person === "2s" ? 0 : person === "1p" ? 1 : 2;
  if (IRREGULAR_IMPERATIF[verb]) return IRREGULAR_IMPERATIF[verb][idx];

  let form = present(verb, person);
  if (person === "2s" && (verb.endsWith("er") || verb === "aller") && form.endsWith("s")) {
    form = form.slice(0, -1);
  }
  return form;
}

/** Futur proche: aller (présent) + infinitif. */
export function futurProche(infinitive: string, person: Person): string {
  return `${present("aller", person)} ${infinitive.toLowerCase()}`;
}

const PASSE_SIMPLE_IRREGULAR: Record<string, string[]> = {
  "être": ["fus", "fus", "fut", "fûmes", "fûtes", "furent"],
  "avoir": ["eus", "eus", "eut", "eûmes", "eûtes", "eurent"],
  "faire": ["fis", "fis", "fit", "fîmes", "fîtes", "firent"],
  "venir": ["vins", "vins", "vint", "vînmes", "vîntes", "vinrent"],
  "tenir": ["tins", "tins", "tint", "tînmes", "tîntes", "tinrent"],
  "prendre": ["pris", "pris", "prit", "prîmes", "prîtes", "prirent"],
  "mettre": ["mis", "mis", "mit", "mîmes", "mîtes", "mirent"],
  "voir": ["vis", "vis", "vit", "vîmes", "vîtes", "virent"],
  "pouvoir": ["pus", "pus", "put", "pûmes", "pûtes", "purent"],
  "vouloir": ["voulus", "voulus", "voulut", "voulûmes", "voulûtes", "voulurent"],
  "devoir": ["dus", "dus", "dut", "dûmes", "dûtes", "durent"],
  "savoir": ["sus", "sus", "sut", "sûmes", "sûtes", "surent"],
  "lire": ["lus", "lus", "lut", "lûmes", "lûtes", "lurent"],
  "dire": ["dis", "dis", "dit", "dîmes", "dîtes", "dirent"],
  "boire": ["bus", "bus", "but", "bûmes", "bûtes", "burent"],
  "courir": ["courus", "courus", "courut", "courûmes", "courûtes", "coururent"],
  "mourir": ["mourus", "mourus", "mourut", "mourûmes", "mourûtes", "moururent"],
  "naître": ["naquis", "naquis", "naquit", "naquîmes", "naquîtes", "naquirent"],
};

/** Passé simple for regular -er/-ir/-re verbs and the frequent irregular set
 * used by the approved item bank. Unsupported forms fail closed. */
export function passeSimple(infinitive: string, person: Person): string {
  const verb = infinitive.toLocaleLowerCase("fr");
  const irregular = PASSE_SIMPLE_IRREGULAR[verb];
  if (irregular) return irregular[PERSON_INDEX[person]];
  if (verb.endsWith("er")) return verb.slice(0, -2) + ["ai", "as", "a", "âmes", "âtes", "èrent"][PERSON_INDEX[person]];
  if (verb.endsWith("ir")) return verb.slice(0, -2) + ["is", "is", "it", "îmes", "îtes", "irent"][PERSON_INDEX[person]];
  if (verb.endsWith("re")) return verb.slice(0, -2) + ["is", "is", "it", "îmes", "îtes", "irent"][PERSON_INDEX[person]];
  throw new UnsupportedVerbError(`passeSimple: unsupported verb "${infinitive}"`);
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
    case "plus_que_parfait":
      return plusQueParfait(infinitive, person, agreement);
    case "futur_simple":
      return futurSimple(infinitive, person);
    case "futur_proche":
      return futurProche(infinitive, person);
    case "passe_simple":
      return passeSimple(infinitive, person);
    case "conditionnel_present":
      return conditionnelPresent(infinitive, person);
    case "subjonctif_present":
      return subjonctifPresent(infinitive, person);
    case "imperatif_present":
      return imperatifPresent(infinitive, person);
  }
}
