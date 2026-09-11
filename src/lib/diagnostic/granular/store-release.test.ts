import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import {checksum} from "@/lib/taxonomy/validate";
vi.mock("server-only",()=>({}));
import {SupabaseAssessmentStore} from "./store";

function storeFor(bundle:unknown,overrides:Record<string,unknown>={}){
 const row={bundle,content_checksum:checksum(bundle),taxonomy_release_id:"taxonomy",bank_release_id:"bank",...overrides};
 const assessment=(bundle as {assessment?:{taxonomyChecksum?:string;bankChecksum?:string}}|null)?.assessment;
 return new SupabaseAssessmentStore({from:(table:string)=>{
  const parent=table==="taxonomy_releases"?{id:"taxonomy",manifest_checksum:assessment?.taxonomyChecksum}:table==="diagnostic_item_bank_releases"?{id:"bank",manifest_checksum:assessment?.bankChecksum}:row;
  const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:parent,error:null})};return query;
 }} as unknown as SupabaseClient);
}
it("refuses the incomplete current candidate even if its envelope says published and ready",async()=>{
 const candidate=JSON.parse(readFileSync("generated/french-v3-assessment-candidate.json","utf8"));
 const bundle={assessment:candidate.assessment,taxonomyId:"taxonomy",bankId:"bank",poolAllocationReady:true};
 expect(await storeFor(bundle).release("release")).toBeNull();
});
it("refuses malformed bundles and mismatched database identities",async()=>{
 expect(await storeFor(null).release("release")).toBeNull();
 expect(await storeFor({taxonomyId:"other",bankId:"bank",assessment:{}}).release("release")).toBeNull();
 expect(await storeFor({taxonomyId:"taxonomy",bankId:"other",assessment:{}}).release("release")).toBeNull();
});
it("detects envelope content changes before interpreting the bundle",async()=>{
 await expect(storeFor({taxonomyId:"taxonomy",bankId:"bank"},{content_checksum:"stale"}).release("release")).rejects.toThrow(/checksum/);
});
