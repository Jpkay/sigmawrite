import {describe,expect,it} from "vitest";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import {assessWithinOccasion,DEFAULT_POLICY,selectProbe,type ExerciseFormat,type Observation,type Probe,type Skill} from "./engine";
import {withRouteCoverageMetadata} from "./route-coverage";

const coreDomains=["conjugation","grammar"] as const;

function fullBudgetReplay(minimumExerciseFormatsPerCoreDomain:number,requiredVerbTenseBands=DEFAULT_POLICY.requiredVerbTenseBands){
 const skills:Skill[]=[],bank:Probe[]=[];
 for(const domain of ["conjugation","grammar","reading_comprehension","spelling"]){
  for(let skillIndex=0;skillIndex<10;skillIndex++){
   const skill:Skill={id:`${domain}-${skillIndex}`,branch:`${domain}-${skillIndex}`,domain,level:1,modes:[domain==="reading_comprehension"?"interpretation":"production"],prerequisites:[]};
   skills.push(skill);
   const exerciseFormat:ExerciseFormat=domain==="reading_comprehension"?"mcq":domain==="spelling"?"short_answer":skillIndex===9?"transform":"cloze";
   const routePurpose=domain==="conjugation"?"verb_tense_use" as const:domain==="grammar"?"grammar_use" as const:undefined;
   const verbTenseBand=domain!=="conjugation"?undefined:skillIndex===8?"past" as const:skillIndex===9?"future" as const:"present" as const;
   for(let itemIndex=0;itemIndex<3;itemIndex++)bank.push({id:`${skill.id}-${itemIndex}`,skillId:skill.id,mode:skill.modes[0],contextId:`${skill.id}-context-${itemIndex}`,
    difficulty:.5,expectedSeconds:30,guessProbability:.05,exerciseFormat,...(routePurpose?{routePurpose}:{}),...(verbTenseBand?{verbTenseBand}:{})});
  }
 }
 const policy={...DEFAULT_POLICY,minimumExerciseFormatsPerCoreDomain,requiredVerbTenseBands},observations:Observation[]=[];
 while(true){
  const selection=selectProbe(skills,bank,observations,policy);
  if(selection.kind!=="question")return {skills,bank,observations,ending:selection};
  observations.push({...selection.item,itemId:selection.item.id,correct:true,activeSeconds:selection.item.expectedSeconds,unaided:true,occasionId:"synthetic-day"});
 }
}

