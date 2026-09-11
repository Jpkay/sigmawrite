import {expect,it} from "vitest";
import {inspectReleaseScope,type ReleaseScope} from "./release-scope";
import {allocateQuestionPools,inspectQuestionPools} from "./question-pools";
import {bindAssessmentRelease} from "./release-binding";
import {assessSkills} from "./engine";
import type {V3Assessment} from "./v3-adapter";
const scope:ReleaseScope={version:"french-granular-release-scope-v1",assessmentSkillIds:["foundation"],teachingSkillIds:["foundation"],limitationFr:"Les autres points restent à vérifier."};
function fixture():V3Assessment{
 const skill={id:"foundation",nodeKey:"foundation",evidenceKey:"production",labelFr:"Fondation",branch:"grammar",level:0,modes:["production" as const],prerequisites:[],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true}}};
 const assessment:V3Assessment={taxonomyChecksum:"tax",bankChecksum:"bank",skills:[skill,{...skill,id:"later",nodeKey:"later",prerequisites:["foundation"]}],probes:Array.from({length:8},(_,i)=>({id:`q${i}`,skillId:"foundation",mode:"production",contextId:`context${i}`,difficulty:.5,expectedSeconds:20,guessProbability:.05}))};
 return allocateQuestionPools(assessment).assessment;
}
it("declares availability without removing graph targets or manufacturing evidence",()=>{
 const assessment=fixture(),before=structuredClone(assessment.skills);
 expect(inspectQuestionPools(assessment).ok).toBe(false);
 assessment.releaseScope=scope;
 expect(inspectQuestionPools(assessment)).toEqual({ok:true,issues:[]});
 expect(inspectReleaseScope(assessment.skills,scope).deferredSkillIds).toEqual(["later"]);
 expect(assessment.skills).toEqual(before);
 expect(assessSkills(assessment.skills,[]).map(r=>r.status)).toEqual(["unknown","unknown"]);
});
it("rejects invalid scope and missing prerequisites, including teaching outside assessment availability",()=>{
 const {skills}=fixture();
 for(const invalid of [null,{...scope,assessmentSkillIds:[]},{...scope,assessmentSkillIds:["foundation","foundation"]},{...scope,assessmentSkillIds:["unknown"]},{...scope,assessmentSkillIds:["later"]},{...scope,teachingSkillIds:["later"]},{...scope,teachingSkillIds:["foundation","foundation"]},{...scope,ignoredGate:true}]){
  expect(()=>inspectReleaseScope(skills,invalid)).toThrow();
  expect(inspectQuestionPools({...fixture(),releaseScope:invalid}).ok).toBe(false);
 }
});
it("pins teaching and assessment availability and retains all supported pool requirements",()=>{
 const assessment=fixture(),identity={taxonomyId:"t",bankId:"b"};
 const full=bindAssessmentRelease(assessment,identity);
 assessment.releaseScope=scope;
 const scoped=bindAssessmentRelease(assessment,identity);
 expect(scoped.checksum).not.toBe(full.checksum);
 expect(bindAssessmentRelease({...assessment,releaseScope:{...scope,teachingSkillIds:[]}},identity).checksum).not.toBe(scoped.checksum);
 const broken=structuredClone(assessment);broken.skills[0].evidenceRequirements!.production!.minimumItems=99;
 expect(inspectQuestionPools(broken).issues.some(issue=>issue.includes("Insufficient"))).toBe(true);
 const outside=fixture();outside.probes.push({...outside.probes[0],id:"outside",skillId:"later"});
 const allocated=allocateQuestionPools(outside).assessment;allocated.releaseScope=scope;
 expect(inspectQuestionPools(allocated).issues.some(issue=>issue.includes("outside release scope"))).toBe(true);
});

it("schedules supported targets only while retaining deferred unknown results and provisional completion",async()=>{
 const {selectProbe,DEFAULT_POLICY}=await import("./engine");
 const {createSession,transitionSession,sessionView}=await import("./session");
 const assessment=fixture();assessment.releaseScope=scope;
 const release=bindAssessmentRelease(assessment,{taxonomyId:"t",bankId:"b"});
 const outside={...assessment.probes[0],id:"outside",skillId:"later",usage:"initial" as const};
 const selection=selectProbe(assessment.skills,[outside,...assessment.probes],[],DEFAULT_POLICY,[],scope);
 expect(selection.kind).toBe("question");if(selection.kind==="question")expect(selection.item.skillId).toBe("foundation");
 let state=createSession(release);
 const apply=(event:Parameters<typeof transitionSession>[0]["event"])=>{
  state=transitionSession({state,release,expectedRevision:state.revision,event,skills:assessment.skills,bank:assessment.probes,releaseScope:scope});
 };
 apply({type:"resume",at:0});apply({type:"pause",at:1000});apply({type:"resume",at:100000});
 for(let i=0;i<8&&state.phase==="assessing";i++){
  expect(state.pendingItemId).not.toBeNull();apply({type:"answer",itemId:state.pendingItemId!,correct:true,at:100000+i*1000});
 }
 expect(state.completionReason).toBe("later_evidence_required");
 const view=sessionView(state,assessment.skills);
 expect(view.provisional).toBe(true);expect(view.results.find(r=>r.skillId==="later")?.status).toBe("unknown");
 const broken=selectProbe(assessment.skills,[],[],DEFAULT_POLICY,[],scope);
 expect(broken.kind).toBe("coverage_gap");
 expect(()=>transitionSession({state:{...createSession(release),paused:false,pendingItemId:outside.id},release,expectedRevision:0,event:{type:"answer",at:0,itemId:outside.id,correct:true},skills:assessment.skills,bank:[outside,...assessment.probes],releaseScope:scope})).toThrow("outside assessment release scope");
 expect(()=>transitionSession({state:{...createSession(release),phase:"learning",completionReason:"time_budget"},release,expectedRevision:0,event:{type:"issue_check",check:{id:"check",activityId:"activity",itemId:outside.id,occasionId:"day"}},skills:assessment.skills,bank:[{...outside,usage:"learning"},...assessment.probes],releaseScope:scope})).toThrow("outside assessment release scope");
});

it("builds scoped pools without changing graph rules or retained assignments",async()=>{
 const {readFileSync}=await import("node:fs");
 const {applyQuestionPoolScope}=await import("./question-pools");
 const prepared=JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
 const scoped=JSON.parse(readFileSync("docs/diagnostic/v3-scoped-review-candidate.json","utf8"));
 const before=structuredClone(prepared.assessment);
 const result=applyQuestionPoolScope(prepared.assessment,scoped.assessment.releaseScope);
 expect(result.skills).toEqual(before.skills);
 expect(prepared.assessment).toEqual(before);
 expect(result.probes.every(probe=>JSON.stringify(probe)===JSON.stringify(before.probes.find((p:{id:string})=>p.id===probe.id)))).toBe(true);
 expect(result.probes.length).toBeLessThan(before.probes.length);
 expect(()=>applyQuestionPoolScope({...prepared.assessment,poolChecksum:"tampered"},result.releaseScope)).toThrow(/checksum/);
});
