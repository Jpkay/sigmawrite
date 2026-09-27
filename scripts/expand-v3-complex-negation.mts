import {readFileSync,writeFileSync} from 'node:fs';
import {COMPLEX_NEGATION_DRAFTS,complexNegationChoices} from '../src/lib/diagnostic/granular/complex-negation';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {checksum} from '../src/lib/taxonomy/validate';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import type {EvidenceAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:EvidenceAnnotation[]=[];

const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==='construction_negation_complexe');
const evidenceKey='reading-analysis',evidence=node?.evidence.find((e:{key:string})=>e.key===evidenceKey);
if(!evidence)throw Error('Approved complex-negation evidence missing');
for(const [index,row] of COMPLEX_NEGATION_DRAFTS.entries()){
 const choices=complexNegationChoices(row.feature,index);
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'reading',learnerMode:'shared',responseType:'mcq',promptFr:`${row.sentence}\n\nChoisis l’analyse correcte de cette phrase.`,instructionsFr:'Choisis une réponse.',choices:choices.map((text,i)=>({text,correct:text===row.answer})),validatorType:'exact',difficulty:50,validatorConfig:{complexNegationFeature:row.feature,materialExposure:{sentences:[row.sentence],assessed:{sentences:[row.sentence]}},...(row.negativeExample?{negativeExample:{excerptFr:row.sentence,rationaleFr:row.answer}}:{})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected complex-negation question ${index}: ${JSON.stringify(checked.gates)}`);
 questionMaterialKeys(checked.item);
 const itemKey=`v3-complex-negation:${row.key}`;
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey,evidenceExpectation:evidence.expectation,sectionKey:'grammar',promptFamily:'complex-negation-meaning',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey},contextKey:`complex-negation:${row.key}`});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-complex-negation-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-complex-negation-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale complex-negation expansion');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length}));
