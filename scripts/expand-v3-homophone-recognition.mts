import {readFileSync,writeFileSync} from "node:fs";
import {HOMOPHONE_RECOGNITION_DRAFTS} from "../src/lib/diagnostic/granular/homophone-recognition-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of HOMOPHONE_RECOGNITION_DRAFTS){
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===`distinguer_homophones_${draft.pair}`),evidence=node?.evidence.find((e:{key:string})=>e.key==='reading-receptive');
 if(!evidence)throw Error('Missing approved homophone recognition target');
 const index=items.filter(e=>e.item.nodeKey===node.key).length,key=`v3-homophone-recognition:${draft.pair}:${index}`;
 const sentences=[draft.sentence];
 const reason='Original sentence context. The fixed target words repeat; approved novel-word requirements remain unresolved.';
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'reading',learnerMode:'shared',responseType:'mcq',promptFr:`${draft.sentence}\n\nChoisis le mot qui convient.`,instructionsFr:'Choisis une réponse.',choices:draft.alternatives.map(word=>({text:word,correct:word===draft.answer})),validatorType:'exact',validatorConfig:{contrastingErrors:[{errorKey:`wrong-${draft.answer}`,incorrectChoiceFr:draft.alternatives.find(w=>w!==draft.answer)}],materialExposure:{words:draft.alternatives.map(word=>({lemma:word,form:word})),sentences,assessed:{words:[...draft.alternatives],sentences}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected homophone draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'spelling',promptFamily:'homophone-recognition-context',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 canonicalProbeMetrics(entry);items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),kind:'evidence',evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:key,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-homophone-recognition-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-homophone-recognition-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale homophone expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
