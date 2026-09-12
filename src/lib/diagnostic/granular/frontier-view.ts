import {publicAssessmentView,type AssessmentBundle,type StoredSession} from './service';
/** A read-only projection: never starts/resumes a session or returns active items. */
export function granularFrontierView(session:StoredSession,bundle:AssessmentBundle){
 const view=publicAssessmentView(session,bundle);
 const results=new Map(view.results.map(result=>[result.skillId,result]));
 return {
  sessionId:session.id,releaseId:session.releaseId,phase:view.phase,
  coverage:view.coverage??null,activities:view.learningActivities,
  nodes:bundle.assessment.skills.map(skill=>({
   id:skill.id,labelFr:skill.labelFr,domain:skill.domain??skill.branch,
   prerequisites:[...skill.prerequisites],
   assessmentAvailable:view.skillDetails[skill.id]?.assessmentAvailable!==false,
   result:results.get(skill.id)!,
  })),
 };
}
export type GranularFrontierView=ReturnType<typeof granularFrontierView>;
