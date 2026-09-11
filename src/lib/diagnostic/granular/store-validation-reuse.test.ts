import {beforeEach,expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {checksum} from '@/lib/taxonomy/validate';
vi.mock('server-only',()=>({}));
const inspect=vi.hoisted(()=>vi.fn());
vi.mock('./question-pools',()=>({inspectQuestionPools:()=>({ok:true})}));
vi.mock('./release-bank',()=>({inspectReleaseBank:inspect}));
import {SupabaseAssessmentStore} from './store';
beforeEach(()=>{inspect.mockReset();inspect.mockReturnValue(true);});
function fixture(){
 const bundle={taxonomyId:'t',bankId:'b',assessment:{skills:[],probes:[],taxonomyChecksum:'tc',bankChecksum:'bc'}};
 const row={id:'r',status:'published',taxonomy_release_id:'t',bank_release_id:'b',bundle,content_checksum:checksum(bundle)};
 const rows:Record<string,Record<string,unknown>>={granular_assessment_releases:row,taxonomy_releases:{id:'t',status:'published',manifest_checksum:'tc'},diagnostic_item_bank_releases:{id:'b',status:'published',taxonomy_release_id:'t',manifest_checksum:'bc'}};
 const reads:string[]=[];
 const db={from:(table:string)=>{const filters:Array<[string,unknown]>=[];const q={select:()=>q,eq:(key:string,value:unknown)=>{filters.push([key,value]);return q;},maybeSingle:async()=>{reads.push(table);return {data:filters.every(([key,value])=>rows[table]?.[key]===value)?structuredClone(rows[table]):null,error:null};}};return q;}} as unknown as SupabaseClient;
 return {db,store:new SupabaseAssessmentStore(db),row,rows,reads};
}
it('reuses deterministic validation but rereads content and parents on every call',async()=>{
 const f=fixture();await f.store.release('r');await f.store.release('r');
 expect(inspect).toHaveBeenCalledTimes(1);
 for(const table of Object.keys(f.rows))expect(f.reads.filter(t=>t===table)).toHaveLength(2);
 await new SupabaseAssessmentStore(f.db).release('r');expect(inspect).toHaveBeenCalledTimes(2);
});
it('checks content checksum even after validation was reused',async()=>{
 const f=fixture();await f.store.release('r');f.row.bundle.bankId='corrupt';
 await expect(f.store.release('r')).rejects.toThrow('checksum mismatch');
});
it('validates again when the content checksum changes and never memoizes rejection',async()=>{
 const f=fixture();await f.store.release('r');
 Object.assign(f.row.bundle,{additionalMetadata:'changed'});f.row.content_checksum=checksum(f.row.bundle);
 inspect.mockReturnValue(false);expect(await f.store.release('r')).toBeNull();
 inspect.mockReturnValue(true);expect(await f.store.release('r')).not.toBeNull();expect(inspect).toHaveBeenCalledTimes(3);
});
it('does not return a previously validated but withdrawn release',async()=>{
 const f=fixture();await f.store.release('r');f.row.status='withdrawn';
 expect(await f.store.release('r')).toBeNull();
});
