import {expect,it} from "vitest";
import {validateActivityBindings} from "./activity-validation";
import type {V3Assessment} from "./v3-adapter";
import type {LearningActivityBinding} from "./activity-plan";
const assessment:V3Assessment={taxonomyChecksum:"t",bankChecksum:"b",skills:["a","b"].map(id=>({id,nodeKey:id,evidenceKey:"e",labelFr:id,branch:id,level:0,modes:["production"],prerequisites:[]})),probes:[{id:"q",skillId:"a",mode:"production",contextId:"c",difficulty:0,guessProbability:.05,expectedSeconds:30,usage:"learning"}]};
const check:LearningActivityBinding={id:"check",nodeKey:"a",mode:"production",kind:"independent_check",status:"published",titleFr:"A",href:"/student/diagnostic",probeIds:["q"]};
it("rejects mismatched and duplicate checks at release load",()=>{
 expect(()=>validateActivityBindings(assessment,[check])).not.toThrow();
 expect(()=>validateActivityBindings(assessment,[check,check])).toThrow(/Duplicate/);
 expect(()=>validateActivityBindings(assessment,[{...check,nodeKey:"b"}])).toThrow(/another skill/);
 expect(()=>validateActivityBindings({...assessment,probes:[{...assessment.probes[0],usage:"initial"}]},[check])).toThrow(/another skill or pool/);
});
it("separates assessment access from teaching access",()=>{
 const scoped={...assessment,releaseScope:{version:"french-granular-release-scope-v1" as const,assessmentSkillIds:["a"],teachingSkillIds:[],limitationFr:"Couverture progressive."}};
 expect(()=>validateActivityBindings(scoped,[check])).not.toThrow();
 const lesson={...check,kind:"instruction" as const,contentId:"lesson"};
 expect(()=>validateActivityBindings(scoped,[lesson])).toThrow(/outside release scope/);
 expect(()=>validateActivityBindings({...scoped,releaseScope:{...scoped.releaseScope,teachingSkillIds:["a"]}},[lesson])).not.toThrow();
});
