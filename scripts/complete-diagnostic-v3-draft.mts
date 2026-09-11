import {questionMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {contrastingErrorKeys} from "../src/lib/diagnostic/granular/contrasting-errors";
import {readFileSync,writeFileSync} from "node:fs";
import {runGates} from "../src/lib/ai/item-generation/pipeline";
import {generatedItemSchema,type GeneratedItem} from "../src/lib/ai/item-generation/schemas";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../src/lib/diagnostic/item-bank";
import type {TaxonomyCandidate} from "../src/lib/taxonomy/validate";
import {diagnosticPromptFamilies,diagnosticDifficultyForTier,DIAGNOSTIC_DIFFICULTY_TIERS} from "../src/lib/diagnostic/item-authoring";
import {sectionForStrand} from "../src/lib/diagnostic/protocol";
import {correctDraftAnswers,repairDraftItems,type DraftAnswerCorrection,type DraftItemRepair} from "../src/lib/diagnostic/granular/draft-corrections";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const taxonomy=read("generated/french-taxonomy-v3.json").taxonomy as TaxonomyCandidate;
const bank=read("generated/diagnostic-bank-v3-candidate.json") as CanonicalDiagnosticBankArtifact;
const source=read("generated/diagnostic-v3-practice-reuse-source.json").items as Array<Record<string,unknown>>;
const exclusions:Array<{id:unknown;nodeKey:unknown;reason:string}>=[];
const added:CanonicalDiagnosticBankItem[]=[];
const counts=new Map<string,number>();
async function append(raw:GeneratedItem,sourceId:string) {
 const node=taxonomy.nodes.find(n=>n.key===raw.nodeKey)!;
 const evidence=node.evidence[0], section=sectionForStrand(node.strand)!;
 raw.modality = evidence.modality === "writing" ? "writing" : "grammar_analysis";
 const index=counts.get(node.key)??0;counts.set(node.key,index+1);
 const tier=DIAGNOSTIC_DIFFICULTY_TIERS[index%3];
 raw.difficulty=diagnosticDifficultyForTier(tier);
 const result=await runGates(raw,{knownNodeKeys:new Set(taxonomy.nodes.map(n=>n.key)),knownMisconceptionKeys:new Set()});
 if(!result.item||result.gates.verdict==="rejected")throw Error(`Hard gate failed: ${sourceId}`);
 // No independent judge was called. Preserve that fact rather than the helper's default agreement.
 const gates={...result.gates,gate3_ensemble:{agreement:0,agrees:false},verdict:"needs_human_review" as const};
 added.push({itemKey:`v3-evidence:${sourceId}`,item:result.item,evidenceKey:evidence.key,evidenceExpectation:evidence.expectation,
 sectionKey:section,promptFamily:diagnosticPromptFamilies(section,evidence.expectation)[index%3],difficultyTier:tier,qcGates:gates,reviewStatus:"needs_human_review"});
}
for(const row of source) {
 const node=String(row.nodeKey), answer=String(row.correct_answer);
 const reason=node==="placer_pronom_complement"?"Blank preselects placement; does not independently test where the pronoun belongs"
 :node==="ordonner_doubles_pronoms"&&answer==="lui"?"Only one pronoun; cannot establish ordering two pronouns"
 :node==="accorder_participe_cod_antepose"&&answer.includes("parlé")?"COI contrast; does not elicit agreement with a preceding COD"
 :node==="produire_pronoms_y_en"&&answer==="elle"?"Tonic-pronoun exception; does not elicit y or en"
 :node==="identifier_complement_direct"&&answer==="COI"?"COI contrast retained for future discrimination probes, not direct COD confirmation":null;
 if(reason){exclusions.push({id:row.id,nodeKey:row.nodeKey,reason});continue;}
 const raw=generatedItemSchema.parse({nodeKey:node,strand:row.strand,modality:row.modality,learnerMode:row.learner_mode,responseType:row.response_type,
 promptFr:row.prompt_fr,instructionsFr:row.instructions_fr??undefined,correctAnswer:row.correct_answer,acceptableAnswers:row.acceptable_answers??[],
 validatorType:row.validator_type,validatorConfig:row.validator_config??undefined,cefrLevel:row.cefr_level??undefined,difficulty:row.difficulty});
 await append(raw,`practice-${row.id}`);
}
const newExamples=[
 ["identifier_complement_direct","Dans « Lina prépare le repas », écris seulement la fonction de « le repas ».","COD",["complément d’objet direct","complément d'objet direct"]],
 ["placer_pronom_complement","Remplace « la lettre » par « la » et réécris toute la phrase : « Nora lit la lettre. »","Nora la lit.",["Nora la lit"]],
 ["placer_pronom_complement","Remplace « les livres » par « les » et réécris toute la phrase : « Je vais ranger les livres. »","Je vais les ranger.",["Je vais les ranger"]],
 ["placer_pronom_complement","Remplace « à Nora » par « lui » et réécris toute la phrase : « Tu ne parles pas à Nora. »","Tu ne lui parles pas.",["Tu ne lui parles pas"]],
] as const;
for(const [index,[nodeKey,promptFr,correctAnswer,acceptableAnswers]] of newExamples.entries())await append({nodeKey,strand:"grammaire_syntaxe",modality:"grammar_analysis",learnerMode:"shared",responseType:"short_answer",promptFr,correctAnswer,acceptableAnswers:[...acceptableAnswers],validatorType:"exact"},`authored-${index+1}`);
// Idempotent replacement of this explicitly named draft family, preserving all inherited items.
bank.items=bank.items.filter(i=>!i.itemKey.startsWith("v3-evidence:"));bank.items.push(...added);
const corrections=read("docs/diagnostic/v3-answer-corrections.json") as DraftAnswerCorrection[];
const repairs=read("docs/diagnostic/v3-item-repairs.json") as DraftItemRepair[];
const correctedBank=repairDraftItems(correctDraftAnswers(bank,corrections),repairs);
for(const correction of [...corrections,...repairs]){
 const entry=correctedBank.items.find(i=>i.itemKey===correction.itemKey)!;
 const checked=await runGates(entry.item,{knownNodeKeys:new Set(taxonomy.nodes.map(n=>n.key)),knownMisconceptionKeys:new Set()});
 if(!checked.item||checked.gates.verdict==="rejected")throw Error(`Corrected item failed hard gates: ${entry.itemKey}`);
 questionMaterialKeys(entry.item);
 contrastingErrorKeys(entry.item);
 entry.qcGates={...checked.gates,gate3_ensemble:{agrees:false,agreement:0},verdict:"needs_human_review"};
}
const validated=validateCanonicalDiagnosticBank(correctedBank,taxonomy);
if(validated.issues.length)throw Error(validated.issues.join("\n"));
const decisions={status:"draft_mapping_review_required",sourceItems:source.length,excluded:exclusions,addedItems:added.map(i=>({itemKey:i.itemKey,nodeKey:i.item.nodeKey,reviewStatus:i.reviewStatus})),independentJudgeRun:false};
for(const [path,value] of [["generated/diagnostic-bank-v3-draft.json",correctedBank],["docs/diagnostic/v3-practice-reuse-decisions.json",decisions]] as const){
 const serialized=JSON.stringify(value,null,2)+"\n";
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==serialized)throw Error(`Stale diagnostic draft: ${path}`);}else writeFileSync(path,serialized);
}
console.log(JSON.stringify({retained:bank.items.length-added.length,added:added.length,excluded:exclusions.length,total:bank.items.length}));
