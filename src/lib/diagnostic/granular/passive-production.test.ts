import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSIVE_PRODUCTION_ASSESSMENT as rows,PASSIVE_PRODUCTION_TEACHING as lessons,passiveSentence} from './passive-production';
import {validateAnswer} from '@/lib/linguistic/validator';
import {canonicalProbeMetrics} from './probe-metrics';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('grades passive transformations and rejects unchanged active voice, tense and agreement errors',async()=>{
 const expansion=read('generated/french-v3-passive-production-expansion.json') as DraftExpansion;
 expect(rows.filter(r=>r.tense==='présent')).toHaveLength(8);
 expect(rows.filter(r=>r.tense==='imparfait')).toHaveLength(4);
 expect(rows.filter(r=>r.tense==='futur simple')).toHaveLength(4);
 for(const [i,entry] of expansion.items.entries()){
  const {item}=entry,r=rows[i];
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(passiveSentence(r),spec)).pass).toBe(true);
  expect((await validateAnswer(passiveSentence(r).slice(0,-1),spec)).pass).toBe(true);
  expect((await validateAnswer(r.active,spec)).pass).toBe(false);
  expect((await validateAnswer(passiveSentence(r,r.auxiliary==='est'?'sera':'est'),spec)).pass).toBe(false);
  const wrongParticiple=r.participle.endsWith('s')?r.participle.slice(0,-1):r.participle+'s';
  expect((await validateAnswer(passiveSentence(r).replace(` ${r.participle} par `,` ${wrongParticiple} par `),spec)).pass).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
 }
});
it('isolates passive production evidence and reserves unseen sentence material for checks',()=>{
 const expansion=read('generated/french-v3-passive-production-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json'),assessment=candidate.assessment as V3Assessment;
 const lesson=lessons[0],known=new Set(teachingMaterialKeys(lesson));
 expect(expansion.items).toHaveLength(16);expect(lesson.practice).toHaveLength(6);
 for(const entry of expansion.items){
  expect(entry.evidenceKey).toBe('writing-controlled-production');expect(entry.item.nodeKey).toBe('construction_voix_passive');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>known.has(k))).toBe(false);
 }
 const probes=assessment.probes.filter(p=>p.skillId==='construction_voix_passive::writing-controlled-production');
 const initial=probes.filter(p=>p.usage==='initial'),later=probes.filter(p=>p.usage==='learning');
 expect(initial.length).toBeGreaterThanOrEqual(3);expect(later.length).toBeGreaterThanOrEqual(3);
 const seen=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
 expect(later.flatMap(p=>p.assessedMaterialKeys??[]).some(k=>seen.has(k))).toBe(false);
});
