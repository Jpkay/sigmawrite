import {inspectReleaseScope} from "./release-scope";
import {checksum} from "@/lib/taxonomy/validate";
import {z} from "zod";
import type {Probe,Mode,Skill} from "./engine";
import {correctGuessChance,MAX_CONFIRMATION_GUESS_CHANCE} from "./engine";
import type {V3Assessment} from "./v3-adapter";
const modeSchema=z.enum(["recognition","production","interpretation","independent_production"]);
const positiveInteger=z.number().int().positive();
const featureSchema=z.object({feature:z.string().min(1),minimumItems:positiveInteger,minimumContexts:positiveInteger});
const ruleSchema=z.object({minimumItems:positiveInteger,minimumContexts:positiveInteger,minimumOccasions:positiveInteger,minimumAccuracy:z.number().min(0).max(1),unaidedRequired:z.boolean(),revisionRequired:z.boolean().optional(),minimumEligibleTokens:z.number().int().nonnegative().optional(),textualSupportRequired:z.boolean().optional(),novelWordsRequired:z.boolean().optional(),novelSentencesRequired:z.boolean().optional(),negativeExamplesRequired:z.boolean().optional(),minimumContrastingErrors:z.number().int().nonnegative().optional(),minimumTextTypes:z.number().int().nonnegative().optional(),parentMinimumTextTypes:z.number().int().nonnegative().optional(),featureRequirements:z.array(featureSchema).optional()});
const allocatedSchema=z.object({
 taxonomyChecksum:z.string().min(1),bankChecksum:z.string().min(1),poolChecksum:z.string().min(1),
 skills:z.array(z.object({id:z.string().min(1),nodeKey:z.string().min(1),evidenceKey:z.string().min(1),labelFr:z.string(),branch:z.string().min(1),level:z.number().int().nonnegative(),modes:z.array(modeSchema).min(1),prerequisites:z.array(z.string()),assessmentStage:z.enum(["initial","learning"]).optional(),evidenceRequirements:z.partialRecord(modeSchema,ruleSchema).optional()}).passthrough()).min(1),
 probes:z.array(z.object({id:z.string().min(1),skillId:z.string().min(1),mode:modeSchema,contextId:z.string().min(1),difficulty:z.number().min(0).max(1),expectedSeconds:z.number().positive(),guessProbability:z.number().positive().max(1),usage:z.enum(["initial","learning"]),assessedMaterialKeys:z.array(z.string().regex(/^(word|sentence|audio):sha256:[a-f0-9]{64}$/)).optional(),materialKeys:z.array(z.string().regex(/^(word|sentence|audio):sha256:[a-f0-9]{64}$/)).optional(),evidenceFeatures:z.array(z.string().min(1)).optional()}).passthrough()),
}).passthrough();
const poolChecksum=(probes:readonly Probe[])=>checksum({version:"granular-question-pools-v1",assignments:probes.map(p=>({id:p.id,usage:p.usage})).sort((a,b)=>a.id.localeCompare(b.id))});

/** Reserve freshness is global: a passage used for one skill's diagnostic is
 * already familiar when another skill later asks a question about that text. */
export function readingPoolConflicts(probes:readonly Probe[]){
 const passages=new Map<string,{contextId:string;initialQuestionIds:string[];learningQuestionIds:string[]}>();
 for(const probe of probes){
  if(!probe.contextId.startsWith("passage-content:"))continue;
  const row=passages.get(probe.contextId)??{contextId:probe.contextId,initialQuestionIds:[],learningQuestionIds:[]};
  if(probe.usage==="initial")row.initialQuestionIds.push(probe.id);
  if(probe.usage==="learning")row.learningQuestionIds.push(probe.id);
  passages.set(probe.contextId,row);
 }
 return [...passages.values()].filter(row=>row.initialQuestionIds.length&&row.learningQuestionIds.length)
  .map(row=>({...row,initialQuestionIds:row.initialQuestionIds.sort(),learningQuestionIds:row.learningQuestionIds.sort()})).sort((a,b)=>a.contextId.localeCompare(b.contextId));
}

