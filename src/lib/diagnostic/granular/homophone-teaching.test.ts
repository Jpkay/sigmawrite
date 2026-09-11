import {expect,it} from 'vitest';
import {HOMOPHONE_TEACHING} from './homophone-teaching';
import {teachingMaterialKeys} from './material-annotations';
it('keeps seven spelling contrasts and both learning modes separate',()=>{
 expect(HOMOPHONE_TEACHING).toHaveLength(14);
 expect(new Set(HOMOPHONE_TEACHING.map(l=>l.nodeKey)).size).toBe(7);
 for(const lesson of HOMOPHONE_TEACHING){
  expect(lesson.status).toBe('draft_requires_review');
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(4);
  expect(lesson.practice).toHaveLength(4);
  for(const p of lesson.practice)if(p.choices)expect(p.choices).toContain(p.answerFr);
 }
});
it('teaches important boundaries rather than treating shortcuts as universal rules',()=>{
 const byKey=(key:string)=>HOMOPHONE_TEACHING.find(l=>l.nodeKey===`distinguer_homophones_${key}`)!;
 expect(byKey('son_sont').boundaryFr).toContain('son amie');
 expect(byKey('ce_se').boundaryFr).toContain('ce sera utile');
 expect(byKey('ces_ses').boundaryFr).toContain('peuvent tous les deux être corrects');
 expect(byKey('ou_ou').practice.at(-1)?.answerFr).toBe('où');
 expect(byKey('on_ont').boundaryFr).toContain('singulier');
});

it('does not silently activate homophone assessment while its novelty contract is unresolved',async()=>{
 const {readFileSync}=await import('node:fs');
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 for(const lesson of HOMOPHONE_TEACHING)expect(candidate.assessment.releaseScope.assessmentSkillIds.some((id:string)=>id.startsWith(lesson.nodeKey+'::'))).toBe(false);
});
