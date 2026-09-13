import type {LearningActivityBinding} from "../activity-plan";
import type {V3Assessment} from "../v3-adapter";
import {runMixedProfileTrace} from "./mixed-profile-trace";
import {REVISION_41_BROAD_STRUGGLING_TARGETS,REVISION_41_MIXED_TARGETS} from "./revision-41-mixed-profile";

type Trace=ReturnType<typeof runMixedProfileTrace>;

function summarize(trace:Trace){
 const lastBySkill=new Map<string,Trace["trace"][number]>();
 for(const step of trace.trace){
  lastBySkill.set(step.skillId,step);
 }
 const branchRuns:Array<{startIndex:number;endIndex:number;branch:string;questions:number;seconds:number}>=[];
 for(const step of trace.trace){
  const current=branchRuns.at(-1);
  if(current?.branch===step.branch){current.endIndex=step.index;current.questions++;current.seconds+=step.expectedSeconds;}
  else branchRuns.push({startIndex:step.index,endIndex:step.index,branch:step.branch,questions:1,seconds:step.expectedSeconds});
 }
 const terminalSteps=[...lastBySkill.values()];
 return {questionCount:trace.trace.length,answeredCount:trace.answeredCount,skippedCount:trace.skippedCount,
  responseCounts:{correct:trace.trace.filter(step=>step.response==="correct").length,
   incorrect:trace.trace.filter(step=>step.response==="incorrect").length,skip:trace.trace.filter(step=>step.response==="skip").length},
  allocation:trace.actualAllocation,selectionReasonCounts:Object.fromEntries([...new Set(trace.trace.map(step=>step.selectionReason))].sort().map(reason=>[
   reason,trace.trace.filter(step=>step.selectionReason===reason).length])),branchRuns,
  graphTransitions:trace.trace.filter(step=>step.selectionTransition.axis==="graph").map(step=>({index:step.index,reason:step.selectionReason,...step.selectionTransition})),
  itemDifficultyTransitions:trace.trace.filter(step=>step.selectionTransition.axis==="item_difficulty").map(step=>({index:step.index,reason:step.selectionReason,...step.selectionTransition})),
  evidence:{unknownSkillCount:trace.releaseScope.untestedSkillCount,unknownSkillIds:trace.releaseScope.untestedSkillIds,
   provisionalGapSkillIds:terminalSteps.filter(step=>step.evidence.provisionalGap).map(step=>step.skillId).sort(),
   directUnresolvedSkillIds:terminalSteps.filter(step=>!step.evidence.withinOccasionResolved).map(step=>step.skillId).sort(),
   resolvedWithinOccasionSkillIds:terminalSteps.filter(step=>step.evidence.withinOccasionResolved).map(step=>step.skillId).sort(),
   officiallyResolvedCount:trace.releaseScope.officiallyResolvedCount},
  unmetDeclaredTargetIds:trace.unmetDeclaredTargetIds,nextActivities:trace.nextActivities,
  missingActivitySkillIds:trace.missingActivitySkillIds,blockedSkillIds:trace.blockedSkillIds};
}

export function runFullBudgetCounterparts(input:{assessment:V3Assessment;activities:readonly LearningActivityBinding[];checksum:string}){
 const reverse=runMixedProfileTrace({assessment:input.assessment,activities:input.activities,candidateChecksum:input.checksum,
  profile:"reverse-contrasts-full-budget",targets:REVISION_41_MIXED_TARGETS});
 const broadStruggling=runMixedProfileTrace({assessment:input.assessment,activities:input.activities,candidateChecksum:input.checksum,
  profile:"broad-struggling-full-budget",targets:REVISION_41_BROAD_STRUGGLING_TARGETS,defaultResponse:"incorrect"});
 const divergences=reverse.trace.flatMap((step,index)=>step.questionId===broadStruggling.trace[index]?.questionId?[]:[{index:index+1,
  reverse:{questionId:step.questionId,skillId:step.skillId,branch:step.branch,selectionReason:step.selectionReason},
  broadStruggling:{questionId:broadStruggling.trace[index]?.questionId,skillId:broadStruggling.trace[index]?.skillId,
   branch:broadStruggling.trace[index]?.branch,selectionReason:broadStruggling.trace[index]?.selectionReason}}]);
 const assessmentTargetCount=input.assessment.releaseScope?.assessmentSkillIds.length??input.assessment.skills.filter(skill=>skill.assessmentStage!=="learning").length;
 return {version:"full-budget-counterparts-v1",checksum:input.checksum,
  fixedInputs:{activeSeconds:2100,independentProductionResponse:"skip",broadStrugglingNonSkippedResponse:"incorrect"},
  reverse:{report:reverse,summary:summarize(reverse)},broadStruggling:{report:broadStruggling,summary:summarize(broadStruggling)},
  comparison:{questionSequenceDifferenceCount:divergences.length,
   branchSequenceDifferenceCount:reverse.trace.filter((step,index)=>step.branch!==broadStruggling.trace[index]?.branch).length,
   firstDivergences:divergences.slice(0,8)},
  limitations:["Both profiles use the unchanged production selector for one 2,100-active-second occasion.",
   "The broad struggling profile marks every selected non-independent-production answer incorrect; independent production remains skipped without a trusted evaluator.",
   "Unknown means untested. A provisional gap requires direct eligible evidence and is not mastery or multi-occasion confirmation.",
   `Unmet declared targets remain explicit; neither profile is expected to assess all ${assessmentTargetCount} released targets in one sitting.`]};
}
