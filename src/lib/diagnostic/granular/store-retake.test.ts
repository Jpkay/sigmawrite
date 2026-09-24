import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {AssessmentBundle,StoredSession} from "./service";
import {checksum} from "@/lib/taxonomy/validate";
vi.mock("server-only",()=>({}));
vi.mock("./material-history",()=>({withKnownMaterialHistory:async(_store:unknown,session:StoredSession)=>session}));
import {SupabaseAssessmentStore} from "./store";

const bundle={taxonomyId:"taxonomy",bankId:"bank",assessment:{taxonomyChecksum:"taxonomy-checksum",bankChecksum:"bank-checksum",skills:[]}} as unknown as AssessmentBundle;
it("creates a fresh sitting atomically and carries all earlier item IDs without copying results",async()=>{
 const rpc=vi.fn().mockResolvedValue({data:"new-session",error:null});
 const store=new SupabaseAssessmentStore({rpc} as unknown as SupabaseClient);
 const old={id:"old-session",studentId:"student",releaseId:"old-release",state:{revision:12,
  priorDiagnosticItemIds:["first-1","first-2"],observations:[{itemId:"first-2"},{itemId:"second-1"}],phase:"learning"}} as StoredSession;
 const fresh={id:"new-session",studentId:"student",releaseId:"current-release",state:{phase:"assessing",revision:0}} as StoredSession;
 const load=vi.spyOn(store,"load").mockResolvedValueOnce(old).mockResolvedValueOnce(fresh);
 vi.spyOn(store,"release").mockResolvedValue(bundle);
 expect(await store.createRetake("student","old-session","current-release")).toEqual(fresh);
 expect(rpc).toHaveBeenCalledWith("create_granular_assessment_retake",expect.objectContaining({
  p_student_id:"student",p_source_session_id:"old-session",p_source_revision:12,
  p_target_release_id:"current-release",p_target_bundle_checksum:checksum(bundle),
  p_target_state:expect.objectContaining({phase:"assessing",revision:0,paused:true,
   observations:[],priorDiagnosticItemIds:["first-1","first-2","second-1"]}),
 }));
 expect(load).toHaveBeenNthCalledWith(2,"student","new-session");
});
it("never creates a retake without an owned source and propagates revision conflicts",async()=>{
 const rpc=vi.fn();const store=new SupabaseAssessmentStore({rpc} as unknown as SupabaseClient);
 vi.spyOn(store,"load").mockResolvedValue(null);
 await expect(store.createRetake("student","other-student-session","release")).rejects.toThrow("predecessor unavailable");
 expect(rpc).not.toHaveBeenCalled();
 vi.mocked(store.load).mockResolvedValueOnce({id:"old",studentId:"student",releaseId:"old",state:{revision:4,observations:[]}} as unknown as StoredSession);
 vi.spyOn(store,"release").mockResolvedValue(bundle);
 rpc.mockResolvedValue({data:null,error:{message:"Diagnostic predecessor revision changed"}});
 await expect(store.createRetake("student","old","release")).rejects.toThrow("revision changed");
});
it("lists completed sittings including historical chains with their actual release keys",async()=>{
 const rows=[{id:"latest",created_at:"2026-09-24T00:00:00Z",granular_assessment_releases:{release_key:"french-v45"}},
  {id:"earlier",created_at:"2026-09-23T00:00:00Z",granular_assessment_releases:[{release_key:"french-v43"}]}];
 const query={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:rows,error:null})};
 const store=new SupabaseAssessmentStore({from:()=>query} as unknown as SupabaseClient);
 expect(await store.completedSessions("student")).toEqual([
  {sessionId:"latest",createdAt:rows[0].created_at,releaseKey:"french-v45"},
  {sessionId:"earlier",createdAt:rows[1].created_at,releaseKey:"french-v43"},
 ]);
});
it("uses the atomic starter to resume an existing current-release sitting under concurrent requests",async()=>{
 const rpc=vi.fn().mockResolvedValue({data:"existing",error:null});
 const store=new SupabaseAssessmentStore({rpc} as unknown as SupabaseClient);
 vi.spyOn(store,"publishedReleaseId").mockResolvedValue("release");
 vi.spyOn(store,"release").mockResolvedValue(bundle);
 const existing={id:"existing",studentId:"student",releaseId:"release",state:{revision:7}} as StoredSession;
 vi.spyOn(store,"load").mockResolvedValue(existing);
 expect(await store.start("student","current-key")).toEqual({session:existing,bundle});
 expect(rpc).toHaveBeenCalledWith("start_granular_assessment_session",expect.objectContaining({
  p_student_id:"student",p_target_release_id:"release",p_target_bundle_checksum:checksum(bundle),
  p_target_state:expect.objectContaining({phase:"assessing",revision:0,observations:[]}),
 }));
});
