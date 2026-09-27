import {LEXICAL_SPELLING_DRAFTS} from "./lexical-spelling-drafts";
import {canonicalProbeMetrics} from "./probe-metrics";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {SPELLING_DRAFTS} from "./spelling-drafts";
import {SPELLING_TEACHING} from "./spelling-teaching";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {questionAssessedMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {validateTeachingTargets} from "./teaching-content";
import {adaptV3ForAssessment} from "./v3-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("binds spelling drafts to exact approved production evidence without promoting them",()=>{
 const {checksum:stored,...expansion}=read("generated/french-v3-spelling-expansion.json");
 expect(checksum(expansion)).toBe(stored);
 const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);
 expect(validation.issues).toEqual([]);
 expect(validation.eligibleItemKeys.some(key=>key.startsWith("v3-spelling:"))).toBe(false);
 const drafts=[...SPELLING_DRAFTS,...LEXICAL_SPELLING_DRAFTS];
 expect(expansion.items).toHaveLength(drafts.length);
 const material=new Set<string>();
 for(const draft of drafts){
  const entry=bank.items.find(entry=>entry.itemKey===`v3-spelling:${draft.key}`)!;
  expect(entry.item.correctAnswer).toBe(draft.answer);
  expect(entry.item.promptFr).toContain(draft.sentence);
  if(draft.nodeKey==="appliquer_m_devant_m_b_p"){
   expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
   // The diagnostic must not show the complete spelling it asks the learner
   // to reconstruct, unlike inflection tasks that deliberately supply a base.
   expect(entry.item.promptFr.toLocaleLowerCase("fr")).not.toContain(draft.answer);
   const masked=draft.sentence.match(/[\p{L}_]*___[\p{L}_]*/u)![0];
   expect(new RegExp(`^${masked.replace("___","[mn]")}$`,"iu").test(draft.answer)).toBe(true);
  }
  expect(expansion.annotations.find((annotation:{itemKey:string})=>annotation.itemKey===entry.itemKey)).toMatchObject({kind:"evidence",itemChecksum:checksum(entry),evidenceTarget:{nodeKey:draft.nodeKey,evidenceKey:"writing-controlled-production"}});
  const keys=questionAssessedMaterialKeys(entry.item);
  expect(keys).toHaveLength(1);expect(material.has(keys[0])).toBe(false);material.add(keys[0]);
 }
 const assessment=adaptV3ForAssessment({artifact,bank});
 expect(()=>validateTeachingTargets(assessment,SPELLING_TEACHING)).not.toThrow();
 for(const lesson of SPELLING_TEACHING){
  expect(lesson.status).toBe("draft_requires_review");
  // No lesson example or guided answer can count as a fresh target word from
  // this question set. Full incidental-word annotation still needs review.
  expect(teachingMaterialKeys(lesson).some(key=>material.has(key))).toBe(false);
 }
});
it("includes contrasts and exceptions instead of making m correct for every lexical item",()=>{
 expect(new Set(LEXICAL_SPELLING_DRAFTS.map(draft=>draft.case))).toEqual(new Set(["before_b","before_p","before_m","keep_n","exception"]));
 expect(LEXICAL_SPELLING_DRAFTS.filter(draft=>draft.case==="exception").map(draft=>draft.answer)).toEqual(["bonbon","bonbonne"]);
});
