import {learningSeenQuestionIds} from "./learning-exposure";
import {categoryExposurePriority} from "./category-exposure";
import {withKnownMaterialHistory} from "./material-history";
import {knownExposedMaterialKeys,probeRepeatsKnownTarget} from "./engine";
import {readQuestionMaterialReceipt} from "./question-material-receipt";
import {z} from "zod";
import {gradeTextualSupport} from "./textual-support";
import {stableUuid} from "@/lib/lexicon/baseline";
import {validateAnswer} from "@/lib/linguistic/validator";
import {ReadingAssessmentError} from "@/lib/linguistic/reading-ideas";
import {publicAssessmentView,publicQuestion,type AssessmentStore} from "./service";
import {bindAssessmentRelease} from "./release-binding";
import {transitionSession,type SessionEvent} from "./session";
import {createWritingEvidence,requiresWritingRevision,type WritingEvidence} from "./writing-evidence";
import type {CanonicalDiagnosticBankItem} from "../item-bank";

/** Trusted, calibrated server evaluator. It receives the pinned source, never
 * a browser-supplied rubric or judgment. No default grammar-clean = mastery. */
export type WritingEvaluator=(input:{answer:string;firstDraft?:string;skillId:string;item:CanonicalDiagnosticBankItem["item"]})=>Promise<{
 connectedWriting:boolean;revisionReviewed?:boolean;evaluator?:WritingEvidence["evaluator"];tokens:Parameters<typeof createWritingEvidence>[0]["tokens"];
}>;

const base={sessionId:z.uuid(),revision:z.number().int().nonnegative()};
const commands=z.discriminatedUnion("type",[
 z.object({...base,type:z.literal("start_check"),activityId:z.string().min(1)}).strict(),
 z.object({...base,type:z.literal("answer_check"),checkId:z.uuid(),answer:z.string().trim().min(1).max(3000),supportChoiceId:z.uuid().optional()}).strict(),
 z.object({...base,type:z.literal("abandon_check"),checkId:z.uuid()}).strict(),
]);

/** Only authenticated server actions supply studentId. Clients never supply a
 * grade, item selection, occasion, hint history or first-attempt assertion. */
