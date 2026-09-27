import {expect,it} from "vitest";
import {assessSkills,selectProbe,type Skill,type Probe,type Observation} from "./engine";
import {createSession,transitionSession} from "./session";
const rule={minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true};
const skills:Skill[]=[{id:"base",branch:"grammar",level:0,anchor:true,prerequisites:[],modes:["production"],evidenceRequirements:{production:rule}},
 {id:"advanced",branch:"grammar",level:1,prerequisites:["base"],modes:["production"],evidenceRequirements:{production:rule}}];
const bank:Probe[]=skills.flatMap(skill=>Array.from({length:9},(_,i)=>({id:`${skill.id}-${i}`,skillId:skill.id,mode:"production" as const,contextId:`${skill.id}-context-${i}`,difficulty:.5,expectedSeconds:5,guessProbability:.05,usage:i<6?"initial" as const:"learning" as const})));
const observed=(probe:Probe):Observation=>({itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:true,guessProbability:.05,activeSeconds:5,unaided:true,occasionId:"learning-day:2026-09-11"});
it("steps up on sufficient current evidence without certifying multi-occasion mastery",()=>{
 const history=bank.filter(p=>p.skillId==="base").slice(0,3).map(observed);
 expect(assessSkills(skills,history)[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(selectProbe(skills,bank,history)).toMatchObject({kind:"question",reason:"step_up",item:{skillId:"advanced"}});
 history.push(...bank.filter(p=>p.skillId==="advanced").slice(0,3).map(observed));
 expect(selectProbe(skills,bank,history)).toMatchObject({kind:"provisional",reason:"later_evidence_required"});
 expect(assessSkills(skills,history).every(result=>!result.resolved)).toBe(true);
});
it("a same-day learning check adds evidence but a later day supplies the second occasion",()=>{
 const history=bank.filter(p=>p.skillId==="base").slice(0,3).map(observed);
 const later=observed(bank.find(p=>p.id==="base-6")!);
 expect(assessSkills([skills[0]],[...history,later])[0].resolved).toBe(false);
 expect(assessSkills([skills[0]],[...history,{...later,occasionId:"learning-day:2026-09-12"}])[0].status).toBe("mastered");
});
it("initial answers on the same UTC day share an occasion through pause and resume",()=>{
 const release={taxonomyId:"test",bankId:"test",checksum:"test"};let state=createSession(release);
 const apply=(event:Parameters<typeof transitionSession>[0]["event"])=>{state=transitionSession({state,release,expectedRevision:state.revision,event,skills,bank});};
 const at=Date.UTC(2026,8,11,10);
 apply({type:"resume",at});apply({type:"answer",at:at+1000,itemId:state.pendingItemId!,correct:true});
 apply({type:"pause",at:at+2000});state=JSON.parse(JSON.stringify(state));
 apply({type:"resume",at:at+60000});apply({type:"answer",at:at+61000,itemId:state.pendingItemId!,correct:true});
 expect(new Set(state.observations.map(o=>o.occasionId))).toEqual(new Set(["learning-day:2026-09-11"]));
});
it("does not retain inflated occasion counts from earlier per-question markers",()=>{
 const history=bank.slice(0,3).map((p,i)=>({...observed(p),occasionId:`initial-diagnostic:${i}`}));
 const result=assessSkills([skills[0]],history)[0];
 expect(result.modes[0].distinctOccasions).toBe(1);expect(result.resolved).toBe(false);
 expect(assessSkills([skills[0]],[...history,observed(bank[6])])[0].resolved).toBe(false);
});
