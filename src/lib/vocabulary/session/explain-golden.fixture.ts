/**
 * Golden set for "Explique avec tes mots" (roadmap 2026-10 D.5): 60 student
 * definitions (CM–3e style, spelling mistakes included) with the verdict a
 * teacher would give. Used by explain.test.ts (rules + fail-closed model
 * layer) and by `scripts/eval-word-explanations.mts` (real model, offline).
 */
import type { ExplainReference, ExplainVerdict } from "./explain";

export type GoldenCase = { word: string; answer: string; expected: Exclude<ExplainVerdict, "uncertain"> };

export const GOLDEN_REFERENCES: Record<string, ExplainReference> = {
  intrépide: { word: "intrépide", definition: "Qui n'a pas peur du danger, qui ose affronter les risques.", validation: [{ text: "Très courageux face au danger.", verdict: "correct" }, { text: "Qui a peur de tout.", verdict: "wrong" }], synonyms: ["courageux", "audacieux", "brave"], antonyms: ["peureux", "craintif", "lâche"] },
  éphémère: { word: "éphémère", definition: "Qui ne dure pas longtemps, qui disparaît vite.", validation: [{ text: "Qui dure peu de temps.", verdict: "correct" }], synonyms: ["passager", "bref", "court"], antonyms: ["durable", "éternel"] },
  dissimuler: { word: "dissimuler", definition: "Cacher quelque chose pour qu'on ne le voie pas ou qu'on ne le sache pas.", validation: [], synonyms: ["cacher", "masquer"], antonyms: ["montrer", "révéler"] },
  fébrile: { word: "fébrile", definition: "Agité et nerveux à cause de l'impatience ou de l'émotion.", validation: [{ text: "Qui a de la fièvre.", verdict: "partial" }], synonyms: ["nerveux", "agité", "excité"], antonyms: ["calme", "serein"] },
  vaste: { word: "vaste", definition: "Très grand, qui s'étend sur une grande surface.", validation: [], synonyms: ["immense", "étendu", "grand"], antonyms: ["petit", "exigu", "étroit"] },
  redouter: { word: "redouter", definition: "Avoir peur de quelque chose qui pourrait arriver.", validation: [], synonyms: ["craindre", "appréhender"], antonyms: ["espérer", "souhaiter"] },
  hostile: { word: "hostile", definition: "Qui se montre ennemi, qui est contre quelqu'un ou quelque chose.", validation: [], synonyms: ["ennemi", "agressif", "défavorable"], antonyms: ["amical", "accueillant", "favorable"] },
  persévérer: { word: "persévérer", definition: "Continuer ses efforts sans abandonner malgré les difficultés.", validation: [], synonyms: ["persister", "s'acharner"], antonyms: ["abandonner", "renoncer"] },
  minuscule: { word: "minuscule", definition: "Très petit.", validation: [{ text: "Une petite lettre, pas une majuscule.", verdict: "partial" }], synonyms: ["petit", "infime", "microscopique"], antonyms: ["énorme", "gigantesque", "immense"] },
  émerveiller: { word: "émerveiller", definition: "Remplir d'admiration devant quelque chose de beau ou d'étonnant.", validation: [], synonyms: ["éblouir", "fasciner", "enchanter"], antonyms: ["décevoir", "ennuyer"] },
};

