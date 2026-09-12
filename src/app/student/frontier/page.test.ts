import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({auth:vi.fn(),owner:vi.fn(),journal:vi.fn(),frontier:vi.fn(),maybe:vi.fn(),db:{from:vi.fn()},service:{name:'service'},payload:{graphView:{nodes:[{labelFr:'Employer la cédille',explanationFr:'Comparer garçon et citron.'}]},missing:[{labelFr:'Reconnaître le sujet'}]}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/auth',()=>({requireRole:f.auth}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>f.db,createServiceClient:()=>f.service}));
vi.mock('@/lib/diagnostic/live',()=>({frontierForStudent:f.frontier}));
vi.mock('@/components/student-competency-graph',()=>({StudentCompetencyGraph:()=>null}));
vi.mock('@/components/frontier-report',()=>({FrontierReportView:()=>null}));
import Page from './page';
beforeEach(()=>{
 vi.clearAllMocks();f.auth.mockResolvedValue({});f.owner.mockResolvedValue('authenticated-student');f.frontier.mockResolvedValue(f.payload);f.journal.mockResolvedValue(undefined);f.maybe.mockResolvedValue({data:null});
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
