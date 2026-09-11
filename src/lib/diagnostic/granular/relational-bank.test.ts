import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import {stableUuid} from "@/lib/lexicon/baseline";
import type {CanonicalDiagnosticBankArtifact,CanonicalDiagnosticBankItem} from "../item-bank";
import type {AssessmentBundle} from "./service";
import {assertRelationalItem,verifyRelationalBank} from "./relational-bank";
const source=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
const entry=source.items.find(e=>e.item.choices?.length&&e.review)!;
function itemRow(e:CanonicalDiagnosticBankItem):Record<string,unknown>{return {primary_node_id:"node",strand:e.item.strand,modality:e.item.modality,learner_mode:e.item.learnerMode,response_type:e.item.responseType,prompt_fr:e.item.promptFr,instructions_fr:e.item.instructionsFr??null,correct_answer:e.item.correctAnswer??null,acceptable_answers:e.item.acceptableAnswers??[],validator_type:e.item.validatorType,validator_config:e.item.validatorConfig??null,difficulty:e.item.difficulty??50,cefr_level:e.item.cefrLevel??null,qc_gates:e.qcGates,review_status:e.reviewStatus,reviewer_profile_id:e.review?.reviewerProfileId??null,reviewed_at:e.review?.reviewedAt??null,competency_item_choices:e.item.choices?.map((c,position)=>({choice_text:c.text,is_correct:c.correct,position,feedback_fr:c.feedbackFr??null}))??[]};}
it("compares answer provenance but ignores operational statistics and timestamp formatting",()=>{
 const row=itemRow(entry);
 row.reviewed_at=new Date(String(row.reviewed_at)).toISOString().replace("Z","+00:00");
 row.rating_attempts=7;row.difficulty_rating=1000;
 expect(()=>assertRelationalItem(entry,"node",row)).not.toThrow();
 for(const field of ["prompt_fr","correct_answer","review_status","reviewer_profile_id"]){
  expect(()=>assertRelationalItem(entry,"node",{...row,[field]:"changed"})).toThrow(/differs/);
 }
 const changed=structuredClone(row);(changed.competency_item_choices as Array<Record<string,unknown>>)[0].is_correct=!(changed.competency_item_choices as Array<Record<string,unknown>>)[0].is_correct;
 expect(()=>assertRelationalItem(entry,"node",changed)).toThrow(/differs/);
});
it("paginates the full bank and rejects missing, extra, or wrongly mapped memberships",async()=>{
 const entries=Array.from({length:501},(_,i)=>({...entry,itemKey:`transport-${i}`}));
 const bank={...source,items:entries},bundle={bank,bankId:"bank",taxonomyId:"taxonomy"} as AssessmentBundle;
 const rows=entries.map(e=>({item_id:stableUuid("sigmawrite-diagnostic-item",`${bank.bank.key}:${e.itemKey}`),node_id:"node",mastery_evidence_id:"evidence",section_key:e.sectionKey,evidence_expectation:e.evidenceExpectation,modality:e.item.modality,prompt_family:e.promptFamily,difficulty_tier:e.difficultyTier,difficulty:e.item.difficulty??50,competency_items:itemRow(e)}));
 let pages=0;
 const db=(members:typeof rows)=>({from:(table:string)=>{
  if(table==="taxonomy_release_memberships")return {select:()=>({eq:()=>({in:async()=>({data:[{record_type:"competency_node",record_id:"node",stable_key:entry.item.nodeKey},{record_type:"mastery_evidence",record_id:"evidence",stable_key:`${entry.item.nodeKey}:${entry.evidenceKey}`}],error:null})})})};
  const q={select:()=>q,eq:()=>q,order:()=>q,range:async(start:number,end:number)=>{pages++;return {data:members.slice(start,end+1),error:null};}};return q;
 }}) as unknown as SupabaseClient;
 expect(await verifyRelationalBank(db(rows),bundle)).toEqual({verifiedItems:501});expect(pages).toBe(2);
 await expect(verifyRelationalBank(db(rows.slice(1)),bundle)).rejects.toThrow(/incomplete/);
 await expect(verifyRelationalBank(db([...rows,{...rows[0],item_id:"extra"}]),bundle)).rejects.toThrow(/Unexpected/);
 await expect(verifyRelationalBank(db([{...rows[0],mastery_evidence_id:"wrong"},...rows.slice(1)]),bundle)).rejects.toThrow(/membership differs/);
});
