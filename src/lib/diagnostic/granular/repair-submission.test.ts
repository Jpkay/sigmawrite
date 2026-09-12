import {expect,it} from 'vitest';
import {MICRO_LESSONS} from '@/lib/content/micro-lessons';
import {gradeRepairSubmission} from './repair-submission';
const lesson=MICRO_LESSONS.cause_consequence;
const input={submissionId:'12345678-1234-4234-8234-123456789012',skillKey:'cause_consequence',answers:[...lesson.questions,lesson.returnToText].map(q=>q.correctIndex)};
it('grades actual submitted choices on the server, including wrong answers',()=>{
 const answers=[...input.answers];answers[0]=(answers[0]+1)%lesson.questions[0].choices.length;
 expect(gradeRepairSubmission({...input,answers})).toMatchObject({corrects:[false,...answers.slice(1).map(()=>true)],lessonChecksum:expect.stringMatching(/^sha256:/)});
});
it('rejects client scores, incomplete answers, unknown lessons and out-of-range choices',()=>{
 for(const candidate of [{...input,corrects:[true]},{...input,answers:[]},{...input,skillKey:'unknown'},{...input,answers:input.answers.map(()=>999)}])expect(()=>gradeRepairSubmission(candidate)).toThrow();
});
