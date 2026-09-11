import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {TaxonomyCandidate} from "@/lib/taxonomy/validate";
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
const taxonomy=JSON.parse(readFileSync("generated/french-taxonomy-v3.json","utf8")).taxonomy as TaxonomyCandidate;
it("provides draft minimum coverage for every initial v3 evidence definition",()=>{
 for(const node of taxonomy.nodes)for(const e of node.evidence){
  if(e.expectation==="independent_production")continue;
  expect(bank.items.filter(i=>i.item.nodeKey===node.key&&i.evidenceKey===e.key).length,`${node.key}:${e.key}`).toBeGreaterThanOrEqual(Number(e.successCriteria.minimumDistinctItems??3));
 }
});
it("satisfies canonical item structure and grading contracts",()=>{
 const result=validateCanonicalDiagnosticBank(bank,taxonomy);
 expect(result.issues).toEqual([]);
});
it("does not turn practice approval or a skipped judge into diagnostic approval",()=>{
 const added=bank.items.filter(i=>i.itemKey.startsWith("v3-evidence:"));
 expect(added).toHaveLength(40);
 expect(added.every(i=>i.reviewStatus==="needs_human_review"&&!i.review&&!i.qcGates.gate3_ensemble.agrees)).toBe(true);
});
it("placement probes require constructing the sentence rather than filling a pre-positioned blank",()=>{
 const items=bank.items.filter(i=>i.item.nodeKey==="placer_pronom_complement");
 expect(items).toHaveLength(3);
 expect(items.every(i=>i.item.promptFr.includes("réécris toute la phrase")&&!i.item.promptFr.includes("___"))).toBe(true);
});
