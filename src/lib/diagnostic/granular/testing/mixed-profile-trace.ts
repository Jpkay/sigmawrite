import {planGranularActivities,type LearningActivityBinding} from "../activity-plan";
import {assessSkills,assessWithinOccasion,DEFAULT_POLICY,selectProbe,type Observation,type Policy,type Probe} from "../engine";
import {inspectReleaseScope} from "../release-scope";
import type {V3Assessment} from "../v3-adapter";

export type MixedProfileTarget={skillId:string;expected:"known"|"weak"};
export type MixedProfileTraceInput={assessment:V3Assessment;activities:readonly LearningActivityBinding[];candidateChecksum:string;
 profile:string;targets:readonly MixedProfileTarget[];defaultResponse?:"correct"|"incorrect";policy?:Policy;maxQuestions?:number};

/** One full-budget replay through the unchanged production selector. There are
 * no per-domain quotas: the allocation is measured from the selected probes. */
export function runMixedProfileTrace(input:MixedProfileTraceInput){
 const policy=input.policy??DEFAULT_POLICY;
 const defaultResponse=input.defaultResponse??"correct";
 if(policy.activeSeconds!==2100)throw Error("Mixed profile trace must use the 2,100-second policy budget");
 const byId=new Map(input.assessment.skills.map(skill=>[skill.id,skill]));
 const expected=new Map(input.targets.map(target=>[target.skillId,target.expected]));
 if(expected.size!==input.targets.length||input.targets.some(target=>!byId.has(target.skillId)))throw Error("Mixed profile targets must be unique released skills");
 const observations:Observation[]=[],trace:Array<{index:number;questionId:string;skillId:string;domain:string;samplingGroup:string;branch:string;
  mode:Probe["mode"];selectionReason:string;difficulty:number;guessProbability:number;expectedSeconds:number;response:"correct"|"incorrect"|"skip";
  selectionTransition:Extract<ReturnType<typeof selectProbe>,{kind:"question"}>["transition"];elapsedSeconds:number;
  evidence:{status:string;source:string;probability:number;distinctItems:number;confirmed:boolean;provisionalGap:boolean;withinOccasionResolved:boolean}}>=[];
 let ending:Exclude<ReturnType<typeof selectProbe>,{kind:"question"}>|undefined;
 for(let index=0;index<(input.maxQuestions??200);index++){
  const selection=selectProbe(input.assessment.skills,input.assessment.probes,observations,policy,[],input.assessment.releaseScope);
  if(selection.kind!=="question"){ending=selection;break;}
  const probe=selection.item,skill=byId.get(probe.skillId)!;
  const response=probe.mode==="independent_production"?"skip":expected.get(probe.skillId)==="weak"?"incorrect":
   expected.get(probe.skillId)==="known"?"correct":defaultResponse;
  const observation:Observation={itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:response==="correct",
   ...(response==="skip"?{skipped:true as const}:{}),guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,
   occasionId:"synthetic-diagnostic-day",evidenceFeatures:probe.evidenceFeatures,textualSupportAssessed:probe.textualSupportAssessed,
   textType:probe.textType,contrastingErrorKeys:probe.contrastingErrorKeys,negativeExampleAssessed:probe.negativeExampleAssessed,
   ...(response!=="skip"?{materialReceipt:{presentationId:`synthetic-mixed:${probe.id}`,sourceChecksum:input.candidateChecksum,historyComplete:true,
    firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}}:{})};
  observations.push(observation);
  const result=assessSkills([skill],observations,policy)[0],within=assessWithinOccasion([skill],observations,policy)[0],mode=result.modes.find(item=>item.mode===probe.mode)!;
  trace.push({index:index+1,questionId:probe.id,skillId:probe.skillId,domain:skill.domain??"unspecified",samplingGroup:skill.samplingGroup??"unspecified",
   branch:skill.branch,mode:probe.mode,selectionReason:selection.reason,difficulty:probe.difficulty,guessProbability:probe.guessProbability,
   expectedSeconds:probe.expectedSeconds,response,selectionTransition:selection.transition,
   elapsedSeconds:observations.reduce((sum,item)=>sum+item.activeSeconds,0),evidence:{status:result.status,
    source:result.evidence,probability:mode.probability,distinctItems:mode.distinctItems,confirmed:mode.confirmed,
    provisionalGap:mode.provisionalGap===true,withinOccasionResolved:within.resolved}});
 }
 if(!ending)throw Error(`Mixed profile trace exceeded ${input.maxQuestions??200} questions`);
 const results=assessSkills(input.assessment.skills,observations,policy),within=assessWithinOccasion(input.assessment.skills,observations,policy);
 const scope=input.assessment.releaseScope?inspectReleaseScope(input.assessment.skills,input.assessment.releaseScope):null;
 const scopedIds=scope?[...scope.assessmentSkillIds]:input.assessment.skills.filter(skill=>skill.assessmentStage!=="learning").map(skill=>skill.id);
 const scopedResults=scopedIds.map(id=>results.find(result=>result.skillId===id)!);
 const allocation=(key:"domain"|"samplingGroup"|"branch")=>Object.fromEntries([...new Set(trace.map(step=>step[key]))].sort().map(value=>[value,{
  questions:trace.filter(step=>step[key]===value).length,seconds:trace.filter(step=>step[key]===value).reduce((sum,step)=>sum+step.expectedSeconds,0)}]));
 const targetResults=input.targets.map(target=>{const result=results.find(item=>item.skillId===target.skillId)!,routing=within.find(item=>item.skillId===target.skillId)!;
  return {...target,questions:trace.filter(step=>step.skillId===target.skillId).length,result,withinOccasionResolved:routing.resolved};});
 const plan=planGranularActivities(input.assessment,results,input.activities,5);
 return {version:"mixed-profile-trace-v1",profile:input.profile,candidateChecksum:input.candidateChecksum,
  fixedInputs:{activeSeconds:policy.activeSeconds,defaultResponse,independentProductionResponse:"skip",targets:input.targets},trace,
  activeSeconds:observations.reduce((sum,item)=>sum+item.activeSeconds,0),answeredCount:observations.filter(item=>!item.skipped).length,
  skippedCount:observations.filter(item=>item.skipped).length,ending,actualAllocation:{byDomain:allocation("domain"),bySamplingGroup:allocation("samplingGroup"),byBranch:allocation("branch")},
  releaseScope:{declaredSkillCount:scopedIds.length,directEvidenceSkillCount:scopedResults.filter(result=>result.evidence==="direct").length,
   untestedSkillCount:scopedResults.filter(result=>result.evidence==="untested").length,resolvedWithinOccasionCount:scopedIds.filter(id=>within.find(result=>result.skillId===id)?.resolved).length,
   officiallyResolvedCount:scopedResults.filter(result=>result.resolved).length,
   untestedSkillIds:scopedResults.filter(result=>result.evidence==="untested").map(result=>result.skillId)},
  declaredTargets:targetResults,unmetDeclaredTargetIds:targetResults.filter(target=>!target.withinOccasionResolved).map(target=>target.skillId),
  nextActivities:plan.activities,missingActivitySkillIds:plan.missingActivitySkillIds,blockedSkillIds:plan.blockedSkillIds,
  limitations:["Synthetic fixed responses through the production selector; no per-domain time quota is imposed.",
   "Independent-production prompts are skipped because this trace has no trusted writing evaluator.",
   "Within-occasion resolution is routing evidence, not an official multi-occasion result or a claim that every released target is mastered.",
   "No pause/resume, persistence, browser, calibration, or deployed journey is exercised."]};
}
