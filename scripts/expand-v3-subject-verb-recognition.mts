import {readFileSync,writeFileSync} from 'node:fs';
import {SUBJECT_VERB_RECOGNITION_DRAFTS} from '../src/lib/diagnostic/granular/subject-verb-recognition';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const d of SUBJECT_VERB_RECOGNITION_DRAFTS){
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===d.nodeKey),evidence=node?.evidence.find((e:{key:string})=>e.key==='reading-receptive');
 if(!evidence)throw Error('Missing approved subject-verb evidence');
 const itemKey=`v3-subject-verb-recognition:${d.key}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'reading',learnerMode:'shared',responseType:'mcq',promptFr:d.prompt,instructionsFr:'Choisis une réponse.',choices:[{text:d.answer,correct:true},...d.distractors.map(text=>({text,correct:false}))],validatorType:'exact',difficulty:50,validatorConfig:{materialExposure:{words:d.forms.map(form=>({lemma:d.lemma,form})),assessed:{words:[d.lemma]}},contrastingErrors:d.distractors.map((incorrectChoiceFr,i)=>({incorrectChoiceFr,errorKey:d.errorKeys[i]}))}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected ${itemKey}`);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'spelling',promptFamily:'subject-verb-recognition',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({itemKey,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${d.construction}`,contextKey:`subject-verb-recognition:${d.key}`,reason:d.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(i=>i.itemKey===key)))throw Error('Invalid or promoted subject-verb draft');
const content={version:'french-v3-subject-verb-recognition-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-subject-verb-recognition-expansion.json',serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale subject-verb agreement expansion');}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,status:content.status}));
