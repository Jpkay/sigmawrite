import {expect,it} from 'vitest';
import {FUTUR_SIMPLE_FAMILY_TEACHING as lessons} from './futur-simple-family-teaching';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
const expected:Record<string,string>={dessiner:'dessinerai',coller:'colleras',porter:'portera',écouter:'écouterons',visiter:'visiterez',filmer:'filmeront',nourrir:'nourrirai',remplir:'rempliras',ralentir:'ralentira',réfléchir:'réfléchirons',obéir:'obéirez',applaudir:'applaudiront'};
it('keeps each guided verb rather than substituting the family model',()=>{
 expect(lessons).toHaveLength(4);
 for(const lesson of lessons){
  const row=CONJUGATION_TEACHING_CASES.find(d=>lesson.facetKey===`produire_futur_simple::${d.key}`)!;
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.practice).toHaveLength(row.cases.length);
  row.cases.forEach((c,i)=>{expect(lesson.practice[i].promptFr).toContain(c.verb);if(expected[c.verb])expect(lesson.practice[i].answerFr).toBe(expected[c.verb]);});
 }
});
it('teaches the future spelling independently of present and imperfect spelling',()=>{
 const text=lessons.flatMap(l=>l.steps.map(s=>s.exampleFr)).join('\n');
 expect(text).toContain('Nous finirons demain.');expect(text).toContain('Nous mangerons demain.');expect(text).toContain('Nous lancerons demain.');
 expect(text).not.toMatch(/finisserons|mangeerons|lançerons/);
});
it('retains untaught follow-up material for each family',async()=>{
 const {readFileSync}=await import('node:fs');
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const lesson of lessons){
  const readiness=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(readiness?.freshCheckAvailable,lesson.id).toBe(true);
 }
 const {FUTUR_SIMPLE_FAMILY_APPLICATIONS:rows}=await import('./futur-simple-family-applications');
 expect(rows).toHaveLength(24);
 expect(rows.find(r=>r.verb==='manger'&&r.person==='1p')?.answer).toBe('mangerons');
 expect(rows.find(r=>r.verb==='lancer'&&r.person==='2p')?.answer).toBe('lancerez');
 expect(rows.find(r=>r.verb==='commencer'&&r.person==='1s')?.answer).toBe('commencerai');
});
