import {teachingChoices} from "./teaching-choices";
import {withKnownMaterialHistory} from "./material-history";
import {teachingMaterialKeys} from "./material-annotations";
import {z} from "zod";
import {publicTeachingView} from "./teaching-view";
export {publicTeachingView} from "./teaching-view";
import {publicAssessmentView,type AssessmentStore,type StoredSession} from "./service";
import {bindAssessmentRelease} from "./release-binding";
import {validatePublishedTeaching} from "./teaching-content";

const base={sessionId:z.uuid(),revision:z.number().int().nonnegative()};
const commands=z.discriminatedUnion("type",[
  z.object({...base,type:z.literal("start_teaching"),activityId:z.string().min(1)}).strict(),
  z.object({...base,type:z.enum(["view_teaching","begin_practice","teaching_hint","next_exercise","leave_teaching"])}).strict(),
  z.object({...base,type:z.literal("answer_practice"),exerciseId:z.string().min(1),answer:z.string().trim().min(1).max(1000)}).strict(),
]);

/** The content is guided sentence rewriting, not a free-writing mastery grader.
 * Preserve accents and hyphens; tolerate case, spaces and terminal punctuation. */
const normalize=(text:string)=>text.normalize("NFC").toLocaleLowerCase("fr").replace(/[’‘]/g,"'")
  .replace(/\s*'\s*/g,"'").replace(/\s+/g," ").trim().replace(/[.!?]+$/g,"").trim();

/** The authenticated action owns studentId. Server state owns which exercise is
 * active and whether help was shown. These commands never add mastery evidence. */
export async function runTeachingCommand(store:AssessmentStore,studentId:string,input:unknown){
  const parsed=commands.safeParse(input);if(!parsed.success)return {error:"Données invalides."} as const;
  const command=parsed.data;
  let session=await store.load(studentId,command.sessionId);if(!session)return {error:"Parcours introuvable."} as const;
  const bundle=await store.release(session.releaseId);if(!bundle)return {error:"Ce parcours n’est pas disponible."} as const;
 session=await withKnownMaterialHistory(store,session,bundle);
  const result=(current:StoredSession)=>({view:publicAssessmentView(current,bundle),teaching:publicTeachingView(current,bundle)});
  if(command.revision!==session.state.revision)return {conflict:true,...result(session)} as const;
  const pinned=bindAssessmentRelease(bundle.assessment,bundle);
  if(pinned.checksum!==session.state.release.checksum||pinned.taxonomyId!==session.state.release.taxonomyId||pinned.bankId!==session.state.release.bankId)
    throw Error("Teaching release differs from saved assessment");
  if(session.state.phase!=="learning"||session.state.completionReason==="coverage_gap")return {error:"Termine d’abord le diagnostic."} as const;
  if(command.type==="view_teaching")return result(session);
  if(session.state.learningCheck)return {error:"Termine ou quitte la vérification avant d’ouvrir une leçon."} as const;
  const state=structuredClone(session.state);
  if(command.type==="start_teaching"){
    if(state.teaching)return result(session);
    const binding=bundle.activities?.find(item=>item.id===command.activityId&&item.status==="published"&&(item.kind==="instruction"||item.kind==="practice"));
    const planned=publicAssessmentView(session,bundle).learningActivities.find(item=>item.activityId===command.activityId);
    const lesson=bundle.teachingContent?.find(item=>item.id===binding?.contentId);
    if(!binding||!planned||!lesson)return {error:"Cette leçon n’est pas proposée dans ton parcours."} as const;
    validatePublishedTeaching(bundle.assessment,[lesson]);
    if(binding.nodeKey!==lesson.nodeKey||binding.facetKey!==lesson.facetKey||binding.mode!==lesson.mode)
      throw Error("Teaching binding targets another skill");
    state.teaching={activityId:binding.id,contentId:lesson.id,exerciseIndex:0,phase:"lesson",responses:[],hintUsed:false};
    // Persist exposure before returning even the first example. Conservatively
    // reserve all reviewed overlaps, including exercises not yet reached.
    state.exposedMaterialKeys=[...new Set([...(state.exposedMaterialKeys??[]),...teachingMaterialKeys(lesson)])];
    state.exposedLearningItemIds=[...new Set([...state.exposedLearningItemIds,...lesson.assessmentExposureIds])];
  }else{
    const progress=state.teaching;
    if(!progress)return {error:"Aucun entraînement n’est ouvert.",...result(session)} as const;
    const lesson=bundle.teachingContent?.find(item=>item.id===progress.contentId);
    if(!lesson)return {error:"Cette leçon n’est pas disponible."} as const;
    validatePublishedTeaching(bundle.assessment,[lesson]);
    const exercise=lesson.practice[progress.exerciseIndex];
    if(command.type==="leave_teaching")state.teaching=null;
    else if(command.type==="begin_practice"){
      if(progress.phase!=="lesson")return result(session);
      progress.phase="practice";
    }else{
      if(progress.phase!=="practice"||!exercise)return {error:"Ouvre d’abord l’entraînement."} as const;
      const previous=progress.responses.find(response=>response.exerciseId===exercise.id);
      if(command.type==="teaching_hint"){
        if(progress.hintUsed)return result(session);
        progress.hintUsed=true;
      }else if(command.type==="answer_practice"){
        if(command.exerciseId!==exercise.id)return {error:"Cet exercice n’est plus actif.",...result(session)} as const;
        if(previous)return result(session);
        const choice=teachingChoices(session.id,lesson.id,exercise)?.find(choice=>choice.id===command.answer);
        if(exercise.choices&&!choice)return {error:"Choisis une des réponses proposées."} as const;
        const answer=choice?.text??command.answer;
        progress.responses.push({exerciseId:exercise.id,answer,correct:exercise.choices?answer===exercise.answerFr:normalize(answer)===normalize(exercise.answerFr),hintUsed:progress.hintUsed});
      }else{
        if(!previous)return {error:"Essaie de répondre avant de continuer."} as const;
        if(progress.exerciseIndex+1===lesson.practice.length){
          state.completedTeachingIds=[...new Set([...(state.completedTeachingIds??[]),lesson.id])];
          state.teaching=null;
        }else{
          progress.exerciseIndex++;
          progress.hintUsed=false;
        }
      }
    }
  }
  state.revision++;
  if(!await store.save(studentId,session.id,command.revision,state)){
    const latest=await store.load(studentId,session.id);
    return {conflict:true,...(latest?result(latest):{})} as const;
  }
  return result({...session,state});
}
