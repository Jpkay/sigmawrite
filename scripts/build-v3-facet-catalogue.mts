import {FACET_PREREQUISITE_RULES} from "../src/lib/diagnostic/granular/facet-prerequisites";
import {CONJUGATION_CHALLENGE_ORDER} from "../src/lib/diagnostic/granular/conjugation-challenge";
import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {validateAnnotationReviewDraft} from "../src/lib/diagnostic/granular/annotation-review";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const facets=buildV3Facets(artifact.taxonomy),base=adaptV3ForAssessment({artifact,bank});
const compiled=applyFacetTargets(base,facets,bank);
const annotationDraft=read("docs/diagnostic/v3-facet-annotations.json");
const annotations=validateAnnotationReviewDraft(annotationDraft,bank);
const preview=applyFacetTargets(base,facets,bank,annotations);
const content={version:"french-v3-assessment-facets-v1",status:"draft_requires_mapping_and_coverage_review",parentTaxonomyChecksum:artifact.manifest.contentChecksum,facets,prerequisiteRules:FACET_PREREQUISITE_RULES,challengeOrder:CONJUGATION_CHALLENGE_ORDER};
writeFileSync("generated/french-v3-assessment-facets.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n");
const report={facets:facets.length,parentCompetencies:new Set(facets.map(f=>f.nodeKey)).size,evidenceTargets:compiled.assessment.skills.length,
 eligibleMappedProbes:compiled.assessment.probes.length,unassignedEligibleProbes:compiled.unassignedItemKeys.length,
 uncoveredFacetEvidenceTargets:compiled.coverage.filter(r=>!r.eligibleQuestions).length,
 annotationReviewPreview:{status:annotationDraft.status,proposedMappings:annotations.length,
  heldItems:annotationDraft.holds.length,mappedProbesIfAccepted:preview.assessment.probes.length,
  uncoveredTargetsIfAccepted:preview.coverage.filter(r=>!r.eligibleQuestions).length,
  remainingUnassignedItemKeys:preview.unassignedItemKeys,
  undecidedItemKeys:preview.unassignedItemKeys.filter(key=>!annotationDraft.holds.some((hold:{itemKey:string})=>hold.itemKey===key))},
 limitations:["Draft extension; not a published curriculum", "Unmapped items cannot certify a refined target", "Computed conjugator metadata supports automatic verb/pattern assignment; other items require explicit annotations", "Coverage is incomplete; original v3 and historical results remain unchanged"],
 coverage:compiled.coverage,unassignedItemKeys:compiled.unassignedItemKeys};
writeFileSync("docs/diagnostic/v3-facet-coverage.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({...report,coverage:undefined,unassignedItemKeys:undefined},null,2));
