import { conjugate, PERSONS, type Person, type Tense } from "@/lib/linguistic/conjugation";
import type { Probe, Skill } from "./engine";

const VERBS = ["être", "avoir", "aller", "faire", "venir", "prendre", "dire", "voir", "parler", "finir"] as const;
const TENSES: ReadonlyArray<{ tense: Tense; label: string; level: number }> = [
  { tense: "present", label: "présent de l’indicatif", level: 0 },
  { tense: "imparfait", label: "imparfait", level: 1 },
  { tense: "futur_proche", label: "futur proche", level: 1 },
  { tense: "passe_recent", label: "passé récent", level: 1 },
  { tense: "passe_compose", label: "passé composé", level: 2 },
  { tense: "futur_simple", label: "futur simple", level: 2 },
  { tense: "imperatif_present", label: "impératif présent", level: 2 },
  { tense: "plus_que_parfait", label: "plus-que-parfait", level: 3 },
  { tense: "conditionnel_present", label: "conditionnel présent", level: 3 },
  { tense: "passe_simple", label: "passé simple", level: 3 },
  { tense: "subjonctif_present", label: "subjonctif présent", level: 4 },
];
const PRONOUN: Record<Person, string> = { "1s": "je", "2s": "tu", "3s": "il", "1p": "nous", "2p": "vous", "3p": "ils" };
const key = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "");
export type AuthoredProbe = Probe & {
  promptFr: string; correctAnswer: string; acceptableAnswers: string[];
  validator: { verb: string; tense: Tense; person: Person };
  reviewStatus: "draft";
};

/** Candidate bank only. Computed answer keys do not constitute release approval. */
export function buildGranularConjugationBank() {
  const skills: Array<Skill & { labelFr: string; verb: string; tense: Tense }> = [];
  const items: AuthoredProbe[] = [];
  for (const verb of VERBS) for (const { tense, label, level } of TENSES) {
    const id = `produire_${key(verb)}_${tense}`;
    skills.push({ id, labelFr: `Conjuguer « ${verb} » au ${label}`, verb, tense,
      domain: "conjugation", branch: `conjugation:${key(verb)}`, level, prerequisites: [], modes: ["production"],
      anchor: (verb === "être" || verb === "avoir") && tense === "present" });
    const persons = tense === "imperatif_present" ? ["2s", "1p", "2p"] as Person[] : PERSONS;
    for (const person of persons) {
      const correctAnswer = conjugate(verb, tense, person, { gender: "m" });
      const feminine = conjugate(verb, tense, person, { gender: "f" });
      // je/tu/nous/vous do not specify gender. Both agreements are legitimate.
      const acceptableAnswers = !["3s", "3p"].includes(person) && feminine !== correctAnswer ? [feminine] : [];
      items.push({ id: `${id}:${person}`, skillId: id, mode: "production", contextId: `person:${person}`,
        difficulty: ["1p", "2p", "3p"].includes(person) ? .65 : .35,
        expectedSeconds: 20, guessProbability: .05,
        promptFr: tense === "imperatif_present"
          ? `Écris « ${verb} » à l’impératif présent, à la ${person === "2s" ? "2e personne du singulier" : person === "1p" ? "1re personne du pluriel" : "2e personne du pluriel"}. Écris uniquement le verbe.`
          : `Conjugue « ${verb} » au ${label} avec « ${PRONOUN[person]} ». Écris uniquement la forme verbale.`,
        correctAnswer, acceptableAnswers, validator: { verb, tense, person }, reviewStatus: "draft" });
    }
  }
  return { version: "granular-conjugation-candidate-v1", status: "draft", skills, items };
}
