import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({guard:vi.fn(),journal:vi.fn(),from:vi.fn(),rubric:{feedback:'Observe les auxiliaires.'}}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:f.guard}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:f.from,rpc:async()=>({data:{allowed:true}})}),createServiceClient:()=>({from:f.from})}));
vi.mock('@/lib/db/student',()=>({getCurrentStudentId:async()=> 'owner',getStudentStateData:vi.fn()}));
vi.mock('@/lib/diagnostic/access',()=>({requireStudentAccessAuthorized:async()=>{},requireStudentLearningUnlocked:async()=>{}}));
vi.mock('@/lib/diagnostic/granular/server-delivery-journal',()=>({journalStudentPayload:f.journal}));
vi.mock('@/lib/safety/moderate-input',()=>({moderateStudentText:async()=>({allowed:true}),fallbackModeration:vi.fn()}));
vi.mock('@/lib/linguistic/languagetool',()=>({LanguageToolChecker:class{async check(){return {matches:[]};}}}));
vi.mock('@/lib/scoring/production-ai',()=>({scoreProductionWithAI:async()=>f.rubric}));
import {loadIndependentProductionTask,submitIndependentProduction} from './student';
const nodeId='11111111-1111-4111-8111-111111111111';
beforeEach(()=>{
 vi.clearAllMocks();f.guard.mockResolvedValue({});f.journal.mockImplementation(async(_owner,_boundary,payload)=>payload);
 f.from.mockImplementation((table:string)=>{
  const data=table==='student_learning_paths'?{id:'path'}:table==='student_learning_path_steps'?{node_id:nodeId}:table==='students'?{current_grade:7}:table==='competency_nodes'?{id:nodeId,key:'employer_passe_compose_en_contexte',label_fr:'Passé composé',description_fr:'Raconter un événement',strand:'conjugation'}:null;
  const q:Record<string,unknown>={};for(const method of ['select','eq','in','order','limit'])q[method]=()=>q;
  q.single=q.maybeSingle=async()=>({data});return q;
 });
});
it('journals the generated writing prompt under the authenticated owner',async()=>{
 const task=await loadIndependentProductionTask({nodeId,studentId:'forged'});
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:production-task',task);
 expect(task.prompt).toContain('passé composé');expect(task.description).toBe('Raconter un événement');
});
it('withholds writing prompts on journal failure',async()=>{
 f.journal.mockRejectedValue(Error('journal unavailable'));
 await expect(loadIndependentProductionTask({nodeId})).rejects.toThrow('journal unavailable');
});
it('does not commit a submission when feedback cannot be recorded, leaving the same text retryable',async()=>{
 f.journal.mockRejectedValue(Error('journal unavailable'));
 await expect(submitIndependentProduction({nodeId,genre:'recit',text:'Elle est allée au marché et nous avons fini le travail. '+Array(65).fill('mot').join(' ')})).rejects.toThrow('journal unavailable');
 expect(f.journal).toHaveBeenCalledWith('owner','legacy:production-feedback',expect.objectContaining({rubric:f.rubric,feedback:expect.any(String)}));
 expect(f.from).not.toHaveBeenCalledWith('independent_production_submissions');
});
it('rejects unauthorized access before loading or journaling a task',async()=>{
 f.guard.mockRejectedValue(Error('unauthorized'));
 await expect(loadIndependentProductionTask({nodeId})).rejects.toThrow('unauthorized');
 expect(f.from).not.toHaveBeenCalled();expect(f.journal).not.toHaveBeenCalled();
});
