import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {PRONOUN_DRAFTS,PRONOUN_DISCRIMINATION_DRAFTS} from "./pronoun-drafts";
import {canonicalProbeMetrics} from "./probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("records only shown sentence exposure while assessing the source sentence and preserving draft status",()=>{
 const {checksum:stored,...expansion}=read("generated/french-v3-pronouns-expansion.json");expect(checksum(expansion)).toBe(stored);
 const base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact,artifact=read("generated/french-taxonomy-v3.json");
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 const validated=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);expect(validated.issues).toEqual([]);
 expect(validated.eligibleItemKeys.some(id=>id.startsWith("v3-pronoun:"))).toBe(false);
 const drafts=[...PRONOUN_DRAFTS,...PRONOUN_DISCRIMINATION_DRAFTS];expect(expansion.items).toHaveLength(drafts.length);
 for(const draft of drafts){
  const entry=bank.items.find(entry=>entry.itemKey===`v3-pronoun:${draft.key}`)!;
  expect(questionAssessedMaterialKeys(entry.item)).toEqual([materialIdentity("sentence",draft.sentence)]);
  const exposed=questionMaterialKeys(entry.item);
  expect(exposed).toContain(materialIdentity("sentence",draft.sentence));expect(exposed).not.toContain(materialIdentity("sentence",draft.answer));
  expect(exposed.some(key=>!questionAssessedMaterialKeys(entry.item).includes(key))).toBe(true);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(1/6);
  expect(entry.reviewStatus).toBe("needs_human_review");
  expect(expansion.annotations.find((row:{itemKey:string})=>row.itemKey===entry.itemKey).itemChecksum).toBe(checksum(entry));
 }
});
