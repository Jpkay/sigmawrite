import {expect,it} from 'vitest';
import {estimateRemainingQuestions,interludeAfter} from './diagnostic-pacing';
const total=35*60;
it('estimates remaining questions from the prior before any answer',()=>{
 expect(estimateRemainingQuestions(0,total)).toBe(40);
});
it('follows the student pace and rounds large estimates to five',()=>{
 // 20 questions in 10 minutes: fast pace, many questions left.
 expect(estimateRemainingQuestions(20,total-600)).toBe(45);
 // 20 questions in 25 minutes: slow pace.
 expect(estimateRemainingQuestions(20,total-1500)).toBe(8);
});
it('never shows zero while time remains and stops at the end',()=>{
 expect(estimateRemainingQuestions(40,20)).toBe(1);
 expect(estimateRemainingQuestions(40,0)).toBe(0);
});
it('celebrates every fifteen questions',()=>{
 expect(interludeAfter({done:14,remainingSeconds:1500},{done:15,remainingSeconds:1480},null)).toEqual({milestone:'questions',done:15,breakSuggested:false});
 expect(interludeAfter({done:15,remainingSeconds:1480},{done:16,remainingSeconds:1460},null)).toBeNull();
});
it('prefers time milestones when both are crossed',()=>{
 expect(interludeAfter({done:29,remainingSeconds:total/2+5},{done:30,remainingSeconds:total/2-5},null)?.milestone).toBe('half');
 expect(interludeAfter({done:40,remainingSeconds:total/4+5},{done:41,remainingSeconds:total/4-5},null)?.milestone).toBe('three_quarters');
});
it('suggests a break after twelve active minutes since the last break',()=>{
 expect(interludeAfter({done:3,remainingSeconds:1300},{done:4,remainingSeconds:1270},2000)).toEqual({milestone:null,done:4,breakSuggested:true});
 expect(interludeAfter({done:3,remainingSeconds:1300},{done:4,remainingSeconds:1270},1900)).toBeNull();
});
it('ignores rejected commands and the final answer',()=>{
 expect(interludeAfter({done:14,remainingSeconds:1500},{done:14,remainingSeconds:1490},0)).toBeNull();
 expect(interludeAfter({done:14,remainingSeconds:10},{done:15,remainingSeconds:0},null)).toBeNull();
});
