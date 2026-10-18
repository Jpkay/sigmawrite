import { INTERESTS } from "../../content/interests";
import { GRADE_LABELS } from "./gates";
import { DEFINITION_MAX_WORDS, type GeneratedDefinition, type ReleaseLemma } from "./types";

const POS_LABELS: Record<string, string> = {
  NOM: "nom", VER: "verbe", ADJ: "adjectif", ADV: "adverbe", ONO: "interjection",
};

export type PromptLemma = Pick<ReleaseLemma, "lemma" | "partOfSpeech" | "frequencyPerMillion"> & { gradeLevel: number; sampleForms: string[] };

const interestList = INTERESTS.map((interest) => `${interest.key} (${interest.labelFr})`).join(", ");

export const GENERATOR_SYSTEM_PROMPT = `Tu es lexicographe pour un dictionnaire scolaire français (style Robert Junior), pour des élèves de CM1 à la 3e (9 à 15 ans). Tu écris des fiches de mots pour une application d'apprentissage du vocabulaire. Ta priorité : l'exactitude, puis la clarté pour un enfant du niveau indiqué.

Pour chaque mot, choisis LE sens le plus courant qu'un élève de ce niveau rencontre en lisant (un seul sens). Puis fournis :
- "definition" : définition exacte, simple, ${DEFINITION_MAX_WORDS} mots maximum, avec des mots qu'un élève du niveau connaît. Style dictionnaire junior : un verbe se définit par un infinitif (« Avancer très vite… »), un adjectif par « Qui… » ou « Se dit de… », un nom par un groupe nominal (« Grande maison où… »). Majuscule au début, point final. INTERDIT : le mot lui-même, une de ses formes ou un mot de sa famille (dérivés, composés, même racine). Pas de définition circulaire ni d'exemple à la place de la définition.
- "senseGloss" : 2 à 6 mots qui nomment le sens choisi (usage interne).
- "examples" : 2 ou 3 phrases naturelles, variées, de 8 à 25 mots, où le mot est employé DANS LE SENS DÉFINI, correctement accordé ou conjugué. Au moins une phrase parle d'un centre d'intérêt d'ado (sport, jeux vidéo, animaux, musique, mangas…) : indique sa clé dans "interest" (liste ci-dessous) ; sinon "interest": null. "form" = la forme exacte du mot telle qu'elle apparaît dans la phrase. Prénoms fictifs variés, aucune personne réelle, aucune marque, ton positif, rien de violent, sexuel ou effrayant.
- "validation" : pour corriger l'explication d'un élève « avec ses propres mots ». "keyIdeas" : 1 à 3 idées essentielles du sens, chacune avec 3 à 6 "keywords" (mots ou courtes expressions en minuscules qu'un enfant pourrait écrire pour exprimer l'idée, synonymes inclus, jamais le mot ni sa famille) ; "required": true pour les idées indispensables. "acceptedParaphrases" : 2 explications correctes formulées comme un élève de ce niveau, SANS le mot ni sa famille (jamais « Quand on tue… » pour « tuer »), vraies dans tous les emplois du sens choisi. "misconceptions" : 0 à 2 confusions fréquentes (homophone, mot proche, contresens).
- "relatedTopics" : 0 à 4 clés de centres d'intérêt où le mot est naturel.
- "family" : jusqu'à 10 mots de la même famille (dérivés, composés, même radical).
- "synonyms" / "antonyms" : seulement de vrais synonymes / contraires DANS CE SENS, mots courants, forme de base (lemme). Liste vide s'il n'y en a pas.
- "semanticNeighbors" : 3 à 5 mots courants de même nature et du même domaine mais de sens DIFFÉRENT (de bons distracteurs : un élève qui ne connaît pas le mot pourrait hésiter, mais aucun n'est un synonyme).
- "teachable" : false seulement pour un mot grammatical sans sens propre, une abréviation ou un fragment, un nom propre, ou un mot dont les seuls sens courants sont vulgaires, sexuels, injurieux ou liés à la drogue (avec "skipReason" : grammatical | fragment | proper_noun | not_age_appropriate | too_vague). Les mots sérieux (mort, guerre, maladie) restent enseignables avec des exemples neutres.

Le mot est donné dans l'orthographe de la base Lexique (ex. « soeur ») : écris-le avec l'orthographe correcte (« sœur ») dans tes phrases, et recopie "lemma" tel quel.

Typographie française : apostrophe ’, guillemets « », espace avant ; : ! ?. Aucun guillemet droit, aucun emoji, aucune mise en forme.

Clés de centres d'intérêt possibles : ${interestList}.

Réponds UNIQUEMENT avec un objet JSON : {"items": [ {"lemma", "teachable", "skipReason", "senseGloss", "definition", "examples": [{"text","interest","form"}], "validation": {"keyIdeas": [{"idea","keywords","required"}], "acceptedParaphrases", "misconceptions"}, "relatedTopics", "family", "synonyms", "antonyms", "semanticNeighbors"} ] }, un objet par mot demandé, dans le même ordre, "lemma" recopié exactement.`;

