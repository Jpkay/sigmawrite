import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBORDINATE_ASSESSMENT,SUBORDINATE_TEACHING} from './subordinate-clauses';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
it('includes semantic contrasts rather than treating que or si as sufficient evidence',()=>{
 expect(SUBORDINATE_ASSESSMENT.completive.filter(r=>r.clause)).toHaveLength(12);
 expect(SUBORDINATE_ASSESSMENT.completive.find(r=>r.sentence.startsWith('Le film que'))?.clause).toBeNull();
 const circumstances=SUBORDINATE_ASSESSMENT.circonstancielle;
 expect(circumstances.find(r=>r.sentence.startsWith('Je me demande si'))?.clause).toBeNull();
 expect(circumstances.find(r=>r.sentence==='Il court malgré la fatigue.')?.clause).toBeNull();
 for(const relation of ['le temps','la cause','le but','une condition','une concession'])expect(circumstances.filter(r=>r.relation===`exprime ${relation}`)).toHaveLength(3);
 for(const row of Object.values(SUBORDINATE_ASSESSMENT).flat())if(row.clause)expect(row.sentence).toContain(row.clause);
});
it('keeps recognition evidence and both negative-example pools separate from teaching',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-subordinate-clauses-expansion.json','utf8')) as DraftExpansion;
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const assessment=candidate.assessment as V3Assessment;
 expect(expansion.items).toHaveLength(36);
 for(const lesson of SUBORDINATE_TEACHING){
  const keys=teachingMaterialKeys(lesson),items=expansion.items.filter(e=>e.item.nodeKey===lesson.nodeKey);
  expect(items.length).toBeGreaterThanOrEqual(16);
  for(const entry of items){
   expect(entry.evidenceKey).toBe('reading-analysis');expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
   expect(questionAssessedMaterialKeys(entry.item).some(key=>keys.includes(key))).toBe(false);
  }
  const id=`${lesson.nodeKey}::reading-analysis`;
  for(const usage of ['initial','learning'])expect(assessment.probes.some(p=>p.skillId===id&&p.usage===usage&&p.negativeExampleAssessed)).toBe(true);
  expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id)?.freshCheckAvailable).toBe(true);
 }
});
