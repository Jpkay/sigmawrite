import {readFileSync,writeFileSync} from "node:fs";
import {READING_TEACHING} from "../src/lib/diagnostic/granular/reading-teaching";
import {teachingMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {checksum} from "../src/lib/taxonomy/validate";
for(const lesson of READING_TEACHING)teachingMaterialKeys(lesson);
const packet=`# Leçons de lecture : dossier de revue\n\nStatut : brouillons, aucune approbation ni activation. Vérifier la justesse, la clarté, le rattachement précis, la difficulté et les recoupements avec les questions de diagnostic. Les exercices sont guidés; leurs résultats ne constituent pas des preuves de maîtrise indépendante.\n\nEmpreinte des contenus : ${checksum(READING_TEACHING)}\n\n${READING_TEACHING.map(lesson=>`## ${lesson.titleFr}\n\nCible : ${lesson.facetKey}.\n\n${lesson.learnerQuestionFr}\n\n${lesson.steps.map(step=>`> ${step.exampleFr.replaceAll("\n","\n> ")}\n\n${step.explanationFr}`).join("\n\n")}\n\nÀ retenir : ${lesson.takeawayFr}\n\nLimite : ${lesson.boundaryFr}\n\n${lesson.practice.map((exercise,index)=>`### Entraînement ${index+1}\n\n${exercise.promptFr}\n\n${exercise.choices?.map(choice=>`- ${choice}`).join("\n")}\n\nIndice : ${exercise.hintFr}\n\nRéponse attendue : ${exercise.answerFr}\n\nExplication : ${exercise.explanationFr}`).join("\n\n")}`).join("\n\n")}\n`;
const path="docs/diagnostic/v3-reading-teaching-review.md";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==packet)throw Error("Stale reading teaching review");}else writeFileSync(path,packet);
console.log(JSON.stringify({lessons:READING_TEACHING.length,guidedExercises:READING_TEACHING.reduce((sum,lesson)=>sum+lesson.practice.length,0),status:"draft_requires_review"}));
