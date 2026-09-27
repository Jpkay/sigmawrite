import { readFileSync, writeFileSync } from "node:fs";
import { AGREEMENT_TEACHING } from "../src/lib/diagnostic/granular/agreement-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
validateTeachingTargets(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment,AGREEMENT_TEACHING);
for (const lesson of AGREEMENT_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Leçons d’accord sujet-verbe : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Quatre cibles distinctes du graphe français : sujet adjacent, séparé, inversé et coordonné. Chaque leçon présente le mécanisme, une limite explicite et quatre exercices au présent. Les formes, les sujets identifiés et les explications sont des propositions à vérifier.

Les exercices sont guidés et peuvent donner des indices : ils ne prouvent pas une maîtrise indépendante. Les exemples et corrections constituent une exposition. Vérifier les recoupements avec les questions réservées et la complétude des annotations avant publication. Les cas coordonnés concernent des référents distincts à la troisième personne reliés par et. Aucun questionnaire indépendant n’est approuvé par ce dossier.

Empreinte des contenus : ${checksum(AGREEMENT_TEACHING)}

${AGREEMENT_TEACHING.map(lesson => `## ${lesson.titleFr}

Cible : ${lesson.facetKey}. Mode : ${lesson.mode}.

${lesson.learnerQuestionFr}

${lesson.steps.map(step => `> ${step.exampleFr.replaceAll("\n", "\n> ")}

${step.explanationFr}`).join("\n\n")}

À retenir : ${lesson.takeawayFr}

Limite : ${lesson.boundaryFr}

${lesson.practice.map((exercise, index) => `### Entraînement ${index + 1}

${exercise.promptFr}

Indice : ${exercise.hintFr}

Réponse attendue : ${exercise.answerFr}

Explication : ${exercise.explanationFr}`).join("\n\n")}`).join("\n\n")}
`;
const path = "docs/diagnostic/v3-agreement-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale agreement teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: AGREEMENT_TEACHING.length, guidedExercises: AGREEMENT_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
