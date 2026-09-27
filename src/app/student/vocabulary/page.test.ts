import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),owner:vi.fn(),load:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({})}));
vi.mock('@/lib/actions/vocabulary',()=>({loadVocabularyMemories:f.load}));
vi.mock('./vocabulary-practice',()=>({VocabularyPractice:()=>null}));
import Page from './page';
beforeEach(()=>{vi.resetAllMocks();f.owner.mockResolvedValue('a');f.load.mockResolvedValue([]);});
it('resets local review state when the authenticated owner changes',async()=>{
 const first=await Page();f.owner.mockResolvedValue('b');const second=await Page();
 expect(first.props.children[1].key).toBe('a');expect(second.props.children[1].key).toBe('b');
});
it('rejects unauthorized visits before loading vocabulary',async()=>{
 f.role.mockRejectedValue(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.load).not.toHaveBeenCalled();
});
