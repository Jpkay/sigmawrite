/** Generate a fixed three-case reference batch; no approval or publication. Idempotent per sample key. */
import {createClient} from '@supabase/supabase-js';
import {getActivePrompt} from '../src/lib/db/ai';
import {OpenAICompatibleAIProvider} from '../src/lib/ai/openai-compatible-provider';
import {resolveAIRuntimeConfig} from '../src/lib/ai/runtime-config';
import {getAIProviderInfo} from '../src/lib/ai';
import {runGenerationPipeline} from '../src/lib/ai/pipeline';
import {queueReview} from '../src/lib/content/automation/worker';
import {PASSAGE_AUTOMATION_INSTRUCTION,PASSAGE_QA_VERSION} from '../src/lib/content/automation/policy';
import type {GenerateTextInput} from '../src/lib/ai/schemas';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const {data:policy,error}=await db.from('passage_automation_policy').select('*').eq('id',true).single();if(error)throw error;
if(policy.enabled)throw Error('Reference preparation requires shadow mode');
const prompt=await getActivePrompt('text_generation',db);const info=getAIProviderInfo();if(info.provider==='mock')throw Error('Real generation required');
// Offline reference preparation allows slow provider responses without changing web request limits.
const referenceProvider=new OpenAICompatibleAIProvider(resolveAIRuntimeConfig(),(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(180_000)}));
const topics=[['Pourquoi une flaque finit par sécher','nature','Foundation 6B'],['Pourquoi les ombres changent de place','science','Secondary 7A'],['Comment les racines aident une plante','nature','Secondary 8A']];
for(const [index,[topic,interest,band]] of topics.entries()){
 const sampleKey=`${PASSAGE_QA_VERSION}:reference:${index+1}`;
 const {data:previous,error:lookupError}=await db.from('ai_generation_jobs').select('id,status').contains('input_payload',{sampleKey}).eq('status','completed').limit(1).maybeSingle();if(lookupError)throw lookupError;if(previous){console.log(JSON.stringify({sampleKey,skipped:true}));continue;}
 const input:GenerateTextInput={language:'fr',studentGrade:6+index,targetReadingBand:band,topic,primaryInterest:interest,knowledgeDomains:[],targetConcepts:[],textType:'expository',wordCountTarget:240,maxAverageSentenceLength:18,maxNewAcademicWords:4,targetVocabulary:[],targetSkills:['literal_comprehension','inference'],avoid:['statistiques non sourcées','publicité'],tone:'curious_explainer'};
 const {data:job,error:jobError}=await db.from('ai_generation_jobs').insert({job_type:'text_generation',status:'running',input_payload:{sampleKey,request:input,automationScope:PASSAGE_QA_VERSION},provider:info.provider,model_id:info.model,prompt_key:prompt.promptKey,prompt_version:prompt.versionNumber}).select('id').single();if(jobError)throw jobError;
 try{
 const candidate=await runGenerationPipeline(input,{provider:referenceProvider,systemPrompt:`${prompt.promptText}\n\n${PASSAGE_AUTOMATION_INSTRUCTION}\nPrépare trois questions. Décris un mécanisme simple, sans affirmation absolue ni conseil de santé. Chaque choix incorrect doit être clairement incompatible avec le passage.`});
 const {error:candidateError}=await db.from('ai_generated_candidates').insert({id:candidate.id,generation_job_id:job.id,candidate_type:'reading_text',payload:candidate,review_status:candidate.reviewStatus});if(candidateError)throw candidateError;
 await queueReview(db,candidate,policy.reviewer_ids);
 const {error:finishError}=await db.from('ai_generation_jobs').update({status:'completed',completed_at:new Date().toISOString(),output_payload:{candidate_id:candidate.id,calibrationReference:true}}).eq('id',job.id);if(finishError)throw finishError;
 console.log(JSON.stringify({sampleKey,candidateId:candidate.id,title:candidate.generated.title,formats:candidate.generated.questions.map(q=>q.answerFormat),wordCount:candidate.difficulty.features.wordCount}));
 }catch(cause){await db.from('ai_generation_jobs').update({status:'failed',error_message:cause instanceof Error?cause.message:String(cause),completed_at:new Date().toISOString()}).eq('id',job.id);throw cause;}
}
