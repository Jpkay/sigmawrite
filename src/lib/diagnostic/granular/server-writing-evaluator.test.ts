import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {WritingEvaluator} from './learning-service';
const f=vi.hoisted(()=>({evaluate:vi.fn(),rpc:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('./writing-evaluator',()=>({createWritingEvaluator:()=>f.evaluate}));
import {serverWritingEvaluator} from './server-writing-evaluator';
import {WritingAssessmentError} from './writing-error';
const client={rpc:f.rpc} as unknown as SupabaseClient;
const input={answer:'Un court texte.',skillId:'writing',item:{}} as Parameters<WritingEvaluator>[0];
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('GRANULAR_WRITING_EVALUATION_ENABLED','true');f.rpc.mockResolvedValue({data:{allowed:true}});f.evaluate.mockResolvedValue({connectedWriting:true,tokens:[]});});
afterEach(()=>vi.unstubAllEnvs());
it('requires explicit activation and does not consume allowance on creation',()=>{
 for(const value of ['', 'false','1']){vi.stubEnv('GRANULAR_WRITING_EVALUATION_ENABLED',value);expect(serverWritingEvaluator(client,'owner')).toBeUndefined();}
 vi.stubEnv('GRANULAR_WRITING_EVALUATION_ENABLED','true');expect(serverWritingEvaluator(client,'owner')).toBeTypeOf('function');expect(f.rpc).not.toHaveBeenCalled();expect(f.evaluate).not.toHaveBeenCalled();
});
it('charges the authenticated student and passes only the pinned service input',async()=>{
 await serverWritingEvaluator(client,'owner')!(input);
 expect(f.rpc).toHaveBeenNthCalledWith(1,'consume_student_action',{p_scope:'free_text'});
 expect(f.rpc).toHaveBeenNthCalledWith(2,'consume_student_llm_budget',{p_student_id:'owner',p_units:1});
 expect(f.evaluate).toHaveBeenCalledWith(input);
});
it('does not call a provider when either allowance is denied or unavailable',async()=>{
 for(const response of [{data:{allowed:false}},{data:null,error:{message:'private database error'}}]){
  f.rpc.mockResolvedValueOnce(response);
  await expect(serverWritingEvaluator(client,'owner')!(input)).rejects.toBeInstanceOf(WritingAssessmentError);
 }
 f.rpc.mockResolvedValueOnce({data:[{allowed:true}]}).mockResolvedValueOnce({data:[{allowed:false}]});
 await expect(serverWritingEvaluator(client,'owner')!(input)).rejects.toBeInstanceOf(WritingAssessmentError);
 expect(f.evaluate).not.toHaveBeenCalled();
});
it('hides provider failures behind the retryable assessment error',async()=>{
 f.evaluate.mockRejectedValue(Error('provider private response'));
 await expect(serverWritingEvaluator(client,'owner')!(input)).rejects.toThrow('Aucun résultat');
});
