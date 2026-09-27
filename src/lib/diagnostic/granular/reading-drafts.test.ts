import {READING_AUTHORING_DRAFTS} from "./reading-authoring-drafts";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {readTextualSupport} from "./textual-support";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
it("keeps the new short passages unapproved and checksum-bound to their evidence mappings",()=>{
 const {checksum:stored,...expansion}=read("generated/french-v3-reading-expansion.json");
 expect(checksum(expansion)).toBe(stored);
 const bank=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const combined={...bank,items:[...bank.items,...expansion.items]};delete combined.manifest;
 const report=validateCanonicalDiagnosticBank(combined,read("generated/french-taxonomy-v3.json").taxonomy);
 expect(report.issues).toEqual([]);
 expect(report.eligibleItemKeys.some(id=>id.startsWith("v3-short-reading:"))).toBe(false);
 const drafts=READING_AUTHORING_DRAFTS;
 expect(expansion.items).toHaveLength(drafts.length);
 for(const entry of expansion.items){
  const draft=drafts.find(d=>entry.itemKey===`v3-short-reading:${d.key}`)!;
  expect(entry.item.promptFr).toBe(`Lis le texte.\n\n${draft.passage}\n\n${draft.question}`);
  const support=readTextualSupport(entry.item)!;
  expect(support.choices.find(c=>c.correct)?.quoteFr).toBe(draft.support);
  expect(expansion.annotations.find((a:{itemKey:string})=>a.itemKey===entry.itemKey)).toMatchObject({itemChecksum:checksum(entry),facetKey:`${draft.nodeKey}::text_type:${draft.genre}`,contextKey:`passage:${entry.itemKey}`});
 }
 expect(new Set(drafts.map(d=>d.passage)).size).toBe(drafts.length);
 expect(drafts.every(d=>d.passage.split(/\s+/).length<=60)).toBe(true);
 expect(new Set(drafts.map(d=>d.nodeKey)).size).toBe(8);
});
