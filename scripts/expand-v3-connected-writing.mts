import {readFileSync,writeFileSync} from 'node:fs';
import {CONNECTED_WRITING_DRAFTS,CONNECTED_WRITING_INSTRUCTIONS} from '../src/lib/diagnostic/granular/connected-writing-drafts';
import {checksum,type TaxonomyCandidate} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {sectionForStrand} from '../src/lib/diagnostic/protocol';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import type {EvidenceAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json');
const taxonomy=artifact.taxonomy as TaxonomyCandidate;
const base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of CONNECTED_WRITING_DRAFTS){
 const node=taxonomy.nodes.find(node=>node.key===draft.nodeKey);
 const evidence=node?.evidence.find(evidence=>evidence.expectation==='independent_production');
 if(!node||!evidence)throw Error(`Missing approved independent target: ${draft.nodeKey}`);
 const itemKey=`v3-connected-writing:${draft.key}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'short_answer',promptFr:draft.promptFr,instructionsFr:CONNECTED_WRITING_INSTRUCTIONS,validatorType:'rubric',validatorConfig:{writingEvaluation:'source-bound-v1',...(draft.writingRubric?{writingRubric:draft.writingRubric}:{}),materialExposure:{sentences:[draft.promptFr,CONNECTED_WRITING_INSTRUCTIONS]}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict!=='needs_human_review')throw Error(`Invalid writing draft: ${itemKey}`);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:'independent_production',sectionKey:sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]),promptFamily:'independent-connected-writing',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);
 annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:draft.contextKey,reason:'Independent connected writing in an authored situation. No model answer or exact key; source-bound evaluation and task review required.'});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,taxonomy);
if(validation.issues.length)throw Error(JSON.stringify(validation.issues));
if(validation.eligibleItemKeys.some(key=>items.some(item=>item.itemKey===key)))throw Error('Draft writing promoted without review');
const content={version:'french-v3-connected-writing-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,taxonomy).manifest.checksum,items,annotations};
const outputPath='generated/french-v3-connected-writing-expansion.json';
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){
 if(readFileSync(outputPath,'utf8')!==serialized)throw Error('Stale connected-writing expansion');
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,targets:new Set(items.map(item=>item.item.nodeKey)).size,status:content.status,checksum:checksum(content)}));
