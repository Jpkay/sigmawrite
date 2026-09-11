import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {inspectQuestionMaterialCoverage} from "./material-coverage";
const original=JSON.parse(readFileSync("generated/french-v3-conjugation-expansion.json","utf8")).items[0] as CanonicalDiagnosticBankItem;
it("distinguishes assessed identities from configured verbs and incidental material without mutating content",()=>{
 const annotated=structuredClone(original),metadataOnly=structuredClone(original),incidental=structuredClone(original);
 metadataOnly.itemKey="metadata-only";delete metadataOnly.item.validatorConfig!.materialExposure;
 incidental.itemKey="incidental";
 const annotation=incidental.item.validatorConfig!.materialExposure as {assessed:unknown};annotation.assessed={words:[],sentences:[]};
 const items=[annotated,metadataOnly,incidental],before=JSON.stringify(items);
 const report=inspectQuestionMaterialCoverage(items,{novelWordsRequired:true,novelSentencesRequired:true});
 expect(report.withoutExplicitAssessedIdentity).toEqual(["metadata-only","incidental"]);
 expect(report.missingRequiredIdentities).toEqual([
  {kind:"word",questionIds:["metadata-only","incidental"]},
  {kind:"sentence",questionIds:items.map(item=>item.itemKey)},
 ]);
 expect(inspectQuestionMaterialCoverage(items).missingRequiredIdentities).toEqual([]);
 expect(JSON.stringify(items)).toBe(before);
});
it("refuses duplicate questions and unanchored material instead of reporting them as covered",()=>{
 expect(()=>inspectQuestionMaterialCoverage([original,original])).toThrow("Duplicate");
 const invalid=structuredClone(original);invalid.item.validatorConfig!.materialExposure={sentences:["Texte absent de cette question."]};
 expect(()=>inspectQuestionMaterialCoverage([invalid])).toThrow("not anchored");
 expect(inspectQuestionMaterialCoverage([],{novelWordsRequired:true})).toEqual({questions:0,withoutExplicitAssessedIdentity:[],missingRequiredIdentities:[{kind:"word",questionIds:[]}]});
});
