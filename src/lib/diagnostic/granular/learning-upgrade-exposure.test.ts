import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createSession} from './session';
import {learningSeenQuestionIds} from './learning-exposure';
import {teachingMaterialKeys} from './material-annotations';
import type {ReleasedTeachingContent} from './teaching-content';
const prepared=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
it('reserves newly bound questions for previously started lessons without inventing receipts',()=>{
 const lesson:ReleasedTeachingContent={...structuredClone(prepared.teachingContent[0]),assessmentExposureIds:['new-overlap']};
 const state=createSession({taxonomyId:'t',bankId:'b',checksum:'c'});
 state.exposedMaterialKeys=teachingMaterialKeys(lesson);
 const before=structuredClone(state);
 expect(learningSeenQuestionIds(state,[],[lesson]).has('new-overlap')).toBe(true);
 expect(state).toEqual(before);expect(state.completedTeachingIds).toBeUndefined();
 state.exposedMaterialKeys=[];
 expect(learningSeenQuestionIds(state,[],[lesson]).has('new-overlap')).toBe(false);
 state.completedTeachingIds=[lesson.id];
 expect(learningSeenQuestionIds(state,[],[lesson]).has('new-overlap')).toBe(true);
});
