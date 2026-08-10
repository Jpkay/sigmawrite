import { conjugate, PERSONS, type Person, type Tense } from "./conjugation";

const SUBJECTS: Record<Person, readonly string[]> = {
  "1s": ["je", "j’"],
  "2s": ["tu"],
  "3s": ["il", "elle", "on"],
  "1p": ["nous"],
  "2p": ["vous"],
  "3p": ["ils", "elles"],
};

const VERBS = ["être", "avoir", "aller", "faire", "venir", "prendre", "parler", "finir", "vendre"] as const;
const IMPERATIVE_PERSONS: Person[] = ["2s", "1p", "2p"];

const NODE_TENSES: Record<string, Tense> = {
  employer_present_indicatif_en_contexte: "present",
  employer_futur_proche_en_contexte: "futur_proche",
  employer_passe_recent_en_contexte: "passe_recent",
  employer_passe_compose_en_contexte: "passe_compose",
  employer_imparfait_en_contexte: "imparfait",
  employer_passe_simple_en_contexte: "passe_simple",
  employer_futur_simple_en_contexte: "futur_simple",
  employer_plus_que_parfait_en_contexte: "plus_que_parfait",
  employer_conditionnel_present_en_contexte: "conditionnel_present",
  employer_subjonctif_present_en_contexte: "subjonctif_present",
  employer_imperatif_en_contexte: "imperatif_present",
};

const canonical = (value: string) => value
  .normalize("NFC")
  .toLocaleLowerCase("fr")
  .replace(/[‘']/g, "’")
  .replace(/\s+/g, " ")
  .trim();

function tenseForms(tense: Tense) {
  const people = tense === "imperatif_present" ? IMPERATIVE_PERSONS : PERSONS;
  const forms = new Set<string>();
  for (const verb of VERBS) {
    for (const person of people) {
      try {
        const variants = new Set([canonical(conjugate(verb, tense, person))]);
        if (tense === "passe_compose" || tense === "plus_que_parfait") {
          variants.add(canonical(conjugate(verb, tense, person, { gender: "f" })));
        }
        for (const form of variants) {
          if (tense === "imperatif_present") {
            forms.add(form);
            continue;
          }
          for (const subject of SUBJECTS[person]) {
            const separator = subject.endsWith("’") ? "" : " ";
            const phrase = `${subject}${separator}${form}`;
            forms.add(tense === "subjonctif_present" ? `que ${phrase}` : phrase);
          }
        }
      } catch {
        // The deterministic engine deliberately fails closed on unsupported
        // combinations; those forms simply cannot prove this competency.
      }
    }
  }
  return [...forms].sort((left, right) => right.length - left.length);
}

const FORMS_BY_TENSE = new Map<Tense, readonly string[]>();

function matchedTenseForms(text: string, tense: Tense) {
  const source = ` ${canonical(text).replace(/[^\p{L}’'-]+/gu, " ")} `;
  const forms = FORMS_BY_TENSE.get(tense) ?? tenseForms(tense);
  FORMS_BY_TENSE.set(tense, forms);
  return forms.filter((form) => source.includes(` ${form} `));
}

function matchedObjectPronouns(text: string) {
  const source = canonical(text);
  const finiteForms = new Set<string>();
  for (const verb of VERBS) {
    for (const person of PERSONS) {
      for (const tense of ["present", "imparfait", "passe_compose", "futur_simple"] as const) {
        try { finiteForms.add(canonical(conjugate(verb, tense, person)).split(" ")[0]); } catch { /* closed */ }
      }
    }
  }
  const following = [...finiteForms].sort((a, b) => b.length - a.length).join("|");
  const pattern = new RegExp(`(?:^|[^\\p{L}])(me|m’|te|t’|se|s’|le|la|l’|les|lui|leur|y|en)\\s+(?=${following})(?=\\p{L})`, "gu");
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

export type IndependentProductionMatch = {
  demonstrated: boolean;
  matchedForms: string[];
};

export function supportsIndependentProductionNode(nodeKey: string) {
  return nodeKey === "employer_pronoms_complements_en_contexte" || nodeKey in NODE_TENSES;
}

export function independentProductionPrompt(nodeKey: string, nodeLabel: string) {
  const target = nodeLabel.toLocaleLowerCase("fr");
  if (nodeKey === "employer_pronoms_complements_en_contexte") {
    return `Rédige un paragraphe original de 50 à 100 mots. Raconte un échange entre plusieurs personnes et emploie correctement au moins deux pronoms compléments différents (par exemple lui, leur, le, la, les, y ou en).`;
  }
  return `Rédige un paragraphe original de 50 à 100 mots qui démontre : ${target}. Emploie au moins deux formes verbales différentes de ce temps et écris sans modèle ni indice.`;
}

/** Conservative local corroboration for unaided connected writing. It never
 * grades a modelled sentence: two distinct target forms must occur in the
 * learner's own text, and the caller must still require a clean writing rubric. */
export function detectIndependentProduction(nodeKey: string, text: string): IndependentProductionMatch {
  if (nodeKey === "employer_pronoms_complements_en_contexte") {
    const forms = [...new Set(matchedObjectPronouns(text))];
    return { demonstrated: forms.length >= 2, matchedForms: forms };
  }
  const tense = NODE_TENSES[nodeKey];
  if (!tense) return { demonstrated: false, matchedForms: [] };
  const forms = matchedTenseForms(text, tense);
  return { demonstrated: new Set(forms).size >= 2, matchedForms: forms };
}
