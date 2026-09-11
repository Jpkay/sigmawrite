import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {buildQuestionRepairReview} from "./question-repair-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const input={source:read("generated/diagnostic-bank-v3-candidate.json"),draft:read("generated/diagnostic-bank-v3-draft.json"),taxonomy:read("generated/french-taxonomy-v3.json").taxonomy,corrections:read("docs/diagnostic/v3-answer-corrections.json"),repairs:read("docs/diagnostic/v3-item-repairs.json")};
it("exports the full before/after content and approved evidence without changing or approving source questions",()=>{
 const before=checksum(input),report=buildQuestionRepairReview(input);
 expect(report.summary.questions).toBe(input.corrections.length+input.repairs.length);
 expect(report.summary.withoutAssessedIdentity).toBeGreaterThan(0);
 for(const row of report.rows){
  const source=input.source.items.find((entry:{itemKey:string})=>entry.itemKey===row.questionId);
  const revised=input.draft.items.find((entry:{itemKey:string})=>entry.itemKey===row.questionId);
  expect(row.before).toEqual(source.item);expect(row.after).toEqual(revised.item);
  expect(row.sourceChecksum).toBe(checksum(source));expect(row.revisedChecksum).toBe(checksum(revised));
  expect(row.status).toBe("needs_human_review");
  expect(row.target.evidence.key).toBe(revised.evidenceKey);
  expect(row.requiredReviews).toContain("approved_target_fit");
 }
 report.rows[0].after.promptFr="mutated export";
 expect(checksum(input)).toBe(before);
});
it("rejects stale sources, unintegrated replacements, duplicate decisions and inherited approval",()=>{
 const source=structuredClone(input);source.source.items.find((entry:{itemKey:string})=>entry.itemKey===source.repairs[0].itemKey).item.promptFr+=" changed";
 expect(()=>buildQuestionRepairReview(source)).toThrow();
 const stale=structuredClone(input);stale.draft.items.find((entry:{itemKey:string})=>entry.itemKey===stale.repairs[0].itemKey).item.promptFr+=" changed";
 expect(()=>buildQuestionRepairReview(stale)).toThrow("does not match");
 const duplicate=structuredClone(input);duplicate.repairs.push(duplicate.repairs[0]);
 expect(()=>buildQuestionRepairReview(duplicate)).toThrow("Duplicate");
 const approved=structuredClone(input);approved.draft.items.find((entry:{itemKey:string})=>entry.itemKey===approved.repairs[0].itemKey).review={reviewerProfileId:"fixture-reviewer",reviewedAt:"2026-09-11T00:00:00Z"};
 expect(()=>buildQuestionRepairReview(approved)).toThrow();
});
