import {readFileSync,writeFileSync} from 'node:fs';
import {INFINITIVE_PARTICIPLE_DRAFTS} from '../src/lib/diagnostic/granular/infinitive-participle-foundations';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const d of INFINITIVE_PARTICIPLE_DRAFTS){
 const recognition=d.mode==='recognition';
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===d.nodeKey),evidence=node?.evidence.find((e:{key:string})=>e.key===(recognition?'reading-receptive':'writing-controlled-production'));
 if(!evidence)throw Error('Missing approved infinitive/participle evidence');
 const itemKey=`v3-infinitive-participle:${d.key}`;
 const conceptual=d.lemma===null;
 const materialExposure=conceptual?{sentences:[d.source],assessed:{sentences:[d.source]}}:{words:[...new Set(recognition?[d.answer,...d.distractors]:[d.lemma!,d.answer])].map(form=>({lemma:d.lemma!,form})),assessed:{words:[d.lemma!]}};
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:recognition?'reading':'writing',learnerMode:'shared',responseType:recognition?'mcq':'cloze',promptFr:d.prompt,instructionsFr:recognition?'Choisis une réponse.':'Écris seulement le mot manquant.',...(recognition?{choices:[{text:d.answer,correct:true},...d.distractors.map(text=>({text,correct:false}))]}:{correctAnswer:d.answer}),validatorType:'exact',difficulty:50,validatorConfig:{materialExposure,...(recognition?(conceptual?{}:{contrastingErrors:[{incorrectChoiceFr:d.distractors[0],errorKey:d.errorKey!}]}):{finiteResponseSpace:{alternatives:[d.answer,...d.distractors],rationaleFr:'Le verbe est fourni et la décision oppose infinitif et participe passé. La saisie ne supprime pas ce choix binaire : plancher de hasard de 1/2, sans calibration empirique.'}})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected ${itemKey}`);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:conceptual?'conjugation':'spelling',promptFamily:'infinitive-participle',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`infinitive-participle:${d.key}`,reason:d.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(i=>i.itemKey===key)))throw Error('Invalid or promoted infinitive/participle draft: '+validation.issues.join('; '));
const content={version:'french-v3-infinitive-participle-foundations-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-infinitive-participle-foundations-expansion.json',serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale infinitive/participle agreement expansion');}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,status:content.status}));
