import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
vi.mock("server-only",()=>({}));
// Only isolate content preflight; this file checks fresh permission transport.
vi.mock("./question-pools",()=>({inspectQuestionPools:()=>({ok:true,issues:[]})}));
vi.mock("./release-bank",()=>({inspectReleaseBank:()=>true}));
vi.mock("./teaching-content",()=>({validatePublishedTeaching:()=>{}}));
const prepare=vi.hoisted(()=>vi.fn());
vi.mock("./publication-contract",()=>({prepareParallelPublication:prepare}));
import {SupabaseAssessmentStore} from "./store";
function fixture(){
 const bundle={taxonomyId:"taxonomy",bankId:"bank",assessment:{skills:[],probes:[],taxonomyChecksum:"t",bankChecksum:"b",reviewPolicy:{mode:"parallel_review"}}};
 const proof={ready:true,bankChecksum:"b",taxonomyChecksum:"t",bundleChecksum:checksum(bundle),policyChecksum:"policy",scopeChecksum:"scope"};
 prepare.mockReturnValue(proof);
 const rows:Record<string,Record<string,unknown>>={
  granular_assessment_releases:{id:"release",status:"published",taxonomy_release_id:"taxonomy",bank_release_id:"bank",bundle,content_checksum:checksum(bundle)},
  taxonomy_releases:{id:"taxonomy",status:"published",manifest_checksum:"t"},
  diagnostic_item_bank_releases:{id:"bank",taxonomy_release_id:"taxonomy",status:"published",manifest_checksum:"b"},
  granular_bank_publication_permissions:{bank_release_id:"bank",bundle_checksum:checksum(bundle),bank_checksum:"b",taxonomy_checksum:"t",preflight:proof},
 };
 const errors:Record<string,string>={};
 const db={from:(table:string)=>{
  const filters:Array<[string,unknown]>=[];
  const query={select:()=>query,eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},maybeSingle:async()=>({data:rows[table]&&filters.every(([key,value])=>rows[table][key]===value)?rows[table]:null,error:errors[table]?{message:errors[table]}:null})};return query;
 }};
 return {store:new SupabaseAssessmentStore(db as unknown as SupabaseClient),bundle,proof,rows,errors};
}
it("requires the exact fresh permission, including after a successful load",async()=>{
 const f=fixture();expect(await f.store.release("release")).toEqual(f.bundle);
 delete f.rows.granular_bank_publication_permissions;
 expect(await f.store.release("release")).toBeNull();
});
it("rejects stale preflight, another bundle, and newly failing readiness",async()=>{
 for(const change of ["report","bundle","readiness"]){
  const f=fixture();
  if(change==="report")f.rows.granular_bank_publication_permissions.preflight={...f.proof,policyChecksum:"changed"};
  if(change==="bundle")f.rows.granular_bank_publication_permissions.bundle_checksum="another-bundle";
  if(change==="readiness")prepare.mockReturnValue({...f.proof,ready:false});
  expect(await f.store.release("release")).toBeNull();
 }
});
it("surfaces a failed permission read instead of serving content",async()=>{
 const f=fixture();f.errors.granular_bank_publication_permissions="permission query failed";
 await expect(f.store.release("release")).rejects.toThrow("permission query failed");
});
