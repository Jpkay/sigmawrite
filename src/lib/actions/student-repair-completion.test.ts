import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),access:vi.fn(),rpc:vi.fn(),from:vi.fn(),state:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('next/cache',()=>({revalidatePath:()=>{}}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from}),createServiceClient:()=>({rpc:f.rpc})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'authenticated-owner'}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:f.access,requireStudentLearningUnlocked:f.access}));
vi.mock('@/lib/diagnostic/granular/student-state-delivery',()=>({getDeliveredStudentState:f.state}));
import {submitSkillPractice} from './student';
import {MICRO_LESSONS} from '@/lib/content/micro-lessons';
const lesson=MICRO_LESSONS.cause_consequence;
const input={submissionId:'12345678-1234-4234-8234-123456789012',skillKey:'cause_consequence',answers:[...lesson.questions,lesson.returnToText].map(q=>q.correctIndex)};
beforeEach(()=>{vi.resetAllMocks();f.rpc.mockResolvedValue({error:null});f.state.mockResolvedValue({unchanged:true});});
it('records authenticated guided completion without reading or writing skill estimates',async()=>{
 await expect(submitSkillPractice(input)).resolves.toEqual({state:{unchanged:true}});
 expect(f.rpc).toHaveBeenCalledWith('record_student_repair_completion',expect.objectContaining({p_student_id:'authenticated-owner',p_submission_id:input.submissionId,p_answers:input.answers,p_corrects:input.answers.map(()=>true)}));expect(f.from).not.toHaveBeenCalled();
});
it('reuses the exact completion identity if state delivery fails after a successful save',async()=>{
 f.state.mockRejectedValueOnce(Error('response lost'));
 await expect(submitSkillPractice(input)).rejects.toThrow('response lost');await submitSkillPractice(input);
 expect(f.rpc.mock.calls[0]).toEqual(f.rpc.mock.calls[1]);expect(f.from).not.toHaveBeenCalled();
});
it('rejects locked or unauthorized students before completion writes',async()=>{
 f.access.mockRejectedValueOnce(Error('locked'));await expect(submitSkillPractice(input)).rejects.toThrow('locked');expect(f.rpc).not.toHaveBeenCalled();
});
