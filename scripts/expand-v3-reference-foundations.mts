import {readFileSync,writeFileSync} from 'node:fs';
import {REFERENCE_FOUNDATION_RECOGNITION as recognition,REFERENCE_FOUNDATION_PRODUCTION as production} from '../src/lib/diagnostic/granular/reference-foundations';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {checksum} from '../src/lib/taxonomy/validate';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import type {EvidenceAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:EvidenceAnnotation[]=[];
for(const mode of ['recognition','production'] as const){
 const rows=mode==='recognition'?recognition:production;
 for(const [index,row] of rows.entries()){
  const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===row.nodeKey);
  const evidenceKey=mode==='recognition'?'reading-analysis':'writing-controlled-production';
  const evidence=node?.evidence.find((e:{key:string})=>e.key===evidenceKey);if(!evidence)throw Error('Missing approved reference evidence');
  const subject=row.nodeKey==='construction_pronom_sujet';
  const material=mode==='recognition'?[row.sentence]:[row.sentence,row.answer];
  let task:Record<string,unknown>;
  if(mode==='recognition'){
   const r=row as typeof recognition[number];
   task={modality:'reading',responseType:'mcq',promptFr:`${r.sentence}\n\nQue fait « ${r.token} » dans cette phrase ?`,choices:[r.answer,...r.others].map((text,i)=>({text,correct:i===0})),validatorConfig:{materialExposure:{sentences:material,assessed:{sentences:material}},...(r.negative?{negativeExample:{excerptFr:r.sentence,rationaleFr:r.answer}}:{})}};
  }else{
   const r=row as typeof production[number];
   const alternatives=(subject?['Il','Elle','Ils','Elles','Nous','Vous']:['celui','celle','ceux','celles']).flatMap(pronoun=>{const answer=r.sentence.replace(r.replace,pronoun);return [answer,answer.slice(0,-1)];});
   task={modality:'writing',responseType:'cloze',promptFr:`Remplace « ${r.replace} » par un pronom ${subject?'sujet':'démonstratif'}. Écris la phrase complète en gardant les autres mots.\n\n${r.sentence}`,correctAnswer:r.answer,acceptableAnswers:[r.answer.slice(0,-1)],validatorConfig:{materialExposure:{sentences:material,assessed:{sentences:material}},finiteResponseSpace:{alternatives,rationaleFr:'Transformation guidée d’une phrase fournie. La saisie ne constitue pas une rédaction libre ; les principaux choix de pronoms sont comptés conservativement.'}}};
  }
  const checked=await runGates({nodeKey:node.key,strand:node.strand,learnerMode:'shared',validatorType:'exact',difficulty:50,...task},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
  if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected ${mode} ${index}: ${JSON.stringify(checked.gates)}`);
  questionMaterialKeys(checked.item);
  const itemKey=`v3-reference-foundations:${mode}:${index+1}`;
  const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey,evidenceExpectation:evidence.expectation,sectionKey:'grammar',promptFamily:`reference-${mode}`,difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
  items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey},contextKey:itemKey});
 }
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-reference-foundations-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-reference-foundations-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale reference-foundations expansion');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length}));
