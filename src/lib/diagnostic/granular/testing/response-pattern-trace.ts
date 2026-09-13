import {assessSkills,assessWithinOccasion,DEFAULT_POLICY,selectProbe,type Observation,type Probe} from "../engine";
import {planGranularActivities,type LearningActivityBinding} from "../activity-plan";
import type {V3Assessment} from "../v3-adapter";

export type FixedResponse="correct"|"incorrect"|"skip";
export type ResponsePatternTraceInput={
 assessment:V3Assessment;activities:readonly LearningActivityBinding[];candidateChecksum:string;
 profile:string;skillId:string;responses:readonly FixedResponse[];
};

/** Fixed, focused response-pattern replay. It intentionally accepts only a
 * released target without prerequisites so no synthetic foundation can affect
 * the behavior under test. */
export function runResponsePatternTrace(input:ResponsePatternTraceInput){
 if(!input.profile.trim()||!input.candidateChecksum.trim()||!input.responses.length)throw Error("Response-pattern trace needs fixed inputs");
 const skill=input.assessment.skills.find(entry=>entry.id===input.skillId);
 if(!skill)throw Error(`Unknown response-pattern target: ${input.skillId}`);
 if(skill.prerequisites.length)throw Error("Response-pattern trace target must not require synthetic prerequisite evidence");
 const probes=input.assessment.probes.filter(probe=>probe.skillId===skill.id);
 if(!probes.some(probe=>probe.usage!=="learning"))throw Error(`No initial probes for response-pattern target: ${skill.id}`);
 const observations:Observation[]=[],trace:Array<{
  index:number;questionId:string;skillId:string;mode:Probe["mode"];selectionReason:string;difficulty:number;guessProbability:number;
  expectedSeconds:number;response:FixedResponse;elapsedSeconds:number;evidence:{status:string;source:string;probability:number;distinctItems:number;confirmed:boolean;provisionalGap:boolean;withinOccasionResolved:boolean};
 }>=[];
 for(const [index,response] of input.responses.entries()){
  const selection=selectProbe([skill],probes,observations,DEFAULT_POLICY);
  if(selection.kind!=="question")throw Error(`Response-pattern trace ended before fixed response ${index+1}: ${selection.kind}`);
  const probe=selection.item,skipped=response==="skip";
  const observation:Observation={itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,
   correct:response==="correct",...(skipped?{skipped:true as const}:{}),guessProbability:probe.guessProbability,
   activeSeconds:probe.expectedSeconds,unaided:true,occasionId:"synthetic-diagnostic-day",evidenceFeatures:probe.evidenceFeatures,
   textualSupportAssessed:probe.textualSupportAssessed,textType:probe.textType,contrastingErrorKeys:probe.contrastingErrorKeys,
   negativeExampleAssessed:probe.negativeExampleAssessed,...(!skipped?{materialReceipt:{presentationId:`synthetic-pattern:${input.profile}:${probe.id}`,
    sourceChecksum:input.candidateChecksum,historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}}:{})};
  observations.push(observation);
  const result=assessSkills([skill],observations)[0],within=assessWithinOccasion([skill],observations)[0],mode=result.modes[0];
  trace.push({index:index+1,questionId:probe.id,skillId:probe.skillId,mode:probe.mode,selectionReason:selection.reason,
   difficulty:probe.difficulty,guessProbability:probe.guessProbability,expectedSeconds:probe.expectedSeconds,response,
   elapsedSeconds:observations.reduce((sum,item)=>sum+item.activeSeconds,0),evidence:{status:result.status,source:result.evidence,
    probability:mode.probability,distinctItems:mode.distinctItems,confirmed:mode.confirmed,provisionalGap:mode.provisionalGap===true,
    withinOccasionResolved:within.resolved}});
 }
 const result=assessSkills([skill],observations)[0],within=assessWithinOccasion([skill],observations)[0];
 const next=selectProbe([skill],probes,observations,DEFAULT_POLICY);
 const followUp=next.kind==="question"?{kind:next.kind,reason:next.reason,questionId:next.item.id,skillId:next.item.skillId,
  mode:next.item.mode,difficulty:next.item.difficulty,guessProbability:next.item.guessProbability,expectedSeconds:next.item.expectedSeconds}:next;
 const focusedAssessment={...input.assessment,skills:[skill],probes,releaseScope:undefined};
 const plan=planGranularActivities(focusedAssessment,[result],input.activities,5);
 return {version:"response-pattern-trace-v1",profile:input.profile,candidateChecksum:input.candidateChecksum,
  fixedInputs:{skillId:input.skillId,responses:input.responses},trace,activeSeconds:observations.reduce((sum,item)=>sum+item.activeSeconds,0),
  answeredCount:observations.filter(item=>!item.skipped).length,skippedCount:observations.filter(item=>item.skipped).length,
  result,withinOccasionResolved:within.resolved,followUp,nextActivity:plan.activities[0]??null,
  missingActivitySkillIds:plan.missingActivitySkillIds,blockedSkillIds:plan.blockedSkillIds,
  limitations:["Synthetic fixed responses; a high guess-probability response space does not establish that a student guessed.","Focused released-target trace; not a complete assessment sitting or mastery claim."]};
}
