import {granularBankOptions} from "./lib/granular-bank-options";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import {readFileSync,writeFileSync} from "node:fs";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {checksum} from "../src/lib/taxonomy/validate";
import {validateAnnotationReviewDraft} from "../src/lib/diagnostic/granular/annotation-review";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const baseAnnotations=validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),base);
const assembled=assembleDraftBank(base,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)),granularBankOptions(process.argv.slice(2)));
const annotations=[...baseAnnotations,...assembled.annotations];
const adapted=applyFacetTargets(adaptV3ForAssessment({artifact,bank:assembled.bank}),buildV3Facets(artifact.taxonomy),assembled.bank,annotations).assessment;
const packet={version:"french-v3-consolidated-review-v1",status:"draft_requires_review",sourceBankChecksum:assembled.sourceBankChecksum,sources:assembled.sources,bankChecksum:assembled.bank.manifest!.checksum,annotations};
const summary={status:packet.status,totalQuestions:assembled.bank.items.length,addedDrafts:assembled.sources.reduce((sum,s)=>sum+s.addedItems,0),canonicalEligibleQuestions:assembled.bank.manifest!.eligibleItemCount,granularUsableQuestions:adapted.probes.length,
 unsupportedEvidenceItemKeys:adapted.unsupportedEvidenceItemKeys,sources:assembled.sources,limitations:["Assembly is not review or publication", "Draft annotations do not inherit taxonomy approval", "Canonical and granular eligibility differ where evidence contracts are unsupported", "Questions still need teaching bindings, disjoint sufficient pools and calibration"]};
for(const [path,value] of [["generated/diagnostic-bank-v3-consolidated-draft.json",assembled.bank],["generated/french-v3-consolidated-review.json",{...packet,checksum:checksum(packet)}],["docs/diagnostic/v3-consolidated-review.json",summary]] as const){
 const text=JSON.stringify(value,null,2)+"\n";
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==text)throw Error(`Stale consolidated artifact: ${path}`);}
 else writeFileSync(path,text);
}
console.log(JSON.stringify(summary,null,2));
