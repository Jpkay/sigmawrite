import {expect,it} from "vitest";
import {assessSkills,type Observation,type Probe} from "./engine";
import {rollUpV3Evidence,type EvidenceSkill,type V3Assessment} from "./v3-adapter";
import {allocateQuestionPools} from "./question-pools";
const skill:EvidenceSkill={id:"reading",nodeKey:"reading",evidenceKey:"interpret",labelFr:"Lire",branch:"reading",level:0,prerequisites:[],modes:["interpretation"],evidenceRequirements:{interpretation:{minimumItems:3,minimumContexts:3,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,minimumTextTypes:2}}};
const answers:Observation[]=Array.from({length:4},(_,i)=>({itemId:`q${i}`,skillId:skill.id,mode:"interpretation",contextId:`text${i}`,correct:true,guessProbability:.25,activeSeconds:30,unaided:true,textType:"narrative"}));
it("requires genre variety in addition to distinct passages, without counting missing metadata",()=>{
 expect(assessSkills([skill],answers)[0].resolved).toBe(false);
 expect(assessSkills([skill],answers.map(o=>({...o,textType:undefined})))[0].resolved).toBe(false);
 expect(assessSkills([skill],answers.map((o,i)=>({...o,textType:i%2?"narrative":"informational"})))[0].status).toBe("mastered");
});
it("reserves genre variety in both initial and later question pools",()=>{
 const probes:Probe[]=Array.from({length:8},(_,i)=>({id:`q${i}`,skillId:skill.id,mode:"interpretation",contextId:`text${i}`,difficulty:.5,expectedSeconds:30,guessProbability:.25,textType:i===0?"informational":"narrative"}));
 const source:V3Assessment={taxonomyChecksum:"test",bankChecksum:"test",skills:[skill],probes};
 expect(allocateQuestionPools(source).ready).toBe(false);
 probes[4].textType="informational";
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 for(const usage of ["initial","learning"])expect(new Set(result.assessment.probes.filter(p=>p.usage===usage).map(p=>p.textType)).size).toBe(2);
});
it("keeps a genre-specific success separate from parent transfer mastery",()=>{
 const facet:EvidenceSkill={...skill,id:"reading::narrative",facetKey:"reading::text_type:narrative",evidenceRequirements:{interpretation:{...skill.evidenceRequirements!.interpretation!,minimumTextTypes:1,parentMinimumTextTypes:2}}};
 const observations=answers.map(o=>({...o,skillId:facet.id}));
 const assessment:V3Assessment={taxonomyChecksum:"test",bankChecksum:"test",skills:[facet],probes:[]};
 expect(assessSkills([facet],observations)[0].status).toBe("mastered");
 expect(rollUpV3Evidence(assessment,assessSkills([facet],observations))[0].confirmedMastery).toBe(false);
 const other={...facet,id:"reading::informational",facetKey:"reading::text_type:informational"};
 assessment.skills.push(other);
 observations.push(...answers.map(o=>({...o,itemId:`other-${o.itemId}`,skillId:other.id,textType:"informational"})));
 expect(rollUpV3Evidence(assessment,assessSkills(assessment.skills,observations))[0].confirmedMastery).toBe(true);
});
