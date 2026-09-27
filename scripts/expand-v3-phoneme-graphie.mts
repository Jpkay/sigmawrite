import {readFileSync,writeFileSync} from "node:fs";
import {PHONEME_GRAPHIE_DRAFTS} from "../src/lib/diagnostic/granular/phoneme-graphie-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const audioManifest=read("generated/french-phoneme-graphie-audio-draft.json");
const groups=["ch","ou","gn","f"] as const;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of PHONEME_GRAPHIE_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="associer_phoneme_graphie_frequente"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key===(draft.mode==="recognition"?"reading-receptive":"writing-controlled-production"));
 if(!evidence)throw Error(`Missing approved target: associer_phoneme_graphie_frequente`);
 const key=`v3-phoneme-graphie:${draft.key}`;
 const alternatives=groups.map(group=>draft.masked.replace("___",group));
 const audio=audioManifest.assets.find((row:{word:string})=>row.word===draft.word)?.audioStimulus;
 if(!audio||draft.masked.replace("___",draft.group)!==draft.word)throw Error(`Missing audio or invalid word mask: ${key}`);
 const reason="Associate the heard word with its missing grapheme; source audio is still pending pronunciation review.";
 const prompt=`Écoute le mot, puis complète : ${draft.masked}

${draft.mode==="recognition"?"Choisis le mot qui correspond à ce que tu entends.":"Écris le mot entier avec les lettres manquantes."}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:draft.mode==="recognition"?"reading":"writing",learnerMode:"shared",responseType:draft.mode==="recognition"?"mcq":"cloze",promptFr:prompt,instructionsFr:draft.mode==="recognition"?"Écoute, puis choisis une réponse.":"Écoute, puis écris le mot entier.",...(draft.mode==="recognition"?{choices:alternatives.map(text=>({text,correct:text===draft.word}))}:{correctAnswer:draft.word}),validatorType:"exact",validatorConfig:{audioStimulus:audio,phonemeGraphieGroup:draft.group,...(draft.mode==="recognition"?{contrastingErrors:groups.filter(group=>group!==draft.group).map(group=>({errorKey:`sound_${draft.group}_confused_with_${group}`,incorrectChoiceFr:draft.masked.replace("___",group)}))}:{finiteResponseSpace:{alternatives,rationaleFr:"Les exemples ciblent quatre graphies : ch, ou, gn et f. Le reste du mot est fourni ; cette réponse ne prouve pas une dictée complète."}}),materialExposure:{words:[{lemma:draft.word,form:draft.word}],assessed:{words:[draft.word]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected spelling draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"heard-word-missing-grapheme",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),kind:"evidence",evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`phoneme-graphie:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-phoneme-graphie-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-phoneme-graphie-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale phoneme-graphie expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
