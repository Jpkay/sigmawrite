import {readFileSync,writeFileSync} from 'node:fs';
import {SUBORDINATE_ASSESSMENT,clauseChoices} from '../src/lib/diagnostic/granular/subordinate-clauses';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {checksum} from '../src/lib/taxonomy/validate';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import type {EvidenceAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:EvidenceAnnotation[]=[];
for(const kind of ['completive','circonstancielle'] as const){
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===`construction_subordonnee_${kind}`);
const evidenceKey='reading-analysis',evidence=node?.evidence.find((e:{key:string})=>e.key===evidenceKey);
if(!evidence)throw Error('Approved subordinate-clause evidence missing');
for(const [index,row] of SUBORDINATE_ASSESSMENT[kind].entries()){
 const {choices}=clauseChoices(kind,row);
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'reading',learnerMode:'shared',responseType:'mcq',promptFr:`${row.sentence}\n\nCette phrase contient-elle une proposition subordonnée ${kind==='completive'?'complétive':'circonstancielle'} ? Choisis l’analyse correcte.`,instructionsFr:'Choisis une réponse.',choices:choices.map((text,i)=>({text,correct:i===0})),validatorType:'exact',difficulty:50,validatorConfig:{materialExposure:{sentences:[row.sentence],assessed:{sentences:[row.sentence]}},...(!row.clause?{negativeExample:{excerptFr:row.sentence,rationaleFr:row.explanation}}:{})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected relative question ${index}: ${JSON.stringify(checked.gates)}`);
 questionMaterialKeys(checked.item);
 const itemKey=`v3-subordinate-clauses:${kind}-${index+1}`;
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey,evidenceExpectation:evidence.expectation,sectionKey:'grammar',promptFamily:`${kind}-analysis`,difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey},contextKey:`${kind}:${index+1}`});
}
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-subordinate-clauses-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-subordinate-clauses-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale relative-clause expansion');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length,negativeExamples:Object.values(SUBORDINATE_ASSESSMENT).flat().filter(row=>!row.clause).length}));
