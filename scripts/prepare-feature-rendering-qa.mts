/** Focused browser QA only. No fabricated answers, timing, review or mastery.
 * This release must never be configured as the application default. */
import {config} from 'dotenv';
import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {applyQuestionPoolScope} from '../src/lib/diagnostic/granular/question-pools';
import {teachingContentChecksum} from '../src/lib/diagnostic/granular/teaching-content';
import {prepareParallelPublication} from '../src/lib/diagnostic/granular/publication-contract';
import {publishParallelAssessment} from '../src/lib/diagnostic/granular/publisher';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import type {AssessmentBundle} from '../src/lib/diagnostic/granular/service';
config({path:'.env.local',quiet:true});
const key='french-granular-feature-rendering-qa-v1';
const path='tmp/plume-feature-rendering-qa-bundle.json';
const mode=process.argv[2];if(!['prepare','publish','start'].includes(mode))throw Error('Expected prepare, publish or start');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
if(mode==='prepare'){
 const source=await db.from('granular_assessment_releases').select('id,bundle').eq('release_key','french-granular-diagnostic-v19').eq('status','published').single();if(source.error)throw source.error;
 const original=source.data.bundle as AssessmentBundle;
 const target='segmenter_syllabes_ecrites::writing-controlled-production';
 const skill=original.assessment.skills.find(s=>s.id===target);if(!skill||skill.prerequisites.length)throw Error('Expected a self-contained published foundation target');
 const assessment=applyQuestionPoolScope(original.assessment,{version:'french-granular-release-scope-v1',assessmentSkillIds:[target],teachingSkillIds:[target],limitationFr:'Vérification technique ciblée des syllabes écrites. Ce compte de test ne représente pas un diagnostic complet.'});
 const ids=new Set(assessment.probes.map(p=>p.id));
 const teachingContent=original.teachingContent!.filter(l=>l.nodeKey===skill.nodeKey&&l.mode==='production').map(l=>({...l,assessmentExposureIds:l.assessmentExposureIds.filter(id=>ids.has(id))}));
 assessment.reviewPolicy={...assessment.reviewPolicy!,teachingChecksums:Object.fromEntries(teachingContent.map(l=>[l.id,teachingContentChecksum(l)]))};
 const activities=original.activities!.filter(a=>a.nodeKey===skill.nodeKey&&a.mode==='production').map(a=>({...a,...(a.probeIds?{probeIds:a.probeIds.filter(id=>ids.has(id))}:{})}));
 const bundle:AssessmentBundle={...original,assessment,teachingContent,activities};
 const preflight=prepareParallelPublication(bundle);if(!preflight.ready||preflight.assessmentTargets!==1)throw Error('Incomplete focused QA release');
 writeFileSync(path,JSON.stringify(bundle),{flag:'wx',mode:0o600});
 const report={purpose:'Focused deployed rendering QA using real submitted answers. Never an application default or a full diagnostic validation.',sourceReleaseId:source.data.id,key,target,preflight,observationsCreated:0,publicDefaultChanged:false};
 writeFileSync('docs/diagnostic/feature-rendering-qa-preparation-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}else if(mode==='publish'){
 const bundle=JSON.parse(readFileSync(path,'utf8')) as AssessmentBundle;
 if(bundle.assessment.releaseScope?.assessmentSkillIds.length!==1)throw Error('Unexpected QA scope');
 console.log(JSON.stringify(await publishParallelAssessment(db,{bundle,releaseKey:key,publisherProfileId:'b4cd70c7-55bd-45cc-ba21-b47ea038b0f6'})));
}else{
 const c=JSON.parse(readFileSync('tmp/plume-granular-feature-rendering-qa.json','utf8'));
 if(c.username!=='doves.granular.features.qa')throw Error('Wrong QA account');
 const started=await new SupabaseAssessmentStore(db).start(c.studentId,key);if(!started)throw Error('QA release unavailable');
 if(started.session.state.observations.length)throw Error('Existing answers must be resumed, never reset');
 console.log(JSON.stringify({sessionId:started.session.id,releaseId:started.session.releaseId,answers:0}));
}
