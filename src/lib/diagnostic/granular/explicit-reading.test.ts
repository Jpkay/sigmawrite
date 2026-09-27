import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import {EXPLICIT_READING_DRAFTS} from "./explicit-reading-drafts";
import {readTextualSupport,publicTextualSupport,gradeTextualSupport} from "./textual-support";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("uses sixteen original short passages and grades the actual supporting excerpt",()=>{
 const expansion=read("generated/french-v3-explicit-reading-expansion.json") as {items:CanonicalDiagnosticBankItem[]};
 expect(expansion.items).toHaveLength(16);
 expect(new Set(EXPLICIT_READING_DRAFTS.map(d=>d.passage)).size).toBe(16);
 for(const draft of EXPLICIT_READING_DRAFTS){
  expect(draft.passage.split(/\s+/).length).toBeLessThan(70);
  const entry=expansion.items.find(e=>e.itemKey===`v3-explicit-reading:${draft.key}`)!;
  expect(entry.evidenceKey).toBe("all-receptive");
  expect(entry.reviewStatus).toBe("needs_human_review");expect(entry.review).toBeUndefined();
  expect(entry.item.choices?.find(c=>c.correct)?.text).toBe(draft.answer);
  expect(new Set(entry.item.choices?.map(c=>c.text)).size).toBe(4);
  expect(readTextualSupport(entry.item)?.choices.filter(c=>c.correct).map(c=>c.quoteFr)).toEqual([draft.support]);
  const choices=publicTextualSupport("test-session",entry.itemKey,entry.item)!;
  for(const choice of choices)expect(gradeTextualSupport("test-session",entry.itemKey,entry.item,choice.id)).toEqual({valid:true,correct:choice.text===draft.support});
 }
});
it("allocates disjoint genre pools while keeping the approved cross-genre parent requirement",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const genre of ["narrative","argumentative"]){
  const id=`localiser_information_explicite::all-receptive::text_type:${genre}`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(id);
  const skill=assessment.skills.find(s=>s.id===id)!;
  expect(skill.evidenceRequirements?.interpretation?.parentMinimumTextTypes).toBe(2);
  const probes=assessment.probes.filter(p=>p.skillId===id);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  expect(initial.length).toBeGreaterThanOrEqual(4);expect(learning.length).toBeGreaterThanOrEqual(4);
  const passages=new Set(initial.map(p=>p.contextId));
  expect(learning.filter(p=>passages.has(p.contextId))).toEqual([]);
 }
});
