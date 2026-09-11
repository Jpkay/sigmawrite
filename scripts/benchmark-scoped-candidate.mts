import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import type {V3Assessment,EvidenceSkill} from "../src/lib/diagnostic/granular/v3-adapter";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {availableLearningBindings,planGranularActivities} from "../src/lib/diagnostic/granular/activity-plan";
import {learningReadiness} from "../src/lib/diagnostic/granular/engine";
import {learningSeenQuestionIds} from "../src/lib/diagnostic/granular/learning-exposure";
import {knownExposedMaterialKeys,probeRepeatsKnownTarget} from "../src/lib/diagnostic/granular/engine";
import {bindAssessmentRelease} from "../src/lib/diagnostic/granular/release-binding";
import {createSession,transitionSession,sessionView,type SessionEvent} from "../src/lib/diagnostic/granular/session";
const candidate=JSON.parse(readFileSync("docs/diagnostic/v3-scoped-review-candidate.json","utf8"));
const assessment:V3Assessment=candidate.assessment;
// Simulated publication only for exercising planning; no DB writes or approvals.
const activities:LearningActivityBinding[]=candidate.activities.map((a:LearningActivityBinding)=>({...a,status:"published"}));
const release=bindAssessmentRelease(assessment,{taxonomyId:"simulation",bankId:"simulation"});
const profiles:Array<{id:string;knows:(s:EvidenceSkill)=>boolean}>=[
 {id:"all_correct",knows:()=>true},{id:"all_incorrect",knows:()=>false},
 {id:"reading_strong",knows:s=>s.domain==="reading_comprehension"},
 {id:"conjugation_strong",knows:s=>s.domain==="conjugation"},
 {id:"recognition_strong",knows:s=>s.modes[0]==="recognition"},
 {id:"grammar_strong",knows:s=>s.domain==="grammar"},
];
const supported=new Set(assessment.releaseScope!.assessmentSkillIds);
const runs=profiles.map(profile=>{
 let state=createSession(release),at=Date.parse("2026-09-11T10:00:00Z"),presented=0;
 const apply=(event:SessionEvent)=>{state=transitionSession({state,release,expectedRevision:state.revision,event,skills:assessment.skills,bank:assessment.probes,releaseScope:assessment.releaseScope});};
 apply({type:"resume",at});
 while(state.phase==="assessing"){
  const probe=assessment.probes.find(p=>p.id===state.pendingItemId);
  if(!probe||++presented>150)throw Error("Missing question or unbounded session");
  if(presented===8){apply({type:"pause",at});const before=state.activeSeconds;at+=3600_000;apply({type:"resume",at});if(before!==state.activeSeconds)throw Error("Pause charged as active time");}
  let seconds=probe.expectedSeconds;
  while(seconds>30){at+=30_000;apply({type:"pulse",at});seconds-=30;}
  at+=seconds*1000;
  const skill=assessment.skills.find(s=>s.id===probe.skillId)!;
  apply({type:"answer",at,itemId:probe.id,correct:profile.knows(skill),materialReceipt:{presentationId:`simulation:${probe.id}`,sourceChecksum:checksum(probe),historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}});
 }
 const view=sessionView(state,assessment.skills);
 const seen=learningSeenQuestionIds(state,assessment.probes);
 const material=knownExposedMaterialKeys(assessment.probes,state.observations,state.exposedLearningItemIds,state.exposedMaterialKeys??[]);
 for(const probe of assessment.probes)if(probeRepeatsKnownTarget(probe,assessment.skills.find(s=>s.id===probe.skillId)!,material))seen.add(probe.id);
 const readiness=learningReadiness(assessment.skills,state.observations,at);
 const plan=planGranularActivities(assessment,readiness.planningResults,availableLearningBindings(assessment,activities,seen));
 const violations:string[]=[];
 if(state.completionReason==="coverage_gap")violations.push("supported_pool_coverage_gap");
 if(state.activeSeconds>40*60)violations.push("over_40_minutes");
 if(view.results.length!==assessment.skills.length)violations.push("pruned_results_map");
 if(view.results.some(r=>!supported.has(r.skillId)&&(r.status!=="unknown"||r.evidence!=="untested")))violations.push("deferred_skill_inferred");
 if(!plan.activities.length)violations.push("no_next_activity");
 const probabilities=(known:boolean)=>view.results.filter(result=>result.evidence==="direct"&&profile.knows(assessment.skills.find(s=>s.id===result.skillId)!)===known).flatMap(result=>result.modes.map(mode=>mode.probability));
 const known=probabilities(true),weak=probabilities(false);
 if(known.length&&weak.length&&Math.min(...known)<=Math.max(...weak))violations.push("mixed_profile_probabilities_not_separated");
 return {profile:profile.id,completionReason:state.completionReason,activeMinutes:state.activeSeconds/60,questions:state.observations.length,correct:state.observations.filter(o=>o.correct).length,sampledTargets:new Set(state.observations.map(o=>o.skillId)).size,results: view.results.reduce<Record<string,number>>((acc,r)=>(acc[r.status]=(acc[r.status]??0)+1,acc),{}),sampledSkills:view.results.filter(result=>result.evidence==="direct").map(result=>{const skill=assessment.skills.find(s=>s.id===result.skillId)!;return {skillId:skill.id,labelFr:skill.labelFr,mode:skill.modes[0],expectedKnown:profile.knows(skill),status:result.status,modes:result.modes};}),firstActivities:plan.activities,missingActivitySkillIds:plan.missingActivitySkillIds,blockedSkillIds:plan.blockedSkillIds,violations};
});
const report={candidateChecksum:candidate.checksum,method:"Pure server-state simulation using actual candidate pools, deterministic correct/incorrect skill profiles and expected response times; not browser, grading, database, or pedagogical validation",runs};
writeFileSync("docs/diagnostic/v3-scoped-simulation.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(runs.map(({profile,completionReason,activeMinutes,questions,correct,sampledTargets,missingActivitySkillIds,violations})=>({profile,completionReason,activeMinutes,questions,correct,sampledTargets,missingActivities:missingActivitySkillIds.length,violations}))));
if(runs.some(r=>r.violations.length))process.exitCode=1;
