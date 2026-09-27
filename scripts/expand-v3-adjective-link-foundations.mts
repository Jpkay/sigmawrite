import {readFileSync,writeFileSync} from 'node:fs';
import {ADJECTIVE_LINK_DRAFTS} from '../src/lib/diagnostic/granular/adjective-link-foundations';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const d of ADJECTIVE_LINK_DRAFTS){
 const recognition=d.mode==='recognition';
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===d.nodeKey),evidence=node?.evidence.find((e:{key:string})=>e.key===(recognition?'reading-analysis':'writing-controlled-production'));
 if(!evidence)throw Error('Missing approved adjective link evidence');
 const itemKey=`v3-adjective-link:${d.key}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:recognition?'reading':'writing',learnerMode:'shared',responseType:recognition?'mcq':'cloze',promptFr:d.prompt,instructionsFr:recognition?'Choisis une réponse.':'Écris seulement l’adjectif accordé.',...(recognition?{choices:[{text:d.answer,correct:true},...d.distractors.map(text=>({text,correct:false}))]}:{correctAnswer:d.answer}),validatorType:'exact',difficulty:50,validatorConfig:{materialExposure:{sentences:[d.source],assessed:{sentences:[d.source]}},...(recognition?{...(d.negative?{negativeExample:{excerptFr:d.source,rationaleFr:d.reason}}:{})}:{finiteResponseSpace:{alternatives:[d.answer,...d.distractors],rationaleFr:'L’adjectif est fourni. Quatre formes de genre et de nombre sont possibles : plancher de hasard de 1/4, sans calibration empirique.'}})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected ${itemKey}`);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'spelling',promptFamily:'noun-adjective-link',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 items.push(entry);annotations.push({kind:'evidence',itemKey,itemChecksum:checksum(entry),evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`adjective-link:${d.key}`,reason:d.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(i=>i.itemKey===key)))throw Error('Invalid or promoted adjective link draft');
const content={version:'french-v3-adjective-link-foundations-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-adjective-link-foundations-expansion.json',serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale adjective link agreement expansion');}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,status:content.status}));
