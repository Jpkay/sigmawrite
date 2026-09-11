import {expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {AssessmentBundle,StoredSession} from './service';
import {checksum} from '@/lib/taxonomy/validate';
vi.mock('server-only',()=>({}));
vi.mock('./learning-successor',()=>({prepareLearningSuccessor:vi.fn(()=>({revision:0,phase:'learning'}))}));
import {prepareLearningSuccessor} from './learning-successor';
import {SupabaseAssessmentStore} from './store';
function fixture(){
 const rpc=vi.fn().mockResolvedValue({data:'successor',error:null});
 const store=new SupabaseAssessmentStore({rpc} as unknown as SupabaseClient);
 const source={id:'source',studentId:'student',releaseId:'old',state:{revision:9}} as StoredSession;
 const successor={id:'successor',studentId:'student',releaseId:'new',state:{revision:0}} as StoredSession;
 const oldBundle={bankId:'old-bank'} as AssessmentBundle,newBundle={bankId:'new-bank'} as AssessmentBundle;
 const load=vi.spyOn(store,'load').mockResolvedValueOnce(source).mockResolvedValueOnce(successor);
 const release=vi.spyOn(store,'release').mockResolvedValueOnce(oldBundle).mockResolvedValueOnce(newBundle);
 return {store,rpc,source,successor,load,release,oldBundle,newBundle};
}
it('validates both live releases and uses the atomic RPC with the persisted revision',async()=>{
 const f=fixture();
 expect(await f.store.createLearningSuccessor('student','source','new')).toEqual(f.successor);
 expect(f.load).toHaveBeenNthCalledWith(1,'student','source');
 expect(f.release.mock.calls).toEqual([['old'],['new']]);
 expect(prepareLearningSuccessor).toHaveBeenCalledWith(f.source,f.oldBundle,f.newBundle);
 expect(f.rpc).toHaveBeenCalledWith('create_granular_learning_successor',{
  p_student_id:'student',p_source_session_id:'source',p_source_revision:9,
  p_target_release_id:'new',p_target_bundle_checksum:checksum(f.newBundle),p_target_state:{revision:0,phase:'learning'},
 });
 expect(f.load).toHaveBeenNthCalledWith(2,'student','successor');
});
it('does not create a successor if ownership or live publication validation fails',async()=>{
 const absent=fixture();absent.load.mockReset().mockResolvedValue(null);
 await expect(absent.store.createLearningSuccessor('other','source','new')).rejects.toThrow('predecessor unavailable');
 expect(absent.rpc).not.toHaveBeenCalled();expect(absent.release).not.toHaveBeenCalled();
 for(const unavailable of [0,1]){
  const f=fixture();f.release.mockReset().mockResolvedValueOnce(unavailable===0?null:f.oldBundle).mockResolvedValueOnce(unavailable===1?null:f.newBundle);
  await expect(f.store.createLearningSuccessor('student','source','new')).rejects.toThrow('release unavailable');
  expect(f.rpc).not.toHaveBeenCalled();
 }
});
it('propagates atomic conflicts without falling back to a new diagnostic',async()=>{
 const f=fixture();f.rpc.mockResolvedValue({data:null,error:{message:'Learning predecessor revision changed'}});
 await expect(f.store.createLearningSuccessor('student','source','new')).rejects.toThrow('revision changed');
 expect(f.rpc).toHaveBeenCalledTimes(1);expect(f.load).toHaveBeenCalledTimes(1);
});
it('offers an upgrade only for idle completed learning on a different compatible release',async()=>{
 const query={select:()=>query,eq:()=>query,maybeSingle:vi.fn().mockResolvedValue({data:{id:'new'},error:null})};
 const store=new SupabaseAssessmentStore({from:()=>query} as unknown as SupabaseClient);
 const release=vi.spyOn(store,'release').mockResolvedValue({bankId:'new'} as AssessmentBundle);
 const source={bankId:'old'} as AssessmentBundle;
 const session={releaseId:'old',state:{phase:'learning',paused:true,completionReason:'time_budget'}} as StoredSession;
 expect(await store.learningUpgradeAvailable(session,source,'default')).toBe(true);
 for(const state of [{phase:'assessing'},{teaching:{contentId:'busy'}},{learningCheck:{id:'busy'}},{paused:false},{completionReason:'coverage_gap'}]){
  expect(await store.learningUpgradeAvailable({...session,state:{...session.state,...state}} as StoredSession,source,'default')).toBe(false);
 }
 expect(release).toHaveBeenCalledTimes(1);
 query.maybeSingle.mockResolvedValue({data:{id:'old'},error:null});
 expect(await store.learningUpgradeAvailable(session,source,'default')).toBe(false);
 query.maybeSingle.mockResolvedValue({data:{id:'new'},error:null});
 vi.mocked(prepareLearningSuccessor).mockImplementationOnce(()=>{throw Error('incompatible');});
 expect(await store.learningUpgradeAvailable(session,source,'default')).toBe(false);
});
