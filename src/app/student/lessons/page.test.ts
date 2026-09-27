import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>{const rpc=vi.fn();return {journal:vi.fn(),redirect:vi.fn(),role:vi.fn(),owner:vi.fn(),plan:vi.fn(),rpc,db:{rpc},createService:vi.fn(),constructStore:vi.fn()};});
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>f.db,createServiceClient:f.createService}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/db/practice',()=>({getCatchUpPlan:f.plan}));
vi.mock('next/navigation',()=>({redirect:f.redirect}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class{constructor(service:unknown){f.constructStore(service);}}}));
vi.mock('@/components/student-page-header',()=>({StudentPageHeader:()=>null}));
vi.mock('@/components/diagnostic/learning-upgrade-button',()=>({LearningUpgradeButton:()=>null}));
import Page from './page';
import {LESSONS_COPY} from '@/lib/diagnostic/granular/lessons-copy';
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','false');f.role.mockResolvedValue({authUserId:'authenticated'});f.owner.mockResolvedValue('owner');f.rpc.mockResolvedValue({data:true,error:null});f.createService.mockReturnValue({name:'service'});f.plan.mockResolvedValue([]);f.redirect.mockImplementation((path:string)=>{throw new Error(`redirect:${path}`);});});
it('checks the authenticated student with the authoritative RPC and retains lesson rendering and journaling when unlocked',async()=>{
 const page=await Page();
 expect(f.role).toHaveBeenCalledWith(['student']);
 expect(f.owner).toHaveBeenCalledWith(f.db);
 expect(f.rpc).toHaveBeenCalledWith('student_learning_is_unlocked',{p_student_id:'owner'});
 expect(f.createService).toHaveBeenCalledOnce();
 expect(f.constructStore).toHaveBeenCalledWith({name:'service'});
 expect(f.plan).toHaveBeenCalledWith('owner',f.db);
 expect(f.journal).toHaveBeenCalledWith('owner','student:lessons',{available:[],optional:[],copy:LESSONS_COPY});
 expect(page).toBeTruthy();
});
it.each([false,null])('redirects locked RPC result %s before constructing services or loading lesson data',async data=>{
 f.rpc.mockResolvedValueOnce({data,error:null});
 await expect(Page()).rejects.toThrow('redirect:/student/diagnostic');
 expect(f.redirect).toHaveBeenCalledWith('/student/diagnostic');
 expect(f.createService).not.toHaveBeenCalled();
 expect(f.constructStore).not.toHaveBeenCalled();
 expect(f.plan).not.toHaveBeenCalled();
 expect(f.journal).not.toHaveBeenCalled();
});
it('throws a verification error instead of redirecting when the unlock RPC fails',async()=>{
 f.rpc.mockResolvedValueOnce({data:null,error:{message:'database unavailable'}});
 await expect(Page()).rejects.toThrow('La vérification du diagnostic a échoué. Réessaie.');
 expect(f.redirect).not.toHaveBeenCalled();
 expect(f.createService).not.toHaveBeenCalled();
 expect(f.plan).not.toHaveBeenCalled();
 expect(f.journal).not.toHaveBeenCalled();
});
it('preserves journal failures after an unlocked lesson list is built',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture unavailable'));
 await expect(Page()).rejects.toThrow('capture unavailable');
});
