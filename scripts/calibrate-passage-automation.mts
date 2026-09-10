/** Real service calibration. No publication or policy activation. Run with node --env-file=<private-env> --import tsx. */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { evaluateAutomatedPassage, evaluatorConfig } from '../src/lib/content/automation/evaluate';
import { PASSAGE_QA_VERSION } from '../src/lib/content/automation/policy';
import type { ContentCandidate } from '../src/lib/ai/pipeline';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const {data:versions,error}=await db.from('content_review_versions').select('id,candidate_id,payload,review_assignments(passage_reviews(status,overall_decision,reviewer_profile_id))').not('workflow_status','in','(retired,rejected)').order('created_at');
if(error) throw error;
const references=(versions??[]).filter(v=>new Set(v.review_assignments.flatMap(a=>a.passage_reviews??[]).filter(r=>r.status==='submitted'&&['approve','approve_minor'].includes(r.overall_decision)).map(r=>r.reviewer_profile_id)).size>=1).sort((a,b)=>{const eligible=(v:typeof a)=>{const c=v.payload as ContentCandidate;return Number(c.input.textType==='expository'&&c.generated.questions.every(q=>q.answerFormat==='multiple_choice'));};return eligible(b)-eligible(a);}).slice(0,6);
if(references.length<6) throw new Error('Six reference versions with at least one favorable human review each required');
const cases:Array<Record<string,unknown>>=[];
async function evaluate(candidate:ContentCandidate,generator:string,label:string,negative=false){
 try {const report=await evaluateAutomatedPassage(candidate,generator,db);cases.push({label,negative,report});console.log(JSON.stringify({label,decision:report.decision,reasons:report.reasons}));}
 catch(cause){cases.push({label,negative,error:cause instanceof Error?cause.message:String(cause)});console.log(JSON.stringify({label,error:cases.at(-1)!.error}));}
}
for(const v of references){
 const {data:row,error}=await db.from('ai_generated_candidates').select('generation_job_id').eq('id',v.candidate_id).single();if(error)throw error;
 const {data:job,error:jobError}=await db.from('ai_generation_jobs').select('model_id').eq('id',row.generation_job_id).single();if(jobError)throw jobError;
 const candidate={...v.payload,id:v.candidate_id} as ContentCandidate;
 await evaluate(candidate,job.model_id,v.id);
}
// Deliberately wrong answer key and duplicate answers test question-level rejection.
const source=references.find(v=>(v.payload as ContentCandidate).generated.questions.some(q=>q.answerFormat==='multiple_choice'&&q.choices&&q.choices.length>1));
if(!source)throw new Error('No multiple-choice reference for negative controls');
for(const mode of ['wrong_key','ambiguous_choices']){
 const candidate=structuredClone({...source.payload,id:source.candidate_id}) as ContentCandidate;
 const q=candidate.generated.questions.find(q=>q.answerFormat==='multiple_choice'&&q.choices&&q.choices.length>1)!;
 if(mode==='wrong_key')q.correctAnswer=q.choices!.find(c=>c!==q.correctAnswer)!;else q.choices!.push(q.correctAnswer!);
 const {data:row}=await db.from('ai_generated_candidates').select('generation_job_id').eq('id',source.candidate_id).single();
 const {data:job}=await db.from('ai_generation_jobs').select('model_id').eq('id',row!.generation_job_id).single();
 await evaluate(candidate,job!.model_id,mode,true);
}
const acceptedCases=cases.filter(c=>!c.negative&&(c.report as {decision?:string})?.decision==='pass').length;
const falseAccepts=cases.filter(c=>c.negative&&(c.report as {decision?:string})?.decision==='pass').length;
const errors=cases.filter(c=>c.error).length;
const report={requiredHumanReviewsPerReference:1,reviewedCases:references.length,negativeCases:2,acceptedCases,falseAccepts,errors,cases};
const passed=errors===0&&falseAccepts===0&&acceptedCases>=1;
const output={pipeline_version:PASSAGE_QA_VERSION,evaluator_model:evaluatorConfig().model,report,passed};
const out=process.env.PASSAGE_CALIBRATION_OUTPUT??'/tmp/sigmawrite-passage-calibration.json';writeFileSync(out,JSON.stringify(output,null,2)+'\n');
if(process.argv.includes('--record')){const {error}=await db.from('passage_automation_calibrations').insert(output);if(error)throw error;}
console.log(JSON.stringify({passed,reviewedCases:references.length,negativeCases:2,acceptedCases,falseAccepts,errors,output:out}));
if(!passed)process.exitCode=1;
