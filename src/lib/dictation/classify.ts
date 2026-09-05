/**
 * Dictée error classifier (roadmap 1.3).
 *
 * Aligns the learner's transcription against the target text word by word,
 * then labels every difference with an adapted Nina Catach category — the
 * Éduscol reference grille — and the competency node the error evidences.
 * Everything here is deterministic; no model is consulted.
 */

export type ErrorCategory =
  | "phonogrammique"
  | "morphogrammique_grammaticale"
  | "morphogrammique_lexicale"
  | "logogrammique"
  | "ideogrammique"
  | "extragraphique";

export type DictationError = {
  segment: number;
  position: number;
  expected: string;
  actual: string | null;
  category: ErrorCategory;
  nodeKey: string;
  /** Short, learner-facing reason with the manipulation that proves the rule. */
  explanationFr: string;
};

export type ErrorProfile = Record<ErrorCategory, number>;

export const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  phonogrammique: "Son et graphie",
  morphogrammique_grammaticale: "Accords et terminaisons",
  morphogrammique_lexicale: "Lettres muettes et familles de mots",
  logogrammique: "Homophones",
  ideogrammique: "Majuscules, ponctuation, apostrophes",
  extragraphique: "Mots oubliés ou méconnaissables",
};

/** DNB-inspired barème: grammatical errors cost twice a lexical one; the dictée is scored out of ten. */
export const CATEGORY_PENALTY: Record<ErrorCategory, number> = {
  morphogrammique_grammaticale: 0.5,
  logogrammique: 0.5,
  morphogrammique_lexicale: 0.25,
  phonogrammique: 0.25,
  ideogrammique: 0.1,
  extragraphique: 0.5,
};

