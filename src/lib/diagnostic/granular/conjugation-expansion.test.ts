import {readFileSync} from "node:fs";
import {questionAssessedMaterialKeys,questionMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
import {checksum} from "@/lib/taxonomy/validate";
import {expect,it} from "vitest";
import {expandConjugationDraft} from "./conjugation-expansion";
import {buildV3Facets,conjugationAuthoringCases} from "./facets";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankItem} from "../item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),taxonomy=read("generated/french-taxonomy-v3.json").taxonomy;
const expansion=await expandConjugationDraft(bank,taxonomy);
const item=(node:string,verb:string,person:string,gender="m",negative=false)=>expansion.items.find(i=>i.itemKey===`v3-granular-forms:${node}:${verb}:${person}:${gender}:${negative?"negative":"affirmative"}`)!.item;
it("covers the declared verb/family inventory using approved parent evidence definitions",()=>{
 const facets=new Set(buildV3Facets(taxonomy).map(f=>f.key));
 expect(expansion.annotations.every(a=>facets.has(a.facetKey))).toBe(true);
 expect(new Set(expansion.annotations.map(a=>a.facetKey))).toEqual(new Set(conjugationAuthoringCases().map(c=>c.facetKey)));
 for(const family of ["regular_er","regular_ir","spelling_ger","spelling_cer"]){
  const contexts=new Set(expansion.annotations.filter(a=>a.facetKey===`produire_present_indicatif::pattern:${family}`).map(a=>a.contextKey));
  expect(contexts.size).toBeGreaterThanOrEqual(2);
 }
 const merged={...bank,items:[...bank.items,...expansion.items]};delete merged.manifest;
 const validated=validateCanonicalDiagnosticBank(merged,taxonomy);
 expect(validated.issues).toEqual([]);
 expect(validated.eligibleItemKeys.some(k=>k.startsWith("v3-granular-forms:"))).toBe(false);
 expect(expansion.items.every(i=>!i.review&&!i.qcGates.gate3_ensemble.agrees)).toBe(true);
});
it("handles negative imperative elision, explicit agreement and spelling changes",()=>{
 expect(item("produire_imperatif","avoir","2s","m",true).correctAnswer).toBe("n’aie pas");
 expect(item("produire_imperatif","aller","2s","m",true).correctAnswer).toBe("ne va pas");
 expect(item("produire_passe_compose","partir","3s","f").correctAnswer).toBe("est partie");
 expect(item("produire_plus_que_parfait","venir","3p","f").correctAnswer).toBe("étaient venues");
 expect(item("produire_present_indicatif","manger","1p").correctAnswer).toBe("mangeons");
 expect(item("produire_present_indicatif","commencer","1p").correctAnswer).toBe("commençons");
 expect(expansion.annotations.find(a=>a.itemKey==="v3-granular-forms:produire_imperatif:commencer:1p:m:negative")?.evidenceFeatures).toEqual(["spelling-adjustment"]);
 expect(expansion.annotations.find(a=>a.itemKey==="v3-granular-forms:produire_present_indicatif:commencer:3s:m:affirmative")?.evidenceFeatures).toEqual([]);
 expect(expansion.items.some(i=>i.item.validatorConfig?.verb==="pouvoir"&&i.item.nodeKey==="produire_imperatif")).toBe(false);
});
it("skips existing surfaces instead of manufacturing independent questions with new IDs",async()=>{
 const before=JSON.stringify(bank);
 const first=expansion.items[0];
 const sourceItems=bank.items as CanonicalDiagnosticBankItem[];
 const repeated=await expandConjugationDraft({...bank,items:[...sourceItems,first]},taxonomy);
 expect(repeated.items.some(i=>i.itemKey===first.itemKey)).toBe(false);
 expect(repeated.skipped).toContainEqual({key:first.itemKey,reason:"Existing student-facing surface"});
 expect(JSON.stringify(bank)).toBe(before);
});

it("anchors supplied infinitives for affirmative and negative forms without asserting unshown answers or sentences",()=>{
 const forms=expansion.items.filter(entry=>entry.promptFamily!=="sentence-form-application");
 expect(forms.filter(entry=>entry.promptFamily==="negative-command")).toHaveLength(90);
 for(const entry of forms){
  const verb=String(entry.item.validatorConfig!.verb);
  expect(entry.item.promptFr).toContain(verb);
  const expected=[materialIdentity("word",verb)];
  expect(questionMaterialKeys(entry.item)).toEqual(expected);
  expect(questionAssessedMaterialKeys(entry.item)).toEqual(expected);
  expect(expansion.annotations.find(row=>row.itemKey===entry.itemKey)?.itemChecksum).toBe(checksum(entry));
  expect(entry.reviewStatus).toBe("needs_human_review");
 }
});
