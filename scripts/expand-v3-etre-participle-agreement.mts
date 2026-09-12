import {readFileSync,writeFileSync} from 'node:fs';
import {ETRE_PARTICIPLE_AGREEMENT_DRAFTS} from '../src/lib/diagnostic/granular/etre-participle-agreement-drafts';
import {checksum} from '../src/lib/taxonomy/validate';
import {runGates} from '../src/lib/ai/item-generation/pipeline';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from '../src/lib/diagnostic/item-bank';
import {questionMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
import {canonicalProbeMetrics} from '../src/lib/diagnostic/granular/probe-metrics';
import type {TargetAnnotation} from '../src/lib/diagnostic/granular/facet-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-taxonomy-v3.json'),base=read('generated/diagnostic-bank-v3-draft.json') as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key==='accorder_participe_etre');
const evidence=node?.evidence.find((e:{key:string})=>e.key==='writing-controlled-production');
if(!evidence)throw Error('Missing approved agreement target');
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<TargetAnnotation & {reason:string}>=[];
for(const draft of ETRE_PARTICIPLE_AGREEMENT_DRAFTS){
 const key=`v3-etre-participle-agreement:${draft.id}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'short_answer',promptFr:draft.prompt,instructionsFr:'Écris seulement le participe passé manquant.',correctAnswer:draft.answer,acceptableAnswers:[],validatorType:'exact',validatorConfig:{tense:'passe_compose',verb:draft.verb,person:draft.construction==='feminine'?'3s':'3p',gender:draft.construction==='plural'?'m':'f',materialExposure:{sentences:[draft.sentence],assessed:{sentences:[draft.sentence]}},finiteResponseSpace:{alternatives:draft.alternatives,rationaleFr:'Le participe masculin singulier est fourni. Quatre accords sont possibles : masculin ou féminin, singulier ou pluriel. Le plancher de hasard reste conservateur à un quart malgré la saisie libre.'}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==='rejected')throw Error(`Rejected agreement draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:'conjugation',promptFamily:`etre-participle-agreement-${draft.construction}`,difficultyTier:'core',reviewStatus:'needs_human_review',qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:'needs_human_review'}};
 canonicalProbeMetrics(entry);items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),kind:'facet',facetKey:`${node.key}::construction:${draft.construction}`,contextKey:key,reason:'Controlled agreement with a supplied participle; does not assess retrieval of its base or pronominal agreement.'});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error(`Invalid or promoted agreement draft: ${validation.issues.join('; ')}`);
const content={version:'french-v3-etre-participle-agreement-expansion-v1',status:'draft_requires_review',parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path='generated/french-v3-etre-participle-agreement-expansion.json';const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+'\n';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==serialized)throw Error('Stale agreement expansion');}else writeFileSync(path,serialized);
console.log(JSON.stringify({draftQuestions:items.length,targets:3,perTarget:12,status:content.status,defaultAssemblyUnchanged:true}));