const HOMOPHONE_GROUPS: { words: string[]; nodeKey: string; explanationFr: string }[] = [
  { words: ["a", "à"], nodeKey: "distinguer_homophones_a_a", explanationFr: "« a » est le verbe avoir : on peut le remplacer par « avait ». Sinon, c’est « à »." },
  { words: ["et", "est"], nodeKey: "distinguer_homophones_et_est", explanationFr: "« est » est le verbe être : on peut le remplacer par « était ». « et » veut dire « et puis »." },
  { words: ["son", "sont"], nodeKey: "distinguer_homophones_son_sont", explanationFr: "« sont » est le verbe être : on peut le remplacer par « étaient ». « son » veut dire « le sien »." },
  { words: ["on", "ont"], nodeKey: "distinguer_homophones_on_ont", explanationFr: "« ont » est le verbe avoir : on peut le remplacer par « avaient ». « on » peut se remplacer par « il »." },
  { words: ["ce", "se"], nodeKey: "distinguer_homophones_ce_se", explanationFr: "« se » précède un verbe (il se lave). « ce » précède un nom ou remplace « cela »." },
  { words: ["ces", "ses", "c’est", "s’est", "sais", "sait"], nodeKey: "distinguer_homophones_ces_ses", explanationFr: "« ses » = les siens (singulier : « son »). « ces » = ceux-là (singulier : « ce »). « c’est » = cela est ; « s’est » précède un participe." },
  { words: ["ou", "où"], nodeKey: "distinguer_homophones_ou_ou", explanationFr: "« ou » peut se remplacer par « ou bien ». « où » indique un lieu ou un moment." },
  { words: ["la", "là", "l’a"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« là » indique un lieu (là-bas). « la » est un article ou un pronom. « l’a » = « l’avait »." },
  { words: ["mais", "mes", "met", "mets"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« mes » = les miens (singulier : « mon »). « mais » oppose deux idées. « met » est le verbe mettre." },
  { words: ["peu", "peut", "peux"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« peut » est le verbe pouvoir : on peut le remplacer par « pouvait ». « peu » = pas beaucoup." },
  { words: ["leur", "leurs"], nodeKey: "accorder_determinant_nom_ecrit", explanationFr: "Devant un nom, « leur » s’accorde avec ce nom (leurs amis). Devant un verbe, « leur » est invariable." },
  { words: ["tout", "tous", "toute", "toutes"], nodeKey: "accorder_determinant_nom_ecrit", explanationFr: "« tout » s’accorde avec le nom qu’il accompagne : tous les jours, toutes les nuits." },
  { words: ["quand", "quant", "qu’en"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« quand » = à quel moment. « quant à » = en ce qui concerne. « qu’en » = que … en." },
  { words: ["sans", "s’en", "sent", "cent", "sang"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« sans » = privé de. « s’en » précède un verbe (il s’en va). « sent » est le verbe sentir." },
  { words: ["dans", "d’en"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« dans » indique un lieu ou un temps. « d’en » = de … en." },
  { words: ["ma", "m’a", "m’as"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« m’a » = « m’avait » (verbe avoir). « ma » = la mienne." },
  { words: ["ta", "t’a"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« t’a » = « t’avait » (verbe avoir). « ta » = la tienne." },
  { words: ["sa", "ça", "çà"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« ça » = cela. « sa » = la sienne (on peut dire « la sienne »)." },
  { words: ["ni", "n’y"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« n’y » = ne … y (il n’y va pas). « ni » relie deux négations." },
  { words: ["si", "s’y", "ci"], nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "« s’y » = se … y (il s’y rend). « si » exprime une condition." },
  { words: ["près", "prêt", "prêts"], nodeKey: "orthographier_mot_irregulier_frequent", explanationFr: "« près de » = à côté de. « prêt » = préparé, il s’accorde (elle est prête)." },
  { words: ["plutôt", "plus tôt"], nodeKey: "orthographier_mot_invariable_frequent", explanationFr: "« plutôt » = de préférence. « plus tôt » = le contraire de « plus tard »." },
  { words: ["voir", "voire"], nodeKey: "orthographier_mot_invariable_frequent", explanationFr: "« voire » = et même. « voir » est le verbe." },
  { words: ["foi", "fois", "foie"], nodeKey: "orthographier_mot_irregulier_frequent", explanationFr: "« une fois » (avec un s), « la foi » (croyance), « le foie » (organe)." },
  { words: ["vers", "vert", "verre", "ver"], nodeKey: "orthographier_mot_irregulier_frequent", explanationFr: "« vert » (couleur, féminin : verte), « verre » (à boire), « vers » (direction), « ver » (animal)." },
  { words: ["mer", "mère", "maire"], nodeKey: "orthographier_mot_irregulier_frequent", explanationFr: "« la mer » (eau), « la mère » (parent), « le maire » (élu)." },
  { words: ["cours", "court", "cour"], nodeKey: "orthographier_mot_irregulier_frequent", explanationFr: "« la cour » (espace), « le cours » (leçon), « court » (adjectif ou verbe courir)." },
  { words: ["dont", "donc"], nodeKey: "orthographier_mot_invariable_frequent", explanationFr: "« donc » = par conséquent. « dont » remplace « de qui / de quoi »." },
  { words: ["davantage", "d’avantage"], nodeKey: "orthographier_mot_invariable_frequent", explanationFr: "« davantage » = plus. « d’avantage » = de bénéfice." },
  { words: ["parce que", "par ce que"], nodeKey: "orthographier_mot_invariable_frequent", explanationFr: "« parce que » explique une cause. « par ce que » = par la chose que." },
];

const HOMOPHONE_INDEX = new Map<string, { group: string[]; nodeKey: string; explanationFr: string }>();
for (const group of HOMOPHONE_GROUPS) for (const word of group.words) HOMOPHONE_INDEX.set(word, { group: group.words, nodeKey: group.nodeKey, explanationFr: group.explanationFr });

const VERB_ENDINGS = ["aient", "ions", "iez", "ait", "ais", "ent", "ons", "ez", "es", "e", "s", "t", "ai", "as", "a", "ont", "ra", "ras", "rez", "ront", "rais", "rait", "raient", "rons"];
const PARTICIPLE_ENDINGS = ["ées", "ée", "és", "é", "er", "ez", "is", "ie", "ies", "us", "ue", "ues", "u", "i"];
const NOMINAL_ENDINGS = ["aux", "eux", "es", "s", "x", "e"];
const SILENT_FINALS = ["d", "t", "s", "x", "p", "g", "c", "h", "l", "b"];

const deaccent = (word: string) => word.normalize("NFD").replace(/[\u0300-\u036f]/gu, "");
const lower = (word: string) => word.toLocaleLowerCase("fr").normalize("NFC").replace(/'/gu, "’");
const stripPunctuation = (word: string) => word.replace(/[.,;:!?«»"()\[\]…–—-]/gu, "");

/** Coarse phonetic skeleton: enough to tell "manjer/manger" (same sound) from "manger/marcher". */
function skeleton(word: string): string {
  let s = deaccent(lower(stripPunctuation(word)));
  s = s.replace(/(?:ain|ein|aim|eim|in|im|un|um)(?![aeiouy])/gu, "I").replace(/(?:an|am|en|em)(?![aeiouy])/gu, "A").replace(/(?:on|om)(?![aeiouy])/gu, "O");
  s = s.replace(/qu/gu, "k").replace(/c(?=[eiy])/gu, "s").replace(/c/gu, "k").replace(/g(?=[eiy])/gu, "j").replace(/ge(?=[aou])/gu, "j").replace(/gu(?=[eiy])/gu, "g");
  s = s.replace(/ph/gu, "f").replace(/ss/gu, "s").replace(/(?<=[aeiouy])s(?=[aeiouy])/gu, "z").replace(/eau|au/gu, "o").replace(/ai|ei/gu, "e").replace(/ou/gu, "u").replace(/oi/gu, "wa");
  s = s.replace(/h/gu, "").replace(/([a-z])\1/gu, "$1");
  s = s.replace(/(?:es|ent|e|s|t|d|x|p)$/u, "");
  return s;
}

/** True when the two spellings use different graphemes for the same family of sounds. */
function graphemesDiffer(pattern: RegExp, e: string, a: string): boolean {
  return (e.match(pattern) ?? []).join("|") !== (a.match(pattern) ?? []).join("|");
}

function commonPrefix(a: string, b: string): number {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index++;
  return index;
}

type Aligned = { expected: string | null; actual: string | null; position: number };

/** Levenshtein alignment over word tokens; substitution is cheaper for similar words so diffs stay local. */
export function alignWords(expected: string[], actual: string[]): Aligned[] {
  const n = expected.length, m = actual.length;
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) cost[i][0] = i;
  for (let j = 1; j <= m; j++) cost[0][j] = j;
  const similarity = (a: string, b: string) => {
    const x = deaccent(lower(stripPunctuation(a))), y = deaccent(lower(stripPunctuation(b)));
    if (x === y) return 0;
    const prefix = commonPrefix(x, y);
    if (skeleton(a) === skeleton(b) || prefix >= Math.min(x.length, y.length) * 0.6) return 0.4;
    return 1.2;
  };
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1, cost[i - 1][j - 1] + similarity(expected[i - 1], actual[j - 1]));
  }
  const out: Aligned[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + similarity(expected[i - 1], actual[j - 1])) { out.push({ expected: expected[i - 1], actual: actual[j - 1], position: i - 1 }); i--; j--; }
    else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) { out.push({ expected: expected[i - 1], actual: null, position: i - 1 }); i--; }
    else { out.push({ expected: null, actual: actual[j - 1], position: i }); j--; }
  }
  return out.reverse();
}

export function tokenize(text: string): string[] {
  return text.normalize("NFC").replace(/’/gu, "'").replace(/(\S)'/gu, "$1' ").split(/\s+/u).filter(Boolean).map((token) => token.replace(/'/gu, "’"));
}

function endingOf(word: string, endings: string[]): string | null {
  for (const ending of endings) if (word.endsWith(ending)) return ending;
  return null;
}

const DETERMINERS = new Set(["les", "des", "ses", "ces", "mes", "tes", "nos", "vos", "leurs", "aux", "deux", "trois", "quatre", "cinq", "quelques", "plusieurs", "tous", "toutes", "certains", "certaines"]);
const SUBJECT_PRONOUNS = new Set(["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "qui"]);
const AUX_ETRE = new Set(["suis", "es", "est", "sommes", "êtes", "sont", "étais", "était", "étions", "étiez", "étaient", "serai", "seras", "sera", "serons", "serez", "seront", "serais", "serait", "seraient", "sois", "soit", "soyons", "soyez", "soient"]);

function classifyPair(expectedRaw: string, actualRaw: string, segment: number, position: number, previous: string | null): DictationError | null {
  if (expectedRaw === actualRaw) return null;
  const expected = lower(expectedRaw), actual = lower(actualRaw);
  if (expected === actual) {
    return { segment, position, expected: expectedRaw, actual: actualRaw, category: "ideogrammique", nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: "Majuscule attendue : début de phrase ou nom propre." };
  }
  const expectedWord = stripPunctuation(expected), actualWord = stripPunctuation(actual);
  const base = { segment, position, expected: expectedRaw, actual: actualRaw };

  if (expectedWord === actualWord || expectedWord.replace(/[’-]/gu, "") === actualWord.replace(/[’-]/gu, "")) {
    return { ...base, category: "ideogrammique", nodeKey: "maintenir_orthographe_grammaticale_phrase", explanationFr: expectedRaw[0] !== actualRaw[0] && expectedRaw[0] === expectedRaw[0].toLocaleUpperCase("fr") ? "Majuscule attendue : début de phrase ou nom propre." : "Vérifie la ponctuation, l’apostrophe ou le trait d’union." };
  }

  const homophone = HOMOPHONE_INDEX.get(expectedWord);
  if (homophone && homophone.group.includes(actualWord)) {
    return { ...base, category: "logogrammique", nodeKey: homophone.nodeKey, explanationFr: homophone.explanationFr };
  }

  const expectedFlat = deaccent(expectedWord), actualFlat = deaccent(actualWord);
  if (expectedFlat === actualFlat) {
    const nodeKey = /[ç]/u.test(expectedWord) !== /[ç]/u.test(actualWord) ? "employer_cedille"
      : /[âêîôû]/u.test(expectedWord) !== /[âêîôû]/u.test(actualWord) ? "employer_accent_circonflexe"
        : /[ëïü]/u.test(expectedWord) !== /[ëïü]/u.test(actualWord) ? "employer_trema"
          : "choisir_e_accent_aigu_grave";
    const explanationFr = nodeKey === "employer_cedille" ? "La cédille donne le son [s] devant a, o, u : garçon, leçon."
      : nodeKey === "employer_accent_circonflexe" ? "L’accent circonflexe se retient avec la famille du mot : forêt → forestier."
        : nodeKey === "employer_trema" ? "Le tréma sépare deux voyelles qui se prononcent chacune : maïs, Noël."
          : "é se prononce fermé (été), è ouvert devant une consonne prononcée (père). Une syllabe qui finit par une consonne écrite ne prend pas d’accent (mettre).";
    return { ...base, category: "phonogrammique", nodeKey, explanationFr };
  }

  const prefix = commonPrefix(expectedFlat, actualFlat);
  const minLen = Math.min(expectedFlat.length, actualFlat.length);
  if (prefix >= Math.max(2, Math.ceil(minLen * 0.6))) {
    const expectedEnding = expectedFlat.slice(prefix), actualEnding = actualFlat.slice(prefix);
    const verbEnding = endingOf(expectedWord, VERB_ENDINGS);
    const participleEnding = endingOf(expectedWord, PARTICIPLE_ENDINGS);
    const nominalEnding = endingOf(expectedWord, NOMINAL_ENDINGS);
    const previousWord = previous ? lower(stripPunctuation(previous)) : "";
    const afterDeterminer = DETERMINERS.has(previousWord);
    const afterPronoun = SUBJECT_PRONOUNS.has(previousWord);
    const infinitiveSwap = (x: string, y: string) => x.endsWith("r") && deaccent(x.slice(0, -1)).replace(/e$/u, "") === deaccent(y).replace(/(?:e|s|es)$/u, "");
    if (infinitiveSwap(expectedWord, actualWord) || infinitiveSwap(actualWord, expectedWord)) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "distinguer_infinitif_participe_ecrit", explanationFr: "Remplace par « mordre / mordu » : si « mordre » convient, c’est l’infinitif ; si « mordu » convient, c’est le participe passé." };
    }
    if ((expectedWord.endsWith("aux") && actualWord.endsWith("als")) || (expectedWord.endsWith("als") && actualWord.endsWith("aux"))) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "former_pluriel_noms_al_aux", explanationFr: "Les noms en -al font leur pluriel en -aux : un cheval, des chevaux (sauf bal, carnaval, festival…)." };
    }
    const agreementOnly = /^(?:s|x|e|es|)$/u.test(expectedEnding) && /^(?:s|x|e|es|)$/u.test(actualEnding);
    if (agreementOnly && AUX_ETRE.has(previousWord)) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_participe_etre", explanationFr: "Avec être, le participe passé s’accorde avec le sujet : elle est partie, ils sont venus." };
    }
    const pluralOnly = /^(?:s|x)$/u.test(expectedEnding + actualEnding) && (expectedEnding === "" || actualEnding === "");
    if (pluralOnly && (afterDeterminer || (!afterPronoun && !expectedWord.endsWith("ons") && !expectedWord.endsWith("ez")))) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_determinant_nom_ecrit", explanationFr: "Le déterminant annonce le nombre : « des », « les », « ses » demandent un -s (ou un -x) au nom et à l’adjectif." };
    }
    if (participleEnding && (actualWord.endsWith("er") || expectedWord.endsWith("er")) && (expectedWord.endsWith("é") || actualWord.endsWith("é") || expectedWord.endsWith("er"))) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "distinguer_infinitif_participe_ecrit", explanationFr: "Remplace par « mordre / mordu » : si « mordre » convient, c’est l’infinitif (-er) ; si « mordu » convient, c’est le participe (-é)." };
    }
    if (participleEnding && /^(?:e|s|es|)$/u.test(actualEnding.replace(/^e/u, "")) && expectedWord.match(/(?:é|i|u)(?:e|s|es)$/u)) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_participe_etre", explanationFr: "Avec être, le participe passé s’accorde avec le sujet : elle est partie, ils sont venus. Avec avoir, il s’accorde avec le COD placé avant." };
    }
    if (verbEnding && (expectedWord.endsWith("ent") || expectedWord.endsWith("ait") || expectedWord.endsWith("aient") || expectedWord.endsWith("ons") || expectedWord.endsWith("ez") || actualWord.endsWith("ent") || actualWord.endsWith("aient"))) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_sujet_verbe_ecrit", explanationFr: "Cherche le sujet avec « qui est-ce qui ? ». Si c’est « ils/elles », le verbe se termine par -ent (ou -aient à l’imparfait)." };
    }
    if (nominalEnding && /^(?:s|x|es|aux|)$/u.test(expectedEnding) && /^(?:s|x|es|aux|)$/u.test(actualEnding)) {
      const isAux = expectedWord.endsWith("aux") || actualWord.endsWith("aux");
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: isAux ? "former_pluriel_noms_al_aux" : "accorder_determinant_nom_ecrit", explanationFr: isAux ? "Les noms en -al font leur pluriel en -aux : un cheval, des chevaux (sauf bal, carnaval, festival…)." : "Le déterminant annonce le nombre : « des », « les », « ses » demandent un -s (ou un -x) au nom et à l’adjectif." };
    }
    if ((expectedEnding === "e" && actualEnding === "") || (expectedEnding === "" && actualEnding === "e")) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_adjectif_nom_ecrit", explanationFr: "L’adjectif prend la marque du nom : au féminin, un -e (une porte ouverte)." };
    }
    if (actualEnding === "" && expectedEnding.length === 1 && SILENT_FINALS.includes(expectedEnding)) {
      return { ...base, category: "morphogrammique_lexicale", nodeKey: "justifier_lettre_finale_muette", explanationFr: "Cherche un mot de la même famille : grand → grande, tabac → tabagie. La lettre finale s’entend dans le mot dérivé." };
    }
    if (skeleton(expectedWord) === skeleton(actualWord)) {
      return phonogramError(base, expectedWord, actualWord);
    }
    if (verbEnding || participleEnding) {
      return { ...base, category: "morphogrammique_grammaticale", nodeKey: "accorder_sujet_verbe_ecrit", explanationFr: "Identifie le sujet et le temps du verbe avant d’écrire la terminaison." };
    }
  }

  if (skeleton(expectedWord) === skeleton(actualWord)) return phonogramError(base, expectedWord, actualWord);
  return { ...base, category: "extragraphique", nodeKey: "maintenir_orthographe_lexicale_phrase", explanationFr: "Le mot écrit ne correspond pas au mot dicté. Réécoute le segment et compare syllabe par syllabe." };
}

function phonogramError(base: Omit<DictationError, "category" | "nodeKey" | "explanationFr">, expectedWord: string, actualWord: string): DictationError {
  const e = deaccent(expectedWord), a = deaccent(actualWord);
  const doubled = (w: string) => (w.match(/([b-df-hj-np-tv-z])\1/gu) ?? []).join("|");
  if (doubled(e) !== doubled(a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_consonne_doublee", explanationFr: "Consonne double : pense à la famille du mot (nommer → nom) et aux préfixes (il-, im-, in- + l/m/n)." };
  if (graphemesDiffer(/[mn](?=[bp])/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "appliquer_m_devant_m_b_p", explanationFr: "Devant m, b, p, on écrit m à la place de n : emmener, tomber, jambe (sauf bonbon, embonpoint, néanmoins)." };
  if (graphemesDiffer(/eau|au|o/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_o_au_eau", explanationFr: "Le son [o] s’écrit o, au ou eau : cherche un mot de la même famille (bateau → batelier)." };
  if (graphemesDiffer(/qu|k|c(?![eiy])/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_k_c_qu", explanationFr: "Le son [k] s’écrit c devant a, o, u ; qu devant e, i ; k dans quelques mots (kilo, képi)." };
  if (graphemesDiffer(/ge(?=[aou])|gu(?=[eiy])|g|j/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_g_ge_gu", explanationFr: "Pour garder le son [ʒ] devant a, o, u, on écrit ge (nageoire). Pour garder le son [g] devant e, i, on écrit gu (guitare)." };
  if (graphemesDiffer(/ss|c(?=[eiy])|s|t(?=i[aeiou])/gu, e, a) || /ç/u.test(expectedWord) !== /ç/u.test(actualWord)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_s_ss_c", explanationFr: "Entre deux voyelles, un seul s se lit [z] : il faut ss, c ou ç pour le son [s] (poisson, glace, garçon)." };
  if (graphemesDiffer(/an|am|en|em/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_nasale_an_en", explanationFr: "Le son [ɑ̃] s’écrit an ou en : pense aux mots de la famille (chanter → chant)." };
  if (graphemesDiffer(/on|om/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_nasale_on_om", explanationFr: "Le son [ɔ̃] s’écrit on, ou om devant b et p (ombre, pompier)." };
  if (graphemesDiffer(/ain|ein|in|un|aim|eim|im|um/gu, e, a)) return { ...base, category: "phonogrammique", nodeKey: "orthographier_nasale_in_ain_ein", explanationFr: "Le son [ɛ̃] s’écrit in, ain, ein ou un : vérifie avec un mot de la famille (main → manuel)." };
  return { ...base, category: "phonogrammique", nodeKey: "associer_phoneme_graphie_frequente", explanationFr: "Le mot se prononce bien mais ne s’écrit pas ainsi : cherche un mot de la même famille pour retrouver la graphie." };
}

export type SegmentResult = { segment: number; expected: string; actual: string; errors: DictationError[] };

/** Classify one dictée segment. Missing and extra words are extragraphique. */
export function classifySegment(expected: string, actual: string, segment: number): SegmentResult {
  const aligned = alignWords(tokenize(expected), tokenize(actual));
  const errors: DictationError[] = [];
  const expectedTokens = tokenize(expected);
  for (const pair of aligned) {
    if (pair.expected === null) {
      errors.push({ segment, position: pair.position, expected: "", actual: pair.actual, category: "extragraphique", nodeKey: "maintenir_orthographe_lexicale_phrase", explanationFr: "Mot en trop : il n’a pas été dicté." });
    } else if (pair.actual === null) {
      errors.push({ segment, position: pair.position, expected: pair.expected, actual: null, category: "extragraphique", nodeKey: "maintenir_orthographe_lexicale_phrase", explanationFr: "Mot oublié : réécoute le segment en entier avant d’écrire." });
    } else {
      const error = classifyPair(pair.expected, pair.actual, segment, pair.position, pair.position > 0 ? expectedTokens[pair.position - 1] : null);
      if (error) errors.push(error);
    }
  }
  return { segment, expected, actual, errors };
}

export function buildErrorProfile(errors: DictationError[]): ErrorProfile {
  const profile: ErrorProfile = { phonogrammique: 0, morphogrammique_grammaticale: 0, morphogrammique_lexicale: 0, logogrammique: 0, ideogrammique: 0, extragraphique: 0 };
  for (const error of errors) profile[error.category]++;
  return profile;
}

/** Score out of ten with the DNB-inspired penalties, never below zero. */
export function scoreOutOfTen(errors: DictationError[]): number {
  const penalty = errors.reduce((total, error) => total + CATEGORY_PENALTY[error.category], 0);
  return Math.max(0, Math.round((10 - penalty) * 4) / 4);
}

export function classifyDictation(segments: string[], answers: string[]) {
  const results = segments.map((expected, index) => classifySegment(expected, answers[index] ?? "", index));
  const errors = results.flatMap((result) => result.errors);
  const words = segments.reduce((total, segment) => total + tokenize(segment).filter((token) => stripPunctuation(token).length > 0).length, 0);
  return { results, errors, profile: buildErrorProfile(errors), score: scoreOutOfTen(errors), words, accuracy: words ? Math.max(0, 1 - errors.length / words) : 0 };
}
