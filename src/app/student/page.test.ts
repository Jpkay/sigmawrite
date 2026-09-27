import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn(),role:vi.fn(),owner:vi.fn(),assignments:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({isSupabaseConfigured:true,createClient:async()=>({})}));
vi.mock('@/lib/diagnostic/granular/assignment-delivery',()=>({deliveredStudentAssignments:f.assignments}));
vi.mock('./home-client',()=>({default:()=>null}));
import Page from './page';
import {HOME_COPY} from './home-copy';
beforeEach(()=>{vi.resetAllMocks();f.owner.mockResolvedValue('owner-a');f.assignments.mockResolvedValue([]);});
it('records the same fixed wording before returning the home client',async()=>{
 let done!:()=>void;f.journal.mockReturnValue(new Promise<void>(resolve=>{done=resolve;}));let returned=false;
 const pending=Page().then(page=>{returned=true;return page;});await Promise.resolve();expect(returned).toBe(false);
 done();const page=await pending;expect(page.props.copy).toBe(HOME_COPY);expect(f.journal).toHaveBeenCalledWith('owner-a','student:home-copy',HOME_COPY);
});
it('withholds the home client when recording fails',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
});

it('changes the client key across accounts and rejects unauthorized requests',async()=>{
 f.assignments.mockResolvedValueOnce([{id:'a'}]).mockResolvedValueOnce([{id:'b'}]);
 const first=await Page();f.owner.mockResolvedValue('owner-b');const second=await Page();
 expect(first.key).toBe('owner-a');expect(second.key).toBe('owner-b');
 expect(first.props.assignments).toEqual([{id:'a'}]);expect(second.props.assignments).toEqual([{id:'b'}]);
 f.journal.mockClear();f.role.mockRejectedValueOnce(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.journal).not.toHaveBeenCalled();
});
