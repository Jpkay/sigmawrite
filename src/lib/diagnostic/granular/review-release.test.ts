import {expect, it, vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));
import {checksum} from "@/lib/taxonomy/validate";
import {loadPublishedReviewRelease} from "./review-release";

function fixture() {
 const bankChecksum=`sha256:${"a".repeat(64)}`,taxonomyChecksum=`sha256:${"b".repeat(64)}`;
 const policy={mode:"parallel_review",authorization:"product-owner-request-2026-09-11",reviewOwner:"product_owner",bankChecksum,questionChecksums:{}};
 const bundle={taxonomyId:"taxonomy",bankId:"bank",assessment:{bankChecksum,taxonomyChecksum,reviewPolicy:policy},bank:{}};
 const contentChecksum=checksum(bundle);
 const tables:Record<string,Record<string,unknown>>={
  granular_assessment_releases:{id:"release",status:"published",bundle,content_checksum:contentChecksum,taxonomy_release_id:"taxonomy",bank_release_id:"bank"},
  taxonomy_releases:{id:"taxonomy",status:"published",manifest_checksum:taxonomyChecksum},
  diagnostic_item_bank_releases:{id:"bank",status:"published",taxonomy_release_id:"taxonomy",manifest_checksum:bankChecksum},
  granular_bank_publication_permissions:{bank_release_id:"bank",bundle_checksum:contentChecksum,bank_checksum:bankChecksum,taxonomy_checksum:taxonomyChecksum,
   preflight:{version:"french-granular-parallel-publication-v1",ready:true,bundleChecksum:contentChecksum,bankChecksum,taxonomyChecksum,policyChecksum:checksum(policy)}},
 };
 const from=vi.fn((table:string)=>{
  const filters:Array<[string,unknown]>=[];
  const query={select:()=>query,eq:(key:string,value:unknown)=>{filters.push([key,value]);return query;},
   maybeSingle:async()=>({data:tables[table]&&filters.every(([key,value])=>tables[table][key]===value)?tables[table]:null,error:null})};
  return query;
 });
 return {bundle,tables,db:{from} as unknown as SupabaseClient};
}

it("loads an immutable historical snapshot using its original publication permission",async()=>{
 const f=fixture();
 expect(await loadPublishedReviewRelease(f.db,"release")).toEqual(f.bundle);
});

it.each(["granular_assessment_releases","taxonomy_releases","diagnostic_item_bank_releases"])("does not expose withdrawn content from %s",async table=>{
 const f=fixture();f.tables[table].status="withdrawn";
 expect(await loadPublishedReviewRelease(f.db,"release")).toBeNull();
});

it("rejects modified content even if the release is still marked published",async()=>{
 const f=fixture();f.bundle.bank={changed:true};
 expect(await loadPublishedReviewRelease(f.db,"release")).toBeNull();
});

it.each(["ready","bundleChecksum","bankChecksum","taxonomyChecksum","policyChecksum"])("requires the original approval's %s to match",async field=>{
 const f=fixture();const approval=f.tables.granular_bank_publication_permissions.preflight as Record<string,unknown>;
 approval[field]=field==="ready"?false:"sha256:invalid";
 expect(await loadPublishedReviewRelease(f.db,"release")).toBeNull();
});

it("rejects missing publication permission and changed parent checksums",async()=>{
 const f=fixture();delete f.tables.granular_bank_publication_permissions;
 expect(await loadPublishedReviewRelease(f.db,"release")).toBeNull();
 const g=fixture();g.tables.taxonomy_releases.manifest_checksum="sha256:changed";
 expect(await loadPublishedReviewRelease(g.db,"release")).toBeNull();
});

it("propagates database failures rather than returning an unchecked release",async()=>{
 const db={from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null,error:{message:"database unavailable"}})};return q;}} as unknown as SupabaseClient;
 await expect(loadPublishedReviewRelease(db,"release")).rejects.toThrow("database unavailable");
});
