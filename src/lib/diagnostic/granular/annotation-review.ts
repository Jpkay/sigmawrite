import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {FacetAnnotation} from "./facet-adapter";

export type AnnotationReviewDraft = {
  version: string;
  status: "draft_requires_review";
  annotations: Array<FacetAnnotation & {reason:string}>;
  holds: Array<{itemKey:string;itemChecksum:string;repairSourceChecksum?:string;category:string;reason:string}>;
  checksum: string;
};

/** This is a coverage-review input, not a publication approval or runtime registry. */
export function validateAnnotationReviewDraft(draft:AnnotationReviewDraft,bank:CanonicalDiagnosticBankArtifact){
  const {checksum:expected,...content}=draft;
  if(draft.status!=="draft_requires_review"||checksum(content)!==expected)throw Error("Invalid annotation review draft");
  const entries=new Map(bank.items.map(item=>[item.itemKey,item]));
  const seen=new Set<string>();
  for(const row of [...draft.annotations,...draft.holds]){
    if(seen.has(row.itemKey))throw Error(`Duplicate annotation decision: ${row.itemKey}`);
    seen.add(row.itemKey);
    const entry=entries.get(row.itemKey);
    if(!entry||checksum(entry)!==row.itemChecksum)throw Error(`Stale annotation decision: ${row.itemKey}`);
    if(!row.reason.trim())throw Error("Annotation decision requires a reason");
  }
  for(const hold of draft.holds){
    if(hold.repairSourceChecksum&&entries.get(hold.itemKey)?.reviewStatus!=="needs_human_review")throw Error("Repaired held item requires fresh review");
  }
  return draft.annotations;
}
