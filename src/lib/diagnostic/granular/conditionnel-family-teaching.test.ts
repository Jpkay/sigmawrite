import {expect,it} from 'vitest';
import {CONDITIONNEL_FAMILY_TEACHING as lessons} from './conditionnel-family-teaching';
import {CONJUGATION_TEACHING_CASES} from './conjugation-teaching';
const expected:Record<string,string>={dessiner:'dessinerais',coller:'collerais',porter:'porterait',écouter:'écouterions',visiter:'visiteriez',filmer:'filmeraient',nourrir:'nourrirais',remplir:'remplirais',ralentir:'ralentirait',réfléchir:'réfléchirions',obéir:'obéiriez',applaudir:'applaudiraient'};
it('keeps each guided verb rather than substituting the family model',()=>{
 expect(lessons).toHaveLength(4);
 for(const lesson of lessons){
  const row=CONJUGATION_TEACHING_CASES.find(d=>lesson.facetKey===`produire_conditionnel_present::${d.key}`)!;
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.practice).toHaveLength(row.cases.length);
  row.cases.forEach((c,i)=>{expect(lesson.practice[i].promptFr).toContain(c.verb);if(expected[c.verb])expect(lesson.practice[i].answerFr).toBe(expected[c.verb]);});
 }
});
it('teaches the conditional spelling independently of present and imperfect spelling',()=>{
 const text=lessons.flatMap(l=>l.steps.map(s=>s.exampleFr)).join('\n');
 expect(text).toContain('Nous finirions plus tôt avec ton aide.');expect(text).toContain('Nous mangerions dehors avec une table.');expect(text).toContain('Je lancerais la balle plus loin avec cet élan.');
 expect(text).not.toMatch(/finisserions|mangeerions|lançerais/);
});
it('retains untaught follow-up material for each family',async()=>{
 const {readFileSync}=await import('node:fs');
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const lesson of lessons){
  const readiness=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(readiness?.freshCheckAvailable,lesson.id).toBe(true);
 }
 const {CONDITIONNEL_FAMILY_APPLICATIONS:rows}=await import('./conditionnel-family-applications');
 expect(rows).toHaveLength(24);
 expect(rows.find(r=>r.verb==='manger'&&r.person==='1p')?.answer).toBe('mangerions');
 expect(rows.find(r=>r.verb==='lancer'&&r.person==='2p')?.answer).toBe('lanceriez');
 expect(rows.find(r=>r.verb==='commencer'&&r.person==='1s')?.answer).toBe('commencerais');
});
