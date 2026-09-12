import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({journal:vi.fn(),order:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('./server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {deliveredStudentAssignments} from './assignment-delivery';
const client={from:()=>({select:()=>({order:f.order})})} as unknown as Parameters<typeof deliveredStudentAssignments>[1];
beforeEach(()=>vi.resetAllMocks());
it('reads fresh assignments and records each authenticated owner separately',async()=>{
 const a={id:'a',target_type:'text',text_slug:null,title:'Lecture pour A',due_at:null};
 const b={id:'b',target_type:'dictation',title:'Dictée pour B',due_at:'2026-09-15'};
 f.order.mockResolvedValueOnce({data:[a]}).mockResolvedValueOnce({data:[b]});
 expect(await deliveredStudentAssignments('owner-a',client)).toEqual([a]);
 expect(await deliveredStudentAssignments('owner-b',client)).toEqual([b]);
 expect(f.journal).toHaveBeenNthCalledWith(1,'owner-a','student:assignments',expect.objectContaining({display:[{title:a.title,description:'Lecture'}]}));
 expect(f.journal).toHaveBeenNthCalledWith(2,'owner-b','student:assignments',expect.objectContaining({display:[{title:b.title,description:'Défi dictée de classe · échéance 2026-09-15'}]}));
});
it('does not deliver assignments when reading or journaling fails',async()=>{
 f.order.mockResolvedValueOnce({error:Error('read failed')});
 await expect(deliveredStudentAssignments('owner-a',client)).rejects.toThrow('read failed');
 expect(f.journal).not.toHaveBeenCalled();
 f.order.mockResolvedValueOnce({data:[]});f.journal.mockRejectedValueOnce(Error('capture failed'));
 await expect(deliveredStudentAssignments('owner-a',client)).rejects.toThrow('capture failed');
});
