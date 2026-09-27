import {readFileSync,writeFileSync} from "node:fs";
import {PARTICIPLE_FORMATION_DRAFTS} from "../src/lib/diagnostic/granular/participle-formation";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {FacetAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<FacetAnnotation & {reason:string}>=[];
for(const draft of PARTICIPLE_FORMATION_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="former_participe_passe"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key==="writing-controlled-production");
 if(!evidence)throw Error(`Missing approved target: former_participe_passe`);
 const key=`v3-participle-formation:${draft.key}`;
 const shown=draft.sentence;
 const prompt=`${shown}\n\nComplète avec le participe passé de « ${draft.verb} ». Écris seulement le mot manquant.`;
 const reason=draft.reason;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:prompt,instructionsFr:"L’auxiliaire est déjà donné.",correctAnswer:draft.answer,validatorType:"exact",validatorConfig:{...(draft.kind!=="irregular"?{finiteResponseSpace:{alternatives:draft.kind==="er"?[draft.answer,draft.verb,draft.verb.slice(0,-2)+"ez",draft.verb.slice(0,-2)+"ait"]:[draft.answer,draft.verb,draft.verb.slice(0,-2)+"it",draft.verb.slice(0,-2)+"is"],rationaleFr:"La formation régulière oppose ici le participe, l’infinitif et des terminaisons conjuguées concurrentes. Ce plancher de hasard conservateur ne transforme pas la saisie en production libre calibrée."}}:{}),materialExposure:{sentences:[shown],assessed:{sentences:[shown]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected correction draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"conjugation",promptFamily:"form-past-participle",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${draft.kind}`,contextKey:`participle-formation:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-participle-formation-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-participle-formation-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale participle-formation expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
