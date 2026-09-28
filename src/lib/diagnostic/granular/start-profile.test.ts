import {describe,expect,it} from "vitest";
import {ADAPTIVE_ROUTING_V1,DEFAULT_POLICY,assessSkills,domainRoutingLevel,selectProbe,type Observation,type Probe,type Skill} from "./engine";
import {createSession,transitionSession,type AssessmentSession} from "./session";
import {START_LEVELS,domainChallengeLevels,policyWithStartProfile,resolveStartProfile,startBand,startProfileForAssessment,type StartProfile} from "./start-profile";

const V45_LEVELS={conjugation:[0,1,2,3,4,5,6],grammar:[0,1,2,3,4,5],reading_comprehension:[0,1,3],spelling:[0,1,2]};
const skill=(id:string,domain:string,level:number,branch=`${domain}:${id}`):Skill=>({id,domain,branch,level,prerequisites:[],modes:["production"]});
const items=(nodes:Skill[]):Probe[]=>nodes.flatMap(s=>Array.from({length:6},(_,n)=>({id:`${s.id}-${n}`,skillId:s.id,mode:"production" as const,contextId:`${s.id}-context-${n}`,difficulty:.5,expectedSeconds:20,guessProbability:.1})));
const answer=(item:Probe,correct:boolean):Observation=>({itemId:item.id,skillId:item.skillId,mode:item.mode,contextId:item.contextId,correct,guessProbability:item.guessProbability,activeSeconds:20,unaided:true});
const adaptive={...DEFAULT_POLICY,startingLevels:{grammar:1},adaptiveRouting:ADAPTIVE_ROUTING_V1};

describe("start profile table",()=>{
 it("resolves bands from type, legacy background and exposures",()=>{
  expect(startBand("french_first_language",["home"])).toBe("first_language");
  expect(startBand("heritage",[])).toBe("heritage_home");
  expect(startBand("french_second_language",["home"])).toBe("heritage_home");
  expect(startBand("immersion",["class_only"])).toBe("sl_extended");
  expect(startBand("french_second_language",["self_study"])).toBe("sl_extended");
  expect(startBand("allophone",["class_only"])).toBe("sl_beginner");
  // Same fallback as onboardingTarget when no explicit student type exists.
  expect(resolveStartProfile({grade:9,frenchBackground:"native"},V45_LEVELS).band).toBe("first_language");
  expect(resolveStartProfile({grade:9,frenchBackground:"bilingual"},V45_LEVELS).band).toBe("heritage_home");
  expect(resolveStartProfile({grade:9,frenchBackground:"not_sure",exposure:"school"},V45_LEVELS).band).toBe("sl_extended");
 });
 it("gives every grade at least four distinct starting points",()=>{
  for(let grade=5;grade<=12;grade++){
   const starts=new Set((["french_second_language","immersion","heritage","french_first_language"] as const)
    .map(studentType=>JSON.stringify(resolveStartProfile({grade,studentType,exposures:studentType==="french_second_language"?["class_only"]:[]},V45_LEVELS).levels)));
   expect(starts.size,`grade ${grade}`).toBe(4);
  }
 });
 it("starts a grade 7 learner of French below a grade 10 first-language speaker in every domain",()=>{
  const beginner=resolveStartProfile({grade:7,studentType:"french_second_language",exposures:["class_only"]},V45_LEVELS);
  const literature=resolveStartProfile({grade:10,studentType:"french_first_language",exposures:["home"],goalType:"literature_class"},V45_LEVELS);
  expect(beginner.levels).toEqual({conjugation:1,grammar:0,reading_comprehension:0,spelling:0});
  expect(literature.levels).toEqual({conjugation:4,grammar:4,reading_comprehension:3,spelling:2});
 });
 it("varies by domain: home speakers read higher but spell lower than immersion learners",()=>{
  const heritage=resolveStartProfile({grade:8,studentType:"heritage",exposures:["home"]},V45_LEVELS).levels;
  const immersion=resolveStartProfile({grade:8,studentType:"immersion",exposures:["immersion"]},V45_LEVELS).levels;
  expect(heritage.reading_comprehension).toBeGreaterThan(immersion.reading_comprehension);
  expect(heritage.grammar).toBeGreaterThan(immersion.grammar);
  expect(heritage.spelling).toBeLessThan(immersion.spelling);
 });
 it("keeps today's level 1 for a missing or unknown profile",()=>{
  for(const input of [null,{},{grade:7},{studentType:"heritage"},{grade:3,studentType:"heritage"}]){
   const profile=resolveStartProfile(input,V45_LEVELS);
   expect(profile.band).toBe("default");
   expect(Object.values(profile.levels).every(level=>level===1)).toBe(true);
  }
 });
 it("snaps every start to a challenge level that has probes",()=>{
  // Reading has no level 2 and spelling stops at 2 in the published release.
  expect(resolveStartProfile({grade:12,studentType:"french_first_language"},{reading_comprehension:[0,1,3],spelling:[0,1],conjugation:[3,4]}).levels)
   .toEqual({conjugation:4,reading_comprehension:3,spelling:1});
  for(const band of Object.keys(START_LEVELS) as (keyof typeof START_LEVELS)[])for(const [domain,row] of Object.entries(START_LEVELS[band]))
   for(const level of row)expect(V45_LEVELS[domain as keyof typeof V45_LEVELS]).toContain(level);
 });
 it("reads domain levels only from in-scope initial probes",()=>{
  const nodes=[skill("a","grammar",0),skill("b","grammar",3),{...skill("c","grammar",5),assessmentStage:"learning" as const},{...skill("d","spelling",2),challengeOrder:1}];
  const probes=items(nodes).filter(item=>!item.skillId.startsWith("b")||item.id.endsWith("-0")).map(item=>item.skillId==="b"?{...item,usage:"learning" as const}:item);
  expect(domainChallengeLevels(nodes,probes)).toEqual({grammar:[0],spelling:[1]});
 });
});