export const GOLDEN_CASES: GoldenCase[] = [
  // intrépide
  { word: "intrépide", answer: "quelqu'un qui n'a pas peur du danger", expected: "correct" },
  { word: "intrépide", answer: "courageux", expected: "correct" },
  { word: "intrépide", answer: "qui ose prendre des risques sans avoir peur", expected: "correct" },
  { word: "intrépide", answer: "qui a peur de tout", expected: "wrong" },
  { word: "intrépide", answer: "peureux", expected: "wrong" },
  { word: "intrépide", answer: "je sais pas", expected: "wrong" },
  // éphémère
  { word: "éphémère", answer: "ça dure pas longtemps", expected: "correct" },
  { word: "éphémère", answer: "qui disparait vite", expected: "correct" },
  { word: "éphémère", answer: "passager", expected: "correct" },
  { word: "éphémère", answer: "qui dure pour toujours", expected: "wrong" },
  { word: "éphémère", answer: "durable", expected: "wrong" },
  { word: "éphémère", answer: "un truc qui dure peu de temps", expected: "correct" },
  // dissimuler
  { word: "dissimuler", answer: "cacher", expected: "correct" },
  { word: "dissimuler", answer: "cacher quelque chose pour que personne le voie", expected: "correct" },
  { word: "dissimuler", answer: "masquer un objet", expected: "correct" },
  { word: "dissimuler", answer: "montrer à tout le monde", expected: "wrong" },
  { word: "dissimuler", answer: "aucune idée", expected: "wrong" },
  { word: "dissimuler", answer: "ne pas laisser voir ce qu'on pense", expected: "correct" },
  // fébrile
  { word: "fébrile", answer: "nerveux et agité", expected: "correct" },
  { word: "fébrile", answer: "très agité à cause de l'impatience", expected: "correct" },
  { word: "fébrile", answer: "qui a de la fièvre", expected: "partial" },
  { word: "fébrile", answer: "calme", expected: "wrong" },
  { word: "fébrile", answer: "excité parce qu'on attend quelque chose", expected: "correct" },
  { word: "fébrile", answer: "je ne sais pas", expected: "wrong" },
  // vaste
  { word: "vaste", answer: "très grand", expected: "correct" },
  { word: "vaste", answer: "immense", expected: "correct" },
  { word: "vaste", answer: "qui s'étend loin sur une grande surface", expected: "correct" },
  { word: "vaste", answer: "petit", expected: "wrong" },
  { word: "vaste", answer: "étroit", expected: "wrong" },
  { word: "vaste", answer: "grand", expected: "correct" },
  // redouter
  { word: "redouter", answer: "avoir peur de quelque chose", expected: "correct" },
  { word: "redouter", answer: "craindre", expected: "correct" },
  { word: "redouter", answer: "avoir peur que quelque chose arrive", expected: "correct" },
  { word: "redouter", answer: "espérer", expected: "wrong" },
  { word: "redouter", answer: "souhaiter que ça arrive", expected: "wrong" },
  { word: "redouter", answer: "euh", expected: "wrong" },
  // hostile
  { word: "hostile", answer: "ennemi", expected: "correct" },
  { word: "hostile", answer: "qui est contre quelqu'un", expected: "correct" },
  { word: "hostile", answer: "agressif", expected: "correct" },
  { word: "hostile", answer: "amical", expected: "wrong" },
  { word: "hostile", answer: "accueillant", expected: "wrong" },
  { word: "hostile", answer: "qui se montre ennemi avec les autres", expected: "correct" },
  // persévérer
  { word: "persévérer", answer: "continuer sans abandonner", expected: "correct" },
  { word: "persévérer", answer: "persister", expected: "correct" },
  { word: "persévérer", answer: "continuer ses efforts malgré les difficultés", expected: "correct" },
  { word: "persévérer", answer: "abandonner", expected: "wrong" },
  { word: "persévérer", answer: "renoncer", expected: "wrong" },
  { word: "persévérer", answer: "continuer", expected: "partial" },
  // minuscule
  { word: "minuscule", answer: "très petit", expected: "correct" },
  { word: "minuscule", answer: "infime", expected: "correct" },
  { word: "minuscule", answer: "énorme", expected: "wrong" },
  { word: "minuscule", answer: "gigantesque", expected: "wrong" },
  { word: "minuscule", answer: "une petite lettre pas une majuscule", expected: "partial" },
  { word: "minuscule", answer: "microscopique", expected: "correct" },
  // émerveiller
  { word: "émerveiller", answer: "remplir d'admiration", expected: "correct" },
  { word: "émerveiller", answer: "éblouir", expected: "correct" },
  { word: "émerveiller", answer: "fasciner quelqu'un", expected: "correct" },
  { word: "émerveiller", answer: "décevoir", expected: "wrong" },
  { word: "émerveiller", answer: "ennuyer quelqu'un", expected: "wrong" },
  { word: "émerveiller", answer: "être plein d'admiration devant quelque chose de beau", expected: "correct" },
];
