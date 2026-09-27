import {writtenGuessingFloor} from "./response-space";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {AGREEMENT_DRAFTS} from "./agreement-drafts";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
it("keeps all four construction sets pending review and avoids false computed answer keys",()=>{
 const {checksum:stored,...expansion}=read("generated/french-v3-agreement-expansion.json");
 expect(checksum(expansion)).toBe(stored);
 const bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const combined={...bank,items:[...bank.items,...expansion.items]};delete combined.manifest;
 const report=validateCanonicalDiagnosticBank(combined,read("generated/french-taxonomy-v3.json").taxonomy);
 expect(report.issues).toEqual([]);
 const draftIds=new Set(expansion.items.map((entry:{itemKey:string})=>entry.itemKey));
 expect(report.eligibleItemKeys.some(id=>draftIds.has(id))).toBe(false);
 expect(expansion.items.filter((entry:{itemKey:string})=>entry.itemKey.startsWith("v3-agreement:"))).toHaveLength(56);
 for(const construction of ["adjacent","separated","inverted","coordinated"])
  expect(AGREEMENT_DRAFTS.filter(d=>d.construction===construction)).toHaveLength(14);
 const expected:Record<string,string>={"adjacent-players":"célèbrent","adjacent-friends":"découvrent","adjacent-children":"courent","separated-hero":"protège","coordinated-animals":"dorment"};
 for(const [key,answer] of Object.entries(expected)){
  const entry=expansion.items.find((e:{itemKey:string})=>e.itemKey===`v3-agreement:${key}`);
  expect(entry.item).toMatchObject({correctAnswer:answer,validatorType:"exact"});
  expect(entry.qcGates.gate0_computed.applied).toBe(false);
 }
 for(const entry of expansion.items.filter((entry:{itemKey:string})=>entry.itemKey.startsWith("v3-agreement:"))){
  expect(writtenGuessingFloor(entry.item)).toBe(.5);
  expect(entry.item.validatorConfig.finiteResponseSpace.alternatives).toContain(entry.item.correctAnswer);
  const draft=AGREEMENT_DRAFTS.find(d=>entry.itemKey===`v3-agreement:${d.key}`)!;
  expect(expansion.annotations.find((a:{itemKey:string})=>a.itemKey===entry.itemKey)).toMatchObject({itemChecksum:checksum(entry),facetKey:`accorder_sujet_verbe_ecrit::construction:${draft.construction}`,subjectFr:draft.subject});
 }
});
