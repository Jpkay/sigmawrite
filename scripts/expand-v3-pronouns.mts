import {readFileSync,writeFileSync} from "node:fs";
import {PRONOUN_DRAFTS,PRONOUN_DISCRIMINATION_DRAFTS} from "../src/lib/diagnostic/granular/pronoun-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {canonicalProbeMetrics} from "../src/lib/diagnostic/granular/probe-metrics";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const draft of [...PRONOUN_DRAFTS,...PRONOUN_DISCRIMINATION_DRAFTS]){
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===draft.nodeKey);
 const evidence=node?.evidence.find((e:{key:string})=>e.key==="writing-controlled-production");
 if(!evidence||!draft.sentence.includes(draft.target))throw Error(`Invalid pronoun source: ${draft.key}`);
 const key=`v3-pronoun:${draft.key}`;
 const pronoun=draft.construction==="elision"?"l’":draft.construction;
 const needle=` ${pronoun}${draft.construction==="elision"?"":" "}`;
 if(!draft.answer.includes(needle))throw Error(`Missing target pronoun: ${key}`);
 const gap=draft.answer.replace(needle,` ___${draft.construction==="elision"?"":" "}`);
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"cloze",
  promptFr:`Complète la deuxième phrase pour remplacer « ${draft.target} » par un pronom.\n\n${draft.sentence}\n${gap}`,
  instructionsFr:"Écris seulement le pronom manquant, avec son apostrophe si nécessaire.",correctAnswer:pronoun,acceptableAnswers:[],validatorType:"exact",difficulty:50,
  validatorConfig:{materialExposure:{sentences:[draft.sentence,gap],assessed:{sentences:[draft.sentence]}},
   finiteResponseSpace:{alternatives:["le","la","les","l’","lui","leur"],rationaleFr:"La tâche demande un pronom complément de troisième personne dans une phrase déjà construite. La saisie ne rend pas cet espace ouvert; les indices grammaticaux peuvent encore faciliter le choix."}},
 },{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid pronoun draft: ${key}`);
 questionMaterialKeys(checked.item);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,
  sectionKey:"grammar",promptFamily:"supply-object-pronoun",difficultyTier:"core",reviewStatus:"needs_human_review",
  qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 canonicalProbeMetrics(entry);
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),contextKey:`pronoun-sentence:${draft.key}`,reason:draft.reason,
  ...(draft.nodeKey==="distinguer_pronom_cod_coi"?{kind:"evidence" as const,evidenceTarget:{nodeKey:node.key,evidenceKey:evidence.key}}:{kind:"facet" as const,facetKey:`${node.key}::construction:${draft.construction}`})});
}
const expanded={...bank,items:[...bank.items,...items]};delete expanded.manifest;
const validation=validateCanonicalDiagnosticBank(expanded,artifact.taxonomy);
if(validation.issues.length)throw Error(validation.issues.join("\n"));
const content={version:"french-v3-pronoun-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,
 sourceBankChecksum:validateCanonicalDiagnosticBank(bank,artifact.taxonomy).manifest.checksum,items,annotations};
const summary={status:content.status,authoredItems:items.length,targets:[...new Set(annotations.map(a=>a.kind==="evidence"?`${a.evidenceTarget.nodeKey}::${a.evidenceTarget.evidenceKey}`:a.facetKey))],eligibleAdded:validation.eligibleItemKeys.filter(id=>id.startsWith("v3-pronoun:")).length,
 limitations:["Controlled production only; no independent-writing mastery", "Authored answer keys and verb complement analysis require review", "Parallel sentence frames across gender/number targets are not independent context evidence", "Source and gapped sentences are annotated; the completed sentence is not displayed and is not asserted as exposed; semantic overlap and complete exposure history remain unverified", "Six declared pronoun forms give a conditional 1/6 guessing floor; grammatical cues and actual difficulty require calibration", "No draft approval, calibrated difficulty or publication"]};
for(const [path,value] of [["generated/french-v3-pronouns-expansion.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n"],["docs/diagnostic/v3-pronoun-expansion.json",JSON.stringify(summary,null,2)+"\n"]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale pronoun expansion: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(summary));
