import {readFileSync,writeFileSync} from 'node:fs';
import {SENTENCE_MAIN_IDEA_DRAFTS} from '../src/lib/diagnostic/granular/sentence-main-idea';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {readingPassageText} from '../src/lib/diagnostic/granular/v3-adapter';
import {questionAssessedMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==='identifier_idee_phrase');
const evidence=node.evidence.find((e:{expectation:string})=>e.expectation==='receptive');
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const draft of SENTENCE_MAIN_IDEA_DRAFTS){
 const itemKey=`v3-sentence-main-idea:${draft.key}`;
 const raw={nodeKey:node.key,strand:node.strand,modality:'reading',learnerMode:'shared',responseType:'mcq',promptFr:`Lis le texte.\n\n${draft.passage}\n\n${draft.question}`,acceptableAnswers:[],validatorType:'exact',difficulty:50,choices:[{text:draft.answer,correct:true},...draft.distractors.map(text=>({text,correct:false}))],validatorConfig:{sourceTextKey:itemKey,sourceTextType:draft.genre==='narrative'?'literary':draft.genre,materialExposure:{sentences:[draft.passage],assessed:{sentences:[draft.passage]}}}};
 const checked=await runGates(raw,{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected main-idea question: ${itemKey}`);
 if(readingPassageText(checked.item.validatorConfig,checked.item.promptFr)!==draft.passage)throw Error('Incorrect passage extraction');
 questionAssessedMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'reading_comprehension',promptFamily:'central-idea-versus-detail',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({itemKey,itemChecksum:checksum(entry),facetKey:`${node.key}::text_type:${draft.genre}`,contextKey:`passage:${itemKey}`});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-sentence-main-idea-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-sentence-main-idea-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale main-idea expansion');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length,genres:3,approved:0}));
