import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({role:vi.fn(),owner:vi.fn(),load:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:f.owner}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({})}));
vi.mock('@/lib/actions/words',()=>({loadWordTreasure:f.load}));
vi.mock('@/components/student-page-header',()=>({StudentPageHeader:()=>null}));
vi.mock('./word-treasure',()=>({WordTreasure:()=>null}));
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Page from './page';
beforeEach(()=>{vi.resetAllMocks();f.owner.mockResolvedValue('a');f.load.mockResolvedValue([]);});
it('resets the treasure when the authenticated owner changes',async()=>{
 const first=await Page();f.owner.mockResolvedValue('b');const second=await Page();
 expect(first.props.children[2].key).toBe('a');expect(second.props.children[2].key).toBe('b');
});
it('rejects unauthorized visits before loading words',async()=>{
 f.role.mockRejectedValue(Error('unauthorized'));await expect(Page()).rejects.toThrow('unauthorized');expect(f.load).not.toHaveBeenCalled();
});
it('offers the optional rappel éclair next to the treasure',async()=>{
 const page=await Page();
 const html=renderToStaticMarkup(page.props.children[1] as React.ReactElement);
 expect(html).toContain('/student/vocabulary/rappel');expect(html).toContain('Rappel éclair');expect(html).not.toMatch(/\d+ à réviser/);
});
