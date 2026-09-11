import {readFileSync,writeFileSync} from "node:fs";
import {Y_EN_DRAFTS} from "../src/lib/diagnostic/granular/y-en-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const node=artifact.taxonomy.nodes.find((node:{key:string})=>node.key==="produire_pronoms_y_en");
const evidence=node.evidence.find((e:{key:string})=>e.key==="writing-controlled-production");
const items:CanonicalDiagnosticBankItem[]=[],annotations=[];
for(const draft of Y_EN_DRAFTS){
 if(!draft.sentence.includes(draft.target))throw Error(`Unanchored target: ${draft.key}`);
 const alternative=draft.answer.replace(/\b(y|en)\b/,pronoun=>pronoun==="y"?"en":"y");
 if(alternative===draft.answer)throw Error(`Missing answer pronoun: ${draft.key}`);
 const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:"writing",learnerMode:"shared",responseType:"transform",promptFr:`${draft.sentence}\n\nRéécris cette phrase en remplaçant « ${draft.target} » par y ou en. Garde les autres mots et, s’il y en a une, la quantité précise.`,instructionsFr:"Écris la phrase complète.",correctAnswer:draft.answer,acceptableAnswers:[],validatorType:"exact",difficulty:50,
 validatorConfig:{materialExposure:{sentences:[draft.sentence,draft.answer],assessed:{sentences:[draft.sentence]}},finiteResponseSpace:{alternatives:[draft.answer,alternative],rationaleFr:"Plancher conservateur de 1/2 pour le choix y/en, conditionnel à la maîtrise des autres transformations. Ce modèle ne mesure pas la réussite réelle d’une phrase complète et nécessite une calibration."}}},
 {knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Invalid y/en draft: ${draft.key}`);
 const entry:CanonicalDiagnosticBankItem={itemKey:`v3-y-en:${draft.key}`,item:checked.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,sectionKey:"grammar",promptFamily:"transform-y-en",difficultyTier:"core",reviewStatus:"needs_human_review",qcGates:{...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"}};
 items.push(entry);annotations.push({kind:"facet",itemKey:entry.itemKey,itemChecksum:checksum(entry),contextKey:`y-en-sentence:${draft.key}`,facetKey:`${node.key}::construction:${draft.construction}`,reason:draft.reason});
}
const combined={...base,items:[...base.items,...items]};delete combined.manifest;
const validation=validateCanonicalDiagnosticBank(combined,artifact.taxonomy);
if(validation.issues.length||validation.eligibleItemKeys.some(id=>id.startsWith("v3-y-en:")))throw Error(`Invalid expansion: ${validation.issues.join("; ")}`);
const content={version:"french-v3-y-en-expansion-v1",status:"draft_requires_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,sourceBankChecksum:validateCanonicalDiagnosticBank(base,artifact.taxonomy).manifest.checksum,items,annotations};
const path="generated/french-v3-y-en-expansion.json",serialized=JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==serialized)throw Error("Stale y/en expansion");}else writeFileSync(path,serialized);
console.log(JSON.stringify({questions:items.length,targets:new Set(annotations.map(a=>a.facetKey)).size,status:content.status}));
