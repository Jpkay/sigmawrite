import {EXPLICIT_CHRONOLOGY_DRAFTS} from "../src/lib/diagnostic/granular/explicit-chronology";
import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const emit=(path:string,text:string)=>{
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error(`Stale reading draft artifact: ${path}`);}
 else writeFileSync(path,text);
};
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const drafts=EXPLICIT_CHRONOLOGY_DRAFTS;
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const draft of drafts){
 const node=artifact.taxonomy.nodes.find((n:{key:string})=>n.key===draft.nodeKey);
 const evidence=node?.evidence.find((e:{expectation:string})=>e.expectation==="receptive");
 if(!evidence)throw Error(`Missing approved reading contract: ${draft.nodeKey}`);
 const key=`v3-explicit-chronology:${draft.key}`;
 const raw={nodeKey:node.key,strand:node.strand,modality:"reading",learnerMode:"shared",responseType:"mcq",promptFr:`Lis le texte.\n\n${draft.passage}\n\n${draft.question}`,acceptableAnswers:[],validatorType:"exact",difficulty:50,
  choices:[{text:draft.answer,correct:true},...draft.distractors.map(text=>({text,correct:false}))],
  validatorConfig:{materialExposure:{sentences:[draft.passage]},sourceTextKey:key,sourceTextType:draft.genre==="narrative"?"literary":draft.genre}};
 const checked=await runGates(raw,{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid reading draft: ${key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:key,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"reading_comprehension",promptFamily:"explicit-event-order",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({itemKey:key,itemChecksum:checksum(entry),facetKey:`${node.key}::text_type:${draft.genre}`,contextKey:`passage:${key}`,reason:draft.reason});
}
const expanded={...bank,items:[...bank.items,...items]};delete expanded.manifest;
const checked=validateCanonicalDiagnosticBank(expanded,artifact.taxonomy);
if(checked.issues.length)throw Error(checked.issues.join("\n"));
const content={version:"french-v3-explicit-chronology-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(bank,artifact.taxonomy).manifest.checksum,items,annotations};
emit("generated/french-v3-explicit-chronology-expansion.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n");
const summary={status:content.status,authoredItems:items.length,distinctPassages:annotations.length,targets:[...new Set(annotations.map(a=>a.facetKey))],eligibleAdded:checked.eligibleItemKeys.filter(id=>id.startsWith("v3-explicit-chronology:")).length,
 limitations:["Original fictional passages; draft content requires pedagogical review", "Ordering explicitly dated events; implicit chronology remains a separate skill", "Four answer choices; minimum confirmation must account for guessing rather than treating one correct answer as mastery", "Consolidated review assembly is separate; no approval or publication"],questions:drafts.map(d=>({key:d.key,words:d.passage.split(/\s+/).length,reviewReason:d.reason}))};
emit("docs/diagnostic/v3-explicit-chronology-expansion.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({questions:items.length,distinctPassages:annotations.length}));
