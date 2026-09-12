import {createElement} from 'react';
import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalCurrentStudentPayload:f.journal}));
import {StudentPageHeader} from './student-page-header';
beforeEach(()=>vi.resetAllMocks());
it('records rendered header wording and explicit action text without serializing the action',async()=>{
 const action=createElement('a',{href:'https://example.invalid/?token=private'},'Autre verbe');
 const output=await StudentPageHeader({boundary:'reference:verb-header',title:'aller',description:'Participe passé : allé.',eyebrow:'Référence',action,actionText:'Autre verbe'});
 expect(f.journal).toHaveBeenCalledWith('reference:verb-header',{title:'aller',description:'Participe passé : allé.',eyebrow:'Référence',actionText:'Autre verbe'});
 expect(output.props.action).toBe(action);
 expect(JSON.stringify(f.journal.mock.calls)).not.toContain('private');
});
it('rejects an action with unrecorded wording',async()=>{
 await expect(StudentPageHeader({boundary:'student:test-header',title:'Titre',action:createElement('button',null,'Ouvrir')})).rejects.toThrow('displayed text');
 expect(f.journal).not.toHaveBeenCalled();
});
it('withholds a header when authenticated capture fails',async()=>{
 f.journal.mockRejectedValue(Error('capture failed'));
 await expect(StudentPageHeader({boundary:'student:test-header',title:'Titre'})).rejects.toThrow('capture failed');
});
