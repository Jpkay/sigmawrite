import {planGranularActivities,type LearningActivityBinding} from "../activity-plan";
import {assessSkills,type Observation,type Probe,type SkillResult} from "../engine";
import type {V3Assessment} from "../v3-adapter";

type TeachingLesson={id:string;nodeKey:string;facetKey?:string;mode:Probe["mode"];status:string;assessmentExposureIds:readonly string[];practice:readonly {id:string}[]};
export type LearningRefinementTraceInput={assessment:V3Assessment;activities:readonly LearningActivityBinding[];teachingContent:readonly TeachingLesson[];
 candidateChecksum:string;skillId:string;firstLearningOccasionItems:number};

const evidence=(result:SkillResult)=>{const mode=result.modes[0];return {status:result.status,resolved:result.resolved,evidence:result.evidence,
 probability:mode.probability,distinctItems:mode.distinctItems,distinctContexts:mode.distinctContexts,distinctOccasions:mode.distinctOccasions,
 accuracy:mode.accuracy,confirmed:mode.confirmed,provisionalGap:mode.provisionalGap===true};};

function observed(probe:Probe,correct:boolean,occasionId:string,sourceChecksum:string,source?:"learning"):Observation{
 return {itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct,guessProbability:probe.guessProbability,
  activeSeconds:probe.expectedSeconds,unaided:true,occasionId,...(source?{source}:{}),evidenceFeatures:probe.evidenceFeatures,
  textualSupportAssessed:probe.textualSupportAssessed,textType:probe.textType,contrastingErrorKeys:probe.contrastingErrorKeys,
  negativeExampleAssessed:probe.negativeExampleAssessed,materialReceipt:{presentationId:`synthetic-refinement:${occasionId}:${probe.id}`,
   sourceChecksum,historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}};
}

/** Replays released questions around a completed guided lesson. Guided practice
 * is recorded separately because the production service never adds it to
 * diagnostic observations. Reserved checks are reported even when their R41
 * activity binding is not published. */
