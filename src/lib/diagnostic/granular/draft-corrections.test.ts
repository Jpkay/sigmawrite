import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {correctDraftAnswers,type DraftAnswerCorrection} from "./draft-corrections";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const source=read("generated/diagnostic-bank-v3-candidate.json") as CanonicalDiagnosticBankArtifact;
const corrections=read("docs/diagnostic/v3-answer-corrections.json") as DraftAnswerCorrection[];
it("removes stale approval and accepted wrong alternatives without changing the historical source",()=>{
 const before=JSON.stringify(source);
 const changed=correctDraftAnswers(source,corrections);
 const item=changed.items.find(i=>i.itemKey===corrections[0].itemKey)!;
 expect(item.item.correctAnswer).toBe("viens de finir");
 expect(item.item.acceptableAnswers).toEqual([]);
 expect(item.reviewStatus).toBe("needs_human_review");
 expect(item.review).toBeUndefined();
 expect(item.qcGates.gate3_ensemble.agrees).toBe(false);
 expect(JSON.stringify(source)).toBe(before);
 const validation=validateCanonicalDiagnosticBank(changed,read("generated/french-taxonomy-v3.json").taxonomy);
 expect(validation.eligibleItemKeys).not.toContain(item.itemKey);
});
it("fails closed when source content or review provenance changes",()=>{
 const changed=structuredClone(source);
 changed.items.find(i=>i.itemKey===corrections[0].itemKey)!.item.promptFr+=" Changed";
 expect(()=>correctDraftAnswers(changed,corrections)).toThrow(/Stale/);
 expect(()=>correctDraftAnswers(source,[...corrections,...corrections])).toThrow(/Duplicate/);
});
it("rebuilds the corrected answer as pending review in the integrated v3 draft",()=>{
 const draft=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const item=draft.items.find(i=>i.itemKey===corrections[0].itemKey)!;
 expect(item.item.correctAnswer).toBe("viens de finir");
 expect(item.reviewStatus).toBe("needs_human_review");
 expect(item.review).toBeUndefined();
});