describe("session persistence",()=>{
 const nodes=[0,1,2,3,4].map(level=>skill(`g${level}`,"grammar",level,"grammar:shared"));
 const bank=items(nodes),release={taxonomyId:"t",bankId:"b",checksum:"c"};
 const first=(state:AssessmentSession)=>{
  const next=transitionSession({state,release,expectedRevision:state.revision,event:{type:"resume",at:1000},skills:nodes,bank});
  return {next,level:nodes.find(node=>node.id===bank.find(item=>item.id===next.pendingItemId)?.skillId)?.level};
 };
 it("stores the resolved profile and starts each profile at its own level",()=>{
  const beginner=startProfileForAssessment({skills:nodes,probes:bank},{grade:7,studentType:"french_second_language",exposures:["class_only"]});
  const native=startProfileForAssessment({skills:nodes,probes:bank},{grade:10,studentType:"french_first_language",exposures:["home"]});
  const state=createSession(release,native);
  expect(state.startProfile).toEqual(native);expect(state.startProfile).not.toBe(native);
  expect(first(createSession(release,beginner)).level).toBe(0);
  const started=first(state);
  expect(started.level).toBe(4);
  // Resume and retakes reuse the stored profile, including after JSON storage.
  expect(JSON.parse(JSON.stringify(started.next)).startProfile).toEqual(native);
 });
 it("keeps sessions created before start profiles on the original start and routing",()=>{
  const legacy=createSession(release);
  expect(legacy).not.toHaveProperty("startProfile");
  const selected=selectProbe(nodes,bank,[],DEFAULT_POLICY);
  expect(first(legacy).next.pendingItemId).toBe(selected.kind==="question"?selected.item.id:null);
  expect(first(legacy).level).toBe(1);
  expect(policyWithStartProfile(DEFAULT_POLICY,undefined)).toBe(DEFAULT_POLICY);
  expect(policyWithStartProfile(DEFAULT_POLICY,{version:"start-profile-v0"} as unknown as StartProfile)).toBe(DEFAULT_POLICY);
 });
});

