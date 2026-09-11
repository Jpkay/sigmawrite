import type {SupabaseClient} from "@supabase/supabase-js";
import {stableJson} from "@/lib/taxonomy/validate";
import {stableUuid} from "@/lib/lexicon/baseline";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {AssessmentBundle} from "./service";
const timestamp=(value:unknown)=>value?new Date(String(value)).toISOString():null;
export function assertRelationalItem(entry:CanonicalDiagnosticBankItem,nodeId:string,stored:Record<string,unknown>){
 const expected={node:nodeId,strand:entry.item.strand,modality:entry.item.modality,learnerMode:entry.item.learnerMode,responseType:entry.item.responseType,prompt:entry.item.promptFr,instructions:entry.item.instructionsFr??null,answer:entry.item.correctAnswer??null,acceptable:entry.item.acceptableAnswers??[],validator:entry.item.validatorType,config:entry.item.validatorConfig??null,difficulty:entry.item.difficulty??50,cefr:entry.item.cefrLevel??null,gates:entry.qcGates,status:entry.reviewStatus,reviewer:entry.review?.reviewerProfileId??null,reviewedAt:timestamp(entry.review?.reviewedAt),choices:(entry.item.choices??[]).map((c,position)=>({text:c.text,correct:c.correct,position,feedback:c.feedbackFr??null}))};
 const choices=(stored.competency_item_choices??[]) as Array<Record<string,unknown>>;
 const actual={node:stored.primary_node_id,strand:stored.strand,modality:stored.modality,learnerMode:stored.learner_mode,responseType:stored.response_type,prompt:stored.prompt_fr,instructions:stored.instructions_fr??null,answer:stored.correct_answer??null,acceptable:stored.acceptable_answers??[],validator:stored.validator_type,config:stored.validator_config??null,difficulty:Number(stored.difficulty),cefr:stored.cefr_level??null,gates:stored.qc_gates,status:stored.review_status,reviewer:stored.reviewer_profile_id??null,reviewedAt:timestamp(stored.reviewed_at),choices:[...choices].sort((a,b)=>Number(a.position)-Number(b.position)).map(c=>({text:c.choice_text,correct:c.is_correct,position:Number(c.position),feedback:c.feedback_fr??null}))};
 if(stableJson(expected)!==stableJson(actual))throw Error(`Relational question differs from canonical version: ${entry.itemKey}`);
}
/** Read-only comparison of every bank member, not only the served scope. */
export async function verifyRelationalBank(db:SupabaseClient,bundle:AssessmentBundle){
 const pinned=await db.from("taxonomy_release_memberships").select("record_type,record_id,stable_key").eq("release_id",bundle.taxonomyId).in("record_type",["competency_node","mastery_evidence"]);
 if(pinned.error)throw Error(pinned.error.message);
 const nodes=new Map((pinned.data??[]).filter(r=>r.record_type==="competency_node").map(r=>[r.stable_key,r.record_id]));
 const evidence=new Map((pinned.data??[]).filter(r=>r.record_type==="mastery_evidence").map(r=>[r.stable_key,r.record_id]));
 const expected=new Map(bundle.bank.items.map(entry=>[stableUuid("sigmawrite-diagnostic-item",`${bundle.bank.bank.key}:${entry.itemKey}`),entry]));
 const seen=new Set<string>();
 for(let offset=0;;offset+=500){
  const result=await db.from("diagnostic_item_bank_memberships").select("item_id,node_id,mastery_evidence_id,section_key,evidence_expectation,modality,prompt_family,difficulty_tier,difficulty,competency_items!inner(primary_node_id,strand,modality,learner_mode,response_type,prompt_fr,instructions_fr,correct_answer,acceptable_answers,validator_type,validator_config,difficulty,cefr_level,qc_gates,review_status,reviewer_profile_id,reviewed_at,competency_item_choices(choice_text,is_correct,position,feedback_fr))").eq("bank_release_id",bundle.bankId).order("item_id").range(offset,offset+499);
  if(result.error)throw Error(result.error.message);
  const rows=result.data??[];
  for(const row of rows){
   const entry=expected.get(row.item_id),node=entry&&nodes.get(entry.item.nodeKey);
   if(!entry||!node||seen.has(row.item_id))throw Error("Unexpected or duplicate relational bank member");
   seen.add(row.item_id);
   if(row.node_id!==node||row.mastery_evidence_id!==evidence.get(`${entry.item.nodeKey}:${entry.evidenceKey}`)||row.section_key!==entry.sectionKey||row.evidence_expectation!==entry.evidenceExpectation||row.modality!==entry.item.modality||row.prompt_family!==entry.promptFamily||row.difficulty_tier!==entry.difficultyTier||Number(row.difficulty)!==(entry.item.difficulty??50))throw Error(`Relational membership differs: ${entry.itemKey}`);
   assertRelationalItem(entry,node,row.competency_items as unknown as Record<string,unknown>);
  }
  if(rows.length<500)break;
 }
 if(seen.size!==expected.size)throw Error(`Relational bank is incomplete: ${seen.size}/${expected.size} questions`);
 return {verifiedItems:seen.size};
}
