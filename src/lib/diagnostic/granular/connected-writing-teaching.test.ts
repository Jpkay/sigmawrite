import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {CONNECTED_WRITING_TEACHING as lessons} from './connected-writing-teaching';
import {CONNECTED_WRITING_DRAFTS as drafts} from './connected-writing-drafts';
import {FRENCH_TEACHING_DRAFTS} from './draft-teaching-catalogue';
import {validateTeachingTargets} from './teaching-content';
import {teachingMaterialKeys} from './material-annotations';
import {FRENCH_TAXONOMY_V3_CANDIDATE} from '@/lib/taxonomy/french-v3';
it('provides guided teaching for every approved independent writing target without reusing assessment prompts',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 const nodes=FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter(n=>n.evidence.some(e=>e.expectation==='independent_production'));
 expect(lessons.map(l=>l.nodeKey).sort()).toEqual(nodes.map(n=>n.key).sort());
 const ids=new Set(FRENCH_TEACHING_DRAFTS.map(l=>l.id));
 expect(ids.size).toBe(FRENCH_TEACHING_DRAFTS.length);
 for(const lesson of lessons){
  expect(ids.has(lesson.id)).toBe(true);
  expect(lesson.mode).toBe('independent_production');
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.steps.length).toBeGreaterThanOrEqual(2);
  expect(lesson.practice.length).toBeGreaterThanOrEqual(2);
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(0);
  for(const draft of drafts)expect(JSON.stringify(lesson)).not.toContain(draft.promptFr);
 }
 expect(JSON.stringify(lessons)).not.toMatch(/—|delve into/);
});