/** Pool novelty is about reviewed material identity, never question IDs. Learner
 * history and exposure from other activities still require runtime verification. */
function freshTogether(probes:readonly Probe[],skill:Skill,mode:Mode){
 const rule=skill.evidenceRequirements?.[mode];
 for(const kind of ["word","sentence"] as const){
  if(!(kind==="word"?rule?.novelWordsRequired:rule?.novelSentencesRequired))continue;
  const exposed=new Set<string>(),assessed=new Set<string>();
  for(const probe of probes){
   const exposureKeys=[...new Set((probe.materialKeys??[]).filter(key=>key.startsWith(`${kind}:`)))];
   const targetKeys=[...new Set((probe.assessedMaterialKeys??probe.materialKeys??[]).filter(key=>key.startsWith(`${kind}:`)))];
   if(!targetKeys.length||targetKeys.some(key=>!exposureKeys.includes(key)||exposed.has(key))||exposureKeys.some(key=>assessed.has(key)))return false;
   exposureKeys.forEach(key=>exposed.add(key));targetKeys.forEach(key=>assessed.add(key));
  }
 }
 return true;
}

export function isQuestionPoolSufficient(probes:readonly Probe[],skill:Skill,mode:Mode,learning:boolean){
 const rule=skill.evidenceRequirements?.[mode];
 const minimum=learning?Math.max(3,rule?.minimumItems??3):(rule?.minimumItems??3);
 return freshTogether(probes,skill,mode)&&(!rule?.textualSupportRequired||probes.every(probe=>probe.textualSupportAssessed===true))&&probes.length>=minimum&&new Set(probes.map(p=>p.contextId)).size>=(rule?.minimumContexts??2)
  &&(!rule?.negativeExamplesRequired||probes.some(p=>p.negativeExampleAssessed===true))
  &&new Set(probes.flatMap(p=>p.contrastingErrorKeys??[])).size>=(rule?.minimumContrastingErrors??0)
  &&new Set(probes.map(p=>p.textType).filter(Boolean)).size>=(rule?.minimumTextTypes??0)
  &&correctGuessChance(probes)<=MAX_CONFIRMATION_GUESS_CHANCE
  &&(rule?.featureRequirements??[]).every(feature=>{
   const relevant=probes.filter(p=>p.evidenceFeatures?.includes(feature.feature));
   return relevant.length>=feature.minimumItems&&new Set(relevant.map(p=>p.contextId)).size>=feature.minimumContexts
    &&correctGuessChance(relevant)<=MAX_CONFIRMATION_GUESS_CHANCE;
  });
}

/** Check the stored assignments, not a caller-supplied readiness flag or a newly
 * computed alternative allocation. This is a pool guard, not pedagogical approval. */
