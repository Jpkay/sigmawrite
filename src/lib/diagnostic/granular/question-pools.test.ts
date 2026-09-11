import {expect,it} from "vitest";
import {allocateQuestionPools,inspectQuestionPools} from "./question-pools";
import {checksum} from "@/lib/taxonomy/validate";
import {selectProbe,assessSkills,type Observation} from "./engine";
import type {V3Assessment} from "./v3-adapter";
import {bindAssessmentRelease} from "./release-binding";
import {createSession,transitionSession} from "./session";
function fixture(count=8):V3Assessment{
 return {taxonomyChecksum:"tax",bankChecksum:"bank",facetChecksum:"facets",skills:[{id:"skill",nodeKey:"node",evidenceKey:"production",labelFr:"Skill",branch:"branch",level:0,modes:["production"],prerequisites:[],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,featureRequirements:[{feature:"change",minimumItems:3,minimumContexts:2}]}}}],
 probes:Array.from({length:count},(_,i)=>({id:`question-${i}`,skillId:"skill",mode:"production",contextId:`verb-${i%2}`,difficulty:.5,expectedSeconds:20,guessProbability:.05,evidenceFeatures:["change"]}))};
}
it("keeps both pools sufficient, disjoint, stable and release-pinned",()=>{
 const source=fixture(),before=JSON.stringify(source),result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(inspectQuestionPools(result.assessment)).toEqual({ok:true,issues:[]});
 const initial=result.assessment.probes.filter(p=>p.usage==="initial"),learning=result.assessment.probes.filter(p=>p.usage==="learning");
 for(const pool of [initial,learning]){
  expect(pool.length).toBeGreaterThanOrEqual(3);
  expect(new Set(pool.map(p=>p.contextId)).size).toBeGreaterThanOrEqual(2);
 }
 expect(initial.some(p=>learning.some(q=>q.id===p.id))).toBe(false);
 expect(allocateQuestionPools(source)).toEqual(result);
 expect(JSON.stringify(source)).toBe(before);
 expect(bindAssessmentRelease(source,{taxonomyId:"t",bankId:"b"}).checksum).not.toBe(bindAssessmentRelease(result.assessment,{taxonomyId:"t",bankId:"b"}).checksum);
});
it("reserves enough MCQs for confirmation instead of passing a count that only permits lucky guessing",()=>{
 const short=fixture(6);short.probes.forEach(p=>p.guessProbability=.25);
 expect(allocateQuestionPools(short).ready).toBe(false);
 const full=fixture(8);full.probes.forEach(p=>p.guessProbability=.25);
 const allocated=allocateQuestionPools(full);
 expect(allocated.ready).toBe(true);
 for(const usage of ["initial","learning"]){
  const pool=allocated.assessment.probes.filter(p=>p.usage===usage);
  expect(pool).toHaveLength(4);
  const answers=pool.map((p,index)=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,guessProbability:p.guessProbability,correct:true,unaided:true,occasionId:`occasion-${index}`,activeSeconds:10,evidenceFeatures:p.evidenceFeatures}));
  expect(assessSkills(full.skills,answers)[0].status).toBe("mastered");
 }
 // Total pool probability is not enough when the distinguishing feature itself
 // is demonstrated only by three four-choice questions.
 const scarceFeature=fixture(10);scarceFeature.probes.forEach((p,index)=>{p.guessProbability=.25;if(index>=6)p.evidenceFeatures=[];});
 expect(allocateQuestionPools(scarceFeature).ready).toBe(false);
});
it("validates stored pool assignments instead of trusting claimed readiness or reallocating",()=>{
 expect(inspectQuestionPools({...fixture(2),poolAllocationReady:true}).ok).toBe(false);
 expect(inspectQuestionPools(null).ok).toBe(false);
 const {assessment}=allocateQuestionPools(fixture());
 while(assessment.probes.filter(p=>p.usage==="learning").length>2)assessment.probes.find(p=>p.usage==="learning")!.usage="initial";
 expect(inspectQuestionPools(assessment).issues).toContain("Question-pool checksum mismatch");
 // A recomputed envelope cannot hide an undersized actual reserve.
 assessment.poolChecksum=checksum({version:"granular-question-pools-v1",assignments:assessment.probes.map(p=>({id:p.id,usage:p.usage})).sort((a,b)=>a.id.localeCompare(b.id))});
 expect(inspectQuestionPools(assessment).issues.some(issue=>issue.startsWith("Insufficient learning pool"))).toBe(true);
 const duplicate=allocateQuestionPools(fixture()).assessment;
 duplicate.probes[1].id=duplicate.probes[0].id;
 expect(inspectQuestionPools(duplicate).issues).toContain("Duplicate question identity across pools");
});
it("does not steal scarce questions or call a search limit proven content insufficiency",()=>{
 const source=fixture(5),result=allocateQuestionPools(source);
 expect(result.ready).toBe(false);
 expect(result.coverage[0].status).toBe("insufficient_coverage");
 expect(result.assessment.probes.every(p=>p.usage==="initial")).toBe(true);
 const shortFeatures=fixture();shortFeatures.probes[0].evidenceFeatures=[];shortFeatures.probes[1].evidenceFeatures=[];shortFeatures.probes[2].evidenceFeatures=[];
 expect(allocateQuestionPools(shortFeatures).ready).toBe(false);
 expect(allocateQuestionPools(fixture(),1).coverage[0].status).toBe("search_limit");
});
it("hands unresolved work to learning after initial questions are exhausted without serving the reserve",()=>{
 const {assessment}=allocateQuestionPools(fixture());
 const initial=assessment.probes.filter(p=>p.usage==="initial");
 const observations:Observation[]=initial.map((p,i)=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,correct:i%2===0,activeSeconds:20,guessProbability:.05,unaided:true,evidenceFeatures:p.evidenceFeatures}));
 expect(selectProbe(assessment.skills,assessment.probes,observations)).toMatchObject({kind:"provisional",reason:"later_evidence_required"});
 const next=selectProbe(assessment.skills,assessment.probes,[]);
 expect(next.kind).toBe("question");if(next.kind==="question")expect(next.item.usage).toBe("initial");
});
it("enforces pool ownership in saved-session transitions and defers learning-only stages",()=>{
 const {assessment}=allocateQuestionPools(fixture()),release=bindAssessmentRelease(assessment,{taxonomyId:"t",bankId:"b"});
 const initial=assessment.probes.find(p=>p.usage==="initial")!,reserved=assessment.probes.find(p=>p.usage==="learning")!;
 expect(()=>transitionSession({state:{...createSession(release),paused:false,pendingItemId:reserved.id},release,expectedRevision:0,event:{type:"answer",at:0,itemId:reserved.id,correct:true},skills:assessment.skills,bank:assessment.probes})).toThrow(/reserve/);
 expect(()=>transitionSession({state:{...createSession(release),phase:"learning",completionReason:"time_budget"},release,expectedRevision:0,event:{type:"issue_check",check:{id:"check",activityId:"activity",itemId:initial.id,occasionId:"day"}},skills:assessment.skills,bank:assessment.probes})).toThrow(/Initial-only/);
 const deferred=fixture(2);deferred.skills[0].assessmentStage="learning";
 const result=allocateQuestionPools(deferred);
 expect(result.ready).toBe(false);
 expect(result.assessment.probes.every(p=>p.usage==="learning")).toBe(true);
});

