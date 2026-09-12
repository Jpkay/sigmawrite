import {readFileSync,writeFileSync} from "node:fs";
import {NARRATIVE_TIME_DRAFTS} from "../src/lib/diagnostic/granular/narrative-time-foundations";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of NARRATIVE_TIME_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key===draft.nodeKey),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key==="reading-receptive");
 if(!evidence)throw Error(`Missing approved target: ${draft.nodeKey}`);
 const key=`v3-narrative-time-foundations:${draft.key}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"reading",learnerMode:"shared",responseType:"mcq",promptFr:draft.prompt,instructionsFr:"Choisis une réponse.",choices:[{text:draft.answer,correct:true},...draft.distractors.map(text=>({text,correct:false}))],validatorType:"exact",validatorConfig:{materialExposure:{sentences:[...new Set([draft.prompt,...draft.distractors,draft.answer,...(draft.assessedTexts??[])])],...(draft.assessedTexts?{assessed:{sentences:draft.assessedTexts}}:{})}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected recognition draft: ${key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"conjugation",promptFamily:"interpret-tense-in-context",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({kind:"evidence",itemKey:key,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`past-tense-sentence:${draft.key}`,reason:draft.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-narrative-time-foundations-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-narrative-time-foundations-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale tense-meaning expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