export function inspectQuestionPools(input:unknown):{ok:boolean;issues:string[]}{
 const parsed=allocatedSchema.safeParse(input);
 if(!parsed.success)return {ok:false,issues:["Malformed or unallocated assessment question pools"]};
 const assessment=parsed.data as V3Assessment,issues:string[]=[];
 if(poolChecksum(assessment.probes)!==assessment.poolChecksum)issues.push("Question-pool checksum mismatch");
 let supported:Set<string>|undefined;
 if(assessment.releaseScope!==undefined){
  try{supported=inspectReleaseScope(assessment.skills,assessment.releaseScope).assessmentSkillIds;}
  catch{return {ok:false,issues:["Invalid assessment release scope"]};}
 }
 const skills=new Map(assessment.skills.map(s=>[s.id,s]));
 if(skills.size!==assessment.skills.length)issues.push("Duplicate assessment skill");
 if(new Set(assessment.probes.map(p=>p.id)).size!==assessment.probes.length)issues.push("Duplicate question identity across pools");
 for(const conflict of readingPoolConflicts(assessment.probes))issues.push(`Reading passage shared across initial and learning pools: ${conflict.contextId}`);
 for(const probe of assessment.probes){
  const skill=skills.get(probe.skillId);
  if(supported&&!supported.has(probe.skillId))issues.push(`Question outside release scope: ${probe.id}`);
  if(!skill||!skill.modes.includes(probe.mode))issues.push(`Unknown question target: ${probe.id}`);
 }
 for(const skill of assessment.skills){
  if(new Set(skill.modes).size!==skill.modes.length)issues.push(`Duplicate mode: ${skill.id}`);
  if(skill.prerequisites.some(id=>!skills.has(id)))issues.push(`Unknown prerequisite: ${skill.id}`);
  if(supported&&!supported.has(skill.id))continue;
  for(const mode of skill.modes){
   const probes=assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===mode),initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
   if(skill.assessmentStage==="learning"?initial.length>0:!isQuestionPoolSufficient(initial,skill,mode,false))issues.push(`Insufficient or invalid initial pool: ${skill.id}:${mode}`);
   if(!freshTogether(probes,skill,mode))issues.push(`Repeated or missing material identity: ${skill.id}:${mode}`);
   if(!isQuestionPoolSufficient(learning,skill,mode,true))issues.push(`Insufficient learning pool: ${skill.id}:${mode}`);
  }
 }
 return {ok:issues.length===0,issues};
}

function allocateFreshPools(probes:readonly Probe[],skill:Skill,mode:Mode,maxStates:number){
 const candidates=probes.filter(probe=>freshTogether([probe],skill,mode));
 const learningOnly=skill.assessmentStage==="learning";
 let visited=0,limited=false;
 function search(index:number,initial:Probe[],learning:Probe[]):{initial:Probe[];learning:Probe[]}|null{
  if(++visited>maxStates){limited=true;return null;}
  const initialReady=learningOnly||isQuestionPoolSufficient(initial,skill,mode,false),learningReady=isQuestionPoolSufficient(learning,skill,mode,true);
  if(initialReady&&learningReady)return {initial,learning};
  const needed=(initialReady?0:Math.max(0,(skill.evidenceRequirements?.[mode]?.minimumItems??3)-initial.length))
   +(learningReady?0:Math.max(0,Math.max(3,skill.evidenceRequirements?.[mode]?.minimumItems??3)-learning.length));
  if(index>=candidates.length||candidates.length-index<needed)return null;
  const probe=candidates[index];
  if(freshTogether([...initial,...learning,probe],skill,mode)){
   if(!initialReady){const found=search(index+1,[...initial,probe],learning);if(found||limited)return found;}
   if(!learningReady){const found=search(index+1,initial,[...learning,probe]);if(found||limited)return found;}
  }
  return search(index+1,initial,learning);
 }
 return {selection:search(0,[],[]),limited};
}

/** Reconcile shared reading passages after target-local allocation. Search only
 * the connected targets touched by a conflict; retain every selected question.
 * Failure is not proof that another selection from the source bank is impossible. */
