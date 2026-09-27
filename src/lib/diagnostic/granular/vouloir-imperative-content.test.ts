import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {VOULOIR_IMPERATIVE_TEACHING as lessons} from './vouloir-imperative-content';
import {questionAssessedMaterialKeys,questionMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {validateAnswer} from '../../linguistic/validator';
import {writtenGuessingFloor} from './response-space';
import {runGates} from '../../ai/item-generation/pipeline';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
const artifact=()=>JSON.parse(readFileSync('generated/french-v3-vouloir-imperative-expansion.json','utf8')) as {items:CanonicalDiagnosticBankItem[]};
it('keeps accepted variants, finite response estimates and teaching/check materials consistent',async()=>{
 const {items}=artifact();expect(items).toHaveLength(18);expect(lessons[0].practice).toHaveLength(8);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const entry of items){
  const item=entry.item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect(entry.reviewStatus).toBe('needs_human_review');
  for(const answer of [item.correctAnswer!,...item.acceptableAnswers!])expect((await validateAnswer(answer,spec)).pass).toBe(true);
  expect(writtenGuessingFloor(item)).toBeCloseTo(item.validatorConfig?.vouloirImperativeUse==='resentment'?1/3:1/2);
  for(const key of questionAssessedMaterialKeys(item))expect(taught.has(key)).toBe(false);
 }
});
it('computes the same context-specific answers during authoring, without trusting suggested overrides',async()=>{
 const source=artifact().items[0].item;
 const result=await runGates({...source,correctAnswer:'wrong',acceptableAnswers:['wrong']},{knownNodeKeys:new Set(['produire_imperatif']),knownMisconceptionKeys:new Set()});
 expect(result.item?.correctAnswer).toBe('veux');expect(result.item?.acceptableAnswers).toEqual(['veuille']);
 expect(result.gates.gate2_answer_key.ok).toBe(true);
});
it('anchors both completed accepted sentences but rejects invented completions',()=>{
 const item=artifact().items[0].item;
 expect(questionMaterialKeys(item).length).toBeGreaterThan(2);
 const invented=structuredClone(item);
 const material=invented.validatorConfig!.materialExposure as {sentences:string[]};
 material.sentences.push('Ne m’en veut pas pour ce retard.');
 expect(()=>questionMaterialKeys(invented)).toThrow('not anchored');
});
it('prepares vouloir while preserving the remaining devoir dependency',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 expect(candidate.assessment.releaseScope.teachingSkillIds).toContain('produire_imperatif::writing-controlled-production::verb:vouloir');
 for(const id of ['interpreter_valeur_imperatif::reading-receptive','employer_imperatif_en_contexte::writing-independent-production'])expect(candidate.blockedTeachingTargets.find((r:{skillId:string})=>r.skillId===id).missingPrerequisiteIds).toEqual(['produire_imperatif::writing-controlled-production::verb:devoir']);
});

it('uses contextual probes only and covers both uses and every person in each phase',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const probes=candidate.assessment.probes.filter((p:{skillId:string})=>p.skillId==='produire_imperatif::writing-controlled-production::verb:vouloir');
 const entries=new Map(artifact().items.map(e=>[e.itemKey,e.item]));
 expect(probes.every((p:{id:string})=>p.id.startsWith('v3-vouloir-imperative:'))).toBe(true);
 for(const phase of ['initial','learning']){
  const items=probes.filter((p:{usage:string})=>p.usage===phase).map((p:{id:string})=>entries.get(p.id)!);
  expect(new Set(items.map((i:CanonicalDiagnosticBankItem['item'])=>i.validatorConfig?.vouloirImperativeUse))).toEqual(new Set(['resentment','polite_request']));
  expect(new Set(items.map((i:CanonicalDiagnosticBankItem['item'])=>i.validatorConfig?.person))).toEqual(new Set(['2s','1p','2p']));
 }
});
