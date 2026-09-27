import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {WritingEvaluator} from './learning-service';
import {createWritingEvaluator} from './writing-evaluator';
import {WritingAssessmentError} from './writing-error';

/** Off until writing content and evaluator checks support release. The learning
 * service calls this only after resolving an owned active check and pinned item.
 * Creating this adapter never calls the provider or consumes a budget. */
export function serverWritingEvaluator(client:SupabaseClient,studentId:string):WritingEvaluator|undefined {
  if(process.env.GRANULAR_WRITING_EVALUATION_ENABLED!=='true')return undefined;
  return async input=>{
    try {
      for(const [name,args] of [
        ['consume_student_action',{p_scope:'free_text'}],
        ['consume_student_llm_budget',{p_student_id:studentId,p_units:1}],
      ] as const){
        const {data,error}=await client.rpc(name,args);
        const allowance=Array.isArray(data)?data[0]:data;
        if(error||allowance?.allowed!==true)throw Error('Writing allowance unavailable');
      }
      return await createWritingEvaluator()(input);
    }catch(cause){
      if(cause instanceof WritingAssessmentError)throw cause;
      throw new WritingAssessmentError(cause);
    }
  };
}
