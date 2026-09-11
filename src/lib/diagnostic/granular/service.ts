import {inspectReleaseScope} from "./release-scope";
import {learningSeenQuestionIds} from "./learning-exposure";
import {assessmentObservations} from "./session";
import {requiresWritingRevision} from "./writing-evidence";
import {withKnownMaterialHistory} from "./material-history";
import {knownExposedMaterialKeys,probeRepeatsKnownTarget,learningReadiness} from "./engine";
import {readQuestionMaterialReceipt} from "./question-material-receipt";
import type {MaterialReceipt} from "./material-receipt";
import {z} from "zod";
import {gradeTextualSupport,publicTextualSupport} from "./textual-support";
import {planGranularActivities,availableLearningBindings,type LearningActivityBinding} from "./activity-plan";
import {stableUuid} from "@/lib/lexicon/baseline";
import {shuffleChoices} from "@/lib/content/choice-order";
const choiceId=(sessionId:string,itemId:string,index:number)=>stableUuid("granular-choice",`${sessionId}:${itemId}:${index}`);
import {validateAnswer} from "@/lib/linguistic/validator";
import {ReadingAssessmentError} from "@/lib/linguistic/reading-ideas";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import {sessionView,transitionSession,type AssessmentSession} from "./session";
import type {V3Assessment} from "./v3-adapter";
import {bindAssessmentRelease} from "./release-binding";
import type {ReleasedTeachingContent} from "./teaching-content";
import {publicTeachingView} from "./teaching-view";
export type AssessmentBundle={assessment:V3Assessment;bank:CanonicalDiagnosticBankArtifact;taxonomyId:string;bankId:string;activities?:LearningActivityBinding[];teachingContent?:ReleasedTeachingContent[]};
export type StoredSession={id:string;studentId:string;releaseId:string;state:AssessmentSession};
export interface AssessmentStore {
 load(studentId:string,sessionId:string):Promise<StoredSession|null>;
 release(id:string):Promise<AssessmentBundle|null>;
 knownMaterialKeys?(studentId:string,materialKeys:readonly string[]):Promise<string[]>;
 loadMaterialReceipt?(input:{presentationId:string;studentId:string;sourceChecksum:string;materialKeys:string[]}):Promise<MaterialReceipt|null>;
 /** Must verify coverage for this presentation, not infer it from an empty ledger. */
 materialHistoryComplete?(studentId:string,presentationId:string):Promise<boolean>;
 save(studentId:string,sessionId:string,expectedRevision:number,state:AssessmentSession):Promise<boolean>;
}
const commandSchema=z.discriminatedUnion("type",[
 z.object({type:z.literal("skip"),sessionId:z.uuid(),revision:z.number().int().nonnegative(),itemId:z.string().min(1)}).strict(),
 z.object({type:z.literal("answer"),sessionId:z.uuid(),revision:z.number().int().nonnegative(),itemId:z.string().min(1),answer:z.string().trim().min(1).max(3000),supportChoiceId:z.uuid().optional()}).strict(),
 z.object({type:z.enum(["pulse","pause","resume"]),sessionId:z.uuid(),revision:z.number().int().nonnegative()}).strict(),
]);
/** studentId is resolved by the authenticated action, never read from input. */
export async function runAssessmentCommand(store:AssessmentStore,studentId:string,input:unknown,now:()=>number=Date.now,receivedAt:number=now()){
 const parsed=commandSchema.safeParse(input);if(!parsed.success)return {error:"Données invalides."} as const;
 const command=parsed.data;
 let session=await store.load(studentId,command.sessionId);if(!session)return {error:"Diagnostic introuvable."} as const;
 const bundle=await store.release(session.releaseId);if(!bundle)return {error:"Ce diagnostic n’est pas disponible."} as const;
 session=await withKnownMaterialHistory(store,session,bundle);
 if(session.state.revision!==command.revision)return {conflict:true,view:publicAssessmentView(session,bundle,receivedAt)} as const;
 if((command.type==="answer"||command.type==="skip")&&(session.state.paused||session.state.pendingItemId!==command.itemId))return {error:"Cette question n’est plus active.",view:publicAssessmentView(session,bundle,receivedAt)} as const;
 let correct=false;
 let materialReceipt;
 if(command.type==="answer"){
  const entry=bundle.bank.items.find(i=>i.itemKey===command.itemId);
  if(!entry||!bundle.assessment.probes.some(p=>p.id===command.itemId))return {error:"Question indisponible."} as const;
  const item=entry.item;
  const support=gradeTextualSupport(session.id,command.itemId,item,command.supportChoiceId);
  if(!support.valid)return {error:support.error} as const;
  if(item.responseType==="mcq"){
   const choice=item.choices?.find((_,index)=>choiceId(session.id,command.itemId,index)===command.answer);if(!choice)return {error:"Choix invalide."} as const;
   correct=choice.correct;
  }else{
   try{
    const result=await validateAnswer(command.answer,{validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig});
    correct=result.pass;
   }catch(error){if(error instanceof ReadingAssessmentError)return {error:error.message} as const;throw error;}
  }
  correct=correct&&support.correct;
  materialReceipt=await readQuestionMaterialReceipt(store,session,bundle,command.itemId);
 }
 const state=transitionSession({state:session.state,release:bindAssessmentRelease(bundle.assessment,{taxonomyId:bundle.taxonomyId,bankId:bundle.bankId}),expectedRevision:command.revision,
  event:command.type==="answer"?{type:"answer",itemId:command.itemId,correct,at:receivedAt,materialReceipt}:command.type==="skip"?{type:"skip",itemId:command.itemId,at:receivedAt}:{type:command.type,at:receivedAt},skills:bundle.assessment.skills,bank:bundle.assessment.probes,releaseScope:bundle.assessment.releaseScope});
 if(state===session.state)return {view:publicAssessmentView(session,bundle,receivedAt)} as const;
 if(command.type==="answer"&&state.observations.length>session.state.observations.length){
  state.diagnosticResponses=[...(session.state.diagnosticResponses??[]),{
   itemId:command.itemId,answer:command.answer,
   ...(command.supportChoiceId?{supportChoiceId:command.supportChoiceId}:{}),
  }];
 }
 // Answer/skip/resume block the question UI. Start the next timed interval
 // after server processing, not at request arrival. Background pulses leave
 // the question usable and must not deduct their processing time.
 if(state.phase==="assessing"&&!state.paused&&["answer","skip","resume"].includes(command.type)){
  state.lastPulseAt=Math.max(receivedAt,now());
 }
 if(!await store.save(studentId,session.id,command.revision,state)){
  const latest=await store.load(studentId,session.id);
  return {conflict:true,...(latest?{view:publicAssessmentView(latest,bundle,receivedAt)}:{})} as const;
 }
 return {view:publicAssessmentView({...session,state},bundle,receivedAt)} as const;
}
export function publicAssessmentView(session:StoredSession,bundle:AssessmentBundle,at:number=Date.now()){
 const view=sessionView(session.state,bundle.assessment.skills);
 const scope=bundle.assessment.releaseScope===undefined?undefined:inspectReleaseScope(bundle.assessment.skills,bundle.assessment.releaseScope);
 const seen=learningSeenQuestionIds(session.state,bundle.assessment.probes,bundle.teachingContent);
 const knownMaterial=knownExposedMaterialKeys(bundle.assessment.probes,[...session.state.observations,...session.state.refinements],session.state.exposedLearningItemIds,session.state.exposedMaterialKeys??[]);
 for(const probe of bundle.assessment.probes){
  const skill=bundle.assessment.skills.find(skill=>skill.id===probe.skillId);
  if(skill&&probeRepeatsKnownTarget(probe,skill,knownMaterial))seen.add(probe.id);
 }
 const readiness=learningReadiness(bundle.assessment.skills,assessmentObservations(session.state),at);
 const learning=view.phase==="learning"?planGranularActivities(bundle.assessment,readiness.planningResults,availableLearningBindings(bundle.assessment,bundle.activities??[],seen),5,new Set(session.state.completedTeachingIds??[])):null;
 const item=view.pendingItemId?bundle.bank.items.find(i=>i.itemKey===view.pendingItemId)?.item:null;
 return {...view,sessionId:session.id,revision:session.state.revision,
  ...(bundle.assessment.reviewPolicy?.mode==="parallel_review"?{contentReviewStatus:"ongoing" as const}:{}),
  ...(scope?{coverage:{supportedSkillCount:scope.assessmentSkillIds.size,deferredSkillCount:scope.deferredSkillIds.length,teachingSkillCount:scope.teachingSkillIds.size,limitationFr:scope.scope.limitationFr}}:{}),
  answeredCount:session.state.observations.filter(o=>!o.skipped).length,
  skippedCount:session.state.observations.filter(o=>o.skipped).length,
  learningActivities:learning?.activities??[],
  deferredReviewCount:readiness.deferredSkillIds.length,
  teaching:publicTeachingView(session,bundle),
  learningCheck:session.state.learningCheck?{id:session.state.learningCheck.id,activityId:session.state.learningCheck.activityId,firstDraft:session.state.learningCheck.firstDraft??null,revisionRequired:requiresWritingRevision(bundle.assessment.skills.find(skill=>skill.id===bundle.assessment.probes.find(probe=>probe.id===session.state.learningCheck!.itemId)?.skillId)?.nodeKey??""),question:publicQuestion(session.id,session.state.learningCheck.itemId,bundle)}:null,
  missingLearningActivityCount:learning?.missingActivitySkillIds.length??0,
  skillDetails:Object.fromEntries(bundle.assessment.skills.map(s=>[s.id,{labelFr:s.labelFr,nodeKey:s.nodeKey,...(scope?{assessmentAvailable:scope.assessmentSkillIds.has(s.id)}:{}),domain:s.domain??s.branch,...(s.samplingGroup?{samplingGroup:s.samplingGroup}:{}),mode:s.modes[0]}])),
  question:item?{id:view.pendingItemId!,promptFr:item.promptFr,instructionsFr:item.instructionsFr??null,responseType:item.responseType,supportChoices:publicTextualSupport(session.id,view.pendingItemId!,item),
   choices:shuffleChoices(item.choices?.map((choice,index)=>({id:choiceId(session.id,view.pendingItemId!,index),text:choice.text}))??[],`${session.id}:${view.pendingItemId}`)}:null};
}

export function publicQuestion(sessionId:string,itemId:string,bundle:AssessmentBundle){
 const item=bundle.bank.items.find(entry=>entry.itemKey===itemId)?.item;
 if(!item)return null;
 return {id:itemId,promptFr:item.promptFr,instructionsFr:item.instructionsFr??null,responseType:item.responseType,supportChoices:publicTextualSupport(sessionId,itemId,item),
 choices:shuffleChoices(item.choices?.map((choice,index)=>({id:choiceId(sessionId,itemId,index),text:choice.text}))??[],`${sessionId}:${itemId}`)};
}