export function runLearningRefinementTrace(input:LearningRefinementTraceInput){
 if(!input.candidateChecksum.trim()||input.firstLearningOccasionItems<1)throw Error("Learning refinement trace needs fixed inputs");
 const skill=input.assessment.skills.find(entry=>entry.id===input.skillId);
 if(!skill)throw Error(`Unknown learning-refinement target: ${input.skillId}`);
 if(skill.prerequisites.length)throw Error("Learning-refinement target must not require synthetic prerequisite evidence");
 const initial=input.assessment.probes.filter(probe=>probe.skillId===skill.id&&probe.usage!=="learning").sort((a,b)=>a.id.localeCompare(b.id)).slice(0,3);
 if(initial.length<3)throw Error("Learning-refinement trace needs three released initial questions");
 const instruction=input.activities.find(binding=>binding.status==="published"&&binding.kind==="instruction"&&binding.nodeKey===skill.nodeKey
  &&(binding.facetKey??null)===(skill.facetKey??null)&&binding.mode===skill.modes[0]);
 if(!instruction?.contentId)throw Error("Learning-refinement trace needs a released instruction");
 const lesson=input.teachingContent.find(entry=>entry.id===instruction.contentId&&entry.status.startsWith("published"));
 if(!lesson||lesson.nodeKey!==skill.nodeKey||(lesson.facetKey??null)!==(skill.facetKey??null)||lesson.mode!==skill.modes[0])throw Error("Released instruction and lesson do not match the target");
 const check=input.activities.find(binding=>binding.kind==="independent_check"&&binding.nodeKey===skill.nodeKey
  &&(binding.facetKey??null)===(skill.facetKey??null)&&binding.mode===skill.modes[0]);
 if(!check?.probeIds?.length)throw Error("Learning-refinement trace needs reserved released check questions");
 const reserved=new Set(check.probeIds);
 const learning=input.assessment.probes.filter(probe=>probe.skillId===skill.id&&probe.usage==="learning"&&reserved.has(probe.id)).sort((a,b)=>a.id.localeCompare(b.id));
 if(learning.length<4||input.firstLearningOccasionItems>=learning.length)throw Error("Learning-refinement trace needs checks across two occasions");
 const focused={...input.assessment,skills:[skill],probes:[...initial,...learning],releaseScope:undefined};
 const observations:Observation[]=initial.map(probe=>observed(probe,false,"synthetic-diagnostic-day",input.candidateChecksum));
 const initialResult=assessSkills([skill],observations)[0];
 const initialPlan=planGranularActivities(focused,[initialResult],input.activities,5);
 const guidedPractice=lesson.practice.map((exercise,index)=>({index:index+1,exerciseId:exercise.id,response:"correct" as const,evidenceObservationAdded:false}));
 const afterGuided=assessSkills([skill],observations)[0];
 const afterGuidedPlan=planGranularActivities(focused,[afterGuided],input.activities,5,new Set([lesson.id]));
 const independentTrace:Array<{index:number;questionId:string;mode:Probe["mode"];usage:Probe["usage"];difficulty:number;guessProbability:number;
  expectedSeconds:number;occasionId:string;response:"correct";elapsedSeconds:number;evidence:ReturnType<typeof evidence>}>=[];
 for(const [index,probe] of learning.entries()){
  const occasionId=index<input.firstLearningOccasionItems?"learning-day:2026-09-14":"learning-day:2026-09-15";
  observations.push(observed(probe,true,occasionId,input.candidateChecksum,"learning"));
  independentTrace.push({index:index+1,questionId:probe.id,mode:probe.mode,usage:probe.usage,difficulty:probe.difficulty,
   guessProbability:probe.guessProbability,expectedSeconds:probe.expectedSeconds,occasionId,response:"correct",
   elapsedSeconds:learning.slice(0,index+1).reduce((sum,item)=>sum+item.expectedSeconds,0),evidence:evidence(assessSkills([skill],observations)[0])});
 }
 const afterFirstOccasion=independentTrace[input.firstLearningOccasionItems-1];
 const finalResult=assessSkills([skill],observations)[0];
 const finalPlan=planGranularActivities(focused,[finalResult],input.activities,5,new Set([lesson.id]));
 return {version:"learning-refinement-trace-v1",candidateChecksum:input.candidateChecksum,skillId:skill.id,
  initialDiagnostic:{questions:initial.map(probe=>({questionId:probe.id,mode:probe.mode,usage:probe.usage,difficulty:probe.difficulty,
   guessProbability:probe.guessProbability,expectedSeconds:probe.expectedSeconds,response:"incorrect" as const})),activeSeconds:initial.reduce((sum,item)=>sum+item.expectedSeconds,0),
   evidence:evidence(initialResult),nextActivity:initialPlan.activities[0]??null},
  guidedLesson:{activityId:instruction.id,contentId:lesson.id,practice:guidedPractice,evidenceObservationCount:0,evidenceBefore:evidence(initialResult),
   evidenceAfter:evidence(afterGuided),nextActivity:afterGuidedPlan.activities[0]??null,missingActivitySkillIds:afterGuidedPlan.missingActivitySkillIds},
  independentCheck:{activityId:check.id,bindingStatus:check.status,deliveryAvailable:check.status==="published",questions:independentTrace,
   activeSeconds:independentTrace.reduce((sum,step)=>sum+step.expectedSeconds,0),afterFirstOccasion:afterFirstOccasion.evidence,
   finalEvidence:evidence(finalResult),nextActivity:finalPlan.activities[0]??null,missingActivitySkillIds:finalPlan.missingActivitySkillIds},
  limitations:["Focused synthetic replay of released R41 evidence; it does not claim mastery of any other target.",
   "The R41 independent-check binding is recorded with its actual publication status; reserved questions are not a claim that the check is deliverable.",
   "No browser, persistence, calibration, owner review, or deployed journey is exercised."]};
}
