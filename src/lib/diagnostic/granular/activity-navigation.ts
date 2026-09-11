import type {AssessmentView} from "./client-state";

export function granularActivityHref(activityId:string) {
 return `/student/diagnostic?activity=${encodeURIComponent(activityId)}`;
}

/** Remove the consumed launch instruction, preserving unrelated navigation. */
export function consumedActivityHref(href:string,activityId:string|undefined) {
 if(!activityId)return null;
 const url=new URL(href);
 if(url.searchParams.get("activity")!==activityId)return null;
 url.searchParams.delete("activity");
 return `${url.pathname}${url.search}${url.hash}`;
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
