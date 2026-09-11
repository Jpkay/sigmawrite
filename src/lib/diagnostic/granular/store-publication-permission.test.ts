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
import {ReleaseContentCache} from "./release-content-cache";
function fixture(cached=false){
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
 const cache=new ReleaseContentCache();
 const selections:string[]=[];
 const db={from:(table:string)=>{
  const filters:Array<[string,unknown]>=[];
  const query={select:(columns:string)=>{selections.push(`${table}:${columns}`);return query;},eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},maybeSingle:async()=>({data:rows[table]&&filters.every(([key,value])=>rows[table][key]===value)?rows[table]:null,error:errors[table]?{message:errors[table]}:null})};return query;
 }};
 return {store:new SupabaseAssessmentStore(db as unknown as SupabaseClient,cached?{cache,namespace:"test-project"}:undefined),bundle,proof,rows,errors,selections,cache,db:db as unknown as SupabaseClient};
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
it("withholds content when full preflight rejects and retries validation on the next request",async()=>{
 const f=fixture();
 prepare.mockImplementationOnce(()=>{throw Error("Invalid approved graph or canonical bank binding");});
 expect(await f.store.release("release")).toBeNull();
 expect(await f.store.release("release")).toEqual(f.bundle);
});

it("reuses immutable content while checking current release, parents and permission",async()=>{
 const f=fixture(true);expect(await f.store.release("release")).toEqual(f.bundle);
 const next=new SupabaseAssessmentStore(f.db,{cache:f.cache,namespace:"test-project"});
 expect(await next.release("release")).toEqual(f.bundle);
 expect(f.selections.filter(s=>s.startsWith("granular_assessment_releases:bundle,"))).toHaveLength(1);
 expect(f.selections.filter(s=>s.startsWith("granular_bank_publication_permissions:"))).toHaveLength(2);
 f.rows.diagnostic_item_bank_releases.status="withdrawn";expect(await f.store.release("release")).toBeNull();
 f.rows.diagnostic_item_bank_releases.status="published";delete f.rows.granular_bank_publication_permissions;expect(await f.store.release("release")).toBeNull();
 f.rows.granular_assessment_releases.status="withdrawn";expect(await f.store.release("release")).toBeNull();
});
