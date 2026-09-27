import { readFileSync, writeFileSync } from "node:fs";
import { PERIPHRASTIC_RECOGNITION_TEACHING } from "../src/lib/diagnostic/granular/periphrastic-recognition-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {validateTeachingTargets} from "../src/lib/diagnostic/granular/teaching-content";
const artifact=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8"));
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8"));
validateTeachingTargets(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment,PERIPHRASTIC_RECOGNITION_TEACHING);
for (const lesson of PERIPHRASTIC_RECOGNITION_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Reconnaître le futur proche et le passé récent : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Deux cibles existantes, reconnaitre_futur_proche et reconnaitre_passe_recent, en mode recognition. Les modèles et premiers exemples sont repris des leçons de conjugaison existantes; les explications et les douze exercices guidés sont adaptés à la reconnaissance. Vérifier la portée pédagogique et les distracteurs avant publication.

Ces leçons distinguent une construction verbale d’une destination, d’une provenance ou d’un simple indicateur temporel. Elles n’établissent ni la production des formes ni la maîtrise des usages en contexte. Le modèle venir au présent + de + infinitif est distinct des formes avec venait de. Les contenus et corrections constituent une exposition, pas une preuve indépendante.

Empreinte des contenus : ${checksum(PERIPHRASTIC_RECOGNITION_TEACHING)}

${PERIPHRASTIC_RECOGNITION_TEACHING.map(lesson => `## ${lesson.titleFr}

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
const path = "docs/diagnostic/v3-periphrastic-recognition-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale recognition teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: PERIPHRASTIC_RECOGNITION_TEACHING.length, guidedExercises: PERIPHRASTIC_RECOGNITION_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
