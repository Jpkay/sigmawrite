import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {assessesNegativeExample} from "./negative-examples";
import {assessSkills,selectProbe,type Observation,type Probe} from "./engine";
import {allocateQuestionPools} from "./question-pools";
import type {EvidenceSkill,V3Assessment} from "./v3-adapter";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
const item=bank.items.find(entry=>entry.item.choices)!.item;
it("does not equate incorrect choices with a counterexample, and requires an anchored review rationale",()=>{
 expect(assessesNegativeExample(item)).toBe(false);
 const annotated={...item,validatorConfig:{negativeExample:{excerptFr:item.promptFr,rationaleFr:"Reviewer must verify absence of the target construction."}}};
 expect(assessesNegativeExample(annotated)).toBe(true);
 expect(()=>assessesNegativeExample({...annotated,validatorConfig:{negativeExample:{excerptFr:"not in prompt",rationaleFr:"reason"}}})).toThrow();
 expect(()=>assessesNegativeExample({...annotated,validatorConfig:{negativeExample:{excerptFr:item.promptFr}}})).toThrow();
});
const skill:EvidenceSkill={id:"construction",nodeKey:"construction",evidenceKey:"recognition",labelFr:"Construction",branch:"grammar",level:0,prerequisites:[],modes:["recognition"],evidenceRequirements:{recognition:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,negativeExamplesRequired:true}}};
const answers:Observation[]=Array.from({length:4},(_,i)=>({itemId:`answered${i}`,skillId:skill.id,mode:"recognition",contextId:`sentence${i}`,correct:true,guessProbability:.25,activeSeconds:15,unaided:true}));
it("requires successful counterexample evidence before confirming mastery",()=>{
 expect(assessSkills([skill],answers)[0].resolved).toBe(false);
 expect(assessSkills([skill],answers.map((o,i)=>({...o,negativeExampleAssessed:i===2})))[0].status).toBe("mastered");
 const failed={...answers[0],itemId:"failed-counterexample",correct:false,negativeExampleAssessed:true};
 expect(assessSkills([skill],[failed,...answers])[0].resolved).toBe(false);
});
it("reserves counterexamples for both pools and selects one when that evidence is missing",()=>{
 const probes:Probe[]=Array.from({length:8},(_,i)=>({id:`q${i}`,skillId:skill.id,mode:"recognition",contextId:`new${i}`,difficulty:.5,expectedSeconds:15,guessProbability:.25,negativeExampleAssessed:i===7}));
 const assessment:V3Assessment={taxonomyChecksum:"test",bankChecksum:"test",skills:[skill],probes};
 expect(allocateQuestionPools(assessment).ready).toBe(false);
 expect(selectProbe([skill],probes,answers)).toMatchObject({kind:"question",item:{id:"q7"}});
 probes[3].negativeExampleAssessed=true;
 const allocation=allocateQuestionPools(assessment);
 expect(allocation.ready).toBe(true);
 for(const usage of ["initial","learning"])expect(allocation.assessment.probes.some(p=>p.usage===usage&&p.negativeExampleAssessed)).toBe(true);
});
