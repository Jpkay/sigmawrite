import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {assessSkills,learningReadiness,type Observation} from "./engine";
import type {EvidenceSkill} from "./v3-adapter";
import {publicAssessmentView,type AssessmentBundle,type StoredSession} from "./service";
import {runLearningCheckCommand} from "./learning-service";
import {createSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
const at=Date.UTC(2026,8,11,12),tomorrow=at+86400000;
const rule={minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true};
const skills:EvidenceSkill[]=["foundation","next"].map((id,index)=>({id,nodeKey:id,evidenceKey:"production",labelFr:id,branch:"grammar",level:index,prerequisites:index?["foundation"]:[],modes:["production"],evidenceRequirements:{production:rule}}));
const history=(correct=true):Observation[]=>Array.from({length:3},(_,i)=>({itemId:`answer-${i}`,skillId:"foundation",mode:"production",contextId:`context-${i}`,correct,guessProbability:.05,activeSeconds:10,unaided:true,occasionId:"learning-day:2026-09-11"}));
function fixture(observations:Observation[]){
 const bundle:AssessmentBundle={taxonomyId:"taxonomy",bankId:"bank",bank:JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")),assessment:{skills,probes:skills.map(s=>({id:`fresh-${s.id}`,skillId:s.id,mode:"production",contextId:`fresh-${s.id}`,difficulty:.5,expectedSeconds:10,guessProbability:.05,usage:"learning"})),taxonomyChecksum:"taxonomy",bankChecksum:"bank"},activities:skills.flatMap(s=>[
 {id:`check-${s.id}`,nodeKey:s.nodeKey,mode:"production",kind:"independent_check",status:"published",titleFr:s.id,href:"/student/diagnostic",probeIds:[`fresh-${s.id}`]},
 {id:`teach-${s.id}`,nodeKey:s.nodeKey,mode:"production",kind:"instruction",status:"published",titleFr:s.id,href:"/student/practice/test"}])};
 const session:StoredSession={id:"11111111-1111-4111-8111-111111111111",studentId:"student",releaseId:"release",state:{...createSession(bindAssessmentRelease(bundle.assessment,bundle)),phase:"learning",completionReason:"time_budget",observations}};
 return {bundle,session};
}
it("defers only today's sufficiently evidenced strength and restores its check tomorrow",()=>{
 const f=fixture(history()),before=structuredClone(f.session);
 const today=publicAssessmentView(f.session,f.bundle,at),later=publicAssessmentView(f.session,f.bundle,tomorrow);
 expect(today.deferredReviewCount).toBe(1);
 expect(today.learningActivities.map(a=>a.activityId)).toEqual(["check-next"]);
 expect(later.deferredReviewCount).toBe(0);
 expect(later.learningActivities.map(a=>a.activityId)).toEqual(["check-foundation","check-next"]);
 expect(today.results[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(later.results).toEqual(today.results);expect(f.session).toEqual(before);
});
it("offers teaching for a sufficiently evidenced gap while keeping the result provisional",()=>{
 const f=fixture(history(false)),view=publicAssessmentView(f.session,f.bundle,at);
 expect(view.learningActivities[0]).toMatchObject({activityId:"teach-foundation",action:"learn"});
 expect(view.results[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(view.deferredReviewCount).toBe(0);
 const readiness=learningReadiness(skills,history(false),at);
 expect(readiness.planningResults).toEqual(assessSkills(skills,history(false)));
 expect(readiness.planningResults[0].modes[0]).toMatchObject({confirmed:false,distinctOccasions:1,provisionalGap:true});
});
it("does not relax question counts, contradictory answers or unaided evidence",()=>{
 for(const observations of [history().slice(0,1),history(false).slice(0,1),history().map((o,i)=>({...o,correct:i!==2})),history().map(o=>({...o,unaided:false}))]){
  const readiness=learningReadiness(skills,observations,at);
  expect(readiness.deferredSkillIds).toEqual([]);
  expect(readiness.planningResults).toEqual(assessSkills(skills,observations));
 }
});
it("does not postpone on a new day based on an aided or duplicate answer",()=>{
 for(const extra of [{...history()[0],occasionId:"learning-day:2026-09-12"},{...history()[0],itemId:"new",occasionId:"learning-day:2026-09-12",unaided:false}]){
  expect(learningReadiness(skills,[...history(),extra],tomorrow).deferredSkillIds).toEqual([]);
 }
});

it("rejects a stale same-day check request without consuming fresh evidence",async()=>{
 const f=fixture(history()),save=vi.fn(async()=>true);
 const response=await runLearningCheckCommand({load:async()=>structuredClone(f.session),release:async()=>f.bundle,save},"student",{type:"start_check",sessionId:f.session.id,revision:f.session.state.revision,activityId:"check-foundation"},()=>at);
 expect(response).toEqual({error:"Cette vérification n’est pas proposée dans ton parcours."});
 expect(save).not.toHaveBeenCalled();
 expect(f.session.state.exposedLearningItemIds).toEqual([]);
});
