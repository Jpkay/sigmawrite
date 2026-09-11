import {expect,it} from "vitest";
import type {AssessmentView} from "./client-state";
import {consumedActivityHref,granularActivityHref,linkedActivityCommand} from "./activity-navigation";
const lesson={activityId:"lesson & one",kind:"instruction",contentId:"content"};
const check={activityId:"check",kind:"independent_check"};
const view={phase:"learning",learningActivities:[lesson,check]} as AssessmentView;
it("consumes the launch link once so reload cannot start another question",()=>{
 const href="https://app.trouvetaplume.com/student/diagnostic?activity=lesson+%26+one&source=lessons#progress";
 const consumed=consumedActivityHref(href,lesson.activityId);
 expect(consumed).toBe("/student/diagnostic?source=lessons#progress");
 expect(consumedActivityHref(`https://app.trouvetaplume.com${consumed}`,lesson.activityId)).toBeNull();
 expect(consumedActivityHref(href,"newer-navigation")).toBeNull();
 expect(consumedActivityHref(href,undefined)).toBeNull();
});
it("links the exact activity and distinguishes instruction from independent checks",()=>{
 expect(granularActivityHref(lesson.activityId)).toBe("/student/diagnostic?activity=lesson%20%26%20one");
 expect(linkedActivityCommand(view,lesson.activityId)).toEqual({type:"start_teaching",activityId:lesson.activityId});
 expect(linkedActivityCommand(view,"check")).toEqual({type:"start_check",activityId:"check"});
});
it("does not launch unknown activities, unfinished assessments or interrupt active work",()=>{
 expect(linkedActivityCommand(view,"other-student-activity")).toBeNull();
 expect(linkedActivityCommand({...view,phase:"assessing"},"check")).toBeNull();
 expect(linkedActivityCommand({...view,teaching:{contentId:"active"} as NonNullable<AssessmentView["teaching"]>},"check")).toBeNull();
 expect(linkedActivityCommand({...view,learningCheck:{id:"active"} as NonNullable<AssessmentView["learningCheck"]>},"check")).toBeNull();
 expect(linkedActivityCommand(null,"check")).toBeNull();
});
