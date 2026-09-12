import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn(),authorize:vi.fn(),role:vi.fn(),plan:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({}),createServiceClient:()=>({})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/db/practice',()=>({getCatchUpPlan:f.plan}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentLearningUnlocked:f.authorize}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class{}}));
vi.mock('@/components/student-page-header',()=>({StudentPageHeader:()=>null}));
vi.mock('@/components/diagnostic/learning-upgrade-button',()=>({LearningUpgradeButton:()=>null}));
import Page from './page';
import {LESSONS_COPY} from '@/lib/diagnostic/granular/lessons-copy';
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','false');f.role.mockResolvedValue({authUserId:'authenticated'});f.plan.mockResolvedValue([]);});
it('records lesson-list wording even when there are no activities',async()=>{
 await Page();expect(f.journal).toHaveBeenCalledWith('owner','student:lessons',{available:[],optional:[],copy:LESSONS_COPY});
});
it('withholds the list on capture failure or denied access',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture unavailable'));await expect(Page()).rejects.toThrow('capture unavailable');
 f.journal.mockClear();f.authorize.mockRejectedValueOnce(Error('locked'));await expect(Page()).rejects.toThrow('locked');expect(f.journal).not.toHaveBeenCalled();
});
