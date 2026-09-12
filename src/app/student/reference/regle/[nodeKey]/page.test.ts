import {beforeEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const f=vi.hoisted(()=>({role:vi.fn(),journal:vi.fn(),read:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.role}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>({select:()=>({eq:()=>({order:()=>({limit:()=>({maybeSingle:f.read})})})})})})}));
import Page from './page';
import {RULE_REFERENCE_COPY,ruleTableSentence} from '@/lib/diagnostic/granular/rule-reference-copy';
beforeEach(()=>{vi.resetAllMocks();f.read.mockResolvedValue({data:null});});
it('records navigation copy even for an unpublished rule',async()=>{
 await Page({params:Promise.resolve({nodeKey:'unknown'})});
 expect(f.journal).toHaveBeenCalledWith('reference:rule-copy',{...RULE_REFERENCE_COPY,tableSentence:ruleTableSentence()});
});
it('withholds the page when recording fails and does not record unauthorized visits',async()=>{
 f.journal.mockRejectedValueOnce(Error('capture failed'));
 await expect(Page({params:Promise.resolve({nodeKey:'unknown'})})).rejects.toThrow('capture failed');
 expect(f.read).not.toHaveBeenCalled();f.journal.mockClear();f.role.mockRejectedValueOnce(Error('unauthorized'));
 await expect(Page({params:Promise.resolve({nodeKey:'unknown'})})).rejects.toThrow('unauthorized');expect(f.journal).not.toHaveBeenCalled();
});