it("checks passage reserves across different skills, not only within each target",()=>{
 const source=fixture(8),first=source.skills[0];
 source.probes.forEach((probe,index)=>{probe.contextId=`passage-content:${index}`;probe.guessProbability=.25;});
 source.skills.push({...structuredClone(first),id:"other",nodeKey:"other"});
 source.probes.push(...source.probes.map((probe,index)=>({...probe,id:`other-${index}`,skillId:"other",contextId:`passage-content:${(index+4)%8}`})));
 const before=JSON.stringify(source),result=allocateQuestionPools(source);
 expect(result.coverage.every(row=>row.status==="allocated")).toBe(true);
 expect(result.readingAllocationStatus).toBe("reallocated");
 expect(result.readingPassageConflicts).toEqual([]);
 expect(result.ready).toBe(true);
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
 expect(allocateQuestionPools(source)).toEqual(result);
 expect(JSON.stringify(source)).toBe(before);
 // Reusing a passage for different skills within the same phase is permitted.
 source.probes.filter(probe=>probe.skillId==="other").forEach((probe,index)=>probe.contextId=`passage-content:${index}`);
 const aligned=allocateQuestionPools(source);
 expect(aligned.readingPassageConflicts).toEqual([]);
 expect(aligned.ready).toBe(true);
 expect(inspectQuestionPools(aligned.assessment).ok).toBe(true);
});

it("rejects a conflicting retained-question set without weakening learning-only evidence",()=>{
 const source=fixture(8);
 source.probes.forEach((probe,index)=>{probe.contextId=`passage-content:${index}`;probe.guessProbability=.25;});
 source.skills.push({...structuredClone(source.skills[0]),id:"later",nodeKey:"later",assessmentStage:"learning"});
 source.probes.push(...source.probes.map((probe,index)=>({...probe,id:`later-${index}`,skillId:"later"})));
 const result=allocateQuestionPools(source);
 expect(result.coverage.every(row=>row.status==="allocated")).toBe(true);
 expect(result.readingAllocationStatus).toBe("unresolved");
 expect(result.ready).toBe(false);
 expect(result.readingPassageConflicts).toHaveLength(4);
 expect(inspectQuestionPools(result.assessment).issues.some(issue=>issue.startsWith("Reading passage shared"))).toBe(true);
 expect(result.assessment.probes.filter(probe=>probe.skillId==="later").every(probe=>probe.usage==="learning")).toBe(true);
});

it("shares surplus with follow-up checks while retaining distinguishing features",()=>{
 const source=fixture(18);source.probes.forEach(probe=>probe.guessProbability=.5);
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(result.coverage[0]).toMatchObject({initialItems:9,learningItems:9});
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
 // Three rare feature items must remain in each pool; balancing cannot take
 // a required example even when another initial question can move safely.
 const scarce=fixture(12);scarce.probes.forEach((probe,index)=>{if(index>=6)probe.evidenceFeatures=[];});
 const balanced=allocateQuestionPools(scarce);
 expect(balanced.coverage[0]).toMatchObject({initialItems:6,learningItems:6});
 expect(inspectQuestionPools(balanced.assessment).ok).toBe(true);
 for(const usage of ["initial","learning"]){
  expect(balanced.assessment.probes.filter(probe=>probe.usage===usage&&probe.evidenceFeatures?.includes("change"))).toHaveLength(3);
 }
});
