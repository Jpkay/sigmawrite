import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({auth:vi.fn(),owner:vi.fn(),access:vi.fn(),latest:vi.fn(),project:vi.fn(),journal:vi.fn(),db:{name:'authenticated'},service:{name:'service'}}));
vi.mock('@/lib/auth',()=>({requireRole:f.auth}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>f.db,createServiceClient:()=>f.service}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class{latestSession=f.latest;}}));
vi.mock('@/lib/diagnostic/granular/frontier-view',()=>({granularFrontierView:f.project}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('./legacy-progress',()=>({default:()=>null,RecentReadingSessions:()=>null}));
vi.mock('@/components/diagnostic/granular-frontier',()=>({GranularFrontier:()=>null}));
import Page from './page';
import LegacyProgress from './legacy-progress';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','true');f.auth.mockResolvedValue({});f.owner.mockResolvedValue('owner');f.access.mockResolvedValue(undefined);f.latest.mockResolvedValue({session:{id:'pinned'},bundle:{}});f.project.mockReturnValue({nodes:[]});f.journal.mockResolvedValue(undefined);});
afterEach(()=>vi.unstubAllEnvs());
it('uses the same current skill projection as the frontier and captures the delivered progress',async()=>{
 await Page();expect(f.auth).toHaveBeenCalledWith(['student']);expect(f.access).toHaveBeenCalledWith(f.db,'owner');expect(f.latest).toHaveBeenCalledWith('owner');expect(f.project).toHaveBeenCalledWith({id:'pinned'},{});expect(f.journal).toHaveBeenCalledWith('owner','student:granular-progress',{nodes:[]});
});
it('retains legacy progress without a granular session or when granular runtime is disabled',async()=>{
 f.latest.mockResolvedValue(null);expect((await Page()).type).toBe(LegacyProgress);expect(f.journal).not.toHaveBeenCalled();
 vi.clearAllMocks();vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','false');expect((await Page()).type).toBe(LegacyProgress);expect(f.latest).not.toHaveBeenCalled();
});
it('does not replace access, storage or capture failures with stale scores',async()=>{
 f.auth.mockRejectedValueOnce(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.latest).not.toHaveBeenCalled();
 f.latest.mockRejectedValueOnce(Error('load failed'));await expect(Page()).rejects.toThrow('load failed');expect(f.journal).not.toHaveBeenCalled();
 f.journal.mockRejectedValueOnce(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
});
