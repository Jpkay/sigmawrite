import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {verifyRelationalBank} from "./relational-bank";
import {z} from "zod";
import type {AssessmentBundle} from "./service";
import {prepareParallelPublication} from "./publication-contract";
import {SupabaseAssessmentStore} from "./store";

/** Trusted operator entry point. Parent content must have been imported and
 * verified against the canonical artifact before calling this publisher. */
export async function publishParallelAssessment(db:SupabaseClient,input:{releaseKey:string;publisherProfileId:string;bundle:AssessmentBundle}){
 const publisherProfileId=z.uuid().parse(input.publisherProfileId);
 const releaseKey=z.string().trim().min(1).max(200).parse(input.releaseKey);
 z.uuid().parse(input.bundle.taxonomyId);z.uuid().parse(input.bundle.bankId);
 const bundle=structuredClone(input.bundle);
 const preflight=prepareParallelPublication(bundle);
 if(!preflight.ready)throw Error(`Publication incomplete: ${preflight.instructionGapSkillIds.length} instruction targets and ${preflight.freshCheckGapSkillIds.length} fresh-check targets missing`);
 await verifyRelationalBank(db,bundle);
 const {data,error}=await db.rpc("publish_granular_parallel_release",{
  p_release_key:releaseKey,p_bundle:bundle,p_bundle_checksum:preflight.bundleChecksum,
  p_preflight:preflight,p_publisher:publisherProfileId,
 });
 if(error)throw Error(error.message);
 const releaseId=z.uuid().parse(data);
 const loaded=await new SupabaseAssessmentStore(db).release(releaseId);
 if(!loaded)throw Error(`Release ${releaseId} was published but verification failed; retry the same release key`);
 const verified=prepareParallelPublication(loaded);
 if(!verified.ready||verified.bundleChecksum!==preflight.bundleChecksum)throw Error("Published assessment differs from the validated bundle");
 return {releaseId,releaseKey,bundleChecksum:verified.bundleChecksum};
}
