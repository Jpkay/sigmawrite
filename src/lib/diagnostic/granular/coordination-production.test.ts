import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COORDINATION_PRODUCTION_ASSESSMENT,COORDINATION_PRODUCTION_TEACHING,coordinationSentence} from './coordination-production';
import {validateAnswer} from '@/lib/linguistic/validator';
import {canonicalProbeMetrics} from './probe-metrics';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('grades sentence combination and rejects copying or the wrong coordination link',async()=>{
 const expansion=read('generated/french-v3-coordination-production-expansion.json') as DraftExpansion;
 expect(expansion.items).toHaveLength(12);
 for(const pronoun of ['et','mais','ou','car'])expect(COORDINATION_PRODUCTION_ASSESSMENT.filter(r=>r.link===pronoun)).toHaveLength(3);
 for(const [index,entry] of expansion.items.entries()){
  const {item}=entry,row=COORDINATION_PRODUCTION_ASSESSMENT[index];
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(item.correctAnswer!,spec)).pass).toBe(true);
  expect((await validateAnswer(item.correctAnswer!.slice(0,-1),spec)).pass).toBe(true);
  expect((await validateAnswer(`${row.first} ${row.second}`,spec)).pass).toBe(false);
  const wrong=row.link==='et'?'mais':'et';
  const answer=coordinationSentence(row,wrong);
  expect((await validateAnswer(answer,spec)).pass).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
 }
});
it('keeps writing evidence distinct from recognition and excludes taught sentences from checks',()=>{
 const expansion=read('generated/french-v3-coordination-production-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json'),assessment=candidate.assessment as V3Assessment;
 const lesson=COORDINATION_PRODUCTION_TEACHING[0],known=teachingMaterialKeys(lesson);
 expect(lesson.practice).toHaveLength(4);
 for(const entry of expansion.items){
  expect(entry.evidenceKey).toBe('writing-controlled-production');expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(key=>known.includes(key))).toBe(false);
 }
 const id='construction_coordination::writing-controlled-production';
 const probes=assessment.probes.filter(p=>p.skillId===id);
 const initial=probes.filter(p=>p.usage==='initial'),later=probes.filter(p=>p.usage==='learning');
 expect(initial.length).toBeGreaterThanOrEqual(3);expect(later.length).toBeGreaterThanOrEqual(3);
 const seen=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
 expect(later.flatMap(p=>p.assessedMaterialKeys??[]).some(key=>seen.has(key))).toBe(false);
 expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id)?.freshCheckAvailable).toBe(true);
});
