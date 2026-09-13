import {describe,expect,it} from "vitest";
import {selectProbe,type Observation,type Probe,type Skill} from "./engine";

const probe=(id:string,skillId:string,difficulty=.5):Probe=>({id,skillId,mode:"production",contextId:id,difficulty,expectedSeconds:10,guessProbability:.05});
const observation=(item:Probe,correct:boolean):Observation=>({itemId:item.id,skillId:item.skillId,mode:item.mode,contextId:item.contextId,
 correct,guessProbability:item.guessProbability,activeSeconds:item.expectedSeconds,unaided:true,occasionId:"transition-test"});

describe("selection transition provenance",()=>{
 it("records a graph ascent separately from unchanged item difficulty",()=>{
  const foundation:Skill={id:"foundation",branch:"same",level:0,prerequisites:[],modes:["production"]};
  const advanced:Skill={id:"advanced",branch:"same",level:1,prerequisites:[foundation.id],modes:["production"]};
  const foundationProbes=[0,1,2].map(index=>probe(`foundation-${index}`,foundation.id)),advancedProbe=probe("advanced",advanced.id);
  const history=foundationProbes.map(item=>observation(item,true));
  expect(selectProbe([foundation,advanced],[...foundationProbes,advancedProbe],history)).toMatchObject({kind:"question",reason:"step_up",
   item:{id:"advanced"},transition:{axis:"graph",relation:"higher_challenge",source:{skillId:"foundation",challenge:0,difficulty:.5},
    target:{skillId:"advanced",challenge:1,difficulty:.5}}});
 });

 it("records the same-skill fallback as an item difficulty descent",()=>{
  const skill:Skill={id:"target",branch:"same",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{
   minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true,negativeExamplesRequired:false}}};
  const core=probe("a-core",skill.id,.5),foundation=probe("b-foundation",skill.id,.25),stretch=probe("c-stretch",skill.id,.75);
  const first=selectProbe([skill],[foundation,core,stretch],[]);
  expect(first).toMatchObject({kind:"question",item:{id:"a-core"},transition:{axis:"coverage",source:null,target:{difficulty:.5}}});
 expect(selectProbe([skill],[foundation,core,stretch],[observation(core,false)])).toMatchObject({kind:"question",reason:"step_down",
   item:{id:"b-foundation"},transition:{axis:"item_difficulty",relation:"same_skill_lower_difficulty",
    source:{skillId:"target",challenge:0,difficulty:.5},target:{skillId:"target",challenge:0,difficulty:.25}}});
 });

});
