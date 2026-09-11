import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {DIRECT_OBJECT_TEACHING} from "./direct-object-teaching";
import {reviewDirectObjectPathways} from "./direct-object-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[read("generated/french-v3-direct-object-expansion.json")]);
const assessment=adaptV3ForAssessment({artifact,bank});
it("keeps the approved target and separate candidate pools without publishing",()=>{
 const before=checksum({assessment,bank,annotations,lessons:DIRECT_OBJECT_TEACHING});
 const row=reviewDirectObjectPathways(assessment,bank,artifact.taxonomy,annotations,DIRECT_OBJECT_TEACHING).rows[0];
 expect(row).toMatchObject({skillId:"identifier_complement_direct::reading-receptive",unapprovedCandidates:16,distinctTargetSentences:16,excludedTeachingOverlapQuestionIds:[],proposedAllocationStatus:"allocated",releaseReady:false});
 expect(row.proposedInitialQuestions.length).toBeGreaterThanOrEqual(4);
 expect(row.proposedLaterQuestions.length).toBeGreaterThanOrEqual(4);
 expect(row.proposedLaterQuestions.some(id=>row.proposedInitialQuestions.includes(id))).toBe(false);
 expect(checksum({assessment,bank,annotations,lessons:DIRECT_OBJECT_TEACHING})).toBe(before);
});
it("excludes a taught sentence even though the question has extra instructions",()=>{
 const lessons=structuredClone(DIRECT_OBJECT_TEACHING);
 lessons[0].steps.push({exampleFr:"Lina lit un manga.",explanationFr:"Exemple montré dans ce test."});
 lessons[0].materialExposure!.sentences!.push("Lina lit un manga.");
 const row=reviewDirectObjectPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows[0];
 expect(row.excludedTeachingOverlapQuestionIds).toContain("v3-direct-object:manga");
 expect([...row.proposedInitialQuestions,...row.proposedLaterQuestions]).not.toContain("v3-direct-object:manga");
});
it("does not manufacture context variety by renaming a repeated sentence",()=>{
 const changed=structuredClone(bank),mapped=structuredClone(annotations);
 const entries=changed.items.filter(entry=>entry.itemKey.startsWith("v3-direct-object:"));
 const original=structuredClone(entries[0].item);
 for(const [index,entry] of entries.entries()){
  entry.item=structuredClone(original);entry.item.promptFr+=`\nConsigne ${index+1}.`;
  const annotation=mapped.find(annotation=>annotation.itemKey===entry.itemKey)!;
  annotation.itemChecksum=checksum(entry);annotation.contextKey=`invented-context-${index}`;
 }
 const validation=validateCanonicalDiagnosticBank(changed,artifact.taxonomy);expect(validation.issues).toEqual([]);changed.manifest=validation.manifest;
 const row=reviewDirectObjectPathways({...assessment,bankChecksum:validation.manifest.checksum},changed,artifact.taxonomy,mapped,DIRECT_OBJECT_TEACHING).rows[0];
 expect(row.distinctTargetSentences).toBe(1);
 expect(row.excludedRepeatedSentenceQuestionIds).toHaveLength(15);
 expect(row.proposedAllocationStatus).toBe("insufficient_coverage");
});
it("rejects stale question mappings before producing a feasibility report",()=>{
 const mapped=structuredClone(annotations);mapped[0].itemChecksum="stale";
 expect(()=>reviewDirectObjectPathways(assessment,bank,artifact.taxonomy,mapped,DIRECT_OBJECT_TEACHING)).toThrow(/stale/);
});
