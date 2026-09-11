import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
vi.mock("server-only",()=>({}));
// Isolate live availability from the independently tested bundle-content gates.
vi.mock("./question-pools",()=>({inspectQuestionPools:()=>({ok:true,issues:[]})}));
vi.mock("./release-bank",()=>({inspectReleaseBank:()=>true}));
import {SupabaseAssessmentStore} from "./store";
function fixture(){
 const bundle={taxonomyId:"taxonomy",bankId:"bank",assessment:{skills:[],probes:[],taxonomyChecksum:"taxonomy-version",bankChecksum:"bank-version"}};
 const rows:Record<string,Record<string,unknown>>={
  granular_assessment_releases:{id:"release",status:"published",taxonomy_release_id:"taxonomy",bank_release_id:"bank",bundle,content_checksum:checksum(bundle)},
  taxonomy_releases:{id:"taxonomy",status:"published",manifest_checksum:"taxonomy-version"},
  diagnostic_item_bank_releases:{id:"bank",taxonomy_release_id:"taxonomy",status:"published",manifest_checksum:"bank-version"},
 };
 const errors:Record<string,string>={};
 const db={from:(table:string)=>{
  const filters:Array<[string,unknown]>=[];
  const query={select:()=>query,eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},maybeSingle:async()=>({
   data:rows[table]&&filters.every(([key,value])=>rows[table][key]===value)?rows[table]:null,
   error:errors[table]?{message:errors[table]}:null,
  })};return query;
 }};
 return {store:new SupabaseAssessmentStore(db as unknown as SupabaseClient),rows,errors,bundle};
}
it("rechecks parent publication on every load, including after an earlier successful read",async()=>{
 for(const table of ["taxonomy_releases","diagnostic_item_bank_releases"]){
  const f=fixture();expect(await f.store.release("release")).toEqual(f.bundle);
  f.rows[table].status="withdrawn";
  expect(await f.store.release("release")).toBeNull();
 }
});
it("rejects missing parents and a bank bound to another taxonomy",async()=>{
 const absent=fixture();delete absent.rows.taxonomy_releases;
 expect(await absent.store.release("release")).toBeNull();
 const wrong=fixture();wrong.rows.diagnostic_item_bank_releases.taxonomy_release_id="another-taxonomy";
 expect(await wrong.store.release("release")).toBeNull();
});
it("surfaces failed availability queries instead of serving a cached bundle",async()=>{
 const f=fixture();f.errors.taxonomy_releases="parent query failed";
 await expect(f.store.release("release")).rejects.toThrow("parent query failed");
});

it("requires the exact published parent content versions, not merely published IDs",async()=>{
 for(const table of ["taxonomy_releases","diagnostic_item_bank_releases"]){
  const f=fixture();expect(await f.store.release("release")).toEqual(f.bundle);
  f.rows[table].manifest_checksum="other-version";
  expect(await f.store.release("release")).toBeNull();
  delete f.rows[table].manifest_checksum;
  expect(await f.store.release("release")).toBeNull();
 }
});
