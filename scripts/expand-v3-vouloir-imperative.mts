import {readFileSync,writeFileSync} from 'node:fs';
import {VOULOIR_IMPERATIVE_APPLICATIONS} from '../src/lib/diagnostic/granular/vouloir-imperative-content';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {checksum} from '../src/lib/taxonomy/validate';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import type {FacetAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==='produire_imperatif');
const evidence=node.evidence.find((e:{expectation:string})=>e.expectation==='controlled_production');
const items:CanonicalDiagnosticBankItem[]=[],annotations:FacetAnnotation[]=[];
for(const [i,row] of VOULOIR_IMPERATIVE_APPLICATIONS.entries()){
 const config={verb:row.verb,tense:'imperatif_present',person:row.person,vouloirImperativeUse:row.use};
 const sentences=[row.sentence,...[row.answer,...row.acceptableAnswers].map(form=>row.sentence.replace('___',form))];
 const raw={nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'short_answer',promptFr:row.prompt,instructionsFr:'Écris seulement le verbe manquant.',correctAnswer:row.answer,acceptableAnswers:row.acceptableAnswers,validatorType:'conjugator',difficulty:50,validatorConfig:{...config,sentenceApplication:row.sentence,finiteResponseSpace:{alternatives:row.use==='polite_request'?['veuille','veuillez']:['veux','veuille','voulons','veuillons','voulez','veuillez'],rationaleFr:"Le verbe, l’usage et la personne sont fournis. Les formules de politesse ont deux formes ici, dont une correcte. En vouloir a six formes proposées, dont deux correctes pour la personne demandée. Ce plancher de hasard conservateur ne mesure pas la rédaction libre."},materialExposure:{words:[{lemma:row.verb,form:row.verb}],sentences,assessed:{sentences}}}};
 const checked=await runGates(raw,{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected imperatif ${i}`);
 questionMaterialKeys(checked.item);
 const itemKey=`v3-vouloir-imperative:${String(i).padStart(2,"0")}:${row.verb}:${row.person}`;
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'conjugation',promptFamily:'sentence-form-application',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({itemKey,itemChecksum:checksum(entry),facetKey:`${node.key}::verb:${row.verb}`,contextKey:`imperatif-verb-application:${i}`,evidenceFeatures:[]});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);if(validation.issues.length)throw Error(validation.issues.join('\n'));
const content={version:'french-v3-vouloir-imperative-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-vouloir-imperative-expansion.json',output=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Stale imperatif production');}else writeFileSync(path,output);
console.log(JSON.stringify({questions:items.length}));
