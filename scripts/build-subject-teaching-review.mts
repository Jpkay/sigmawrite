import { readFileSync, writeFileSync } from "node:fs";
import { SUBJECT_TEACHING } from "../src/lib/diagnostic/granular/subject-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
validateTeachingTargets(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment,SUBJECT_TEACHING);
for (const lesson of SUBJECT_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Identifier le sujet : leçon : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Cible existante identifier_sujet_verbe, mode recognition. Trois exemples expliqués et six exercices guidés : sujet non humain, groupe complet, sujet postposé, coordination, sujet à la voix passive et coordination dans le complément. Ces cas décrivent la portée du brouillon, pas de nouvelles compétences approuvées.

Les exemples, indices et corrections constituent de l’exposition, jamais une preuve indépendante. Vérifier le remplacement pronominal, la distinction entre sujet et auteur de l’action, la difficulté des distracteurs et l’adaptation de la portée au profil de l’élève. La couverture des questions indépendantes ne doit pas être déduite de celle de cette leçon.

Empreinte des contenus : ${checksum(SUBJECT_TEACHING)}

${SUBJECT_TEACHING.map(lesson => `## ${lesson.titleFr}

Cible : ${lesson.facetKey??lesson.nodeKey}. Mode : ${lesson.mode}.

${lesson.learnerQuestionFr}

${lesson.steps.map(step => `> ${step.exampleFr.replaceAll("\n", "\n> ")}

${step.explanationFr}`).join("\n\n")}

À retenir : ${lesson.takeawayFr}

Limite : ${lesson.boundaryFr}

${lesson.practice.map((exercise, index) => `### Entraînement ${index + 1}

${exercise.promptFr}

${exercise.choices?.map(choice=>`- ${choice}`).join("\n")??""}

Indice : ${exercise.hintFr}

Réponse attendue : ${exercise.answerFr}

Explication : ${exercise.explanationFr}`).join("\n\n")}`).join("\n\n")}
`;
const path = "docs/diagnostic/v3-subject-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale subject teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: SUBJECT_TEACHING.length, guidedExercises: SUBJECT_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
