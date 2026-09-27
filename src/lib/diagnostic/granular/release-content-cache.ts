import type {AssessmentBundle} from './service';
import type {prepareParallelPublication} from './publication-contract';
export type ValidatedReleaseContent={bundle:AssessmentBundle;preflight:ReturnType<typeof prepareParallelPublication>|null};
function freeze(value:unknown):void{
 if(!value||typeof value!=='object'||Object.isFrozen(value))return;
 for(const child of Object.values(value))freeze(child);
 Object.freeze(value);
}
/** Immutable content only. Callers must recheck release/parent status and exact
 * permission before using a hit. No sessions, identities or permission decisions. */
export class ReleaseContentCache{
 private readonly entries=new Map<string,{content:ValidatedReleaseContent;expires:number;bytes:number}>();
 constructor(private readonly now:()=>number=Date.now,private readonly maxEntries=2,private readonly maxBytes=32*1024*1024,private readonly ttlMs=60000){}
 private prune(){for(const [key,entry] of this.entries)if(entry.expires<=this.now())this.entries.delete(key);}
 get(key:readonly string[]):ValidatedReleaseContent|undefined{
  this.prune();const id=JSON.stringify(key),entry=this.entries.get(id);if(!entry)return;
  this.entries.delete(id);this.entries.set(id,entry);return entry.content;
 }
 set(key:readonly string[],content:ValidatedReleaseContent):void{
  this.prune();const id=JSON.stringify(key);this.entries.delete(id);
  const bytes=Buffer.byteLength(JSON.stringify(content),'utf8');
  if(bytes>this.maxBytes||this.maxEntries<1||this.ttlMs<=0)return;
  while(this.entries.size>=this.maxEntries||[...this.entries.values()].reduce((n,e)=>n+e.bytes,0)+bytes>this.maxBytes){
   const oldest=this.entries.keys().next().value;if(oldest===undefined)break;this.entries.delete(oldest);
  }
  freeze(content);this.entries.set(id,{content,bytes,expires:this.now()+this.ttlMs});
 }
}
// Bounded across all projects handled by this process; namespace is part of key.
export const sharedReleaseContentCache=new ReleaseContentCache();
