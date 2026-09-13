import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
import {assessWithinOccasion,DEFAULT_POLICY,selectProbe,type Observation,type Probe,type Skill} from "./engine";
import type {V3Assessment} from "./v3-adapter";

const r42Source=resolve(process.env.SIGMAWRITE_PUBLISHED_R42_BUNDLE??"tmp/published-r42-profile-bundle.json");
const r42Available=existsSync(r42Source);
const r42=r42Available?JSON.parse(readFileSync(r42Source,"utf8")) as {checksum:string;assessment:V3Assessment}:null;

const probe=(id:string,skillId:string,difficulty:number,mode:Probe["mode"]="production",expectedSeconds=10):Probe=>({
 id,skillId,mode,contextId:`context:${id}`,difficulty,expectedSeconds,guessProbability:.05,
});
const observed=(item:Probe,correct:boolean,input:{unaided?:boolean;skipped?:true;sourceChecksum?:string}={}):Observation=>({
 itemId:item.id,skillId:item.skillId,mode:item.mode,contextId:item.contextId,correct,skipped:input.skipped,
 guessProbability:item.guessProbability,activeSeconds:item.expectedSeconds,unaided:input.unaided??true,occasionId:"item-tier-test",
 materialReceipt:{presentationId:`item-tier:${item.id}`,sourceChecksum:input.sourceChecksum??"item-tier-test",historyComplete:true,
  firstRecordedKeys:item.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:item.assessedMaterialKeys},
});
const tieredBank=(skillId:string,mode:Probe["mode"]="production")=>[
 ...[0,1,2].map(index=>probe(`foundation-${index}`,skillId,.25,mode)),
 ...[0,1,2].map(index=>probe(`core-${index}`,skillId,.5,mode)),
 ...[0,1].map(index=>probe(`stretch-${index}`,skillId,.75,mode)),
];
const skill=(id:string,modes:Skill["modes"]=["production"]):Skill=>({id,branch:"grammar",domain:"grammar",level:0,prerequisites:[],modes,
 evidenceRequirements:Object.fromEntries(modes.map(mode=>[mode,{minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,
  unaidedRequired:true,negativeExamplesRequired:false}]))});

describe.skipIf(!r42Available)("published R42 authored item tiers",()=>{
 const skillId="relation_cause::writing-controlled-production";
 const target=r42?.assessment.skills.find(candidate=>candidate.id===skillId);
 const bank=r42?.assessment.probes.filter(item=>item.skillId===skillId&&item.usage!=="learning")??[];

 it("ascends from two fresh eligible core successes without inferring mastery",()=>{
  expect(target).toBeDefined();
  expect(Object.fromEntries([.25,.5,.75].map(difficulty=>[difficulty,bank.filter(item=>item.difficulty===difficulty).length])))
   .toEqual({"0.25":3,"0.5":3,"0.75":2});
  const first=selectProbe([target!],bank,[]);
  expect(first).toMatchObject({kind:"question",item:{difficulty:.5}});
  if(first.kind!=="question")throw Error("Expected an R42 core question");
  const firstSuccess=[observed(first.item,true,{sourceChecksum:r42!.checksum})];
  const confirmation=selectProbe([target!],bank,firstSuccess);
  expect(confirmation).toMatchObject({kind:"question",reason:"confirmation",item:{difficulty:.5},
   transition:{axis:"confirmation",source:{difficulty:.5},target:{difficulty:.5}}});
  if(confirmation.kind!=="question")throw Error("Expected an R42 core confirmation");
  const history=[...firstSuccess,observed(confirmation.item,true,{sourceChecksum:r42!.checksum})];
  expect(assessWithinOccasion([target!],history)[0]).toMatchObject({status:"uncertain",resolved:false});
  const ascent=selectProbe([target!],bank,history);
  expect(ascent).toMatchObject({kind:"question",reason:"step_up",item:{difficulty:.75},transition:{axis:"item_difficulty",
   relation:"same_skill_higher_difficulty",source:{skillId,challenge:0,difficulty:.5},target:{skillId,challenge:0,difficulty:.75}}});
  if(ascent.kind!=="question")throw Error("Expected an R42 stretch question");
  const exposed=new Set(history.flatMap(item=>item.materialReceipt?.firstRecordedKeys??[]));
  expect(ascent.item.assessedMaterialKeys?.some(key=>exposed.has(key))).toBe(false);
 });

 it("descends after a fresh error and requires two fresh lower-tier successes before reascending",()=>{
  const entry=selectProbe([target!],bank,[]);
  if(entry.kind!=="question")throw Error("Expected an R42 core question");
  const failed=[observed(entry.item,false,{sourceChecksum:r42!.checksum})];
  const descent=selectProbe([target!],bank,failed);
  expect(descent).toMatchObject({kind:"question",reason:"step_down",item:{difficulty:.25},transition:{axis:"item_difficulty",
   relation:"same_skill_lower_difficulty",source:{difficulty:.5},target:{difficulty:.25}}});
  if(descent.kind!=="question")throw Error("Expected an R42 foundation question");
  const firstRecovery=[...failed,observed(descent.item,true,{sourceChecksum:r42!.checksum})];
  const confirmation=selectProbe([target!],bank,firstRecovery);
  expect(confirmation).toMatchObject({kind:"question",reason:"confirmation",item:{difficulty:.25}});
  if(confirmation.kind!=="question")throw Error("Expected an R42 foundation confirmation");
  const recovered=[...firstRecovery,observed(confirmation.item,true,{sourceChecksum:r42!.checksum})];
  expect(assessWithinOccasion([target!],recovered)[0]).toMatchObject({status:"uncertain",resolved:false});
  expect(selectProbe([target!],bank,recovered)).toMatchObject({kind:"question",reason:"step_up",item:{difficulty:.5},
   transition:{axis:"item_difficulty",relation:"same_skill_higher_difficulty",source:{difficulty:.25},target:{difficulty:.5}}});
 });
});

