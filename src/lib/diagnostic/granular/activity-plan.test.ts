import {expect,it} from "vitest";
import {planGranularActivities,type LearningActivityBinding} from "./activity-plan";
import {assessSkills} from "./engine";
import type {V3Assessment,EvidenceSkill} from "./v3-adapter";
const skills:EvidenceSkill[]=["etre","avoir"].map(verb=>({id:verb,nodeKey:"present",evidenceKey:"production",facetKey:verb,labelFr:verb,branch:verb,level:0,modes:["production"],prerequisites:[]}));
const assessment:V3Assessment={skills,probes:[],taxonomyChecksum:"taxonomy",bankChecksum:"bank"};
const binding=(id:string,facetKey:string|undefined,kind:LearningActivityBinding["kind"]):LearningActivityBinding=>({id,nodeKey:"present",facetKey,kind,mode:"production",status:"published",titleFr:id,href:`/student/practice/${id}`});
it("cannot substitute broad present-tense practice for a specific verb gap",()=>{
 const result=planGranularActivities(assessment,assessSkills(skills,[]),[binding("broad",undefined,"independent_check")]);
 expect(result.activities).toHaveLength(0);expect(result.missingActivitySkillIds).toEqual(["avoir","etre"]);
});
it("verification uses an independent check rather than instructional answers",()=>{
 const result=planGranularActivities(assessment,assessSkills(skills,[]),[binding("lesson","etre","instruction"),binding("check","avoir","independent_check")]);
 expect(result.activities.map(a=>a.activityId)).toEqual(["check"]);
});
it("does not route into an unavailable prerequisite or a draft activity",()=>{
 const graph={...assessment,skills:[skills[0],{...skills[1],prerequisites:["etre"]}]};
 const result=planGranularActivities(graph,assessSkills(graph.skills,[]),[{...binding("draft","etre","independent_check"),status:"draft"},binding("dependent","avoir","independent_check")]);
 expect(result.activities).toHaveLength(0);expect(result.blockedSkillIds).toContain("avoir");
});
it("does not offer a dependent lesson merely because its missing prerequisite has a lesson available",()=>{
 const graph={...assessment,skills:[skills[0],{...skills[1],prerequisites:["etre"]}]};
 const observations=graph.skills.flatMap(s=>Array.from({length:3},(_,i)=>({itemId:`${s.id}-${i}`,skillId:s.id,mode:"production" as const,contextId:`context-${i}`,correct:false,guessProbability:.05,activeSeconds:10})));
 const plan=planGranularActivities(graph,assessSkills(graph.skills,observations),[binding("foundation-lesson","etre","instruction"),binding("dependent-lesson","avoir","instruction")]);
 expect(plan.activities.map(a=>a.activityId)).toEqual(["foundation-lesson"]);
 expect(plan.blockedSkillIds).toContain("avoir");
});
it("allows advancement at readiness without marking the prerequisite mastered",()=>{
 const graph={...assessment,skills:[skills[0],{...skills[1],prerequisites:["etre"]}]};
 const observations=graph.skills.flatMap(s=>Array.from({length:3},(_,i)=>({itemId:`${s.id}-${i}`,skillId:s.id,mode:"production" as const,contextId:`context-${i}`,correct:false,guessProbability:.05,activeSeconds:10})));
 const results=assessSkills(graph.skills,observations);
 results[0]={...results[0],status:"uncertain",resolved:false,modes:results[0].modes.map(mode=>({...mode,probability:.65,confirmed:false}))};
 const bindings=[binding("foundation-check","etre","independent_check"),binding("dependent-lesson","avoir","instruction")];
 const snapshot=structuredClone(results);
 expect(planGranularActivities(graph,results,bindings).activities.map(a=>a.activityId)).toEqual(["foundation-check","dependent-lesson"]);
 expect(results).toEqual(snapshot);
 results[0].modes[0].probability=.64;
 expect(planGranularActivities(graph,results,bindings).activities.map(a=>a.activityId)).toEqual(["foundation-check"]);
 results[0].modes[0].probability=.99;results[0].modes[0].distinctItems=0;
 expect(planGranularActivities(graph,results,bindings).activities.map(a=>a.activityId)).toEqual(["foundation-check"]);
});
it("can independently verify an advanced skill even when its prerequisite is weak",()=>{
 const graph={...assessment,skills:[skills[0],{...skills[1],prerequisites:["etre"]}]};
 const evidence=Array.from({length:3},(_,i)=>({itemId:`base-${i}`,skillId:"etre",mode:"production" as const,contextId:`context-${i}`,correct:false,guessProbability:.05,activeSeconds:10}));
 const plan=planGranularActivities(graph,assessSkills(graph.skills,evidence),[binding("foundation-lesson","etre","instruction"),binding("advanced-check","avoir","independent_check")]);
 expect(plan.activities.map(a=>a.activityId)).toEqual(["foundation-lesson","advanced-check"]);
});
it("does not use recognition readiness as a substitute for a required production mode",()=>{
 const graph={...assessment,skills:[{...skills[0],modes:["recognition","production"] as const},{...skills[1],prerequisites:["etre"]}]};
 const observations=graph.skills.flatMap(s=>s.modes.flatMap(mode=>Array.from({length:3},(_,i)=>({itemId:`${s.id}-${mode}-${i}`,skillId:s.id,mode,contextId:`context-${i}`,correct:s.id==="etre"&&mode==="recognition",guessProbability:.05,activeSeconds:10}))));
 const results=assessSkills(graph.skills,observations),plan=planGranularActivities(graph,results,[binding("foundation-check","etre","independent_check"),binding("dependent-lesson","avoir","instruction")]);
 expect(plan.activities.map(a=>a.activityId)).toEqual(["foundation-check"]);
 expect(plan.blockedSkillIds).toContain("avoir");
});
it("keeps deferred targets unknown and restricts instruction to teaching scope",()=>{
 const scoped:V3Assessment={...assessment,releaseScope:{version:"french-granular-release-scope-v1",assessmentSkillIds:["etre"],teachingSkillIds:[],limitationFr:"Couverture en cours."}};
 const results=assessSkills(skills,[]),before=structuredClone(results);
 const checks=[binding("supported","etre","independent_check"),binding("deferred","avoir","independent_check")];
 const plan=planGranularActivities(scoped,results,checks);
 expect(plan.activities.map(a=>a.activityId)).toEqual(["supported"]);
 expect(plan.missingActivitySkillIds).not.toContain("avoir");
 expect(results).toEqual(before);
 const wrong=Array.from({length:3},(_,i)=>({itemId:`wrong-${i}`,skillId:"etre",mode:"production" as const,contextId:`wrong-${i}`,correct:false,guessProbability:.05,activeSeconds:10}));
 const gaps=assessSkills(skills,wrong),lesson=binding("lesson","etre","instruction");
 expect(planGranularActivities(scoped,gaps,[lesson]).activities).toHaveLength(0);
 expect(planGranularActivities({...scoped,releaseScope:{...scoped.releaseScope!,teachingSkillIds:["etre"]}},gaps,[lesson]).activities.map(a=>a.activityId)).toEqual(["lesson"]);
});
it('offers different areas while retaining priority order within each area',()=>{
 const graph:V3Assessment={...assessment,skills:['a-grammar','b-grammar','c-grammar','z-reading'].map(id=>({id,nodeKey:id,evidenceKey:'production',labelFr:id,branch:id,domain:id.endsWith('reading')?'reading':'grammar',level:0,modes:['production'],prerequisites:[]}))};
 const bindings:LearningActivityBinding[]=graph.skills.map(s=>({id:`check:${s.id}`,nodeKey:s.nodeKey,kind:'independent_check',mode:'production',status:'published',titleFr:s.labelFr,href:'/student/check'}));
 const results=assessSkills(graph.skills,[]),snapshot=structuredClone(results);
 expect(planGranularActivities(graph,results,bindings,3).activities.map(a=>a.skillId)).toEqual(['a-grammar','z-reading','b-grammar']);
 expect(results).toEqual(snapshot);
 expect(results.every(r=>r.status==='unknown')).toBe(true);
});
it('keeps recent lesson follow-ups visible without removing other subject areas',()=>{
 const graph:V3Assessment={...assessment,skills:['a-spelling','b-spelling','z-spelling','reading'].map(id=>({id,nodeKey:id,evidenceKey:'production',labelFr:id,branch:id,domain:id==='reading'?'reading':'spelling',level:0,modes:['production'],prerequisites:[]}))};
 const bindings:LearningActivityBinding[]=graph.skills.flatMap(s=>[
  {id:`check:${s.id}`,nodeKey:s.nodeKey,kind:'independent_check' as const,mode:'production' as const,status:'published' as const,titleFr:s.labelFr,href:'/student/check'},
  {id:`lesson:${s.id}`,nodeKey:s.nodeKey,kind:'instruction' as const,contentId:`content:${s.id}`,mode:'production' as const,status:'published' as const,titleFr:s.labelFr,href:'/student/check'},
 ]);
 const results=assessSkills(graph.skills,[]),before=structuredClone(results);
 const plan=planGranularActivities(graph,results,bindings,2,new Set(['content:a-spelling','content:z-spelling']));
 expect(plan.activities.map(a=>a.skillId)).toEqual(['z-spelling','reading']);
 expect(results).toEqual(before);
 const withoutFresh=bindings.filter(b=>b.id!=='check:z-spelling');
 expect(planGranularActivities(graph,results,withoutFresh,2,new Set(['content:z-spelling'])).activities.map(a=>a.skillId)).toEqual(['a-spelling','reading']);
});