describe("adaptive routing",()=>{
 it("moves the domain level up after two successes, jumps after four and steps down on errors",()=>{
  const levels=[0,1,2,3,4,5,6],ok=(challenge:number)=>({correct:true,challenge,unaided:true}),ko=(challenge:number)=>({correct:false,challenge});
  expect(domainRoutingLevel(1,levels,[ok(1)],ADAPTIVE_ROUTING_V1).level).toBe(1);
  expect(domainRoutingLevel(1,levels,[ok(1),ok(1)],ADAPTIVE_ROUTING_V1).level).toBe(2);
  expect(domainRoutingLevel(1,levels,[ok(1),ok(1),ok(2),ok(2)],ADAPTIVE_ROUTING_V1)).toEqual({level:4,streak:4});
  expect(domainRoutingLevel(3,levels,[ko(3)],ADAPTIVE_ROUTING_V1).level).toBe(2);
  // A failure above the level or an easy success far below it does not move it.
  expect(domainRoutingLevel(3,levels,[ko(5)],ADAPTIVE_ROUTING_V1).level).toBe(3);
  expect(domainRoutingLevel(4,levels,[ok(0),ok(1)],ADAPTIVE_ROUTING_V1).level).toBe(4);
  expect(domainRoutingLevel(6,levels,[ok(6),ok(6)],ADAPTIVE_ROUTING_V1).level).toBe(6);
  expect(domainRoutingLevel(1,[0,1,3],[ok(1),ok(1)],ADAPTIVE_ROUTING_V1).level).toBe(3);
 });
 const nodes=[1,2,3,4,5].map(level=>skill(`g${level}`,"grammar",level,"grammar:shared"));
 const bank=items(nodes),at=(level:number,index:number)=>bank.find(item=>item.id===`g${level}-${index}`)!;
 const levelOf=(selection:ReturnType<typeof selectProbe>)=>selection.kind==="question"?nodes.find(node=>node.id===selection.item.skillId)!.level:null;
 it("steps up after two unaided successes without waiting for full confirmation",()=>{
  const history=[answer(at(1,0),true),answer(at(1,1),true)];
  expect(assessSkills(nodes,history)[0].status).toBe("uncertain");
  const next=selectProbe(nodes,bank,history,adaptive);
  expect(next).toMatchObject({kind:"question",reason:"step_up",transition:{relation:"higher_challenge"}});
  expect(levelOf(next)).toBe(2);
  // Legacy routing keeps confirming the unresolved target.
  expect(selectProbe(nodes,bank,history,DEFAULT_POLICY)).toMatchObject({kind:"question",reason:"confirmation",item:{skillId:"g1"}});
  // Assisted successes never trigger the faster step.
  expect(selectProbe(nodes,bank,history.map(o=>({...o,unaided:undefined})),adaptive)).toMatchObject({reason:"confirmation"});
 });
 it("jumps up to two challenge levels after four successes in a row",()=>{
  const history=[answer(at(1,0),true),answer(at(1,1),true),answer(at(2,0),true),answer(at(2,1),true)];
  const next=selectProbe(nodes,bank,history,adaptive);
  expect(next).toMatchObject({kind:"question",reason:"step_up"});
  expect(levelOf(next)).toBe(4);
 });
 it("still steps down after an error",()=>{
  const next=selectProbe(nodes,bank,[answer(at(3,0),false)],{...adaptive,startingLevels:{grammar:3}});
  expect(next).toMatchObject({kind:"question",reason:"step_down",transition:{relation:"lower_challenge"}});
  expect(levelOf(next)).toBe(2);
 });
 it("keeps a short visit in one area before rotating",()=>{
  const areas=[skill("g","grammar",1),skill("s","spelling",1)],pool=items(areas);
  const run=(policy:typeof DEFAULT_POLICY)=>{
   const history:Observation[]=[],domains:string[]=[];
   for(let i=0;i<6;i++){const next=selectProbe(areas,pool,history,policy);if(next.kind!=="question")break;domains.push(next.item.skillId);history.push(answer(next.item,i%2===0));}
   return domains.join("");
  };
  expect(run(DEFAULT_POLICY)).toBe("gsgsgs");
  expect(run({...DEFAULT_POLICY,adaptiveRouting:ADAPTIVE_ROUTING_V1})).toBe("gggsss");
 });
 it("leaves published results unchanged",()=>{
  const history=[answer(at(1,0),true),answer(at(1,1),true),answer(at(2,0),false),answer(at(1,2),true),answer(at(3,0),true)];
  const profile=resolveStartProfile({grade:10,studentType:"french_first_language"},{grammar:[1,2,3,4,5]});
  expect(assessSkills(nodes,history,policyWithStartProfile(DEFAULT_POLICY,profile))).toEqual(assessSkills(nodes,history,DEFAULT_POLICY));
  expect(assessSkills(nodes,history).find(result=>result.skillId==="g1")?.status).toBe("mastered");
 });
});
