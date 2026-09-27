import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {assembleDraftBank,type DraftExpansion} from "./assemble-drafts";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),taxonomy=read("generated/french-taxonomy-v3.json").taxonomy;
const expansion=read("generated/french-v3-reading-expansion.json") as DraftExpansion;
function resign(source:DraftExpansion){const {checksum:previous,...content}=source;void previous;source.checksum=checksum(content);return source;}
it("preserves base entries and approval state while assembling mapped drafts",()=>{
 const before=JSON.stringify(bank),result=assembleDraftBank(bank,taxonomy,[expansion]);
 expect(result.bank.items).toHaveLength(bank.items.length+expansion.items.length);
 expect(JSON.stringify(bank)).toBe(before);
 expect(result.bank.items.slice(0,bank.items.length)).toEqual(bank.items);
 expect(result.bank.manifest!.eligibleItemCount).toBe(238);
 expect(result.annotations).toHaveLength(expansion.items.length);
});
it("rejects stale provenance, missing mappings, duplicate sources and inserted approvals",()=>{
 const stale=structuredClone(expansion);stale.sourceBankChecksum="other";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(stale)])).toThrow(/Stale expansion/);
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion,expansion])).toThrow(/Duplicate expansion/);
 const missing=structuredClone(expansion);missing.annotations.pop();
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(missing)])).toThrow(/exactly one/);
 const edited=structuredClone(expansion);edited.items[0].item.promptFr+=" changed";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(edited)])).toThrow(/Stale item mapping/);
 const approved=structuredClone(expansion);approved.items[0].reviewStatus="human_approved";
 expect(()=>assembleDraftBank(bank,taxonomy,[resign(approved)])).toThrow(/introduce approval/);
});
it("creates a separate immutable bank identity without rewriting items or approvals",()=>{
 const original=assembleDraftBank(bank,taxonomy,[expansion]);
 const revision=assembleDraftBank(bank,taxonomy,[expansion],{revision:2});
 expect(revision.bank.bank).toEqual({key:"french-diagnostic-bank-v3-r2",version:"3.0.0-r2"});
 expect(revision.bank.items).toEqual(original.bank.items);
 expect(revision.annotations).toEqual(original.annotations);
 expect(revision.bank.manifest!.checksum).not.toBe(original.bank.manifest!.checksum);
 expect(revision.bank.manifest!.eligibleItemCount).toBe(original.bank.manifest!.eligibleItemCount);
 expect(bank.bank).toEqual({key:"french-diagnostic-bank-v3",version:"3.0.0"});
 for(const value of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])expect(()=>assembleDraftBank(bank,taxonomy,[expansion],{revision:value})).toThrow(/positive integer/);
});
it("requires the complete prior refinement chain before assembling revision 42 cause content",()=>{
 const refinements={verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true};
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion],{revision:41,...refinements,causeRelationFamily:true})).toThrow(/revision 42/);
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion],{revision:42,causeRelationFamily:true})).toThrow(/preceding refinements/);
 expect(assembleDraftBank(bank,taxonomy,[expansion],{revision:42,...refinements,causeRelationFamily:true}).bank.bank.key).toBe("french-diagnostic-bank-v3-r42");
});
it("requires revision 43 and the complete cause chain before modal passe recent content",()=>{
 const refinements={verbFamilyRecognition:true,etreParticipleAgreement:true,questionDetailReading:true,localDefinitionReading:true,avoirParticipleAgreement:true,causalReadingGenres:true,causeRelationFamily:true};
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion],{revision:42,...refinements,passeRecentModalFamily:true})).toThrow(/revision 43/);
 expect(()=>assembleDraftBank(bank,taxonomy,[expansion],{revision:43,passeRecentModalFamily:true})).toThrow(/preceding refinements/);
 expect(assembleDraftBank(bank,taxonomy,[expansion],{revision:43,...refinements,passeRecentModalFamily:true}).bank.bank.key).toBe("french-diagnostic-bank-v3-r43");
});
it("carries the guarded revision 44 prompt fixes into later revisions",()=>{
 const keys=[
  "local-grammar-v1:construction_negation_simple:receptive:foundation",
  "local-grammar-v1:construction_subordonnee_relative:receptive:core",
 ];
 const revision43=assembleDraftBank(bank,taxonomy,[],{revision:43});
 const revision44=assembleDraftBank(bank,taxonomy,[],{revision:44});
 const revision45=assembleDraftBank(bank,taxonomy,[],{revision:45});
 expect(keys.map(key=>revision43.bank.items.find(entry=>entry.itemKey===key)?.item.promptFr)).toEqual([
  "Quelle phrase contient une négation simple ?",
  "Dans quelle phrase « dont » introduit-il une relative ?",
 ]);
 expect(keys.map(key=>revision44.bank.items.find(entry=>entry.itemKey===key)?.item.promptFr)).toEqual([
  "Quelle phrase dit qu’une action ne se produit pas ?",
  "Dans quelle phrase le mot « dont » ajoute-t-il une précision sur un nom ?",
 ]);
 expect(keys.map(key=>revision45.bank.items.find(entry=>entry.itemKey===key)?.item.promptFr)).toEqual(keys.map(key=>revision44.bank.items.find(entry=>entry.itemKey===key)?.item.promptFr));
 const drifted=structuredClone(bank);delete drifted.manifest;
 drifted.items.find((entry:CanonicalDiagnosticBankItem)=>entry.itemKey===keys[0])!.item.promptFr="Unexpected source copy";
 expect(()=>assembleDraftBank(drifted,taxonomy,[],{revision:44})).toThrow(/prompt override source mismatch/);
});
it("applies guarded revision 45 wording without changing answers, validators or bindings",()=>{
 const key="computed-conjugation-v1:produire_futur_proche:foundation";
 const before=bank.items.find((entry:CanonicalDiagnosticBankItem)=>entry.itemKey===key)!;
 const revision45=assembleDraftBank(bank,taxonomy,[],{revision:45});
 const after=revision45.bank.items.find(entry=>entry.itemKey===key)!;
 expect(after.item.promptFr).toContain("une forme d’aller suivie de « parler »");
 expect({...after,item:{...after.item,promptFr:before.item.promptFr}}).toEqual(before);
 const revision44=assembleDraftBank(bank,taxonomy,[],{revision:44});
 expect(revision44.bank.items.find(entry=>entry.itemKey===key)).toEqual(before);
});
