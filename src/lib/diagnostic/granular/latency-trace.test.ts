import {afterEach,describe,expect,it,vi} from "vitest";
import {span,spanSync,timedStore,traceCommand} from "./latency-trace";

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const logged=(spy:ReturnType<typeof vi.spyOn>)=>JSON.parse(String(spy.mock.calls[0]![0]));

describe("latency trace",()=>{
 it("logs one aggregated record per traced command",async()=>{
  const log=vi.spyOn(console,"info").mockImplementation(()=>{});
  class Store{calls=0;async load(){this.calls++;return this.inner();}async inner(){return "row";}count(){return this.calls;}}
  const store=timedStore(new Store());
  const result=await traceCommand("granular:diagnostic:answer",async()=>{
   await span("auth.role",async()=>{});
   spanSync("select",()=>1);
   expect(store.count()).toBe(0);
   return store.load();
  });
  expect(result).toBe("row");
  expect(store.count()).toBe(1);
  const record=logged(log);
  expect(record).toMatchObject({event:"granular_latency",command:"granular:diagnostic:answer",outcome:"ok"});
  expect(record.spans["store.load"].count).toBe(1);
  expect(record.spans["store.inner"].count).toBe(1);
  expect(Object.keys(record.spans)).toEqual(expect.arrayContaining(["auth.role","select"]));
 });

 it("records failures and rethrows",async()=>{
  const log=vi.spyOn(console,"info").mockImplementation(()=>{});
  await expect(traceCommand("granular:start",async()=>{throw Error("boom");})).rejects.toThrow("boom");
  expect(logged(log).outcome).toBe("error");
 });

 it("skips fast background pulses and runs spans untraced outside a command",async()=>{
  const log=vi.spyOn(console,"info").mockImplementation(()=>{});
  await traceCommand("granular:diagnostic:pulse",async()=>{});
  expect(await span("outside",async()=>7)).toBe(7);
  expect(log).not.toHaveBeenCalled();
 });

 it("can be switched off",async()=>{
  vi.stubEnv("GRANULAR_LATENCY_LOG","off");
  const log=vi.spyOn(console,"info").mockImplementation(()=>{});
  await traceCommand("granular:start",async()=>{});
  expect(log).not.toHaveBeenCalled();
 });
});