export async function runLearningCheckCommand(store:AssessmentStore,studentId:string,input:unknown,now:()=>number=Date.now,writingEvaluator?:WritingEvaluator){
 const parsed=commands.safeParse(input);if(!parsed.success)return {error:"Données invalides."} as const;
 const command=parsed.data;
 let session=await store.load(studentId,command.sessionId);if(!session)return {error:"Diagnostic introuvable."} as const;
 const bundle=await store.release(session.releaseId);if(!bundle)return {error:"Ce parcours n’est pas disponible."} as const;
 session=await withKnownMaterialHistory(store,session,bundle);
 const view=()=>publicAssessmentView(session,bundle,now());
 if(session.state.revision!==command.revision)return {conflict:true,view:view()} as const;
 if(session.state.phase!=="learning"||session.state.completionReason==="coverage_gap")return {error:"Termine d’abord le diagnostic."} as const;
 if(session.state.teaching)return {error:"Termine ou quitte l’entraînement avant de commencer une vérification."} as const;
 let event:SessionEvent;
 if(command.type==="start_check"){
  if(session.state.learningCheck)return {view:view()} as const;
  const currentView=view();
  const planned=currentView.learningActivities.find(a=>a.activityId===command.activityId);
  const binding=bundle.activities?.find(a=>a.id===command.activityId&&a.status==="published"&&a.kind==="independent_check");
  if(!planned||!binding)return {error:"Cette vérification n’est pas proposée dans ton parcours."} as const;
  const seen=learningSeenQuestionIds(session.state,bundle.assessment.probes,bundle.teachingContent);
  const categoryPriority=categoryExposurePriority(bundle.assessment.probes,seen);
  const knownMaterial=knownExposedMaterialKeys(bundle.assessment.probes,[...session.state.observations,...session.state.refinements],session.state.exposedLearningItemIds,session.state.exposedMaterialKeys??[]);
  const targetSkill=bundle.assessment.skills.find(skill=>skill.id===planned.skillId)!;
  const missingFeatures=currentView.results.find(result=>result.skillId===planned.skillId)?.modes.find(mode=>mode.mode===binding.mode)?.unconfirmedFeatures??[];
  const candidates=bundle.assessment.probes.filter(p=>p.usage!=="initial"&&binding.probeIds?.includes(p.id)&&p.skillId===planned.skillId&&p.mode===binding.mode&&!seen.has(p.id)&&!probeRepeatsKnownTarget(p,targetSkill,knownMaterial));
  const featurePriority=(features:readonly string[]|undefined)=>missingFeatures.filter(feature=>features?.includes(feature)).length;
  const currentMode=currentView.results.find(result=>result.skillId===planned.skillId)?.modes.find(mode=>mode.mode===binding.mode);
  const requiredTypes=bundle.assessment.skills.find(skill=>skill.id===planned.skillId)?.evidenceRequirements?.[binding.mode]?.minimumTextTypes??0;
  const genrePriority=(type:string|undefined)=>Number((currentMode?.textTypes?.length??0)<requiredTypes&&Boolean(type)&&!currentMode?.textTypes?.includes(type!));
  const requiredErrors=bundle.assessment.skills.find(skill=>skill.id===planned.skillId)?.evidenceRequirements?.[binding.mode]?.minimumContrastingErrors??0;
  const errorPriority=(keys:readonly string[]|undefined)=>Number((currentMode?.contrastingErrorKeys?.length??0)<requiredErrors&&keys?.some(key=>!currentMode?.contrastingErrorKeys?.includes(key)));
  const needsNegative=bundle.assessment.skills.find(skill=>skill.id===planned.skillId)?.evidenceRequirements?.[binding.mode]?.negativeExamplesRequired&&!currentMode?.negativeExampleConfirmed;
  candidates.sort((a,b)=>Number(needsNegative&&b.negativeExampleAssessed===true)-Number(needsNegative&&a.negativeExampleAssessed===true)||errorPriority(b.contrastingErrorKeys)-errorPriority(a.contrastingErrorKeys)||genrePriority(b.textType)-genrePriority(a.textType)||featurePriority(b.evidenceFeatures)-featurePriority(a.evidenceFeatures)||categoryPriority(a)-categoryPriority(b)||a.id.localeCompare(b.id));
  const item=candidates[0];
  if(!item)return {error:"Aucune nouvelle question n’est disponible pour cette vérification."} as const;
  const timestamp=now();if(!Number.isFinite(timestamp)||timestamp<0)throw Error("Invalid server timestamp");
  event={type:"issue_check",check:{id:stableUuid("granular-learning-check",`${session.id}:${command.revision}:${item.id}`),activityId:binding.id,itemId:item.id,
   // Multiple checks on the same UTC date are one occasion, never fabricated
   // independent occasions merely because the student clicks another question.
   occasionId:`learning-day:${new Date(timestamp).toISOString().slice(0,10)}`}};
 }else{
  const check=session.state.learningCheck;
  if(!check||check.id!==command.checkId)return {error:"Cette vérification n’est plus active.",view:view()} as const;
  if(command.type==="abandon_check")event={type:"abandon_check",checkId:check.id};
  else{
   const item=bundle.bank.items.find(i=>i.itemKey===check.itemId)?.item;
   if(!item)return {error:"Question indisponible."} as const;
   const target=bundle.assessment.skills.find(skill=>skill.id===bundle.assessment.probes.find(probe=>probe.id===check.itemId)?.skillId);
   if(target&&requiresWritingRevision(target.nodeKey)&&check.firstDraft===undefined){
    event={type:"save_writing_draft",checkId:check.id,answer:command.answer};
   }else{
   const support=gradeTextualSupport(session.id,check.itemId,item,command.supportChoiceId);
   if(!support.valid)return {error:support.error} as const;
   let correct:boolean;
   let writingEvidence:WritingEvidence|undefined;
   const probe=bundle.assessment.probes.find(probe=>probe.id===check.itemId);
   if(!probe)return {error:"Question indisponible."} as const;
   if(probe.mode==="independent_production"){
    if(!writingEvaluator||item.responseType==="mcq")return {error:"La vérification de ce texte n’est pas encore disponible."} as const;
    const judgment=await writingEvaluator({answer:command.answer,...(check.firstDraft!==undefined?{firstDraft:check.firstDraft}:{}),skillId:probe.skillId,item});
    if(!judgment.connectedWriting||!judgment.tokens.length)return {error:"Ce texte ne permet pas encore de vérifier cette compétence."} as const;
    if(target&&requiresWritingRevision(target.nodeKey)&&judgment.revisionReviewed!==true)return {error:"La révision de ce texte doit encore être vérifiée."} as const;
    writingEvidence=createWritingEvidence({skillId:probe.skillId,answer:command.answer,connectedWriting:judgment.connectedWriting,
     // Only the fresh, server-issued check path can reach this point; guided
     // practice and browser-supplied independence claims are excluded above.
     unaided:true,evaluator:judgment.evaluator,...(check.firstDraft!==undefined&&judgment.revisionReviewed===true?{firstDraft:check.firstDraft,revisionReviewed:true as const}:{}),tokens:judgment.tokens});
    const rule=bundle.assessment.skills.find(skill=>skill.id===probe.skillId)?.evidenceRequirements?.independent_production;
    correct=writingEvidence.correctTokens/writingEvidence.eligibleTokens>=(rule?.minimumAccuracy??.8);
   }else if(item.responseType==="mcq"){
    const choice=publicQuestion(session.id,check.itemId,bundle)?.choices.find(c=>c.id===command.answer);
    if(!choice)return {error:"Choix invalide."} as const;
    const index=item.choices?.findIndex((_,i)=>stableUuid("granular-choice",`${session.id}:${check.itemId}:${i}`)===choice.id)??-1;
    correct=item.choices?.[index]?.correct===true;
   }else{
    try{correct=(await validateAnswer(command.answer,{validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig})).pass;}
    catch(error){if(error instanceof ReadingAssessmentError)return {error:error.message} as const;throw error;}
   }
   event={type:"answer_check",checkId:check.id,correct:correct&&support.correct,writingEvidence,materialReceipt:await readQuestionMaterialReceipt(store,session,bundle,check.itemId)};
   }
  }
 }
 const state=transitionSession({state:session.state,release:bindAssessmentRelease(bundle.assessment,bundle),expectedRevision:command.revision,event,skills:bundle.assessment.skills,bank:bundle.assessment.probes,releaseScope:bundle.assessment.releaseScope});
 if(event.type==="answer_check"&&!event.correct){
  const probe=bundle.assessment.probes.find(item=>item.id===session.state.learningCheck?.itemId);
  const skill=bundle.assessment.skills.find(item=>item.id===probe?.skillId);
  const revisit=new Set(bundle.teachingContent?.filter(lesson=>lesson.nodeKey===skill?.nodeKey&&lesson.facetKey===skill?.facetKey&&lesson.mode===probe?.mode).map(lesson=>lesson.id));
  state.completedTeachingIds=state.completedTeachingIds?.filter(id=>!revisit.has(id));
 }
 if(!await store.save(studentId,session.id,command.revision,state)){
  const latest=await store.load(studentId,session.id);
  return {conflict:true,...(latest?{view:publicAssessmentView(latest,bundle,now())}:{})} as const;
 }
 return {view:publicAssessmentView({...session,state},bundle,now())} as const;
}
