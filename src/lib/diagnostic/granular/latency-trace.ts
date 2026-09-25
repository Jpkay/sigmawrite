import {AsyncLocalStorage} from "node:async_hooks";

/**
 * Per-request timing for diagnostic server actions. Spans record wall-clock
 * durations, so concurrent spans overlap and nested store calls (a store
 * method calling another) appear as separate entries. Outside a trace,
 * span() only runs the work.
 */
type Span={name:string;ms:number};
type Trace={command:string;startedAt:number;spans:Span[]};
const storage=new AsyncLocalStorage<Trace>();
const enabled=()=>process.env.GRANULAR_LATENCY_LOG!=="off";

export async function span<T>(name:string,work:()=>Promise<T>|T):Promise<T>{
 const trace=storage.getStore();
 if(!trace)return work();
 const started=performance.now();
 try{return await work();}
 finally{trace.spans.push({name,ms:Math.round(performance.now()-started)});}
}

export function spanSync<T>(name:string,work:()=>T):T{
 const trace=storage.getStore();
 if(!trace)return work();
 const started=performance.now();
 try{return work();}
 finally{trace.spans.push({name,ms:Math.round(performance.now()-started)});}
}

export async function traceCommand<T>(command:string,work:()=>Promise<T>):Promise<T>{
 if(!enabled())return work();
 const trace:Trace={command,startedAt:performance.now(),spans:[]};
 let outcome="ok";
 try{return await storage.run(trace,work);}
 catch(error){outcome="error";throw error;}
 finally{
  const totalMs=Math.round(performance.now()-trace.startedAt);
  // Background pulses fire every 15 s; only slow ones are worth a log line.
  if(!command.endsWith(":pulse")||totalMs>=1000)console.info(JSON.stringify(latencyRecord(trace,totalMs,outcome)));
 }
}

export function latencyRecord(trace:Trace,totalMs:number,outcome:string){
 const byName:Record<string,{count:number;ms:number}>={};
 for(const {name,ms} of trace.spans){
  const entry=byName[name]??={count:0,ms:0};
  entry.count++;entry.ms+=ms;
 }
 return {event:"granular_latency",command:trace.command,outcome,totalMs,spans:byName};
}

/** Times every async method of a store without changing its behaviour. */
export function timedStore<T extends object>(store:T):T{
 return new Proxy(store,{
  get(target,property,receiver){
   const value=Reflect.get(target,property,receiver);
   if(typeof value!=="function"||typeof property!=="string")return value;
   return (...args:unknown[])=>{
    const trace=storage.getStore(),started=performance.now();
    const result=value.apply(receiver,args);
    if(!trace||!(result instanceof Promise))return result;
    const record=()=>{trace.spans.push({name:`store.${property}`,ms:Math.round(performance.now()-started)});};
    return result.finally(record);
   };
  },
 });
}
