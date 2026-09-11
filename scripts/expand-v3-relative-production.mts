import {readFileSync,writeFileSync} from 'node:fs';
import {RELATIVE_PRODUCTION_ASSESSMENT,combinedRelative,combinationPrompt} from '../src/lib/diagnostic/granular/relative-production';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {checksum} from '../src/lib/taxonomy/validate';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import type {EvidenceAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==='construction_subordonnee_relative');
const evidenceKey='writing-controlled-production',evidence=node?.evidence.find((e:{key:string})=>e.key===evidenceKey);
if(!evidence)throw Error('Approved relative production evidence missing');
const items:CanonicalDiagnosticBankItem[]=[],annotations:EvidenceAnnotation[]=[];
for(const [index,row] of RELATIVE_PRODUCTION_ASSESSMENT.entries()){
 const answer=combinedRelative(row),prompt=combinationPrompt(row);
 const alternatives=['qui','que','dont','où'].flatMap(pronoun=>{const sentence=`${row.first.slice(0,-1)} ${pronoun}${row.relative.slice(row.pronoun.length)}.`;return [sentence,sentence.slice(0,-1)];});
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'cloze',promptFr:prompt,instructionsFr:'Écris la phrase complète.',correctAnswer:answer,acceptableAnswers:[answer.slice(0,-1)],validatorType:'exact',difficulty:50,validatorConfig:{materialExposure:{sentences:[row.first,row.second,answer],assessed:{sentences:[row.first,row.second,answer]}},finiteResponseSpace:{alternatives,rationaleFr:'La tâche combine des phrases fournies. Le choix du pronom est borné conservativement à quatre possibilités ; la saisie ne constitue pas une rédaction libre.'}}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected relative production ${index}: ${JSON.stringify(checked.gates)}`);
 questionMaterialKeys(checked.item);
 const itemKey=`v3-relative-production:${index+1}`;
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey,evidenceExpectation:evidence.expectation,sectionKey:'grammar',promptFamily:'relative-sentence-combination',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey},contextKey:`relative-production:${index+1}`});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-relative-production-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-relative-production-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale relative-production expansion');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length}));