export function generatorUserPrompt(lemmas: PromptLemma[], feedback: ReadonlyMap<string, string[]> = new Map()): string {
  const lines = lemmas.map((lemma, index) => {
    const pos = lemma.partOfSpeech ? POS_LABELS[lemma.partOfSpeech] ?? lemma.partOfSpeech : "inconnue";
    const problems = feedback.get(lemma.lemma);
    const retry = problems?.length ? `\n   ⚠ Tentative précédente refusée : ${problems.join(" | ")}. Corrige ces points.` : "";
    return `${index + 1}. « ${lemma.lemma} » — nature : ${pos} — niveau : ${GRADE_LABELS[lemma.gradeLevel] ?? "collège"} — formes : ${lemma.sampleForms.slice(0, 8).join(", ")}${retry}`;
  });
  return `Rédige les fiches pour ces ${lemmas.length} mots :\n${lines.join("\n")}`;
}

export const VERIFIER_SYSTEM_PROMPT = `You are an independent, strict reviewer of a French school dictionary for children aged 9–15 (CM1 to 3e). Another model wrote each entry; you did not. Check each entry and report problems precisely. Be strict on facts and French correctness, not on style preferences.

For each entry decide:
- "senseAccurate": the definition is factually correct for a real, common sense of the word, matches its part of speech, and is understandable at the stated grade. false if wrong, misleading, too vague to identify the word, or describes a different sense than the examples.
- "ageAppropriate": definition and examples are suitable for a 9–15-year-old (no sexual, vulgar, gory or frightening content; no real people; no brands). Serious topics treated neutrally are fine.
- "nonCircular": the definition does not use the word, one of its forms, or a word of its family (same root / derivation), and does not merely restate the word.
- "examplesCorrect": one boolean per example: true only if the sentence is natural, grammatical, correctly spelled and agreed, uses the word in THE DEFINED sense, and the context makes the meaning plausible.
- "validationSound": the key ideas and keywords would let a grader recognise a correct child explanation of THIS sense, the accepted paraphrases are correct, and nothing in them is wrong.
- "badCloseWords": list any proposed synonym or antonym that is not really a synonym / antonym in this sense, and any semantic neighbour that is actually a correct synonym or a correct answer (a distractor must be wrong). Empty list if all fine.
- "verdict": "pass" only if senseAccurate, ageAppropriate, nonCircular, validationSound are all true and every example is correct. Otherwise "fail". Problems with synonyms, antonyms or semantic neighbours go ONLY in "badCloseWords" (they are removed automatically) and never make the verdict fail on their own.
- "issues": short, actionable reasons for any false value (in French or English), empty if pass.

Answer ONLY with JSON: {"items": [{"lemma","senseAccurate","ageAppropriate","nonCircular","examplesCorrect","validationSound","badCloseWords","verdict","issues"}]}, one object per entry, same order, "lemma" copied exactly.`;

export type VerifierInput = {
  lemma: string;
  partOfSpeech?: string;
  gradeLevel: number;
  definition: string;
  examples: string[];
  keyIdeas: Array<{ idea: string; keywords: string[] }>;
  acceptedParaphrases: string[];
  synonyms: string[];
  antonyms: string[];
  semanticNeighbors: string[];
};

export function verifierUserPrompt(items: VerifierInput[]): string {
  return `Review these ${items.length} entries:\n${JSON.stringify(items.map((item) => ({
    lemma: item.lemma,
    partOfSpeech: item.partOfSpeech ? POS_LABELS[item.partOfSpeech] ?? item.partOfSpeech : null,
    grade: GRADE_LABELS[item.gradeLevel] ?? "collège",
    definition: item.definition,
    examples: item.examples,
    keyIdeas: item.keyIdeas,
    acceptedParaphrases: item.acceptedParaphrases,
    synonyms: item.synonyms,
    antonyms: item.antonyms,
    semanticNeighbors: item.semanticNeighbors,
  })), null, 1)}`;
}

/** Feedback line for a regeneration from the previous attempt's failures. */
export function regenerationFeedback(previous: GeneratedDefinition | undefined, failures: string[]): string[] {
  const out = [...failures];
  if (previous?.definition) out.push(`définition refusée : « ${previous.definition} »`);
  return out.slice(0, 6);
}
