import { readFileSync, writeFileSync } from "node:fs";
import { Y_EN_TEACHING } from "../src/lib/diagnostic/granular/y-en-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
validateTeachingTargets(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment,Y_EN_TEACHING);
for (const lesson of Y_EN_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Employer y et en : leçons : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Cinq leçons de production contrôlée, chacune liée à une distinction proposée sous produire_pronoms_y_en : lieu, à + chose, provenance, quantité, de + chose. Trois étapes et quatre exercices par leçon. Les distinctions n’héritent pas automatiquement de l’approbation du nœud parent.

Les exemples, indices et corrections sont de l’exposition. Aucun entraînement guidé ne certifie la maîtrise indépendante. Vérifier la portée de chaque règle, les limites des raccourcis par préposition, les référents humains exclus, les variantes de réponse, l’élision, le maintien des quantités et le recoupement avec la banque. Les erreurs de réécriture peuvent impliquer plusieurs connaissances.

Empreinte des contenus : ${checksum(Y_EN_TEACHING)}

${Y_EN_TEACHING.map(lesson => `## ${lesson.titleFr}

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
const path = "docs/diagnostic/v3-y-en-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale y/en teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: Y_EN_TEACHING.length, guidedExercises: Y_EN_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