function alignReadingPools(assessment:V3Assessment,maxStates:number):"not_needed"|"reallocated"|"unresolved"|"search_limit"{
 const conflicts=readingPoolConflicts(assessment.probes);
 if(!conflicts.length)return "not_needed";
 const targetKey=(probe:Probe)=>JSON.stringify([probe.skillId,probe.mode]);
 const contexts=new Set(conflicts.map(row=>row.contextId)),targets=new Set<string>();
 let changed=true;
 while(changed){
  changed=false;
  for(const probe of assessment.probes){
   if(!probe.contextId.startsWith("passage-content:"))continue;
   const key=targetKey(probe);
   if(contexts.has(probe.contextId)&&!targets.has(key)){targets.add(key);changed=true;}
   if(targets.has(key)&&!contexts.has(probe.contextId)){contexts.add(probe.contextId);changed=true;}
  }
 }
 const groups=assessment.skills.flatMap(skill=>skill.modes.flatMap(mode=>{
  const probes=assessment.probes.filter(probe=>probe.skillId===skill.id&&probe.mode===mode);
  return targets.has(JSON.stringify([skill.id,mode]))?[{skill,mode,probes}]:[];
 }));
 const ordered=[...contexts].sort(),assignment=new Map<string,"initial"|"learning">();
 let visited=0,limited=false;
 function possible(){
  return groups.every(({skill,mode,probes})=>{
   const phase=(probe:Probe)=>contexts.has(probe.contextId)?assignment.get(probe.contextId):probe.usage;
   if(skill.assessmentStage==="learning"&&probes.some(probe=>phase(probe)==="initial"))return false;
   return (skill.assessmentStage==="learning"||isQuestionPoolSufficient(probes.filter(probe=>phase(probe)!=="learning"),skill,mode,false))
    &&isQuestionPoolSufficient(probes.filter(probe=>phase(probe)!=="initial"),skill,mode,true);
  });
 }
 function search(index:number):boolean{
  if(++visited>maxStates){limited=true;return false;}
  if(!possible())return false;
  if(index===ordered.length)return true;
  const context=ordered[index],existing=assessment.probes.find(probe=>probe.contextId===context)!.usage!;
  for(const phase of [existing,existing==="initial"?"learning":"initial"] as const){
   assignment.set(context,phase);
   if(search(index+1))return true;
   if(limited)break;
  }
  assignment.delete(context);
  return false;
 }
 if(!search(0))return limited?"search_limit":"unresolved";
 for(const probe of assessment.probes){const phase=assignment.get(probe.contextId);if(phase)probe.usage=phase;}
 return "reallocated";
}

/** Split only when BOTH pools retain the declared evidence requirements. A search
 * limit is reported separately from a proven capacity shortfall; neither can
 * silently weaken a target or allow initial selection to consume its reserve. */
