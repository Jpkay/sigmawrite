import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {assessSkills,type Observation} from './engine';
import type {V3Assessment} from './v3-adapter';
const assessment=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8')).assessment as V3Assessment;
const target=(tense:string,verb:string)=>`produire_${tense}::writing-controlled-production::verb:${verb}`;
const cases=[
 {name:'passé composé strong, plus-que-parfait weak',known:[target('passe_compose','venir'),target('passe_compose','prendre')],weak:[target('plus_que_parfait','venir'),target('plus_que_parfait','prendre')]},
 {name:'venir strong, prendre weak at both tenses',known:[target('passe_compose','venir'),target('plus_que_parfait','venir')],weak:[target('passe_compose','prendre'),target('plus_que_parfait','prendre')]},
 {name:'crossed verb and tense boundaries',known:[target('passe_compose','prendre'),target('plus_que_parfait','venir')],weak:[target('passe_compose','venir'),target('plus_que_parfait','prendre')]},
];
it.each(cases)('keeps separate direct evidence for $name',profile=>{
 const selected=new Set([...profile.known,...profile.weak]);
 // Independent synthetic attempts exercise inference only; they are never saved
 // as student data and are not evidence of pedagogical calibration.
 const observations:Observation[]=assessment.probes.filter(p=>selected.has(p.skillId)&&p.usage==='initial').map(p=>({
  itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,guessProbability:p.guessProbability,
  correct:profile.known.includes(p.skillId),activeSeconds:30,unaided:true,occasionId:'synthetic-one-sitting',
  materialReceipt:{presentationId:`synthetic:${p.id}`,sourceChecksum:'synthetic',historyComplete:true,firstRecordedKeys:p.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:p.assessedMaterialKeys},
 }));
 const results=assessSkills(assessment.skills,observations);
 for(const id of selected){
  expect(assessment.releaseScope?.assessmentSkillIds).toContain(id);
  const result=results.find(r=>r.skillId===id)!;
  expect(result.evidence).toBe('direct');
  expect(result.modes[0].confirmed).toBe(false);
  if(profile.known.includes(id))expect(result.modes[0].probability).toBeGreaterThan(.85);
  else expect(result.modes[0].provisionalGap).toBe(true);
 }
 for(const id of [target('passe_compose','avoir'),target('plus_que_parfait','être')])expect(results.find(r=>r.skillId===id)).toMatchObject({status:'unknown',evidence:'untested'});
 expect(results).toHaveLength(542);
});
