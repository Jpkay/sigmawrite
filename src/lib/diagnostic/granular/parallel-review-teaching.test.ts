import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {validatePublishedTeaching} from "./teaching-content";
const read=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("validates the assembled pending lessons only with their exact teaching permissions",()=>{
 const candidate=read();
 expect(candidate.teachingContent.length).toBeGreaterThan(0);
 expect(()=>validatePublishedTeaching(candidate.assessment,candidate.teachingContent)).not.toThrow();
 expect(candidate.teachingContent.every((lesson:{status:string;review?:unknown})=>lesson.status==="published_pending_review"&&lesson.review===undefined)).toBe(true);
 const withoutPolicy=structuredClone(candidate.assessment);delete withoutPolicy.reviewPolicy;
 expect(()=>validatePublishedTeaching(withoutPolicy,candidate.teachingContent)).toThrow("permission");
 const changed=structuredClone(candidate.teachingContent);changed[0].practice[0].answerFr="Changed after permission";
 expect(()=>validatePublishedTeaching(candidate.assessment,changed)).toThrow();
 const exposure=structuredClone(candidate.teachingContent);exposure[0].assessmentExposureIds.push("invented-question");
 expect(()=>validatePublishedTeaching(candidate.assessment,exposure)).toThrow();
 const forged=structuredClone(candidate.teachingContent);forged[0].review={reviewerId:"invented"};
 expect(()=>validatePublishedTeaching(candidate.assessment,forged)).toThrow("permission");
});
