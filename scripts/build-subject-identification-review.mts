import {readFileSync,writeFileSync} from "node:fs";
import {SUBJECT_IDENTIFICATION_DRAFTS} from "../src/lib/diagnostic/granular/subject-identification-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const base=read("generated/diagnostic-bank-v3-draft.json"),artifact=read("generated/french-taxonomy-v3.json"),expansion=read("generated/french-v3-agreement-expansion.json");
const assembled=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const questions=SUBJECT_IDENTIFICATION_DRAFTS.map(draft=>{
 const entry=assembled.bank.items.find(entry=>entry.itemKey===`v3-subject-identification:${draft.key}`)!;
 if(!entry||entry.item.nodeKey!=="identifier_sujet_verbe"||entry.evidenceKey!=="reading-receptive"||entry.item.choices?.filter(choice=>choice.correct).map(choice=>choice.text).join()!==draft.subject)throw Error(`Invalid subject review source: ${draft.key}`);
 return {...draft,itemKey:entry.itemKey,itemChecksum:checksum(entry)};
});
const packet=`# Identifier le sujet du verbe : dossier de revue

Statut : 16 brouillons, aucune approbation ni activation.

Cible approuvée : identifier_sujet_verbe / reading-receptive. Le verbe est déjà conjugué : on demande de trouver son sujet complet, pas d’écrire une terminaison. Quatre phrases par construction : sujet adjacent, séparé, inversé et coordonné. Ces catégories servent à examiner la variété des questions; elles ne créent pas quatre nouvelles compétences approuvées.

Cette preuve peut compléter les réponses aux questions de conjugaison et d’accord. Elle ne permet pas, à elle seule, d’attribuer avec certitude la cause d’une erreur. Vérifier le sujet complet, l’unicité de la bonne réponse, les distracteurs, le vocabulaire, la difficulté et les prérequis. La comparaison entre compétences doit reposer sur plusieurs réponses indépendantes.

Empreinte : ${checksum(questions)}

${questions.map((question,index)=>`## ${index+1}. ${question.construction}

${question.sentence}

Quel groupe de mots est le sujet du verbe « ${question.verbForm} » ?

${[question.subject,...question.distractors].map(choice=>`- ${choice}`).join("\n")}

Réponse : ${question.subject}

Justification pour la revue : ${question.reason}

Identité : ${question.itemKey}; empreinte : ${question.itemChecksum}`).join("\n\n")}
`;
const path="docs/diagnostic/v3-subject-identification-review.md";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==packet)throw Error("Stale subject review packet");}else writeFileSync(path,packet);
console.log(JSON.stringify({drafts:questions.length,target:"identifier_sujet_verbe::reading-receptive",status:"draft_requires_review"}));
