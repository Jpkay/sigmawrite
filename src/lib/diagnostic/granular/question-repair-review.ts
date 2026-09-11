import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {correctDraftAnswers,repairDraftItems,type DraftAnswerCorrection,type DraftItemRepair} from "./draft-corrections";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {contrastingErrorKeys} from "./contrasting-errors";
import {canonicalProbeMetrics} from "./probe-metrics";

/** Before/after review evidence only. This export cannot grant approval. */
export function buildQuestionRepairReview(input:{source:CanonicalDiagnosticBankArtifact;draft:CanonicalDiagnosticBankArtifact;taxonomy:TaxonomyCandidate;corrections:DraftAnswerCorrection[];repairs:DraftItemRepair[]}){
 const {source,draft,taxonomy,corrections,repairs}=input;
 const originalValidation=validateCanonicalDiagnosticBank(source,taxonomy),validation=validateCanonicalDiagnosticBank(draft,taxonomy);
 if(originalValidation.issues.length||validation.issues.length)throw Error("Invalid repair review source bank");
 const decisions=[...corrections,...repairs];
 if(new Set(decisions.map(row=>row.itemKey)).size!==decisions.length)throw Error("Duplicate repair review decision");
 const expected=repairDraftItems(correctDraftAnswers(source,corrections),repairs);
 const eligible=new Set(validation.eligibleItemKeys);
 const rows=decisions.map(decision=>{
  const before=source.items.find(entry=>entry.itemKey===decision.itemKey)!;
  const after=draft.items.find(entry=>entry.itemKey===decision.itemKey);
  const intended=expected.items.find(entry=>entry.itemKey===decision.itemKey)!;
  if(!after||checksum(after.item)!==checksum(intended.item)||after.evidenceKey!==before.evidenceKey||after.evidenceExpectation!==before.evidenceExpectation)throw Error(`Repair does not match integrated draft: ${decision.itemKey}`);
  if(after.reviewStatus!=="needs_human_review"||after.review||after.qcGates.gate3_ensemble.agrees||eligible.has(after.itemKey))throw Error(`Repair inherited approval: ${decision.itemKey}`);
  const node=taxonomy.nodes.find(node=>node.key===after.item.nodeKey)!;
  const evidence=node.evidence.find(evidence=>evidence.key===after.evidenceKey)!;
  const exposed=questionMaterialKeys(after.item),assessed=questionAssessedMaterialKeys(after.item);
  return {questionId:after.itemKey,sourceChecksum:checksum(before),revisedChecksum:checksum(after),
   reason:decision.reason,priorReviewStatus:before.reviewStatus,status:after.reviewStatus,
   target:{nodeKey:node.key,labelFr:node.labelFr,descriptionFr:node.descriptionFr,evidence:structuredClone(evidence)},
   before:structuredClone(before.item),after:structuredClone(after.item),metrics:canonicalProbeMetrics(after),
   material:{exposed,assessed,annotationStatus:assessed.length?"anchored_requires_review":"missing_assessed_identity"},
   contrastingErrorKeys:contrastingErrorKeys(after.item),
   requiredReviews:["answer_validity_and_alternatives","unique_response_and_clear_instructions","approved_target_fit","material_novelty_and_error_annotations","difficulty_and_guessing"]};
 });
 const content={version:"french-question-repair-review-v1",status:"draft_requires_review",sourceBankChecksum:originalValidation.manifest.checksum,draftBankChecksum:validation.manifest.checksum,
  taxonomyChecksum:source.taxonomy.checksum,decisionChecksum:checksum(decisions),
  summary:{questions:rows.length,targets:new Set(rows.map(row=>`${row.target.nodeKey}:${row.target.evidence.key}`)).size,withoutAssessedIdentity:rows.filter(row=>!row.material.assessed.length).length},rows};
 return {...content,checksum:checksum(content)};
}
