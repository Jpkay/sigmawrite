import {homeDynamicDisplay} from '@/lib/diagnostic/granular/home-display-text';
import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),access:vi.fn(),journal:vi.fn(),queries:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:()=>{}}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.queries,rpc:f.queries}),createServiceClient:()=>({from:f.queries,rpc:f.queries})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'authenticated-owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access,requireStudentLearningUnlocked:f.access}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {loadStudentHome} from './student';
beforeEach(()=>{vi.resetAllMocks();const query:unknown=new Proxy({}, {get:(_target,key)=>key==='then'?(resolve:unknown,reject:unknown)=>Promise.reject(Error('section unavailable')).then(resolve as never,reject as never):()=>query});f.queries.mockReturnValue(query);f.journal.mockImplementation(async(_owner,_boundary,payload)=>payload);});
it('records the combined fallback response when optional sections are unavailable',async()=>{
 const result=await loadStudentHome({});
 expect(result).toEqual({texts:null,plan:null,fallbackPlan:null,motivation:null,resume:null,assessment:null,recap:null,classGoal:null,league:null});
 expect(f.journal).toHaveBeenLastCalledWith('authenticated-owner','student:home',{...result,displayText:homeDynamicDisplay(result),motivationDisplay:null,leagueDisplay:null});
});
it('does not swallow failure of the final recording step',async()=>{
 f.journal.mockRejectedValue(Error('journal unavailable'));await expect(loadStudentHome({})).rejects.toThrow('journal unavailable');
});
it('authorizes the whole home request before launching optional reads',async()=>{
 f.guard.mockRejectedValueOnce(Error('unauthorized'));await expect(loadStudentHome({})).rejects.toThrow('unauthorized');
 expect(f.queries).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
