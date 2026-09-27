import {expect,it} from "vitest";
import {assessSkills,type Observation} from "./engine";
import {buildGranularPriorities} from "./pathway";
import {planGranularActivities,type LearningActivityBinding} from "./activity-plan";
import {materialIdentity} from "./material-identity";
import type {EvidenceSkill,V3Assessment} from "./v3-adapter";
const rule={minimumItems:3,minimumContexts:3,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true};
const subject:EvidenceSkill={id:"subject",nodeKey:"identifier_sujet_verbe",evidenceKey:"reading-receptive",labelFr:"Sujet",branch:"conjugation",level:0,prerequisites:[],modes:["recognition"],evidenceRequirements:{recognition:rule}};
const agreement:EvidenceSkill[]=["adjacent","separated","inverted","coordinated"].map(construction=>({id:construction,nodeKey:"accorder_sujet_verbe_ecrit",evidenceKey:"writing-controlled-production",facetKey:`accorder_sujet_verbe_ecrit::construction:${construction}`,labelFr:construction,branch:"agreement",level:1,prerequisites:[subject.id],modes:["production"],evidenceRequirements:{production:{...rule,novelWordsRequired:true}}}));
const skills=[subject,...agreement];
const assessment:V3Assessment={taxonomyChecksum:"synthetic-test",bankChecksum:"synthetic-test",skills,probes:[]};
function observations(skill:EvidenceSkill,correct:boolean,count:number,day="day-1",source?:"learning"):Observation[]{
 return Array.from({length:count},(_,index)=>{
  const id=`${skill.id}:${day}:${index}`,key=materialIdentity("word",id);
  return {itemId:id,skillId:skill.id,mode:skill.modes[0],contextId:id,occasionId:day,correct,guessProbability:skill.id===subject.id ? .25 : .5,activeSeconds:20,unaided:true,...(source?{source}:{}),
   // Synthetic verified history isolates planning logic; no real receipt or approval.
   materialReceipt:{presentationId:id,sourceChecksum:"synthetic-test",historyComplete:true,firstRecordedKeys:[key],previouslySeenKeys:[],assessedMaterialKeys:[key]}};
 });
}
const bindings:LearningActivityBinding[]=skills.flatMap(skill=>(["instruction","independent_check"] as const).map(kind=>({id:`synthetic:${skill.id}:${kind}`,nodeKey:skill.nodeKey,facetKey:skill.facetKey,mode:skill.modes[0],kind,status:"published",titleFr:skill.labelFr,href:"/student/diagnostic",...(kind==="instruction"?{contentId:`synthetic-lesson:${skill.id}`}:{})})));
it("starts exact-target teaching for consistent first-sitting gaps without confirming the skill",()=>{
 const evidence=[...observations(subject,true,4),...agreement.flatMap(skill=>observations(skill,!['separated','inverted'].includes(skill.id),7))];
 const results=assessSkills(skills,evidence),snapshot=structuredClone(results);
 expect(results.every(result=>result.status==="uncertain"&&!result.resolved)).toBe(true);
 expect(results.filter(result=>result.modes.some(mode=>mode.provisionalGap)).map(result=>result.skillId)).toEqual(["separated","inverted"]);
 const priorities=buildGranularPriorities(skills,results,10);
 expect(priorities.filter(priority=>priority.action==="learn").map(priority=>priority.skillId).sort()).toEqual(["inverted","separated"]);
 expect(priorities.filter(priority=>priority.action==="learn").every(priority=>priority.reason==="provisional_gap")).toBe(true);
 const plan=planGranularActivities(assessment,results,bindings,10);
 expect(plan.activities.filter(activity=>activity.kind==="instruction").map(activity=>activity.skillId).sort()).toEqual(["inverted","separated"]);
 expect(results).toEqual(snapshot);
});
it("does not turn skips, absent novelty or insufficient context into a teaching diagnosis",()=>{
 const target={...agreement[0],prerequisites:[]},base=observations(target,false,3);
 for(const evidence of [[],base.map(o=>({...o,skipped:true as const})),base.map(o=>({...o,materialReceipt:undefined})),base.map(o=>({...o,contextId:"same"})),[base[0],{...base[1],correct:true},base[2]]]){
  const results=assessSkills([target],evidence);
  expect(results[0].modes.some(mode=>mode.provisionalGap)).toBe(false);
  expect(buildGranularPriorities([target],results)[0].action).toBe("verify");
 }
});
it("keeps prerequisite readiness and moves completed provisional teaching to verification",()=>{
 const target=agreement[0],results=assessSkills([subject,target],observations(target,false,3));
 const graph={...assessment,skills:[subject,target]};
 expect(planGranularActivities(graph,results,bindings).activities.some(activity=>activity.kind==="instruction")).toBe(false);
 const ready=assessSkills(graph.skills,[...observations(subject,true,4),...observations(target,false,3)]);
 const plan=planGranularActivities(graph,ready,bindings,10,new Set([`synthetic-lesson:${target.id}`]));
 expect(plan.activities.find(activity=>activity.skillId===target.id)).toMatchObject({action:"verify",kind:"independent_check"});
 expect(ready.find(result=>result.skillId===target.id)).toMatchObject({status:"uncertain",resolved:false});
});
it("still requires separate later occasions before a new success establishes mastery",()=>{
 const target=agreement[0],initial=observations(target,false,3);
 const day2=observations(target,true,7,"day-2","learning"),day3=observations(target,true,7,"day-3","learning");
 expect(assessSkills([target],[...initial,...day2])[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(assessSkills([target],[...initial,...day2,...day3])[0]).toMatchObject({status:"mastered",resolved:true});
});
