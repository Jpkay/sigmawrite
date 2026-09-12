import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),owner:vi.fn(),journal:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({isSupabaseConfigured:true,createClient:async()=>({})}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('./inbox-client',()=>({StudentInbox:()=>null}));
import Page from './page';
import {INBOX_COPY} from '@/lib/diagnostic/granular/inbox-display';
beforeEach(()=>{vi.resetAllMocks();f.owner.mockResolvedValue('a');});
it('records the supplied copy and remounts the client for each authenticated owner',async()=>{
 const first=await Page();f.owner.mockResolvedValue('b');const second=await Page();
 expect(first.props.children[1].key).toBe('a');expect(second.props.children[1].key).toBe('b');
 expect(second.props.children[1].props.copy).toBe(INBOX_COPY);expect(f.journal).toHaveBeenLastCalledWith('b','student:inbox-copy',INBOX_COPY);
});
it('withholds the page on failed recording or authentication',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture failed'));await expect(Page()).rejects.toThrow('capture failed');
 f.journal.mockClear();f.role.mockRejectedValueOnce(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.journal).not.toHaveBeenCalled();
});
