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
const profiles:Array<{id:string;knows:(s:EvidenceSkill)=>boolean;contrast?:{known:(s:EvidenceSkill)=>boolean;weak:(s:EvidenceSkill)=>boolean}}>=[
 ...[
  {id:"present_avoir_known_aller_weak",known:(s:EvidenceSkill)=>s.id==="produire_present_indicatif::writing-controlled-production::verb:avoir",weak:(s:EvidenceSkill)=>s.id==="produire_present_indicatif::writing-controlled-production::verb:aller"},
  {id:"determiner_agreement_known_subject_agreement_weak",known:(s:EvidenceSkill)=>s.nodeKey==="construction_accord_determinant_nom",weak:(s:EvidenceSkill)=>s.nodeKey==="construction_accord_sujet_verbe"},
  {id:"m_before_mbp_known_cedilla_weak",known:(s:EvidenceSkill)=>s.nodeKey==="appliquer_m_devant_m_b_p",weak:(s:EvidenceSkill)=>s.nodeKey==="employer_cedille"},
  {id:"literal_chronology_known_causal_inference_weak",known:(s:EvidenceSkill)=>s.nodeKey==="ordonner_evenements_explicites",weak:(s:EvidenceSkill)=>s.nodeKey==="inferer_cause_locale"},
 ].map(contrast=>({id:contrast.id,knows:(skill:EvidenceSkill)=>!contrast.weak(skill),contrast})),
 {id:"all_correct",knows:()=>true},{id:"all_incorrect",knows:()=>false},
 {id:"reading_strong",knows:s=>s.domain==="reading_comprehension"},
 {id:"conjugation_strong",knows:s=>s.domain==="conjugation"},
 {id:"recognition_strong",knows:s=>s.modes[0]==="recognition"},
 {id:"grammar_strong",knows:s=>s.domain==="grammar"},
];
const supported=new Set(assessment.releaseScope!.assessmentSkillIds);
const runs=profiles.map(profile=>{
 const delivered=new Set<string>();
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
  apply({type:"answer",at,itemId:probe.id,correct:profile.knows(skill),materialReceipt:{presentationId:`simulation:${probe.id}`,sourceChecksum:checksum(probe),historyComplete:true,firstRecordedKeys:(probe.materialKeys??[]).filter(k=>!delivered.has(k)),previouslySeenKeys:(probe.materialKeys??[]).filter(k=>delivered.has(k)),assessedMaterialKeys:probe.assessedMaterialKeys}});
  for(const key of probe.materialKeys??[])delivered.add(key);
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
 const sampled=new Set(state.observations.map(o=>o.skillId));
 const contrastCoverage=profile.contrast?Object.fromEntries((["known","weak"] as const).map(side=>{const intended=assessment.skills.filter(profile.contrast![side]).map(s=>s.id);return [side,{intended,sampled:intended.filter(id=>sampled.has(id)),unsampled:intended.filter(id=>!sampled.has(id))}];})):undefined;
 const targetedFollowup=profile.contrast?assessment.skills.filter(profile.contrast.weak).filter(s=>sampled.has(s.id)).map(skill=>{
  const ancestors=new Set<string>(),visit=(id:string)=>{for(const parent of assessment.skills.find(s=>s.id===id)?.prerequisites??[]){if(ancestors.has(parent))continue;ancestors.add(parent);visit(parent);}};visit(skill.id);
  const result=view.results.find(r=>r.skillId===skill.id)!;
  return {skillId:skill.id,resultStatus:result.status,directlyPlanned:plan.activities.filter(a=>a.skillId===skill.id).map(a=>a.titleFr),prerequisiteActivities:plan.activities.filter(a=>ancestors.has(a.skillId)).map(a=>({skillId:a.skillId,titleFr:a.titleFr})),blocked:plan.blockedSkillIds.includes(skill.id)};
 }):undefined;
 const contrastStatus=contrastCoverage?(contrastCoverage.known.sampled.length&&contrastCoverage.weak.sampled.length?"both_sides_sampled":"not_fully_exercised"):undefined;
 return {profile:profile.id,contrastStatus,contrastCoverage,targetedFollowup,completionReason:state.completionReason,activeMinutes:state.activeSeconds/60,questions:state.observations.length,correct:state.observations.filter(o=>o.correct).length,sampledTargets:new Set(state.observations.map(o=>o.skillId)).size,results: view.results.reduce<Record<string,number>>((acc,r)=>(acc[r.status]=(acc[r.status]??0)+1,acc),{}),sampledSkills:view.results.filter(result=>result.evidence==="direct").map(result=>{const skill=assessment.skills.find(s=>s.id===result.skillId)!;return {skillId:skill.id,labelFr:skill.labelFr,mode:skill.modes[0],expectedKnown:profile.knows(skill),status:result.status,modes:result.modes};}),firstActivities:plan.activities,missingActivitySkillIds:plan.missingActivitySkillIds,blockedSkillIds:plan.blockedSkillIds,violations};
});
const report={candidateChecksum:candidate.checksum,method:"Pure server-state simulation using actual candidate pools, deterministic correct/incorrect skill profiles and expected response times; synthetic complete starting history with a ledger retaining repeated exposures; not browser, grading, database, or pedagogical validation",runs};
const outputIndex=process.argv.indexOf("--output"),outputPath=outputIndex<0?"docs/diagnostic/v3-scoped-simulation.json":process.argv[outputIndex+1];if(!outputPath||outputPath.startsWith("--"))throw Error("Missing --output path");
writeFileSync(outputPath,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(runs.map(({profile,completionReason,activeMinutes,questions,correct,sampledTargets,missingActivitySkillIds,violations})=>({profile,completionReason,activeMinutes,questions,correct,sampledTargets,missingActivities:missingActivitySkillIds.length,violations}))));
if(runs.some(r=>r.violations.length))process.exitCode=1;
