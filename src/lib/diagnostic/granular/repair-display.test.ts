import {expect,it} from 'vitest';
import {MICRO_LESSONS} from '@/lib/content/micro-lessons';
import {repairDisplay} from './repair-display';
it('records each exercise position and valid final score including the return question',()=>{
 const lesson=MICRO_LESSONS.cause_consequence,display=repairDisplay(lesson),total=lesson.questions.length+1;
 expect(display.progress).toHaveLength(lesson.questions.length);expect(display.scores).toHaveLength(total+1);expect(display.scores.at(-1)).toBe(`${total} / ${total}`);
 expect(display.completion).toBe(`Tu as terminé « ${lesson.title} ». D’autres questions permettront de vérifier ce que tu sais faire sans aide.`);
 expect(repairDisplay(null).copy.missing).toBe('Micro-leçon introuvable');
});
