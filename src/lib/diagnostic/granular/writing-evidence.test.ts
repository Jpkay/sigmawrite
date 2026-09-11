import {expect,it} from "vitest";
import {createWritingEvidence,verifiedWritingEvidence,writingSampleIdentity} from "./writing-evidence";
import {assessSkills,type Skill,type Observation} from "./engine";
const skill:Skill={id:"spelling",branch:"spelling",level:0,prerequisites:[],modes:["independent_production"],assessmentStage:"learning",
 evidenceRequirements:{independent_production:{minimumItems:2,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.75,minimumEligibleTokens:8,unaidedRequired:true}}};
const tokens=[{start:0,end:3,text:"Les",correct:true},{start:4,end:11,text:"chevaux",correct:true},{start:12,end:19,text:"courent",correct:true},{start:20,end:24,text:"vite",correct:true}];
function observations():Observation[]{return [0,1].map(i=>({itemId:`text-${i}`,skillId:skill.id,mode:"independent_production",contextId:`context-${i}`,occasionId:`day-${i}`,correct:true,unaided:true,guessProbability:.05,activeSeconds:60,
 writingEvidence:createWritingEvidence({skillId:skill.id,answer:i?"Les chevaux courent loin.":"Les chevaux courent vite.",connectedWriting:true,unaided:true,tokens:tokens.map(t=>t.start===20&&i?{...t,text:"loin"}:t)})}));}
it("rejects generic correct answers as independent writing evidence",()=>{
 expect(assessSkills([skill],observations().map(o=>({...o,writingEvidence:undefined})))[0].status).toBe("unknown");
});
it("counts relevant opportunities across texts and computes token accuracy",()=>{
 expect(assessSkills([skill],observations())[0].status).toBe("mastered");
 const short=observations().map(o=>({...o,writingEvidence:createWritingEvidence({skillId:skill.id,answer:o.writingEvidence!.responseText,connectedWriting:true,unaided:true,tokens:o.writingEvidence!.tokens.slice(0,3)})}));
 expect(assessSkills([skill],short)[0].resolved).toBe(false);
 const inaccurate=observations().map(o=>({...o,writingEvidence:createWritingEvidence({skillId:skill.id,answer:o.writingEvidence!.responseText,connectedWriting:true,unaided:true,tokens:o.writingEvidence!.tokens.map((t,i)=>({...t,correct:i<2}))})}));
 expect(assessSkills([skill],inaccurate)[0].modes[0].accuracy).toBe(.5);
 expect(assessSkills([skill],inaccurate)[0].resolved).toBe(false);
});
it("rejects overlapping, unanchored or aided writing evidence",()=>{
 const input={skillId:skill.id,answer:"Les chevaux courent vite.",connectedWriting:true,unaided:true,tokens};
 expect(()=>createWritingEvidence({...input,tokens:[tokens[0],tokens[0]]})).toThrow(/span/);
 expect(()=>createWritingEvidence({...input,tokens:[{...tokens[0],text:"Des"}]})).toThrow(/span/);
 expect(()=>createWritingEvidence({...input,unaided:false})).toThrow(/Independent/);
 expect(()=>createWritingEvidence({...input,connectedWriting:false})).toThrow(/Independent/);
 expect(()=>createWritingEvidence({...input,tokens:[]})).toThrow();
 const wrong=observations().map(o=>({...o,writingEvidence:{...o.writingEvidence!,skillId:"other"}}));
 expect(assessSkills([skill],wrong)[0].status).toBe("unknown");
});

it("does not count the same response as two distinct texts",()=>{
 const rows=observations();rows[1].writingEvidence=rows[0].writingEvidence;
 expect(assessSkills([skill],rows)[0].resolved).toBe(false);
});

it("revalidates the saved source, spans and counts after serialization",()=>{
 const evidence=JSON.parse(JSON.stringify(observations()[0].writingEvidence));
 expect(verifiedWritingEvidence(evidence,skill.id)).not.toBeNull();
 for(const changed of [{...evidence,responseText:"A different text."},{...evidence,correctTokens:0},{...evidence,tokens:[{...evidence.tokens[0],text:"Changed"}]}]){
  expect(verifiedWritingEvidence(changed,skill.id)).toBeNull();
 }
});
it("requires both versions and explicit revision assessment for revision skills",()=>{
 const revisionSkill={...skill,evidenceRequirements:{independent_production:{...skill.evidenceRequirements!.independent_production!,revisionRequired:true}}};
 expect(assessSkills([revisionSkill],observations())[0].status).toBe("unknown");
 const assessed=observations().map(o=>({...o,writingEvidence:{...o.writingEvidence!,firstDraft:"Les cheveaux court.",revisionReviewed:true as const}}));
 expect(assessSkills([revisionSkill],assessed)[0].status).toBe("mastered");
});

it("does not count typography-only changes as a new writing sample",()=>{
 expect(writingSampleIdentity("L’élève écrit. Il rêve !")).toBe(writingSampleIdentity("l'e\u0301le\u0300ve  écrit ; il rêve."));
 expect(writingSampleIdentity("Il a parlé.")).not.toBe(writingSampleIdentity("Il a parle."));
 const rows=observations();
 rows[1].writingEvidence=createWritingEvidence({skillId:skill.id,answer:"Les chevaux courent vite !",connectedWriting:true,unaided:true,tokens});
 expect(assessSkills([skill],rows)[0].resolved).toBe(false);
});
