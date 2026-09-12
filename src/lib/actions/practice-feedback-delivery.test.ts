import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),journal:vi.fn(),from:vi.fn(),insert:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from}),createServiceClient:()=>({from:f.from})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{},requireStudentLearningUnlocked:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
import {submitNodePractice} from './student';
const id='11111111-1111-4111-8111-111111111111';
const input={nodeId:id,itemId:id,practiceSessionId:id,exercisePosition:0,selectedChoiceId:id,startedAt:'2026-09-12T10:00:00Z'};
beforeEach(()=>{
 vi.resetAllMocks();
 f.from.mockImplementation((table:string)=>{
  const data=table==='practice_learning_sessions'?{id,node_id:id,status:'active',expires_at:'2099-01-01T00:00:00Z'}:table==='competency_items'?{id,response_type:'mcq',validator_type:'exact',validator_config:{},correct_answer:'chevaux',acceptable_answers:[],competency_item_choices:[{id,is_correct:false,feedback_fr:'Au pluriel, écris « chevaux ».'}]}:null;
  const q:Record<string,unknown>={};for(const method of ['select','eq','in'])q[method]=()=>q;
  q.single=async()=>({data});q.insert=f.insert;return q;
 });
 f.insert.mockImplementation(()=>{throw Error('test storage boundary');});
});
it('records validator correction text before any attempt write',async()=>{
 await expect(submitNodePractice(input)).rejects.toThrow('test storage boundary');
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:practice-feedback',{itemId:id,feedbackFr:'Au pluriel, écris « chevaux ».'});
 expect(f.journal.mock.invocationCallOrder[0]).toBeLessThan(f.insert.mock.invocationCallOrder[0]);
});
it('does not consume the attempt or change mastery if capture fails',async()=>{
 f.journal.mockRejectedValue(Error('journal unavailable'));
 await expect(submitNodePractice(input)).rejects.toThrow('journal unavailable');
 expect(f.insert).not.toHaveBeenCalled();expect(f.from).not.toHaveBeenCalledWith('student_competency_estimates');
});
it('does not record feedback for an invalid selected choice',async()=>{
 await expect(submitNodePractice({...input,selectedChoiceId:'22222222-2222-4222-8222-222222222222'})).rejects.toThrow('Choix invalide');
 expect(f.journal).not.toHaveBeenCalled();expect(f.insert).not.toHaveBeenCalled();
});
