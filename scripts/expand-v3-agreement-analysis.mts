import {readFileSync,writeFileSync} from "node:fs";
import {AGREEMENT_ANALYSIS_DRAFTS} from "../src/lib/diagnostic/granular/agreement-analysis-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import type {FacetAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<FacetAnnotation & {reason:string}>=[];
for(const draft of AGREEMENT_ANALYSIS_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="construction_accord_sujet_verbe"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key==="reading-analysis");
 if(!evidence)throw Error(`Missing approved target: construction_accord_sujet_verbe`);
 const key=`v3-agreement-analysis:${draft.key}`;
 const number=draft.plural?"pluriel":"singulier";
 const other=draft.plural?"singulier":"pluriel";
 const answer=draft.negative?`L’accord est incorrect : « ${draft.subject} » commande le ${number}. Il faut écrire « ${draft.correctForm} ».`:`L’accord est correct : « ${draft.subject} » commande le ${number}.`;
 const distractors=draft.negative?[
  `L’accord est correct : « ${draft.subject} » commande le ${other}.`,
  "L’accord est correct parce que le verbe ne dépend jamais du sujet.",
  "Il n’y a pas de sujet dans cette phrase.",
 ]:[
  `L’accord est incorrect : « ${draft.subject} » commande le ${other}.`,
  "L’accord est correct parce que le verbe ne dépend jamais du sujet.",
  "Il n’y a pas de sujet dans cette phrase.",
 ];
 const reason=`Le groupe sujet « ${draft.subject} » commande le ${number}. La forme attendue est « ${draft.correctForm} ».`;
 const prompt=`${draft.sentence}\n\nL’accord du verbe « ${draft.form} » est-il correct ? Choisis l’explication juste.`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"reading",learnerMode:"shared",responseType:"mcq",promptFr:prompt,instructionsFr:"Choisis une réponse.",choices:[{text:answer,correct:true},...distractors.map(text=>({text,correct:false}))],validatorType:"exact",validatorConfig:{...(draft.negative?{negativeExample:{excerptFr:draft.sentence,rationaleFr:reason}}:{}),materialExposure:{sentences:[draft.sentence],assessed:{sentences:[draft.sentence]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected recognition draft: ${key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"analyze-subject-verb-agreement",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${draft.construction}`,contextKey:`agreement-analysis:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-agreement-analysis-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-agreement-analysis-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale agreement-analysis expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
