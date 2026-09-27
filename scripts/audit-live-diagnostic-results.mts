/** Read-only audit of a completed, explicitly provisioned technical QA diagnostic. */
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {retryQaRead} from './lib/retry-qa-read';
import {assessSkills,type Observation} from '../src/lib/diagnostic/granular/engine';
import {auditNoveltyCoverage} from '../src/lib/diagnostic/granular/novelty-coverage-audit';
import type {AssessmentBundle} from '../src/lib/diagnostic/granular/service';
config({path:'.env.local',quiet:true});
function option(flag:string){const i=process.argv.indexOf(flag);if(i<0||!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw Error(`Required ${flag}`);return process.argv[i+1];}
const credentials=JSON.parse(readFileSync(option('--credentials-file'),'utf8'));
if(!/^doves\.granular\..*\.qa$/.test(credentials.username??''))throw Error('Only a provisioned technical QA account is allowed');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const row=await retryQaRead(()=>admin.from('granular_assessment_sessions').select('id,state,release_id').eq('student_id',credentials.studentId).eq('id',option('--session-id')).single());if(row.error)throw row.error;
if(row.data.state.phase!=='learning')throw Error('Diagnostic is not complete; do not label an interim snapshot as results');
const release=await retryQaRead(()=>admin.from('granular_assessment_releases').select('release_key,bundle').eq('id',row.data.release_id).single());if(release.error)throw release.error;
const bundle=release.data.bundle as AssessmentBundle,observations=row.data.state.observations as Observation[];
// Initial diagnostic only: later lesson/check responses are intentionally excluded.
const results=assessSkills(bundle.assessment.skills,observations);
const novelty=auditNoveltyCoverage(bundle.assessment.skills,observations);
const sampled=bundle.assessment.skills.flatMap(skill=>{
 const responses=observations.filter(o=>o.skillId===skill.id),result=results.find(r=>r.skillId===skill.id)!;
 if(!responses.length)return [];
 return [{skillId:skill.id,labelFr:skill.labelFr,domain:skill.domain??skill.branch,correct:responses.filter(o=>!o.skipped&&o.correct).length,incorrect:responses.filter(o=>!o.skipped&&!o.correct).length,skipped:responses.filter(o=>o.skipped).length,status:result.status,resolved:result.resolved,modes:result.modes,unverifiedNoveltyResponses:novelty.rows.filter(r=>r.skillId===skill.id&&!r.verified).length}];
});
const report={sessionId:row.data.id,releaseKey:release.data.release_key,completionReason:row.data.state.completionReason,activeSeconds:row.data.state.activeSeconds,answers:observations.filter(o=>!o.skipped).length,correct:observations.filter(o=>!o.skipped&&o.correct).length,incorrect:observations.filter(o=>!o.skipped&&!o.correct).length,graphTargets:results.length,sampledTargets:sampled.length,statusCounts:Object.fromEntries([...new Set(results.map(r=>r.status))].map(status=>[status,results.filter(r=>r.status===status).length])),noveltyCoverage:{requiredResponses:novelty.requiredObservations,verifiedResponses:novelty.verifiedObservations,incompleteHistoryResponses:novelty.incompleteHistoryObservations},sampled,limits:['One deliberately mixed technical QA run, not a calibrated learner profile or classroom validation.','Results recomputed from saved initial observations and the immutable release; later learning responses excluded.','A correct response is not necessarily eligible mastery evidence. See incomplete-history and per-mode eligibility counts.']};
writeFileSync(option('--output'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({...report,sampled:undefined}));
