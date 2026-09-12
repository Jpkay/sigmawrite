import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),latest:vi.fn(),start:vi.fn(),record:vi.fn(),journal:vi.fn(),command:vi.fn(),writingFactory:vi.fn(),writingEvaluator:vi.fn(),view:{phase:'learning',answeredCount:3,skippedCount:1,remainingSeconds:90,results:[],question:{promptFr:'Les oiseaux chantent.'}},state:{lessonTitle:'Observer le sujet',sessions:[],interests:[]}}));
vi.mock('@/lib/diagnostic/granular/server-writing-evaluator',()=>({serverWritingEvaluator:f.writingFactory}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({}),createServiceClient:()=>({})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner',getStudentStateData:async()=>f.state}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/store',()=>({SupabaseAssessmentStore:class{recordDeliveredText=f.journal;latestSession=f.latest;start=f.start;}}));
vi.mock('@/lib/diagnostic/granular/material-delivery',()=>({recordMaterialDelivery:f.record}));
vi.mock('@/lib/diagnostic/granular/service',()=>({runAssessmentCommand:f.command,publicAssessmentView:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/learning-service',()=>({runLearningCheckCommand:f.command}));
vi.mock('@/lib/diagnostic/granular/teaching-service',()=>({runTeachingCommand:f.command}));
vi.mock('@/lib/diagnostic/granular/answer-review',()=>({loadDiagnosticAnswerReview:vi.fn()}));
vi.mock('@/lib/diagnostic/granular/release-content-cache',()=>({sharedReleaseContentCache:{}}));
import {startGranularDiagnostic,updateGranularDiagnostic,updateGranularLearningCheck,updateGranularTeaching} from './granular-diagnostic';
beforeEach(()=>{vi.clearAllMocks();f.writingFactory.mockReturnValue(f.writingEvaluator);f.guard.mockResolvedValue({});f.record.mockResolvedValue(undefined);f.journal.mockResolvedValue(undefined);f.command.mockResolvedValue({view:f.view});});
it('records the complete final delivery including appended student-state content under the authenticated owner',async()=>{
 for(const action of [updateGranularDiagnostic,updateGranularLearningCheck]){
  const result=await action({studentId:'forged-owner'});
  expect(result).toMatchObject({studentState:f.state});
  expect(result).not.toHaveProperty('displayText');
  expect(f.journal).toHaveBeenLastCalledWith(expect.objectContaining({studentId:'owner',textFragments:expect.arrayContaining(['Les oiseaux chantent.','Observer le sujet','3 réponses enregistrées · 1 question passée · environ 2 min restantes','Question 5'])}));
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

it('supplies the server evaluator with authenticated ownership, never a browser owner',async()=>{
 await updateGranularLearningCheck({studentId:'forged-owner'});
 expect(f.writingFactory).toHaveBeenCalledWith({},'owner');
 expect(f.command).toHaveBeenCalledWith(expect.anything(),'owner',{studentId:'forged-owner'},expect.any(Function),f.writingEvaluator);
 expect(f.writingEvaluator).not.toHaveBeenCalled();
});

it('records the unavailable message without claiming a question presentation',async()=>{
 f.latest.mockResolvedValue(null);f.start.mockResolvedValue(null);
 expect(await startGranularDiagnostic()).toEqual({error:'Ce diagnostic n’est pas encore disponible.'});
 expect(f.journal).toHaveBeenCalledWith(expect.objectContaining({studentId:'owner',boundary:'granular:start',textFragments:['Ce diagnostic n’est pas encore disponible.']}));
});
