import {afterEach,beforeEach,expect,it,vi} from "vitest";
const {load}=vi.hoisted(()=>({load:vi.fn()}));
vi.mock("@/lib/actions/student",()=>({loadStudentState:load}));
vi.mock("react",()=>({useSyncExternalStore:(subscribe:(callback:()=>void)=>unknown,get:()=>unknown)=>{subscribe(()=>{});return get();}}));
beforeEach(()=>{
 vi.resetModules();load.mockReset();
 vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://example.supabase.co");vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY","test-key");
 vi.stubGlobal("window",{localStorage:{getItem:()=>null,setItem:vi.fn(),removeItem:vi.fn()}});
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it("keeps a failed fetch unhydrated and retries to recover saved completion",async()=>{
 load.mockRejectedValueOnce(new Error("offline"));
 const store=await import("./student-store");
 store.useStudentState("student-a");
 await vi.waitFor(()=>expect(store.getStudentState().hydrationError).toBe(true));
 expect(store.getStudentState().hydrated).toBe(false);
 load.mockResolvedValueOnce({onboarded:true,granularDiagnosticReady:true,grade:8});
 await store.retryStudentHydration();
 expect(store.getStudentState()).toMatchObject({hydrated:true,hydrationError:false,onboarded:true,granularDiagnosticReady:true,grade:8});
 expect(load).toHaveBeenCalledTimes(2);
});
it("ignores a late response from the previous signed-in student",async()=>{
 let finish!:(data:unknown)=>void;
 load.mockReturnValueOnce(new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce({onboarded:true,grade:6});
 const store=await import("./student-store");store.useStudentState("student-a");
 await vi.waitFor(()=>expect(load).toHaveBeenCalledTimes(1));
 store.useStudentState("student-b");
 await vi.waitFor(()=>expect(store.getStudentState().grade).toBe(6));
 finish({onboarded:true,grade:12});await new Promise(resolve=>setTimeout(resolve,0));
 expect(store.getStudentState().grade).toBe(6);
});
