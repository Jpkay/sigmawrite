import {readFileSync,writeFileSync} from "node:fs";
import {ON_OM_DRAFTS} from "../src/lib/diagnostic/granular/on-om-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of ON_OM_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="orthographier_nasale_on_om"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key===(draft.mode==="recognition"?"reading-receptive":"writing-controlled-production"));
 if(!evidence)throw Error(`Missing approved target: orthographier_nasale_on_om`);
 const key=`v3-on-om:${draft.key}`;
 const masked=draft.sentence.match(/[\p{L}_]*___[\p{L}_]*/u)![0];
 const wrong=masked.replace("___",draft.letter==="m"?"n":"m");
 if(masked.replace("___",draft.letter)!==draft.word)throw Error(`Invalid word mask: ${key}`);
 const reason=draft.letter==="m"?"Dans ce mot, on écrit om devant b ou p.":"Dans ce mot, le son nasal s’écrit on.";
 const prompt=`${draft.sentence}\n\n${draft.mode==="recognition"?"Choisis le mot correctement écrit.":"Complète le mot. Écris le mot entier avec la lettre manquante."}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:draft.mode==="recognition"?"reading":"writing",learnerMode:"shared",responseType:draft.mode==="recognition"?"mcq":"cloze",promptFr:prompt,instructionsFr:draft.mode==="recognition"?"Choisis une réponse.":"Écris le mot entier.",...(draft.mode==="recognition"?{choices:[{text:draft.word,correct:true},{text:wrong,correct:false}]}:{correctAnswer:draft.word}),validatorType:"exact",validatorConfig:{...(draft.mode==="recognition"?{contrastingErrors:[{errorKey:draft.letter==="m"?"n_before_b_or_p":"m_without_b_or_p",incorrectChoiceFr:wrong}]}:{finiteResponseSpace:{alternatives:[draft.word,wrong],rationaleFr:"Le choix ciblé oppose n et m. La saisie du mot ne supprime pas ce choix binaire."}}),materialExposure:{words:[{lemma:draft.word,form:draft.word}],assessed:{words:[draft.word]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected spelling draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"nasal-on-om-in-context",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),kind:"evidence",evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`on-om:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-on-om-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-on-om-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale on-om expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
