import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {AssessmentBundle} from "./service";
vi.mock("server-only",()=>({}));
const {preflight,load,verify}=vi.hoisted(()=>({preflight:vi.fn(),load:vi.fn(),verify:vi.fn().mockResolvedValue({verifiedItems:1})}));
vi.mock("./publication-contract",()=>({prepareParallelPublication:preflight}));
vi.mock("./relational-bank",()=>({verifyRelationalBank:verify}));
vi.mock("./store",()=>({SupabaseAssessmentStore:class{release=load;}}));
import {publishParallelAssessment} from "./publisher";
const id="11111111-1111-4111-8111-111111111111";
const bundle={taxonomyId:id,bankId:id} as AssessmentBundle;
it("never writes a failing preflight",async()=>{
 preflight.mockReturnValue({ready:false,instructionGapSkillIds:["missing"],freshCheckGapSkillIds:[]});
 const rpc=vi.fn();
 await expect(publishParallelAssessment({rpc} as unknown as SupabaseClient,{releaseKey:"test",publisherProfileId:id,bundle})).rejects.toThrow(/Publication incomplete/);
 expect(rpc).not.toHaveBeenCalled();
});
it("publishes the exact validated bundle and verifies it through the normal loader",async()=>{
 const proof={ready:true,bundleChecksum:"checksum",instructionGapSkillIds:[],freshCheckGapSkillIds:[]};
 preflight.mockReturnValue(proof);load.mockResolvedValue(bundle);
 const rpc=vi.fn().mockResolvedValue({data:id,error:null});
 expect(await publishParallelAssessment({rpc} as unknown as SupabaseClient,{releaseKey:"test",publisherProfileId:id,bundle})).toEqual({releaseId:id,releaseKey:"test",bundleChecksum:"checksum"});
 expect(rpc).toHaveBeenCalledWith("publish_granular_parallel_release",{p_release_key:"test",p_bundle:bundle,p_bundle_checksum:"checksum",p_preflight:proof,p_publisher:id});
 expect(load).toHaveBeenCalledWith(id);
});
it("does not report success when the publication cannot be loaded",async()=>{
 preflight.mockReturnValue({ready:true,bundleChecksum:"checksum"});load.mockResolvedValue(null);
 const rpc=vi.fn().mockResolvedValue({data:id,error:null});
 await expect(publishParallelAssessment({rpc} as unknown as SupabaseClient,{releaseKey:"test",publisherProfileId:id,bundle})).rejects.toThrow(/was published but verification failed/);
});

it("does not publish when imported questions fail comparison",async()=>{
 preflight.mockReturnValue({ready:true,bundleChecksum:"checksum"});
 verify.mockRejectedValueOnce(new Error("Relational question differs"));
 const rpc=vi.fn();
 await expect(publishParallelAssessment({rpc} as unknown as SupabaseClient,{releaseKey:"test",publisherProfileId:id,bundle})).rejects.toThrow(/Relational question differs/);
 expect(rpc).not.toHaveBeenCalled();
});
