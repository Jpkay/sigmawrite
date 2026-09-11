import type {AssessmentView} from "./client-state";

export function granularActivityHref(activityId:string) {
 return `/student/diagnostic?activity=${encodeURIComponent(activityId)}`;
}

/** An incoming link can launch only an activity currently offered to this student. */
export function linkedActivityCommand(view:AssessmentView|null,activityId:string|undefined) {
 if(!view||view.phase!=="learning"||view.teaching||view.learningCheck||!activityId)return null;
 const activity=view.learningActivities.find(item=>item.activityId===activityId);
 if(!activity)return null;
 if(activity.kind==="independent_check")return {type:"start_check" as const,activityId};
 if(activity.contentId)return {type:"start_teaching" as const,activityId};
 return null;
}
