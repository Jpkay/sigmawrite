/** Read-only audit of an explicitly supplied technical QA session. No learner writes. */
import {config} from 'dotenv';
import {writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {publicAssessmentView,type AssessmentBundle} from '../src/lib/diagnostic/granular/service';
config({path:process.env.DIAGNOSTIC_ENV_FILE??'.env.local',quiet:true});
const [sessionId,output]=process.argv.slice(2);
if(!sessionId||!output)throw Error('Expected QA session UUID and output JSON path');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const row=await db.from('granular_assessment_sessions').select('id,student_id,release_id,state').eq('id',sessionId).single();if(row.error)throw row.error;
const release=await db.from('granular_assessment_releases').select('bundle').eq('id',row.data.release_id).single();if(release.error)throw release.error;
const bundle=release.data.bundle as AssessmentBundle;
const state=row.data.state;
const view=publicAssessmentView({id:row.data.id,studentId:row.data.student_id,releaseId:row.data.release_id,state},bundle);
if(view.phase!=='learning')throw Error('Diagnostic has not reached final results; no result audit emitted');
const findings:string[]=[];
const entries=view.results.map(result=>{
 const skill=bundle.assessment.skills.find(s=>s.id===result.skillId)!;
 const observations=state.observations.filter((o:{skillId:string})=>o.skillId===skill.id);
 if(result.evidence==='untested'&&(result.status!=='unknown'||result.resolved))findings.push(`Untested skill reported as resolved or known: ${skill.id}`);
 if(result.status==='mastered'&&result.modes.some(m=>!m.confirmed))findings.push(`Mastery without confirmed mode evidence: ${skill.id}`);
 for(const mode of result.modes){
  const requirement=skill.evidenceRequirements?.[mode.mode];
  if(result.status==='mastered'&&requirement&&(mode.distinctItems<requirement.minimumItems||mode.distinctContexts<requirement.minimumContexts||mode.distinctOccasions<requirement.minimumOccasions||mode.accuracy<requirement.minimumAccuracy))findings.push(`Mastery below release evidence minimums: ${skill.id}/${mode.mode}`);
 }
 return {skillId:skill.id,status:result.status,evidence:result.evidence,resolved:result.resolved,diagnosticAnswers:observations.length,diagnosticCorrect:observations.filter((o:{correct:boolean})=>o.correct).length,modes:result.modes};
});
const report={sessionId,releaseId:row.data.release_id,completionReason:state.completionReason,activeSeconds:state.activeSeconds,graphTargets:bundle.assessment.skills.length,reportedTargets:entries.length,diagnosticAnswers:state.observations.length,statusCounts:Object.fromEntries(['mastered','missing','fragile','uncertain','unknown'].map(status=>[status,entries.filter(e=>e.status===status).length])),assessedSkills:entries.filter(e=>e.evidence==='direct'),activities:view.learningActivities.map(a=>({skillId:a.skillId,kind:a.kind,titleFr:a.titleFr})),findings,limitation:'Technical consistency audit, not psychometric validation. Diagnostic counts exclude later refinements; reported mode evidence may include them.'};
if(entries.length!==bundle.assessment.skills.length)findings.push('Incomplete graph result map');
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({sessionId,reportedTargets:entries.length,statusCounts:report.statusCounts,findings}));
if(findings.length)process.exitCode=1;
