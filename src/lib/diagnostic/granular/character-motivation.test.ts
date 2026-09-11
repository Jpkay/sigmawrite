import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {MOTIVATION_DRAFTS,MOTIVATION_TEACHING} from './character-motivation';
import {readTextualSupport,publicTextualSupport,gradeTextualSupport} from './textual-support';
import {questionMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {canonicalProbeMetrics} from './probe-metrics';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('uses short distinct narratives and checks the actual situation clue rather than a predictable longest option',()=>{
 const expansion=read('generated/french-v3-character-motivation-expansion.json') as DraftExpansion;
 expect(expansion.items).toHaveLength(8);expect(new Set(MOTIVATION_DRAFTS.map(d=>d.passage)).size).toBe(8);
 const taught=teachingMaterialKeys(MOTIVATION_TEACHING[0]);
 for(const draft of MOTIVATION_DRAFTS){
  expect(draft.passage.split(/\s+/).length).toBeLessThan(75);
  expect(draft.support).toBe(draft.clue);
  const entry=expansion.items.find(e=>e.itemKey===`v3-character-motivation:${draft.key}`)!;
  expect(entry.evidenceKey).toBe('literary-receptive');expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(readTextualSupport(entry.item)?.choices.filter(c=>c.correct).map(c=>c.quoteFr)).toEqual([draft.support]);
  expect(questionMaterialKeys(entry.item).some(k=>taught.includes(k))).toBe(false);
  // Do not multiply correlated answer and support-choice probabilities.
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
  for(const choice of publicTextualSupport('fixture',entry.itemKey,entry.item)!)expect(gradeTextualSupport('fixture',entry.itemKey,entry.item,choice.id)).toEqual({valid:true,correct:choice.text===draft.support});
 }
});
it('preserves the three-text and textual-support requirements in independent pools',()=>{
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json'),assessment=candidate.assessment as V3Assessment;
 const id='inferer_motivation_personnage::literary-receptive::text_type:narrative';
 const skill=assessment.skills.find(s=>s.id===id)!;
 expect(skill.evidenceRequirements?.interpretation).toMatchObject({minimumContexts:3,textualSupportRequired:true});
 const probes=assessment.probes.filter(p=>p.skillId===id);
 const initial=probes.filter(p=>p.usage==='initial'),later=probes.filter(p=>p.usage==='learning');
 expect(new Set(initial.map(p=>p.contextId)).size).toBeGreaterThanOrEqual(3);
 expect(new Set(later.map(p=>p.contextId)).size).toBeGreaterThanOrEqual(3);
 expect(later.some(p=>initial.some(q=>q.contextId===p.contextId))).toBe(false);
 expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===MOTIVATION_TEACHING[0].id)?.freshCheckAvailable).toBe(true);
});

it('does not make length alone a reliable evidence-answer shortcut',()=>{
 const ranks=MOTIVATION_DRAFTS.map(d=>{
  const n=d.support.split(/\s+/).length,others=d.otherSpans.map(s=>s.split(/\s+/).length);
  return {longest:others.every(v=>n>v),shortest:others.every(v=>n<v)};
 });
 expect(ranks.filter(r=>r.longest).length).toBeGreaterThan(0);
 expect(ranks.filter(r=>r.shortest).length).toBeGreaterThan(0);
 expect(ranks.filter(r=>r.longest).length).toBeLessThanOrEqual(3);
 expect(ranks.filter(r=>r.shortest).length).toBeLessThanOrEqual(3);
});
