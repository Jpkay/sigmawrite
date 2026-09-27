import {assessSkills,assessWithinOccasion,DEFAULT_POLICY,selectProbe,type Observation,type Policy,type Probe,type SkillResult} from "../engine";
import {planGranularActivities,type LearningActivityBinding} from "../activity-plan";
import {inspectProfileDiscrimination} from "../profile-discrimination";
import type {V3Assessment} from "../v3-adapter";

export type ProfileTarget={skillId:string;expected:"known"|"weak"};
export type ProfileTraceInput={
 assessment:V3Assessment;
 activities:readonly LearningActivityBinding[];
 targets:readonly ProfileTarget[];
 candidateChecksum:string;
 profile:string;
 policy?:Policy;
 maxQuestions?:number;
 /** Test-only bound that returns a deliberately incomplete trace. */
 stopAfterQuestions?:number;
 /** Tense boundaries require one shared verb branch; cross-verb profiles do not. */
 requireSameBranch?:boolean;
};

type ModeEvidence=SkillResult["modes"][number];
export type ProfileTraceStep={
 index:number;questionId:string;skillId:string;mode:Probe["mode"];
 selectionReason:"branch_coverage"|"step_down"|"step_up"|"recheck_boundary"|"confirmation"|"gap_check";
 difficulty:number;expectedSeconds:number;answer:"correct"|"incorrect";elapsedSeconds:number;
 evidence:{status:SkillResult["status"];source:SkillResult["evidence"];probability:number;distinctItems:number;distinctContexts:number;distinctOccasions:number;confirmed:boolean;provisionalGap:boolean;withinOccasionResolved:boolean};
};

const requirementCount=(skill:V3Assessment["skills"][number],mode:Probe["mode"])=>(skill.evidenceRequirements?.[mode]?.minimumItems??DEFAULT_POLICY.minimumItemsPerMode);

/** Create explicit, synthetic prerequisite history for a focused routing trace.
 * It is kept outside elapsed diagnostic time and cannot stand for student evidence. */
function prerequisiteHistory(skills:readonly V3Assessment["skills"][number][],targets:ReadonlySet<string>):Observation[]{
 return skills.filter(skill=>!targets.has(skill.id)).flatMap(skill=>skill.modes.flatMap(mode=>{
  const rule=skill.evidenceRequirements?.[mode];
  const featureMinimum=Math.max(0,...(rule?.featureRequirements??[]).map(feature=>feature.minimumItems));
  const count=Math.max(requirementCount(skill,mode),featureMinimum,3);
  const contexts=Math.max(rule?.minimumContexts??DEFAULT_POLICY.minimumContextsPerMode,...(rule?.featureRequirements??[]).map(feature=>feature.minimumContexts),1);
  return Array.from({length:count},(_,index)=>{
   const hash=(index+1).toString(16).padStart(64,"0");
   const materialKeys=[...(rule?.novelWordsRequired?[`word:sha256:${hash}`]:[]),...(rule?.novelSentencesRequired?[`sentence:sha256:${hash}`]:[])];
   if(!materialKeys.length)materialKeys.push(`sentence:sha256:${hash}`);
   return {itemId:`synthetic-prerequisite:${skill.id}:${mode}:${index}`,skillId:skill.id,mode,
    contextId:`synthetic-prerequisite-context:${index%contexts}`,correct:true,guessProbability:.01,activeSeconds:0,
    unaided:true,occasionId:`synthetic-prior-day-${index%Math.max(rule?.minimumOccasions??2,2)}`,
    evidenceFeatures:(rule?.featureRequirements??[]).map(feature=>feature.feature),
    textualSupportAssessed:rule?.textualSupportRequired===true,negativeExampleAssessed:rule?.negativeExamplesRequired===true,
    contrastingErrorKeys:Array.from({length:rule?.minimumContrastingErrors??0},(_,error)=>`synthetic-prerequisite-error:${error}`),
    materialReceipt:{presentationId:`synthetic-prerequisite:${skill.id}:${index}`,sourceChecksum:"synthetic-prerequisite",
     historyComplete:true,firstRecordedKeys:materialKeys,previouslySeenKeys:[],assessedMaterialKeys:materialKeys}} satisfies Observation;
  });
 }));
}

const evidenceSnapshot=(result:SkillResult,within:SkillResult):ProfileTraceStep["evidence"]=>{
 const mode:ModeEvidence=result.modes[0];
 return {status:result.status,source:result.evidence,probability:mode.probability,distinctItems:mode.distinctItems,
  distinctContexts:mode.distinctContexts,distinctOccasions:mode.distinctOccasions,confirmed:mode.confirmed,
  provisionalGap:mode.provisionalGap===true,withinOccasionResolved:within.resolved};
};

/** Deterministically replays fixed known/weak answers through the production
 * selector. Every declared contrast target must resolve within the sitting. */
