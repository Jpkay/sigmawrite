import { readFileSync, writeFileSync } from "node:fs";
import { CONJUGATION_TEACHING } from "../src/lib/diagnostic/granular/conjugation-teaching";
import { checksum } from "../src/lib/taxonomy/validate";
import { teachingMaterialKeys } from "../src/lib/diagnostic/granular/material-annotations";

for (const lesson of CONJUGATION_TEACHING) teachingMaterialKeys(lesson);
const packet = `# Leçons de conjugaison : dossier de revue

Statut : brouillons, aucune approbation ni activation.

Dix-huit cibles distinctes au présent : modèle régulier en -er, modèle finir, ajustements -ger et -cer, et quatorze verbes fréquents traités séparément. Les formes attendues et tableaux sont calculés par le conjugueur déterministe. Vérifier aussi leur justesse, le sens des phrases, la clarté des explications et le rattachement à chaque cible.

Les exercices sont guidés et peuvent donner des indices : ils ne prouvent pas une maîtrise indépendante. Les exemples, tableaux et corrections constituent une exposition. Les annotations recensent les verbes explicitement montrés et les phrases d’exemple/correction ; une revue des recoupements sémantiques et du vocabulaire incident reste nécessaire avant publication. Aucun questionnaire de vérification indépendante n’est approuvé par ce dossier.

Empreinte des contenus : ${checksum(CONJUGATION_TEACHING)}

${CONJUGATION_TEACHING.map(lesson => `## ${lesson.titleFr}

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
const path = "docs/diagnostic/v3-conjugation-teaching-review.md";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== packet) throw Error("Stale conjugation teaching packet");
} else writeFileSync(path, packet);
console.log(JSON.stringify({ lessons: CONJUGATION_TEACHING.length, guidedExercises: CONJUGATION_TEACHING.reduce((sum, lesson) => sum + lesson.practice.length, 0), status: "draft_requires_review" }));
