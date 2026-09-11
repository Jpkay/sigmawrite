import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import {generatedItemSchema,type GeneratedItem} from "@/lib/ai/item-generation/schemas";

export type DraftItemRepair={itemKey:string;sourceChecksum:string;replacement:GeneratedItem;reason:string};

export function repairDraftItems(bank:CanonicalDiagnosticBankArtifact,repairs:readonly DraftItemRepair[]){
 const result=structuredClone(bank),seen=new Set<string>();
 for(const repair of repairs){
  if(seen.has(repair.itemKey))throw Error("Duplicate item repair");
  seen.add(repair.itemKey);
  const entry=result.items.find(i=>i.itemKey===repair.itemKey);
  if(!entry||checksum(entry)!==repair.sourceChecksum)throw Error(`Stale item repair: ${repair.itemKey}`);
  const replacement=generatedItemSchema.parse(repair.replacement);
  if(!repair.reason.trim())throw Error("Item repair requires a reason");
  if(replacement.nodeKey!==entry.item.nodeKey||replacement.strand!==entry.item.strand||replacement.modality!==entry.item.modality)throw Error("Item repair cannot silently change the evidence target");
  entry.item=replacement;
  entry.reviewStatus="needs_human_review";
  delete entry.review;
  entry.qcGates={...entry.qcGates,verdict:"needs_human_review",gate0_computed:{applied:false},gate3_ensemble:{agrees:false,agreement:0},gate1_schema:true,gate1_invariants:{ok:false,violations:["Repaired content requires gates to run again"]},gate2_answer_key:{ok:false}};
 }
 delete result.manifest;
 return result;
}

export type DraftAnswerCorrection = {
  itemKey: string;
  sourceChecksum: string;
  correctAnswer: string;
  reason: string;
};

/** Corrections produce new review candidates; historical approval is never inherited. */
export function correctDraftAnswers(bank: CanonicalDiagnosticBankArtifact, corrections: readonly DraftAnswerCorrection[]) {
  const result = structuredClone(bank);
  const seen = new Set<string>();
  for (const correction of corrections) {
    if (seen.has(correction.itemKey)) throw Error("Duplicate answer correction");
    seen.add(correction.itemKey);
    const entry = result.items.find(item => item.itemKey === correction.itemKey);
    if (!entry || checksum(entry) !== correction.sourceChecksum) throw Error(`Stale answer correction: ${correction.itemKey}`);
    if (!correction.correctAnswer.trim() || !correction.reason.trim()) throw Error("Correction requires an answer and reason");
    if (entry.item.validatorType !== "exact" || entry.item.responseType === "mcq") throw Error("Answer correction requires an exact free-response item");
    entry.item.correctAnswer = correction.correctAnswer;
    entry.item.acceptableAnswers = [];
    entry.reviewStatus = "needs_human_review";
    delete entry.review;
    entry.qcGates = {
      ...entry.qcGates,
      verdict: "needs_human_review",
      gate0_computed: {applied: false},
      gate3_ensemble: {agrees: false, agreement: 0},
    };
  }
  // The caller must revalidate the changed content before assembling a release.
  delete result.manifest;
  return result;
}
