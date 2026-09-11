import {readFileSync,writeFileSync} from "node:fs";
import {LEXICAL_SPELLING_DRAFTS} from "../src/lib/diagnostic/granular/lexical-spelling-drafts";
import {SPELLING_DRAFTS} from "../src/lib/diagnostic/granular/spelling-drafts";
import {SPELLING_TEACHING} from "../src/lib/diagnostic/granular/spelling-teaching";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {questionMaterialKeys,teachingMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
const drafts=[...SPELLING_DRAFTS,...LEXICAL_SPELLING_DRAFTS];
for(const draft of drafts){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key===draft.nodeKey);
 const evidence=node?.evidence.find((evidence:{key:string})=>evidence.key==="writing-controlled-production");
 if(!evidence||draft.sentence.split("___").length!==2)throw Error(`Invalid spelling target: ${draft.key}`);
 const instruction=draft.nodeKey==="marquer_pluriel_nom_regulier"?"au pluriel":"au féminin singulier";
 const lexical=draft.nodeKey==="appliquer_m_devant_m_b_p";
 const masked=lexical?draft.sentence.match(/[\p{L}_]*___[\p{L}_]*/u)![0]:null;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:lexical?`Complète le mot auquel il manque une lettre.\n\n${draft.sentence}`:`Complète avec « ${draft.lemma} » ${instruction}.\n\n${draft.sentence}`,instructionsFr:lexical?"Écris le mot complet, avec la lettre manquante.":"Écris seulement le mot manquant.",correctAnswer:draft.answer,acceptableAnswers:[],validatorType:"exact",difficulty:50,
  validatorConfig:{materialExposure:{words:[{lemma:draft.lemma,form:lexical?draft.answer:draft.lemma}],assessed:{words:[draft.lemma]}},
   ...(masked?{finiteResponseSpace:{alternatives:["m","n"].map(letter=>masked.replace("___",letter).toLocaleLowerCase("fr")),rationaleFr:"Une seule lettre manque et le choix ciblé oppose m et n. La saisie du mot entier ne rend pas cet espace de réponse ouvert."}}:{})},
 },{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid spelling item: ${draft.key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:`v3-spelling:${draft.key}`,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:lexical?"nasal-spelling-in-context":"regular-word-inflection",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:entry.itemKey,itemChecksum:checksum(entry),kind:"evidence" as const,evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`spelling-context:${draft.key}`,reason:draft.reason});
}
for(const lesson of SPELLING_TEACHING)teachingMaterialKeys(lesson);
const expanded={...bank,items:[...bank.items,...items]};delete expanded.manifest;
const validation=validateCanonicalDiagnosticBank(expanded,artifact.taxonomy);
if(validation.issues.length)throw Error(validation.issues.join("\n"));
const content={version:"french-v3-spelling-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(bank,artifact.taxonomy).manifest.checksum,items,annotations};
const summary={status:content.status,authoredItems:items.length,targets:[...new Set(annotations.map(annotation=>`${annotation.evidenceTarget.nodeKey}::${annotation.evidenceTarget.evidenceKey}`))],eligibleAdded:validation.eligibleItemKeys.filter(key=>key.startsWith("v3-spelling:")).length,teachingDrafts:SPELLING_TEACHING.length,
 limitations:["Controlled production only; recognition and independent writing are separate evidence", "Nasal-spelling cases include unchanged n and lexical exceptions; coverage across cases and related-word families requires review", "Single-letter reconstruction offers limited alternatives; its guessing estimate must be calibrated before release", "Target lemmas differ within each skill and from guided examples; semantic/context independence still requires review", "Material annotations identify target words, not a complete annotation of incidental vocabulary", "Novel-word and multiple-occasion requirements remain enforced; drafts do not establish sufficient eligible pools", "Authored answers, mapping, instruction quality and difficulty require review; no publication"]};
const responseNote=(entry:CanonicalDiagnosticBankItem)=>{const space=entry.item.validatorConfig?.finiteResponseSpace as {alternatives:string[]}|undefined;return space?`\n\nChoix implicites déclarés pour la revue (dont une graphie incorrecte) : ${space.alternatives.join(" / ")}. Plancher prudent de hasard : ${canonicalProbeMetrics(entry).guessProbability}. Ce choix doit être validé et calibré.`:"";};
const packet=`# Orthographe : dossier de revue\n\nStatut : brouillons non approuvés. Vérifier chaque réponse, le sens de la phrase, le rattachement au graphe et les annotations de mots. La réussite guidée ne prouve pas une maîtrise indépendante.\n\nEmpreinte des questions : ${checksum(content)}\n\n${items.map((entry,index)=>`## ${entry.itemKey}\n\nCible : ${entry.item.nodeKey}, ${entry.evidenceKey}.\n\n${entry.item.promptFr}\n\nRéponse : ${entry.item.correctAnswer}\n\nJustification : ${drafts[index].reason}${responseNote(entry)}`).join("\n\n")}\n\n# Leçons et entraînement\n\nEmpreinte des leçons : ${checksum(SPELLING_TEACHING)}\n\n${SPELLING_TEACHING.map(lesson=>`## ${lesson.titleFr}\n\nCible : ${lesson.nodeKey}, ${lesson.mode}.\n\n${lesson.learnerQuestionFr}\n\n${lesson.steps.map(step=>`> ${step.exampleFr}\n\n${step.explanationFr}`).join("\n\n")}\n\nÀ retenir : ${lesson.takeawayFr}\n\nLimite : ${lesson.boundaryFr}\n\n${lesson.practice.map(exercise=>`${exercise.promptFr}\n\nIndice : ${exercise.hintFr}\n\nRéponse : ${exercise.answerFr}\n\n${exercise.explanationFr}`).join("\n\n")}`).join("\n\n")}\n`;
for(const [path,value] of [["generated/french-v3-spelling-expansion.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n"],["docs/diagnostic/v3-spelling-expansion.json",JSON.stringify(summary,null,2)+"\n"],["docs/diagnostic/v3-spelling-review.md",packet]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale spelling artifact: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(summary));
