import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),access:vi.fn(),from:vi.fn(),eq:vi.fn(),journal:vi.fn(),error:null as {message:string}|null}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from}),createServiceClient:()=>({})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access,requireStudentLearningUnlocked:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {loadStudentNotifications} from './student';
const row={id:'message',kind:'teacher_comment',message_fr:'On écrit « chevaux » au pluriel.',payload:{example:'Les chevaux courent.'},read_at:null,created_at:'2026-09-12T10:00:00Z'};
beforeEach(()=>{
 vi.resetAllMocks();f.error=null;
 f.journal.mockImplementation(async(_owner,_boundary,payload)=>payload);
 f.from.mockImplementation(()=>{const q={select:()=>q,eq:(...args:unknown[])=>{f.eq(...args);return q;},order:()=>q,limit:async()=>({data:[row],error:f.error})};return q;});
});
it('records teacher examples and the full returned payload under the authenticated student without marking messages read',async()=>{
 const result=await loadStudentNotifications({});
 expect(f.eq).toHaveBeenCalledWith('student_id','owner');
 expect(result[0]).toMatchObject({message:row.message_fr,payload:row.payload,readAt:null});
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:notifications',result);
 expect(f.from).toHaveBeenCalledTimes(1);
});
it('withholds notifications after failed capture and allows retry',async()=>{
 f.journal.mockRejectedValueOnce(Error('journal unavailable'));
 await expect(loadStudentNotifications({})).rejects.toThrow('journal unavailable');
 expect((await loadStudentNotifications({}))[0].readAt).toBeNull();
});
it('does not journal a failed database read',async()=>{
 f.error={message:'read failed'};
 await expect(loadStudentNotifications({})).rejects.toThrow('read failed');
 expect(f.journal).not.toHaveBeenCalled();
});
it.each(['role','access'])('rejects failed %s authorization before reading messages',async mode=>{
 (mode==='role'?f.guard:f.access).mockRejectedValue(Error('unauthorized'));
 await expect(loadStudentNotifications({})).rejects.toThrow('unauthorized');
 expect(f.from).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});

it('rejects client-supplied ownership before reading messages',async()=>{
 await expect(loadStudentNotifications({studentId:'forged'})).rejects.toThrow('Données invalides');
 expect(f.from).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
