import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),owner:vi.fn(),journal:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({isSupabaseConfigured:true,createClient:async()=>({})}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('./memory-client',()=>({default:()=>null}));
import Page from './page';
import {MEMORY_COPY} from '@/lib/diagnostic/granular/memory-display';
beforeEach(()=>{vi.resetAllMocks();f.owner.mockResolvedValue('a');});
it('records fixed copy and remounts the client across authenticated accounts',async()=>{
 const first=await Page();f.owner.mockResolvedValue('b');const second=await Page();
 expect(first.key).toBe('a');expect(second.key).toBe('b');expect(f.journal).toHaveBeenLastCalledWith('b','student:memory-copy',MEMORY_COPY);
});
it('withholds the page on failed capture or authorization',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
 f.journal.mockClear();f.role.mockRejectedValueOnce(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.journal).not.toHaveBeenCalled();
});
