import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PLUS_QUE_PARFAIT_FAMILY_TEACHING as lessons} from './plus-que-parfait-family-teaching';
import {PLUS_QUE_PARFAIT_FAMILY_APPLICATIONS as rows} from './plus-que-parfait-family-applications';
const expected=['avais dessiné','avais collé','avait porté','avions écouté','aviez visité','avaient filmé'];
it('uses the imperfect auxiliary and preserves the actual guided verb',()=>{
 expect(lessons).toHaveLength(4);
 expect(lessons[0].practice.map(p=>p.answerFr)).toEqual(expected);
 expect(lessons[1].practice.map(p=>p.answerFr)).toEqual(['avais nourri','avais rempli','avait ralenti','avions réfléchi','aviez obéi','avaient applaudi']);
 for(const lesson of lessons)expect(lesson.status).toBe('draft_requires_review');
});
it('retains correct participles and elision in new applications',()=>{
 expect(rows).toHaveLength(36);
 expect(rows.find(r=>r.verb==='manger'&&r.person==='1p')?.answer).toBe('avions mangé');
 expect(rows.find(r=>r.verb==='lancer'&&r.person==='2p')?.answer).toBe('aviez lancé');
 expect(rows.find(r=>r.verb==='commencer'&&r.person==='1s')?.answer).toBe('avais commencé');
 for(const row of rows)expect(row.sentence.replace('___',row.answer)).not.toMatch(/\b[Jj]e avais|mangeé|lançé/);
});
it('provides fresh independent material for every target',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const lesson of lessons)expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id)?.freshCheckAvailable,lesson.id).toBe(true);
});