describe("bounded item-difficulty policy",()=>{
 it("keeps graph prerequisites ahead of a same-skill difficulty descent",()=>{
  const prerequisite=skill("prerequisite"),advanced={...skill("advanced"),level:1,prerequisites:[prerequisite.id]};
  const advancedBank=tieredBank(advanced.id),failedCore=advancedBank.find(item=>item.difficulty===.5)!;
  const prerequisiteBank=[0,1,2].map(index=>probe(`prerequisite-${index}`,prerequisite.id,.5));
  expect(selectProbe([prerequisite,advanced],[...prerequisiteBank,...advancedBank],[observed(failedCore,false)])).toMatchObject({
   kind:"question",reason:"step_down",item:{skillId:prerequisite.id,difficulty:.5},
   transition:{axis:"graph",relation:"prerequisite",source:{skillId:advanced.id},target:{skillId:prerequisite.id}},
  });
 });

 it("keeps an ascent in the evidenced mode",()=>{
  const target=skill("two-mode",["recognition","production"]);
  const production=tieredBank(target.id,"production");
  const recognition=tieredBank(target.id,"recognition");
  const core=production.filter(item=>item.difficulty===.5);
  expect(selectProbe([target],[...recognition,...production],[observed(core[0],true),observed(core[1],true)])).toMatchObject({
   kind:"question",reason:"step_up",item:{mode:"production",difficulty:.75},
  });
 });

 it("does not let hinted successes promote the learner",()=>{
  const target=skill("hinted"),bank=tieredBank(target.id),core=bank.filter(item=>item.difficulty===.5);
  const next=selectProbe([target],bank,[observed(core[0],true,{unaided:false}),observed(core[1],true,{unaided:false})]);
  expect(next).toMatchObject({kind:"question",reason:"confirmation",item:{id:"core-2",difficulty:.5}});
  expect(next).not.toMatchObject({transition:{relation:"same_skill_higher_difficulty"}});
 });

 it("does not turn skipped core exhaustion into an ascent",()=>{
  const target=skill("skipped"),bank=tieredBank(target.id),history:Observation[]=[];
  for(let index=0;index<3;index++){
   const next=selectProbe([target],bank,history);
   expect(next).toMatchObject({kind:"question",item:{difficulty:.5}});
   if(next.kind!=="question")throw Error("Expected a core question before exhaustion");
   history.push(observed(next.item,false,{skipped:true}));
  }
  const fallback=selectProbe([target],bank,history);
  expect(fallback).toMatchObject({kind:"question",item:{difficulty:.25},transition:{axis:"coverage",source:null}});
  expect(fallback).not.toMatchObject({item:{difficulty:.75}});
 });

 it("leaves sparse-tier selection unchanged and labels its fallback truthfully",()=>{
  const target=skill("sparse"),foundation=[0,1].map(index=>probe(`a-foundation-${index}`,target.id,.25));
  const core=[0,1].map(index=>probe(`core-${index}`,target.id,.5)),stretch=[probe("z-stretch",target.id,.75)];
  const next=selectProbe([target],[...foundation,...core,...stretch],[observed(core[0],true),observed(core[1],true)]);
  expect(next).toMatchObject({kind:"question",reason:"confirmation",item:{id:"a-foundation-0",difficulty:.25},
   transition:{axis:"item_difficulty",relation:"same_skill_pool_fallback",source:{difficulty:.5},target:{difficulty:.25}}});
 });

 it("does not select a stretch item that cannot fit the remaining time",()=>{
  const target=skill("budget"),bank=tieredBank(target.id).map(item=>item.difficulty===.75?{...item,expectedSeconds:20}:item);
  const core=bank.filter(item=>item.difficulty===.5),history=[observed(core[0],true),observed(core[1],true)];
  expect(selectProbe([target],bank,history,{...DEFAULT_POLICY,activeSeconds:35})).toMatchObject({kind:"question",reason:"confirmation",
   item:{id:"core-2",difficulty:.5}});
 });

 it("continues an unrelated branch when the current authored tier is blocked",()=>{
  const blocked={...skill("blocked"),branch:"a-blocked"},open={...skill("open"),branch:"z-open"};
  const blockedBank=tieredBank(blocked.id),openBank=[0,1,2].map(index=>probe(`open-${index}`,open.id,.5));
  const foundation=blockedBank.filter(item=>item.difficulty===.25),core=blockedBank.filter(item=>item.difficulty===.5);
  const history=[...foundation.map(item=>observed(item,false,{skipped:true})),
   ...core.map(item=>observed(item,true,{unaided:false}))];
  expect(selectProbe([blocked],blockedBank,history,{...DEFAULT_POLICY,itemsPerBranchVisit:20}))
   .toMatchObject({kind:"provisional",reason:"later_evidence_required",unresolvedSkillIds:[blocked.id]});
  expect(selectProbe([blocked,open],[...blockedBank,...openBank],history,{...DEFAULT_POLICY,itemsPerBranchVisit:20}))
   .toMatchObject({kind:"question",reason:"branch_coverage",item:{skillId:open.id,difficulty:.5},
    transition:{axis:"coverage",relation:"branch_entry",source:null,target:{skillId:open.id}}});
 });
});
