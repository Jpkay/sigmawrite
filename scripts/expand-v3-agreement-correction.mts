import {readFileSync,writeFileSync} from "node:fs";
import {AGREEMENT_CORRECTION_DRAFTS} from "../src/lib/diagnostic/granular/agreement-correction-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import type {FacetAnnotation} from "../src/lib/diagnostic/granular/facet-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations:Array<FacetAnnotation & {reason:string}>=[];
for(const draft of AGREEMENT_CORRECTION_DRAFTS){
 const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="construction_accord_sujet_verbe"),evidence=node?.evidence.find((evidence:{key:string})=>evidence.key==="writing-controlled-production");
 if(!evidence)throw Error(`Missing approved target: construction_accord_sujet_verbe`);
 const key=`v3-agreement-correction:${draft.key}`;
 const shown=draft.template.replace("___",draft.wrong);
 const prompt=`${shown}\n\nCorrige l’accord du verbe « ${draft.wrong} ». Écris uniquement la forme correcte du verbe.`;
 const reason="Accorder le verbe avec son sujet dans une phrase nouvelle, sans modifier son temps.";
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:prompt,instructionsFr:"Écris le verbe corrigé.",correctAnswer:draft.correct,validatorType:"exact",validatorConfig:{finiteResponseSpace:{alternatives:[draft.correct,draft.wrong],rationaleFr:"Cette correction oppose les formes du singulier et du pluriel. La saisie ne supprime pas le choix binaire."},materialExposure:{sentences:[shown],assessed:{sentences:[shown]}}},difficulty:50},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Rejected correction draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"spelling",promptFamily:"correct-subject-verb-agreement",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:`${node.key}::construction:${draft.construction}`,contextKey:`agreement-correction:${draft.key}`,reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(key=>items.some(entry=>entry.itemKey===key)))throw Error("Invalid or promoted recognition draft expansion");
const content={version:"french-v3-agreement-correction-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const outputPath="generated/french-v3-agreement-correction-expansion.json";
const serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){
 if(readFileSync(outputPath,"utf8")!==serialized)throw Error("Stale agreement-correction expansion: regenerate before reviewing or assembling");
}else writeFileSync(outputPath,serialized);
console.log(JSON.stringify({draftQuestions:items.length,status:content.status,targets:[...new Set(items.map(entry=>entry.item.nodeKey))]}));