describe("diagnostic route coverage",()=>{
 it("adds canonical response formats to historical compact probes without mutating them",()=>{
  const probe:Probe={id:"q",skillId:"grammar",mode:"production",contextId:"context",difficulty:.5,expectedSeconds:30,guessProbability:.05};
  const artifact={items:[{itemKey:"q",sectionKey:"grammar",evidenceExpectation:"controlled_production",item:{responseType:"transform"}}]} as unknown as CanonicalDiagnosticBankArtifact;
  const routed=withRouteCoverageMetadata([probe],artifact);
  expect(routed[0]).toMatchObject({id:"q",exerciseFormat:"transform",routePurpose:"grammar_use"});
  expect(probe.exerciseFormat).toBeUndefined();
 });

 it("collects a second real format in grammar and conjugation during the 35-minute route",()=>{
  const baseline=fullBudgetReplay(1,[]),covered=fullBudgetReplay(2);
  for(const domain of coreDomains){
   const formats=(run:typeof covered)=>new Set(run.observations.filter(observation=>run.skills.find(skill=>skill.id===observation.skillId)?.domain===domain)
    .map(observation=>run.bank.find(probe=>probe.id===observation.itemId)?.exerciseFormat));
   expect([...formats(baseline)]).toEqual(["cloze"]);
   expect(formats(covered)).toEqual(new Set(["cloze","transform"]));
  }
  expect(covered.observations.reduce((sum,item)=>sum+item.activeSeconds,0)).toBe(2100);
  expect(covered.ending).toMatchObject({kind:"provisional",reason:"time_budget"});
  expect(new Set(covered.observations.map(item=>item.itemId)).size).toBe(covered.observations.length);
  expect(new Set(covered.observations.map(item=>covered.bank.find(probe=>probe.id===item.itemId)?.verbTenseBand).filter(Boolean))).toEqual(new Set(["present","past","future"]));
 });

 it("reaches verb-tense and grammar use early even when the small replay stops on evidence",()=>{
  const definitions=[
   {id:"tense-use",domain:"conjugation",mode:"production" as const,formats:["cloze","transform","cloze"] as ExerciseFormat[],routePurpose:"verb_tense_use" as const,verbTenseBand:"present" as const},
   {id:"tense-label-recognition",domain:"conjugation",mode:"recognition" as const,formats:["mcq","mcq","mcq"] as ExerciseFormat[]},
   {id:"grammar-use",domain:"grammar",mode:"production" as const,formats:["short_answer","transform","short_answer"] as ExerciseFormat[],routePurpose:"grammar_use" as const},
   {id:"determiner-analysis",domain:"grammar",mode:"recognition" as const,formats:["mcq","mcq","mcq"] as ExerciseFormat[]},
   {id:"literal-reading",domain:"reading_comprehension",mode:"interpretation" as const,formats:["mcq","mcq","mcq"] as ExerciseFormat[]},
   {id:"spelling",domain:"spelling",mode:"production" as const,formats:["cloze","cloze","cloze"] as ExerciseFormat[]},
  ];
  const skills:Skill[]=definitions.map(row=>({id:row.id,branch:row.id,domain:row.domain,level:1,modes:[row.mode],prerequisites:[]}));
  const bank:Probe[]=definitions.flatMap(row=>row.formats.map((exerciseFormat,index)=>({id:`${row.id}-${index}`,skillId:row.id,mode:row.mode,
   contextId:`${row.id}-context-${index}`,difficulty:.5,expectedSeconds:30,guessProbability:.05,exerciseFormat,...("routePurpose" in row?{routePurpose:row.routePurpose}: {}),...("verbTenseBand" in row?{verbTenseBand:row.verbTenseBand}:{})})));
  const observations:Observation[]=[];
  let ending:ReturnType<typeof selectProbe>;
  while((ending=selectProbe(skills,bank,observations)).kind==="question"){
   const item=ending.item;
   observations.push({...item,itemId:item.id,correct:true,activeSeconds:item.expectedSeconds,unaided:true,occasionId:"synthetic-day"});
  }
  expect(ending).toMatchObject({kind:"finished",reason:"evidence_complete"});
  for(const purpose of ["verb_tense_use","grammar_use"] as const){
   const index=observations.findIndex(observation=>bank.find(item=>item.id===observation.itemId)?.routePurpose===purpose);
   expect(index).toBeGreaterThanOrEqual(0);
   expect(observations.slice(0,index+1).reduce((sum,item)=>sum+item.activeSeconds,0)).toBeLessThanOrEqual(15*60);
  }
  for(const domain of coreDomains){
   const first=observations.find(item=>skills.find(skill=>skill.id===item.skillId)?.domain===domain)!;
   expect(bank.find(item=>item.id===first.itemId)).toMatchObject({difficulty:.5,routePurpose:domain==="conjugation"?"verb_tense_use":"grammar_use"});
  }
  expect(new Set(observations.filter(item=>item.skillId==="tense-use").map(item=>bank.find(probe=>probe.id===item.itemId)?.exerciseFormat))).toEqual(new Set(["cloze","transform"]));
  expect(new Set(observations.filter(item=>item.skillId==="grammar-use").map(item=>bank.find(probe=>probe.id===item.itemId)?.exerciseFormat))).toEqual(new Set(["short_answer","transform"]));
  expect(assessWithinOccasion(skills,observations).every(result=>result.resolved)).toBe(true);
  expect(new Set(observations.map(item=>item.itemId)).size).toBe(observations.length);
 });

 it("keeps confirming an unresolved error when its target has no unseen format",()=>{
  const skills:Skill[]=[
   {id:"agreement",branch:"a-agreement",domain:"grammar",level:1,modes:["production"],prerequisites:[]},
   {id:"complex-sentence",branch:"z-complex",domain:"grammar",level:1,modes:["production"],prerequisites:[]},
  ];
  const make=(skillId:string,exerciseFormat:ExerciseFormat,index:number):Probe=>({id:`${skillId}-${index}`,skillId,mode:"production",contextId:`${skillId}-context-${index}`,
   difficulty:.5,expectedSeconds:30,guessProbability:.05,exerciseFormat});
  const bank=[...Array.from({length:3},(_,index)=>make("agreement","cloze",index)),...Array.from({length:3},(_,index)=>make("complex-sentence","transform",index))];
  const observations:Observation[]=[];
  for(let index=0;index<3;index++){
   const selection=selectProbe(skills,bank,observations);
   expect(selection).toMatchObject({kind:"question",item:{skillId:"agreement",exerciseFormat:"cloze"}});
   if(selection.kind==="question")observations.push({...selection.item,itemId:selection.item.id,correct:false,activeSeconds:30,unaided:true,occasionId:"synthetic-day"});
  }
  expect(selectProbe(skills,bank,observations)).toMatchObject({kind:"question",item:{skillId:"complex-sentence",exerciseFormat:"transform"}});
 });

 it("rotates a repetitive spelling skill without inventing resolution",()=>{
  const skills:Skill[]=[
   {id:"m-before-mbp",branch:"a-m-before-mbp",domain:"spelling",samplingGroup:"orthographe_grammaticale",level:1,modes:["production"],prerequisites:[],evidenceRequirements:{production:{minimumItems:6,minimumContexts:6,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true}}},
   {id:"accent",branch:"z-accent",domain:"spelling",samplingGroup:"orthographe_grammaticale",level:1,modes:["production"],prerequisites:[]},
  ];
  const bank:Probe[]=skills.flatMap(skill=>Array.from({length:12},(_,index)=>({id:`${skill.id}-${index}`,skillId:skill.id,mode:"production",contextId:`${skill.id}-${index}`,
   difficulty:.5,expectedSeconds:30,guessProbability:.05,exerciseFormat:"cloze",routeTopic:skill.id})));
  const observations:Observation[]=bank.filter(item=>item.skillId==="m-before-mbp").slice(0,4).map((item,index)=>({...item,itemId:item.id,correct:index%2===0,
   activeSeconds:30,unaided:true,occasionId:"synthetic-day"}));
  expect(assessWithinOccasion(skills,observations).find(result=>result.skillId==="m-before-mbp")?.resolved).toBe(false);
  expect(selectProbe(skills,bank,observations,{...DEFAULT_POLICY,maxSpellingTopicVisit:undefined})).toMatchObject({kind:"question",item:{skillId:"m-before-mbp"}});
  expect(selectProbe(skills,bank,observations,{...DEFAULT_POLICY,maxSpellingTopicVisit:4})).toMatchObject({kind:"question",item:{skillId:"accent"}});
 });
});