export function allocateQuestionPools(source:V3Assessment,maxSearchStates=20000){
 if(!Number.isInteger(maxSearchStates)||maxSearchStates<1)throw Error("Invalid pool search limit");
 const assessment=structuredClone(source);
 const coverage:Array<{skillId:string;mode:Mode;status:"allocated"|"insufficient_coverage"|"search_limit";initialItems:number;learningItems:number;excludedQuestionIds?:string[]}>=[];
 for(const skill of assessment.skills)for(const mode of skill.modes){
  const probes=assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===mode).sort((a,b)=>a.id.localeCompare(b.id));
  for(const probe of probes)probe.usage="initial";
  const learningOnly=skill.assessmentStage==="learning";
  const rule=skill.evidenceRequirements?.[mode];
  if(rule?.novelWordsRequired||rule?.novelSentencesRequired){
   const result=allocateFreshPools(probes,skill,mode,maxSearchStates);
   const selected=result.selection;
   if(selected){
    const selectedIds=new Set([...selected.initial,...selected.learning].map(probe=>probe.id));
    // The search finds a sufficient core, not the whole usable inventory. Keep
    // compatible surplus so later learning has more than the minimum checks.
    // Check the union: an extra item's context may expose another item's target
    // even when its own assessed word or sentence is new.
    for(const probe of probes){
     if(selectedIds.has(probe.id)||!freshTogether([...selected.initial,...selected.learning,probe],skill,mode))continue;
     const destination=learningOnly||selected.learning.length<selected.initial.length?selected.learning:selected.initial;
     destination.push(probe);selectedIds.add(probe.id);
    }
    selected.initial.forEach(probe=>probe.usage="initial");selected.learning.forEach(probe=>probe.usage="learning");
    assessment.probes=assessment.probes.filter(probe=>!probes.includes(probe)||selectedIds.has(probe.id));
    coverage.push({skillId:skill.id,mode,status:"allocated",initialItems:selected.initial.length,learningItems:selected.learning.length,excludedQuestionIds:probes.filter(probe=>!selectedIds.has(probe.id)).map(probe=>probe.id)});
   }else{
    if(learningOnly)probes.forEach(probe=>probe.usage="learning");
    coverage.push({skillId:skill.id,mode,status:result.limited?"search_limit":"insufficient_coverage",initialItems:learningOnly?0:probes.length,learningItems:learningOnly?probes.length:0});
   }
   continue;
  }
  // Even the most favourable subset must pass the guessing bound. Starting
  // below this size wastes the search budget enumerating impossible subsets.
  const bestGuessOrder=[...probes].sort((a,b)=>a.guessProbability-b.guessProbability);
  const guessMinimum=Array.from({length:probes.length},(_,index)=>index+1)
   .find(count=>correctGuessChance(bestGuessOrder.slice(0,count))<=MAX_CONFIRMATION_GUESS_CHANCE)??probes.length+1;
  const minInitial=learningOnly?0:Math.max(guessMinimum,skill.evidenceRequirements?.[mode]?.minimumItems??3);
  const minLearning=Math.max(guessMinimum,3,skill.evidenceRequirements?.[mode]?.minimumItems??3);
  let chosen:Probe[]|null=null,visited=0,limited=false;
  if(learningOnly){
   // Initial assessment never serves this stage, including when its content is incomplete.
   for(const probe of probes)probe.usage="learning";
   if(isQuestionPoolSufficient(probes,skill,mode,true))chosen=probes;
  }else if(probes.length>=minInitial+minLearning&&isQuestionPoolSufficient(probes,skill,mode,true)
   &&(skill.evidenceRequirements?.[mode]?.featureRequirements??[]).every(rule=>probes.filter(p=>p.evidenceFeatures?.includes(rule.feature)).length>=2*rule.minimumItems)){
   // Try a balanced partition for multi-feature contracts before enumerating
   // subsets that cannot meet each feature's independent guessing bound.
   // Full pool validation remains authoritative, including shared material.
   const requiredFeatures=skill.evidenceRequirements?.[mode]?.featureRequirements??[];
   if(requiredFeatures.length>1){
    const groups=new Map<string,Probe[]>();
    for(const probe of probes){
     const signature=JSON.stringify(requiredFeatures.filter(f=>probe.evidenceFeatures?.includes(f.feature)).map(f=>f.feature).sort());
     groups.set(signature,[...(groups.get(signature)??[]),probe]);
    }
    const balanced=[...groups.values()].flatMap(group=>[...group].sort((a,b)=>a.id.localeCompare(b.id)).filter((_,index)=>index%2===0));
    const ids=new Set(balanced.map(p=>p.id));
    if(isQuestionPoolSufficient(balanced,skill,mode,true)&&isQuestionPoolSufficient(probes.filter(p=>!ids.has(p.id)),skill,mode,false))chosen=balanced;
   }
   const search=(start:number,size:number,current:Probe[]):Probe[]|null=>{
    if(++visited>maxSearchStates){limited=true;return null;}
    if(current.length===size){
     if(!isQuestionPoolSufficient(current,skill,mode,true))return null;
     const ids=new Set(current.map(p=>p.id));
     return isQuestionPoolSufficient(probes.filter(p=>!ids.has(p.id)),skill,mode,false)?[...current]:null;
    }
    for(let index=start;index<=probes.length-(size-current.length);index++){
     const result=search(index+1,size,[...current,probes[index]]);
     if(result||limited)return result;
    }
    return null;
   };
   for(let size=minLearning;size<=probes.length-minInitial&&!chosen&&!limited;size++)chosen=search(0,size,[]);
  }
  if(chosen)for(const probe of chosen)probe.usage="learning";
  coverage.push({skillId:skill.id,mode,status:chosen?"allocated":limited?"search_limit":"insufficient_coverage",
   initialItems:probes.filter(p=>p.usage==="initial").length,learningItems:probes.filter(p=>p.usage==="learning").length});
 }
 // Once both pools meet their evidence contract, share surplus capacity instead
 // of putting every extra question in the initial sitting. Move a question only
 // when both resulting pools remain sufficient. Historical bundles keep their
 // stored assignments; this applies only when compiling a new allocation.
 for(const row of coverage.filter(row=>row.status==="allocated")){
  const skill=assessment.skills.find(skill=>skill.id===row.skillId)!;
  if(skill.assessmentStage==="learning")continue;
  const group=assessment.probes.filter(probe=>probe.skillId===row.skillId&&probe.mode===row.mode);
  for(const probe of group.filter(probe=>probe.usage==="initial")){
   const initial=group.filter(probe=>probe.usage==="initial"),learning=group.filter(probe=>probe.usage==="learning");
   if(initial.length<=learning.length+1)break;
   if(isQuestionPoolSufficient(initial.filter(item=>item.id!==probe.id),skill,row.mode,false)
    &&isQuestionPoolSufficient([...learning,probe],skill,row.mode,true))probe.usage="learning";
  }
 }
 // Preserve content categories in both reserves when the existing evidence
 // contract permits it. This changes only a newly compiled partition, not the
 // graph's confirmation criteria or historical stored releases.
 for(const row of coverage.filter(row=>row.status==="allocated")){
  const skill=assessment.skills.find(skill=>skill.id===row.skillId)!;
  if(skill.assessmentStage==="learning")continue;
  const group=assessment.probes.filter(probe=>probe.skillId===row.skillId&&probe.mode===row.mode);
  if(!group.length||group.some(probe=>!probe.samplingCategory))continue;
  const categories=[...new Set(group.map(probe=>probe.samplingCategory))].sort();
  const balanced=categories.flatMap(category=>group.filter(probe=>probe.samplingCategory===category).sort((a,b)=>a.id.localeCompare(b.id)).map((probe,index)=>({...probe,usage:index%2===0?"initial" as const:"learning" as const})));
  if(!categories.every(category=>["initial","learning"].every(usage=>balanced.some(probe=>probe.samplingCategory===category&&probe.usage===usage))))continue;
  if(isQuestionPoolSufficient(balanced.filter(probe=>probe.usage==="initial"),skill,row.mode,false)&&isQuestionPoolSufficient(balanced.filter(probe=>probe.usage==="learning"),skill,row.mode,true)){
   const usage=new Map(balanced.map(probe=>[probe.id,probe.usage]));
   group.forEach(probe=>{probe.usage=usage.get(probe.id)!;});
  }
 }
 const readingAllocationStatus=!readingPoolConflicts(assessment.probes).length?"not_needed":coverage.every(row=>row.status==="allocated")?alignReadingPools(assessment,maxSearchStates):"unresolved";
 for(const row of coverage){
  const probes=assessment.probes.filter(probe=>probe.skillId===row.skillId&&probe.mode===row.mode);
  row.initialItems=probes.filter(probe=>probe.usage==="initial").length;
  row.learningItems=probes.filter(probe=>probe.usage==="learning").length;
 }
 assessment.poolChecksum=poolChecksum(assessment.probes);
 const readingPassageConflicts=readingPoolConflicts(assessment.probes);
 return {assessment,coverage,readingPassageConflicts,readingAllocationStatus,ready:coverage.every(row=>row.status==="allocated")&&readingPassageConflicts.length===0};
}

/** Select an explicit release scope from allocated pools, preserving the full
 * graph and every retained question's initial/follow-up assignment. */
export function applyQuestionPoolScope(source:V3Assessment,rawScope:unknown):V3Assessment{
 const checked=inspectReleaseScope(source.skills,rawScope);
 if(!source.poolChecksum||poolChecksum(source.probes)!==source.poolChecksum)throw Error("Source question-pool checksum mismatch");
 const assessment=structuredClone(source);
 assessment.releaseScope=checked.scope;
 assessment.probes=assessment.probes.filter(probe=>checked.assessmentSkillIds.has(probe.skillId));
 assessment.poolChecksum=poolChecksum(assessment.probes);
 const validation=inspectQuestionPools(assessment);
 if(!validation.ok)throw Error(`Scoped question pools are incomplete: ${validation.issues.join("; ")}`);
 return assessment;
}
