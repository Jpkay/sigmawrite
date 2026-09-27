import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {checksum} from '@/lib/taxonomy/validate';
import {ETRE_PARTICIPLE_AGREEMENT_TEACHING as lessons} from './etre-participle-agreement-teaching';
import {validateTeachingTargets} from './teaching-content';
import {questionMaterialKeys,questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {canonicalProbeMetrics} from './probe-metrics';
import {allocateTeachingQuestionPools} from './teaching-question-pools';
import {participleAgreementFacet} from './facets';
import {FRENCH_DRAFT_EXPANSION_SOURCES} from './draft-expansion-sources';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import type {V3Assessment} from './v3-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const artifact=read('generated/french-v3-etre-participle-agreement-expansion.json');
const items=artifact.items as CanonicalDiagnosticBankItem[];
it('keeps new agreement drafts separate and pending while preserving exact existing target mappings',()=>{
 expect(FRENCH_DRAFT_EXPANSION_SOURCES as readonly string[]).not.toContain('etre-participle-agreement');
 const {checksum:recorded,...body}=artifact;expect(checksum(body)).toBe(recorded);
 expect(items).toHaveLength(36);expect(new Set(items.map(entry=>entry.item.promptFr)).size).toBe(36);
 for(const entry of items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.qcGates.verdict).toBe('needs_human_review');
  expect(entry.item.responseType).toBe('short_answer');expect(entry.evidenceExpectation).toBe('controlled_production');
  const annotation=artifact.annotations.find((a:{itemKey:string})=>a.itemKey===entry.itemKey);
  expect(annotation.facetKey).toBe(participleAgreementFacet(entry.item.nodeKey,entry.item.validatorConfig!));
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
 }
});
it('requires both agreement marks where appropriate and disambiguates epicene plural subjects',()=>{
 for(const [id,answer] of [['feminine:1','allée'],['plural:4','venus'],['both:8','parties']])expect(items.find(entry=>entry.itemKey===`v3-etre-participle-agreement:${id}`)?.item.correctAnswer).toBe(answer);
 for(const entry of items.filter(entry=>/Les (capitaines|journalistes)/.test(entry.item.promptFr)))expect(entry.item.promptFr).toMatch(/Ce sont tou(?:s des hommes|tes des femmes)/);
});
it('provides three exact-target lessons with disjoint initial and post-teaching question pools',()=>{
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const skills=(candidate.assessment.skills as V3Assessment['skills']).filter(skill=>skill.nodeKey==='accorder_participe_etre');
 const assessment:V3Assessment={taxonomyChecksum:candidate.assessment.taxonomyChecksum,bankChecksum:checksum(items),skills,probes:items.map(entry=>({id:entry.itemKey,skillId:skills.find(skill=>skill.facetKey===participleAgreementFacet(entry.item.nodeKey,entry.item.validatorConfig!))!.id,mode:'production',contextId:entry.itemKey,materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item),...canonicalProbeMetrics(entry)}))};
 expect(skills).toHaveLength(3);expect(()=>validateTeachingTargets(assessment,lessons)).not.toThrow();
 const allocation=allocateTeachingQuestionPools(assessment,lessons);
 expect(allocation.coverage).toHaveLength(3);
 for(const row of allocation.coverage)expect(row).toMatchObject({status:'allocated',initialItems:6,learningItems:6});
 for(const lesson of lessons){
  expect(lesson.practice).toHaveLength(6);expect(lesson.practice.every(exercise=>!exercise.choices)).toBe(true);
  const taught=new Set(teachingMaterialKeys(lesson));expect(taught.size).toBeGreaterThan(0);
  const target=skills.find(skill=>skill.facetKey===lesson.facetKey)!;
  for(const probe of allocation.assessment.probes.filter(probe=>probe.skillId===target.id&&probe.usage==='learning'))expect(probe.assessedMaterialKeys?.some(key=>taught.has(key))).toBe(false);
  expect(JSON.stringify(lesson)).not.toContain('—');expect(lesson.boundaryFr).toContain('pronominal');
 }
});
