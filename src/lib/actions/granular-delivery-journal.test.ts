import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),record:vi.fn(),journal:vi.fn(),command:vi.fn(),view:{phase:'learning',question:{promptFr:'Les oiseaux chantent.'}},state:{lessonTitle:'Observer le sujet'}}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({}),createServiceClient:()=>({})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner',getStudentStateData:async()=>f.state}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class{recordDeliveredText=f.journal;}}));
vi.mock('@/lib/diagnostic/granular/material-delivery',()=>({recordMaterialDelivery:f.record}));
vi.mock('@/lib/diagnostic/granular/service',()=>({runAssessmentCommand:f.command,publicAssessmentView:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/learning-service',()=>({runLearningCheckCommand:f.command}));
vi.mock('@/lib/diagnostic/granular/teaching-service',()=>({runTeachingCommand:f.command}));
vi.mock('@/lib/diagnostic/granular/answer-review',()=>({loadDiagnosticAnswerReview:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/release-content-cache',()=>({sharedReleaseContentCache:{}}));
import {updateGranularDiagnostic,updateGranularLearningCheck,updateGranularTeaching} from './granular-diagnostic';
beforeEach(()=>{vi.clearAllMocks();f.guard.mockResolvedValue({});f.record.mockResolvedValue(undefined);f.journal.mockResolvedValue(undefined);f.command.mockResolvedValue({view:f.view});});
it('records the complete final delivery including appended student-state content under the authenticated owner',async()=>{
 for(const action of [updateGranularDiagnostic,updateGranularLearningCheck]){
  const result=await action({studentId:'forged-owner'});
  expect(result).toMatchObject({studentState:f.state});
  expect(f.journal).toHaveBeenLastCalledWith(expect.objectContaining({studentId:'owner',textFragments:expect.arrayContaining(['Les oiseaux chantent.','Observer le sujet'])}));
 }
 expect(f.record.mock.invocationCallOrder[0]).toBeLessThan(f.journal.mock.invocationCallOrder[0]);
});
it('withholds a lesson payload when the journal write fails',async()=>{
 f.journal.mockRejectedValueOnce(Error('journal unavailable'));
 await expect(updateGranularTeaching({})).rejects.toThrow('journal unavailable');
});
it('does not run or journal commands when authorization fails',async()=>{
 f.guard.mockRejectedValueOnce(Error('unauthorized'));
 await expect(updateGranularDiagnostic({})).rejects.toThrow('unauthorized');
 expect(f.command).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