export function runProfileTrace(input:ProfileTraceInput){
 if(!input.profile.trim()||!input.candidateChecksum.trim())throw Error("Profile trace needs source identity");
 if(input.targets.length<2||!input.targets.some(target=>target.expected==="known")||!input.targets.some(target=>target.expected==="weak"))throw Error("Profile trace needs known and weak targets");
 const targetIds=new Set(input.targets.map(target=>target.skillId));
 if(targetIds.size!==input.targets.length)throw Error("Profile trace targets must be unique");
 const byId=new Map(input.assessment.skills.map(skill=>[skill.id,skill]));
 const included=new Set<string>();
 const include=(id:string)=>{
  if(included.has(id))return;
  const skill=byId.get(id);if(!skill)throw Error(`Unknown profile target or prerequisite: ${id}`);
  included.add(id);skill.prerequisites.forEach(include);
 };
 input.targets.forEach(target=>include(target.skillId));
 const skills=input.assessment.skills.filter(skill=>included.has(skill.id));
 const probes=input.assessment.probes.filter(probe=>included.has(probe.skillId));
 for(const target of input.targets)if(!probes.some(probe=>probe.skillId===target.skillId&&probe.usage!=="learning"))throw Error(`No initial probes for profile target: ${target.skillId}`);
 const policy=input.policy??DEFAULT_POLICY;
 const prior=prerequisiteHistory(skills,targetIds),observations:Observation[]=[...prior],steps:ProfileTraceStep[]=[];
 const expected=new Map(input.targets.map(target=>[target.skillId,target.expected]));
 let ending:Exclude<ReturnType<typeof selectProbe>,{kind:"question"}>|undefined;
 for(let index=0;index<(input.maxQuestions??100);index++){
  const next=selectProbe(skills,probes,observations,policy);
  if(next.kind!=="question"){ending=next;break;}
  const outcome=expected.get(next.item.skillId);
  if(!outcome)throw Error(`Focused trace selected prerequisite without resolved fixture evidence: ${next.item.skillId}`);
  const observation:Observation={itemId:next.item.id,skillId:next.item.skillId,mode:next.item.mode,contextId:next.item.contextId,
   correct:outcome==="known",guessProbability:next.item.guessProbability,activeSeconds:next.item.expectedSeconds,unaided:true,
   occasionId:"synthetic-diagnostic-day",evidenceFeatures:next.item.evidenceFeatures,textualSupportAssessed:next.item.textualSupportAssessed,
   textType:next.item.textType,contrastingErrorKeys:next.item.contrastingErrorKeys,negativeExampleAssessed:next.item.negativeExampleAssessed,
   materialReceipt:{presentationId:`synthetic-profile:${next.item.id}`,sourceChecksum:input.candidateChecksum,historyComplete:true,
    firstRecordedKeys:next.item.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:next.item.assessedMaterialKeys}};
  observations.push(observation);
  const results=assessSkills(skills,observations,policy),within=assessWithinOccasion(skills,observations,policy);
  steps.push({index:index+1,questionId:next.item.id,skillId:next.item.skillId,mode:next.item.mode,selectionReason:next.reason,
   difficulty:next.item.difficulty,expectedSeconds:next.item.expectedSeconds,answer:observation.correct?"correct":"incorrect",
   elapsedSeconds:steps.reduce((sum,step)=>sum+step.expectedSeconds,0)+next.item.expectedSeconds,
   evidence:evidenceSnapshot(results.find(result=>result.skillId===next.item.skillId)!,within.find(result=>result.skillId===next.item.skillId)!)});
  if(steps.length===input.stopAfterQuestions){
   ending={kind:"provisional",reason:"time_budget",unresolvedSkillIds:assessSkills(skills,observations,policy).filter(result=>!result.resolved).map(result=>result.skillId)};
   break;
  }
 }
 if(!ending)throw Error(`Profile trace exceeded ${input.maxQuestions??100} questions`);
 const results=assessSkills(skills,observations,policy),within=assessWithinOccasion(skills,observations,policy);
 const sampled=input.targets.map(target=>({skillId:target.skillId,withinOccasionResolved:within.find(result=>result.skillId===target.skillId)!.resolved}));
 const contrast=inspectProfileDiscrimination(input.targets.map(target=>({skillId:target.skillId,branch:byId.get(target.skillId)!.branch,expectedKnown:target.expected==="known"})),sampled,input.requireSameBranch??true);
 const focusedAssessment={...input.assessment,skills,probes,releaseScope:undefined};
 const plan=planGranularActivities(focusedAssessment,results,input.activities,5);
 const firstActivity=plan.activities[0]??null;
 return {version:"profile-trace-v1",profile:input.profile,candidateChecksum:input.candidateChecksum,
  fixedInputs:{targets:input.targets,requireSameBranch:input.requireSameBranch??true,policy:{activeSeconds:policy.activeSeconds,minimumItemsPerMode:policy.minimumItemsPerMode,
   minimumContextsPerMode:policy.minimumContextsPerMode,maxItemsPerSkill:policy.maxItemsPerSkill,startingLevel:policy.startingLevel,
   itemsPerBranchVisit:policy.itemsPerBranchVisit??null},syntheticPrerequisiteObservationCount:prior.length},
  trace:steps,activeSeconds:steps.reduce((sum,step)=>sum+step.expectedSeconds,0),ending,
  contrast,passed:contrast.passed,
  targetResults:input.targets.map(target=>results.find(result=>result.skillId===target.skillId)!),
  nextActivity:firstActivity?{...firstActivity,evidence:results.find(result=>result.skillId===firstActivity.skillId)!}:null,
  missingActivitySkillIds:plan.missingActivitySkillIds,blockedSkillIds:plan.blockedSkillIds,
  limitations:["Synthetic fixed answers and prerequisite history; no student calibration or mastery claim.","Focused routing trace over released target branches; not a complete 35-minute assessment journey."]};
}
