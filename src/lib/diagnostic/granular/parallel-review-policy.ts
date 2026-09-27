import {z} from "zod";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
const digest=z.string().regex(/^sha256:[a-f0-9]{64}$/);
const schema=z.object({
 mode:z.literal("parallel_review"),
 authorization:z.literal("product-owner-request-2026-09-11"),
 reviewOwner:z.literal("product_owner"),
 bankChecksum:digest,
 questionChecksums:z.record(z.string().min(1),digest),
 teachingChecksums:z.record(z.string().min(1),digest).optional(),
}).strict();
export type ParallelReviewPolicy=z.infer<typeof schema>;
export const parseParallelReviewPolicy=(value:unknown)=>schema.parse(value);

/** Product owner explicitly authorized student use while personally reviewing.
 * This permits selected versions; it does not rewrite human-review provenance,
 * change approved graph evidence, or bypass canonical structural/answer gates. */
export function assessmentQuestionIds(bank:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate,policy?:ParallelReviewPolicy):string[]{
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length)throw Error("Invalid assessment question bank");
 if(bank.manifest&&bank.manifest.checksum!==validation.manifest.checksum)throw Error("Stale assessment bank manifest");
 if(policy===undefined)return validation.eligibleItemKeys;
 const parsed=schema.parse(policy);
 if(parsed.bankChecksum!==validation.manifest.checksum)throw Error("Parallel review policy belongs to another bank version");
 const entries=new Map(bank.items.map(entry=>[entry.itemKey,entry]));
 const ids=new Set(validation.eligibleItemKeys);
 for(const [id,expected] of Object.entries(parsed.questionChecksums)){
  const entry=entries.get(id);
  if(!entry||checksum(entry)!==expected)throw Error(`Stale parallel review question: ${id}`);
  if(entry.reviewStatus!=="needs_human_review"&&entry.reviewStatus!=="human_approved"&&entry.reviewStatus!=="auto_approved")throw Error(`Question cannot be released for review: ${id}`);
  ids.add(id);
 }
 return [...ids];
}
