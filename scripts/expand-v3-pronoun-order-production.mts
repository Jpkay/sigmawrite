import {readFileSync,writeFileSync} from 'node:fs';
import {PRONOUN_ORDER_DRAFTS} from '../src/lib/diagnostic/granular/pronoun-order-production';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {canonicalProbeMetrics} from '../src/lib/diagnostic/granular/probe-metrics';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const d of PRONOUN_ORDER_DRAFTS){
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===d.nodeKey),evidence=node?.evidence.find((e:{key:string})=>e.key==='writing-controlled-production');
 if(!evidence)throw Error(`Missing target ${d.nodeKey}`);
 const itemKey=`v3-pronoun-order:${d.key}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'transform',promptFr:d.prompt,instructionsFr:'Écris la phrase transformée.',correctAnswer:d.answer,acceptableAnswers:[],validatorType:'exact',difficulty:50,validatorConfig:{...(d.construction==='imperative'?{punctuationPolicy:'optional_imperative_ending'}:{}),materialExposure:{sentences:[d.source],assessed:{sentences:[d.source]}},finiteResponseSpace:{alternatives:[d.answer,d.wrong],rationaleFr:'Les mots et pronoms sont donnés. Deux positions ou deux ordres plausibles donnent ici un plancher conservateur de hasard de 1/2, même avec une réponse saisie. La difficulté réelle reste à calibrer.'}}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected ${itemKey}`);
 const entry:CanonicalDiagnosticBankItem={itemKey,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'grammar',promptFamily:'transform-pronoun-position',difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 canonicalProbeMetrics(entry);items.push(entry);annotations.push({kind:'facet',itemKey,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${d.construction}`,contextKey:`pronoun-source:${checksum(d.source)}`,reason:'Transformation contrôlée de la place ou de l’ordre des pronoms ; les pronoms à utiliser sont donnés, sans modèle de réponse.'});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(i=>i.itemKey===key)))throw Error('Invalid or promoted pronoun-order drafts');
const content={version:'french-v3-pronoun-order-production-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n',path='generated/french-v3-pronoun-order-production-expansion.json';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale pronoun-order expansion');}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,targets:new Set(annotations.map(a=>a.facetKey)).size,status:content.status}));
