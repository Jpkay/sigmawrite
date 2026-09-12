import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {AVOIR_PARTICIPLE_AGREEMENT_DRAFTS as drafts} from './avoir-participle-agreement-drafts';
import {validateCanonicalDiagnosticBank} from '../item-bank';
import {canonicalProbeMetrics} from './probe-metrics';
import {questionAssessedMaterialKeys} from './material-annotations';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('distinguishes preceding, following and absent objects without subject agreement shortcuts',()=>{
 expect(new Set(drafts.map(d=>d.sentence)).size).toBe(36);
 for(const group of ['preceding','following','absent'])expect(drafts.filter(d=>d.construction===group)).toHaveLength(12);
 for(const d of drafts){expect(d.alternatives).toContain(d.answer);expect(new Set(d.alternatives).size).toBe(4);expect(d.prompt).toContain(`Forme au masculin singulier : ${d.base}`);expect(d.sentence.match(/___/g)).toHaveLength(1);expect(d.explanation).toBeTruthy();if(d.construction!=='preceding')expect(d.answer).toBe(d.base);}
 const preceding=drafts.filter(d=>d.construction==='preceding');
 for(const suffix of ['','e','s','es'])expect(preceding.filter(d=>d.answer===d.base+suffix)).toHaveLength(3);
});
it('keeps all questions unapproved and attached to the approved controlled-production contract',()=>{
 const expansion=read('generated/french-v3-avoir-participle-agreement-expansion.json'),base=read('generated/diagnostic-bank-v3-draft.json'),taxonomy=read('generated/french-taxonomy-v3.json').taxonomy;
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 expect(validateCanonicalDiagnosticBank(bank,taxonomy).issues).toEqual([]);
 expect(expansion.items).toHaveLength(36);
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(entry.item.nodeKey).toBe('accorder_participe_avoir_cod');expect(entry.evidenceKey).toBe('writing-controlled-production');expect(questionAssessedMaterialKeys(entry.item)).toHaveLength(1);expect(canonicalProbeMetrics(entry)).toBeTruthy();}
 for(const annotation of expansion.annotations)expect(annotation.facetKey).toMatch(/^accorder_participe_avoir_cod::construction:(preceding|following|absent)$/);
 expect(read('generated/diagnostic-bank-v3-consolidated-draft.json').items.some((entry:{itemKey:string})=>entry.itemKey.startsWith('v3-avoir-participle-agreement:'))).toBe(false);
});

import {AVOIR_PARTICIPLE_AGREEMENT_TEACHING as lessons} from './avoir-participle-agreement-teaching';
import {validateTeachingTargets} from './teaching-content';
it('matches each lesson to its approved case and keeps guided contexts separate from questions',()=>{
 expect(()=>validateTeachingTargets(read('docs/diagnostic/v3-parallel-review-candidate.json').assessment,lessons)).not.toThrow();
 expect(lessons).toHaveLength(3);
 expect(new Set(lessons.map(lesson=>lesson.facetKey)).size).toBe(3);
 for(const lesson of lessons){expect(lesson.practice).toHaveLength(6);expect(lesson.status).toBe('draft_requires_review');expect(lesson.mode).toBe('production');expect(JSON.stringify(lesson)).not.toContain('—');for(const draft of drafts)expect(JSON.stringify(lesson)).not.toContain(draft.sentence);for(const exercise of lesson.practice){expect(exercise.choices).toBeUndefined();expect(exercise.answerFr).toBeTruthy();expect(exercise.promptFr).toContain('Forme au masculin singulier');}}
 expect(drafts.some(d=>d.sentence.startsWith('Quels exercices'))).toBe(true);
 expect(drafts.some(d=>d.sentence.includes('Noé l’a'))).toBe(true);
});
