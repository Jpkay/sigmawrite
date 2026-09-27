import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({role:vi.fn(),access:vi.fn(),latest:vi.fn(),upgrade:vi.fn(),query:vi.fn(),revalidate:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.role}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:mocks.access}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'authenticated-student'}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({}),createServiceClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:mocks.query})})})})})}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class {latestSession=mocks.latest;createLearningSuccessor=mocks.upgrade;}}));
import {upgradeGranularLearning} from './granular-learning-upgrade';
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv('GRANULAR_LEARNING_UPGRADES_ENABLED','true');vi.stubEnv('GRANULAR_DIAGNOSTIC_RELEASE_KEY','approved-default');
 mocks.latest.mockResolvedValue({session:{id:'owned-session',releaseId:'old',state:{phase:'learning'}}});
 mocks.query.mockResolvedValue({data:{id:'target'},error:null});
});
afterEach(()=>vi.unstubAllEnvs());
it('uses the authenticated student and returns no private assessment state',async()=>{
 expect(await upgradeGranularLearning()).toEqual({changed:true});
 expect(mocks.role).toHaveBeenCalledWith(['student']);
 expect(mocks.access).toHaveBeenCalledWith({},'authenticated-student');
 expect(mocks.upgrade).toHaveBeenCalledWith('authenticated-student','owned-session','target');
 expect(mocks.revalidate).toHaveBeenCalledWith('/student/lessons');
});
it('rejects revoked access before inspecting or changing sessions',async()=>{
 mocks.access.mockRejectedValue(Error('Access denied'));
 await expect(upgradeGranularLearning()).rejects.toThrow('Access denied');
 expect(mocks.latest).not.toHaveBeenCalled();expect(mocks.upgrade).not.toHaveBeenCalled();
});
it('leaves disabled, unfinished, absent and current-release sessions unchanged',async()=>{
 vi.stubEnv('GRANULAR_LEARNING_UPGRADES_ENABLED','false');
 expect(await upgradeGranularLearning()).toEqual({changed:false});
 vi.stubEnv('GRANULAR_LEARNING_UPGRADES_ENABLED','true');
 for(const current of [null,{session:{state:{phase:'assessing'}}},{session:{releaseId:'target',state:{phase:'learning'}}}]){
  mocks.latest.mockResolvedValue(current);expect(await upgradeGranularLearning()).toEqual({changed:false});
 }
 expect(mocks.upgrade).not.toHaveBeenCalled();
});
it('does not report success or refresh after an atomic conflict',async()=>{
 mocks.upgrade.mockRejectedValue(Error('revision changed'));
 await expect(upgradeGranularLearning()).rejects.toThrow('revision changed');
 expect(mocks.revalidate).not.toHaveBeenCalled();
});
