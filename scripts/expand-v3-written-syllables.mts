import {readFileSync,writeFileSync} from "node:fs";
import {WRITTEN_SYLLABLE_DRAFTS,shortWordSegmentations} from "../src/lib/diagnostic/granular/written-syllable-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {EvidenceAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<EvidenceAnnotation & {reason:string}>=[];
for(const draft of WRITTEN_SYLLABLE_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="segmenter_syllabes_ecrites"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key===(draft.mode==="recognition"?"reading-receptive":"writing-controlled-production"));
 if(!evidence)throw Error(`Missing approved target: segmenter_syllabes_ecrites`);
 const key=`v3-written-syllables:${draft.key}`;
 const wrongBoundary=Array.from({length:draft.word.length-1},(_,i)=>`${draft.word.slice(0,i+1)}/${draft.word.slice(i+1)}`).find(value=>value!==draft.segmented)!;
 const alternatives=[draft.segmented,draft.word,wrongBoundary,[...draft.word].join('/')];
 if(new Set(alternatives).size!==4||draft.segmented.replaceAll('/','')!==draft.word)throw Error(`Invalid segmentation alternatives: ${key}`);
 const finite=shortWordSegmentations(draft.word);
 const reason="Written syllable segmentation of regular words; not oral counting or line wrapping.";
 const prompt=`Le mot est « ${draft.word} ».
${draft.mode==="recognition"?"Choisis son découpage en syllabes écrites.":"Découpe-le en syllabes écrites. Sépare les syllabes par /."}`;
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:draft.mode==="recognition"?"reading":"writing",learnerMode:"shared",responseType:draft.mode==="recognition"?"mcq":"short_answer",promptFr:prompt,instructionsFr:draft.mode==="recognition"?"Choisis une réponse.":"Garde toutes les lettres et sépare les syllabes par /.",...(draft.mode==="recognition"?{choices:alternatives.map(text=>({text,correct:text===draft.segmented}))}:{correctAnswer:draft.segmented}),validatorType:"exact",validatorConfig:{writtenSyllablePattern:draft.pattern,...(draft.mode==="recognition"?{contrastingErrors:[{errorKey:"missing_boundary",incorrectChoiceFr:alternatives[1]},{errorKey:"wrong_boundary",incorrectChoiceFr:alternatives[2]},{errorKey:"letter_by_letter",incorrectChoiceFr:alternatives[3]}]}:finite?{finiteResponseSpace:{alternatives:finite,rationaleFr:"Toutes les positions possibles des barres sont comptées pour ce mot court. Les lettres sont fournies."}}:{}),materialExposure:{words:[{lemma:draft.word,form:draft.word}],assessed:{words:[draft.word]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected spelling draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"written-syllable-segmentation",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),kind:"evidence",evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key},contextKey:`written-syllables:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-written-syllables-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-written-syllables-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale written-syllable expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
