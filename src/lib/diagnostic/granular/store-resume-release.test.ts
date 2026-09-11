import {expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {AssessmentBundle,StoredSession} from "./service";
vi.mock("server-only",()=>({}));
vi.mock("./material-history",()=>({withKnownMaterialHistory:async(_store:unknown,session:StoredSession)=>session}));
import {SupabaseAssessmentStore} from "./store";
it("resumes the student's published pinned release and skips withdrawn versions",async()=>{
 const eq=vi.fn();const query={select:()=>query,eq:(...args:unknown[])=>{eq(...args);return query;},order:()=>query,limit:async()=>({data:[{id:"withdrawn-session",release_id:"withdrawn"},{id:"existing-session",release_id:"old-published"}],error:null})};
 const from=vi.fn(()=>query);
 const store=new SupabaseAssessmentStore({from} as unknown as SupabaseClient);
 const bundle={bankId:"old-bank"} as AssessmentBundle;
 const session={id:"existing-session",studentId:"student",releaseId:"old-published"} as StoredSession;
 const release=vi.spyOn(store,"release").mockResolvedValueOnce(null).mockResolvedValueOnce(bundle);
 const load=vi.spyOn(store,"load").mockResolvedValue(session);
 expect(await store.latestSession("student")).toEqual({bundle,session});
 expect(from).toHaveBeenCalledWith("granular_active_assessment_sessions");
 expect(eq).toHaveBeenCalledWith("student_id","student");
 expect(release).toHaveBeenNthCalledWith(2,"old-published");
 expect(load).toHaveBeenCalledExactlyOnceWith("student","existing-session");
});
it("does not turn a failed session lookup into a new assessment",async()=>{
 const query={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:null,error:{message:"database unavailable"}})};
 const store=new SupabaseAssessmentStore({from:()=>query} as unknown as SupabaseClient);
 await expect(store.latestSession("student")).rejects.toThrow("database unavailable");
});
