import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {CanonicalDiagnosticBankArtifact,CanonicalDiagnosticBankItem} from "../item-bank";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "./draft-expansion-sources";
import {rewriteRevision45ResidualItem} from "./revision-45-residual-copy";

const read=<T>(path:string):T=>JSON.parse(readFileSync(path,"utf8")) as T;
const base=read<CanonicalDiagnosticBankArtifact>("generated/diagnostic-bank-v3-draft.json");
const sources=[...FRENCH_DRAFT_EXPANSION_SOURCES,"etre-participle-agreement","avoir-participle-agreement","passe-recent-modal-family"];
const items:CanonicalDiagnosticBankItem[]=[...base.items,...sources.flatMap(source=>read<{items:CanonicalDiagnosticBankItem[]}>(`generated/french-v3-${source}-expansion.json`).items)];
const revised=items.map(rewriteRevision45ResidualItem);
const changed=revised.filter((entry,index)=>entry!==items[index]);
const byKey=(key:string)=>revised.find(entry=>entry.itemKey===key)?.item;

describe("revision 45 residual instruction copy",()=>{
 it("covers the remaining named-tense and grammar instruction families",()=>{
  expect(changed).toHaveLength(1147);
  const count=(prefix:string)=>changed.filter(entry=>entry.itemKey.startsWith(prefix)).length;
  expect(count("v3-passe-recent-production:")).toBe(180);
  expect(count("v3-passe-simple-verb-production:")).toBe(168);
  expect(count("v3-imperatif-verb-production:")).toBe(132);
  expect(count("v3-subordinate-clauses:")).toBe(36);
  expect(count("v3-relative-clause:")).toBe(16);
  expect(count("v3-participle-formation:")).toBe(36);
  expect(count("v3-etre-participle-agreement:")).toBe(36);
  expect(count("v3-avoir-participle-agreement:")).toBe(36);
  expect(count("v3-tense-meaning-foundations:")).toBe(36);
  expect(count("v3-connected-writing:")).toBe(27);
  expect(byKey("v3-subordinate-clauses:completive-1")?.promptFr).not.toContain("proposition subordonnée");
  expect(byKey("v3-relative-clause:recognition-1")?.choices?.map(choice=>choice.text).join(" ")).not.toContain("proposition relative");
  expect(byKey("v3-passive-production:1")?.promptFr).not.toContain("voix passive");
  expect(byKey("v3-subordinate-clauses:circonstancielle-19")?.promptFr).toContain("malgré quoi");
  expect(byKey("v3-subordinate-clauses:circonstancielle-19")?.choices?.find(choice=>choice.correct)?.text).toContain("n’empêche pas");
  expect(byKey("v3-subordinate-clauses:completive-4")?.choices?.find(choice=>choice.correct)?.text).toContain("après un verbe");
 });

 it("keeps each question identity, answer, validator, assessed material, and one distinct correct choice",()=>{
  for(const [index,before] of items.entries()){
   const after=revised[index];
   if(after===before)continue;
   const {item:beforeItem,...beforeMetadata}=before,{item:afterItem,...afterMetadata}=after;
   expect(afterMetadata).toEqual(beforeMetadata);
   expect(afterItem.nodeKey).toBe(beforeItem.nodeKey);
   expect(afterItem.responseType).toBe(beforeItem.responseType);
   expect(afterItem.validatorType).toBe(beforeItem.validatorType);
   expect(afterItem.correctAnswer).toBe(beforeItem.correctAnswer);
   expect(afterItem.acceptableAnswers).toEqual(beforeItem.acceptableAnswers);
   const beforeValidator={...(beforeItem.validatorConfig??{})},afterValidator={...(afterItem.validatorConfig??{})};
   delete beforeValidator.materialExposure;delete afterValidator.materialExposure;
   expect(afterValidator).toEqual(beforeValidator);
   expect((afterItem.validatorConfig?.materialExposure as {assessed?:unknown}|undefined)?.assessed).toEqual((beforeItem.validatorConfig?.materialExposure as {assessed?:unknown}|undefined)?.assessed);
   if(beforeItem.responseType==="mcq"){
    const beforeChoices=beforeItem.choices??[],afterChoices=afterItem.choices??[];
    expect(afterChoices.filter(choice=>choice.correct)).toHaveLength(1);
    expect(new Set(afterChoices.map(choice=>choice.text)).size).toBe(afterChoices.length);
    expect(afterChoices.findIndex(choice=>choice.correct)).toBe(beforeChoices.findIndex(choice=>choice.correct));
   }
  }
 });

 it("uses non-answer examples to distinguish verb forms",()=>{
  expect(byKey("v3-passe-simple-verb-production:être:1s:0")?.promptFr).toContain("il dansa");
  expect(byKey("v3-imparfait-family-production:parler:1s:0")?.promptFr).toContain("je chantais");
  expect(byKey("v3-conditionnel-family-production:manger:1s:0")?.promptFr).toContain("je chanterais");
  expect(byKey("v3-futur-simple-family-production:manger:1s:0")?.promptFr).toContain("je chanterai");
  expect(byKey("v3-connected-writing:subjunctive-trip")?.promptFr).toContain("Je souhaite qu’elle vienne");
 });
});
