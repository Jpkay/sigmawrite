import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {EXPLICIT_CHRONOLOGY_DRAFTS as drafts,EXPLICIT_CHRONOLOGY_TEACHING as lessons} from './explicit-chronology';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';

it('assesses three genres with distinct short passages and unambiguous order choices',()=>{
 expect(new Set(drafts.map(r=>r.passage)).size).toBe(24);
 for(const genre of ['narrative','informational','argumentative'])expect(drafts.filter(r=>r.genre===genre)).toHaveLength(8);
 for(const row of drafts){
  expect(row.passage.split(/\s+/).length).toBeLessThan(65);
  const events=row.answer.split(' → ');
  expect(events).toHaveLength(3);
  expect(new Set([row.answer,...row.distractors]).size).toBe(4);
  for(const distractor of row.distractors)expect(distractor.split(' → ').sort()).toEqual([...events].sort());
 }
 expect(drafts.find(r=>r.key==='n-library')?.answer).toBe('départ de la maison → arrivée à la bibliothèque → rencontre avec sa sœur');
 expect(drafts.find(r=>r.key==='a-bikes')?.answer).toBe('vérification des vélos → essai dans la cour → sortie du groupe');
});

it('records assessed passage exposure, isolates genres and keeps independent passages untaught',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-explicit-chronology-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(24);
 expect(lessons).toHaveLength(3);
 for(const lesson of lessons){expect(lesson.practice).toHaveLength(4);expect(lesson.status).toBe('draft_requires_review');}
 for(const entry of expansion.items){
  const row=drafts.find(r=>entry.itemKey.endsWith(`:${r.key}`))!;
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.nodeKey).toBe('ordonner_evenements_explicites');
  expect(entry.item.validatorConfig?.sourceTextType).toBe(row.genre==='narrative'?'literary':row.genre);
  const material=questionAssessedMaterialKeys(entry.item);
  expect(material.length).toBeGreaterThan(0);
  expect(material.some(k=>taught.has(k))).toBe(false);
 }
});
