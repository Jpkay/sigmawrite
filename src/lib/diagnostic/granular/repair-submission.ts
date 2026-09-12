import {z} from 'zod';
import {MICRO_LESSONS} from '@/lib/content/micro-lessons';
import {checksum} from '@/lib/taxonomy/validate';
export const repairSubmissionSchema=z.object({submissionId:z.string().uuid(),skillKey:z.string().min(1).max(100),answers:z.array(z.number().int().nonnegative()).min(1).max(30)}).strict();
/** Guided answers record completion, never independent mastery evidence. */
export function gradeRepairSubmission(input:unknown){
 const data=repairSubmissionSchema.parse(input);
 const lesson=Object.hasOwn(MICRO_LESSONS,data.skillKey)?MICRO_LESSONS[data.skillKey]:null;
 if(!lesson)throw Error('Compétence introuvable.');
 const questions=[...lesson.questions,lesson.returnToText];
 if(data.answers.length!==questions.length||data.answers.some((answer,index)=>answer>=questions[index].choices.length))throw Error('Réponses incomplètes ou invalides.');
 return {...data,lessonChecksum:checksum(lesson),corrects:questions.map((question,index)=>data.answers[index]===question.correctIndex)};
}
