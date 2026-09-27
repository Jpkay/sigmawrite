import { readFileSync, writeFileSync } from "node:fs";
import { DIRECT_OBJECT_TEACHING } from "../src/lib/diagnostic/granular/direct-object-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
validateTeachingTargets(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment,DIRECT_OBJECT_TEACHING);
for (const lesson of DIRECT_OBJECT_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Identifier le complément direct : leçon : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Cible existante identifier_complement_direct, mode recognition. Quatre exemples expliqués et huit exercices guidés : groupes complets, objets humains, destinataire, COD interrogatif, négation, complément indirect, attribut du sujet et lieu.

Les exemples, indices et corrections constituent de l’exposition, jamais une preuve indépendante. Vérifier la distinction entre COD, sujet, complément indirect, attribut et complément de lieu. Les questions qui/quoi ne sont présentées que comme une aide, pas un test universel. La leçon ne couvre pas encore les pronoms objets ni les propositions COD. Les distracteurs, la difficulté et le recoupement avec les questions d’évaluation nécessitent une revue pédagogique.

Empreinte des contenus : ${checksum(DIRECT_OBJECT_TEACHING)}

${DIRECT_OBJECT_TEACHING.map(lesson => `## ${lesson.titleFr}

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
const path = "docs/diagnostic/v3-direct-object-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale direct-object teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: DIRECT_OBJECT_TEACHING.length, guidedExercises: DIRECT_OBJECT_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
