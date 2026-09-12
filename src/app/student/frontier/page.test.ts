import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({access:vi.fn(),latest:vi.fn(),project:vi.fn(),auth:vi.fn(),owner:vi.fn(),journal:vi.fn(),frontier:vi.fn(),maybe:vi.fn(),db:{from:vi.fn()},service:{name:'service'},payload:{graphView:{nodes:[{labelFr:'Employer la cédille',explanationFr:'Comparer garçon et citron.'}]},missing:[{labelFr:'Reconnaître le sujet'}]}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/auth',()=>({requireRole:f.auth}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>f.db,createServiceClient:()=>f.service}));
vi.mock('@/lib/diagnostic/live',()=>({frontierForStudent:f.frontier}));
vi.mock('@/components/student-competency-graph',()=>({StudentCompetencyGraph:()=>null}));
vi.mock('@/components/frontier-report',()=>({FrontierReportView:()=>null}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class {latestSession=f.latest;}}));
vi.mock('@/lib/diagnostic/granular/frontier-view',()=>({granularFrontierView:f.project}));
vi.mock('@/components/diagnostic/granular-frontier',()=>({GranularFrontier:()=>null}));
import Page from './page';
afterEach(()=>vi.unstubAllEnvs());
beforeEach(()=>{
 vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','false');vi.clearAllMocks();f.auth.mockResolvedValue({});f.owner.mockResolvedValue('authenticated-student');f.frontier.mockResolvedValue(f.payload);f.journal.mockResolvedValue(undefined);f.maybe.mockResolvedValue({data:null});
 const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),maybeSingle:f.maybe};f.db.from.mockReturnValue(query);
});
it('records the full owner-scoped graph and report before returning the page',async()=>{
 expect(await Page()).toBeTruthy();expect(f.frontier).toHaveBeenCalledWith('authenticated-student',f.db);
 expect(f.journal).toHaveBeenCalledWith('authenticated-student','student:frontier',f.payload);
 expect(f.frontier.mock.invocationCallOrder[0]).toBeLessThan(f.journal.mock.invocationCallOrder[0]);
});
it('withholds the page on capture failure and does not bypass authorization',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture unavailable'));await expect(Page()).rejects.toThrow('capture unavailable');
 vi.clearAllMocks();f.auth.mockRejectedValueOnce(Error('not authorized'));await expect(Page()).rejects.toThrow('not authorized');expect(f.frontier).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
it('keeps pilot graph loading scoped to the authenticated student',async()=>{
 f.maybe.mockResolvedValue({data:{is_pilot:true}});await Page();expect(f.frontier).toHaveBeenCalledWith('authenticated-student',f.service);expect(f.journal).toHaveBeenCalledWith('authenticated-student','student:frontier',f.payload);
});

it('uses the authenticated student granular session and journals only its projected map',async()=>{
 vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','true');
 const current={session:{id:'current-session'},bundle:{}};const map={nodes:[{id:'separate-production-target'}]};
 f.latest.mockResolvedValue(current);f.project.mockReturnValue(map);
 await Page();
 expect(f.access).toHaveBeenCalledWith(f.db,'authenticated-student');
 expect(f.latest).toHaveBeenCalledWith('authenticated-student');
 expect(f.project).toHaveBeenCalledWith(current.session,current.bundle);
 expect(f.journal).toHaveBeenCalledWith('authenticated-student','student:granular-frontier',map);
 expect(f.frontier).not.toHaveBeenCalled();
});
it('keeps older students on their existing map when there is no granular session',async()=>{
 vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','true');f.latest.mockResolvedValue(null);
 await Page();expect(f.frontier).toHaveBeenCalledWith('authenticated-student',f.db);
});
it('withholds the granular page on access, load or journal failure',async()=>{
 vi.stubEnv('GRANULAR_DIAGNOSTIC_ENABLED','true');f.access.mockRejectedValueOnce(Error('inactive'));
 await expect(Page()).rejects.toThrow('inactive');expect(f.latest).not.toHaveBeenCalled();
 f.latest.mockRejectedValueOnce(Error('load failed'));await expect(Page()).rejects.toThrow('load failed');expect(f.frontier).not.toHaveBeenCalled();
 f.latest.mockResolvedValue({session:{},bundle:{}});f.project.mockReturnValue({nodes:[]});f.journal.mockRejectedValueOnce(Error('capture failed'));
 await expect(Page()).rejects.toThrow('capture failed');expect(f.frontier).not.toHaveBeenCalled();
});
