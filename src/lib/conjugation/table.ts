import {
  auxiliaryOf,
  conjugate,
  participePasse,
  PERSONS,
  UnsupportedVerbError,
  type Person,
  type Tense,
} from "@/lib/linguistic/conjugation";

/** Display order and French labels for every tense the deterministic engine supports. */
export const TABLE_TENSES: { tense: Tense; label: string; mode: "Indicatif" | "Conditionnel" | "Subjonctif" | "Impératif"; hint: string }[] = [
  { tense: "present", label: "Présent", mode: "Indicatif", hint: "Ce qui se passe maintenant ou toujours." },
  { tense: "imparfait", label: "Imparfait", mode: "Indicatif", hint: "Décor, habitude ou action en cours dans le passé." },
  { tense: "passe_compose", label: "Passé composé", mode: "Indicatif", hint: "Action passée, terminée, racontée depuis aujourd’hui." },
  { tense: "plus_que_parfait", label: "Plus-que-parfait", mode: "Indicatif", hint: "Action passée avant une autre action passée." },
  { tense: "passe_simple", label: "Passé simple", mode: "Indicatif", hint: "Action passée dans un récit écrit." },
  { tense: "futur_simple", label: "Futur simple", mode: "Indicatif", hint: "Ce qui arrivera." },
  { tense: "futur_proche", label: "Futur proche", mode: "Indicatif", hint: "Aller + infinitif : ce qui va arriver." },
  { tense: "passe_recent", label: "Passé récent", mode: "Indicatif", hint: "Venir de + infinitif : ce qui vient d’arriver." },
  { tense: "conditionnel_present", label: "Conditionnel présent", mode: "Conditionnel", hint: "Souhait, politesse, condition (si + imparfait)." },
  { tense: "subjonctif_present", label: "Subjonctif présent", mode: "Subjonctif", hint: "Après « il faut que », « je veux que », « bien que »." },
  { tense: "imperatif_present", label: "Impératif présent", mode: "Impératif", hint: "Ordre ou conseil, sans sujet exprimé." },
];

const VOWEL_START = /^[aeéèêiouyh]/iu;

/** Subject pronoun with elision; the impératif has no subject. */
export function subjectFor(person: Person, form: string, tense: Tense): string {
  if (tense === "imperatif_present") return "";
  if (tense === "subjonctif_present") return "que " + subjectFor(person, form, "present");
  switch (person) {
    case "1s": return VOWEL_START.test(form) ? "j’" : "je ";
    case "2s": return "tu ";
    case "3s": return "il/elle ";
    case "1p": return "nous ";
    case "2p": return "vous ";
    case "3p": return "ils/elles ";
  }
}

export type ConjugationRow = { person: Person; subject: string; form: string };
export type ConjugationTense = { tense: Tense; label: string; mode: string; hint: string; rows: ConjugationRow[] };
export type ConjugationTable = {
  infinitive: string;
  group: 1 | 2 | 3;
  auxiliary: "avoir" | "être";
  participle: string;
  tenses: ConjugationTense[];
  notes: string[];
};

function groupOf(infinitive: string): 1 | 2 | 3 {
  if (infinitive === "aller") return 3;
  if (infinitive.endsWith("er")) return 1;
  if (infinitive.endsWith("ir") && conjugate(infinitive, "present", "1p").endsWith("issons")) return 2;
  return 3;
}

/**
 * Full Bescherelle-style table from the deterministic engine (roadmap 3.1).
 * Throws UnsupportedVerbError for verbs the engine cannot conjugate, so the
 * page fails closed instead of showing an invented paradigm.
 */
export function buildConjugationTable(rawInfinitive: string): ConjugationTable {
  const infinitive = rawInfinitive.trim().toLocaleLowerCase("fr").normalize("NFC");
  if (!/^[a-zàâçéèêëîïôûùüÿœ]{3,}$/u.test(infinitive)) throw new UnsupportedVerbError(`Verbe invalide : ${rawInfinitive}`);
  const tenses: ConjugationTense[] = TABLE_TENSES.map((meta) => ({
    ...meta,
    rows: PERSONS.filter((person) => meta.tense !== "imperatif_present" || ["2s", "1p", "2p"].includes(person)).map((person) => {
      const form = conjugate(infinitive, meta.tense, person);
      return { person, subject: subjectFor(person, form, meta.tense), form };
    }),
  }));
  const auxiliary = auxiliaryOf(infinitive);
  const participle = participePasse(infinitive);
  const group = groupOf(infinitive);
  const notes: string[] = [];
  notes.push(auxiliary === "être"
    ? "Aux temps composés, l’auxiliaire est être : le participe passé s’accorde avec le sujet (elle est partie, ils sont partis)."
    : "Aux temps composés, l’auxiliaire est avoir : le participe passé ne s’accorde jamais avec le sujet, mais avec le COD s’il est placé avant (la lettre qu’il a écrite).");
  if (group === 1) notes.push("Verbe du 1er groupe : au présent, je / il / ils se prononcent pareil (-e, -e, -ent). Seule l’écriture change.");
  if (group === 2) notes.push("Verbe du 2e groupe : le pluriel du présent et tout l’imparfait prennent -iss- (nous finissons, je finissais).");
  if (group === 3) notes.push("Verbe du 3e groupe : radical parfois irrégulier. Vérifie surtout le présent et le participe passé.");
  notes.push("Le futur simple et le conditionnel partagent le même radical ; seule la terminaison change (-rai / -rais).");
  return { infinitive, group, auxiliary, participle, tenses, notes };
}

/** Frequent verbs offered as shortcuts on the reference page. */
export const FREQUENT_VERBS = ["être", "avoir", "aller", "faire", "dire", "pouvoir", "vouloir", "venir", "prendre", "voir", "savoir", "devoir", "parler", "finir", "manger", "commencer", "écrire", "lire", "mettre", "partir"] as const;
