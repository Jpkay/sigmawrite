import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {assessSkills,type Observation,type Probe} from './engine';
import {WRITTEN_SYLLABLE_FEATURES,applyWrittenSyllableCoverage} from './written-syllable-coverage';
const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
it('provides both pools for every pattern and rejects single-pattern mastery',()=>{
 for(const mode of ['recognition','production']){
  const skill=candidate.assessment.skills.find((s:{nodeKey:string;modes:string[]})=>s.nodeKey==='segmenter_syllabes_ecrites'&&s.modes.includes(mode));
  const probes:Probe[]=candidate.assessment.probes.filter((p:Probe)=>p.skillId===skill.id);
  for(const usage of ['initial','learning'])for(const feature of WRITTEN_SYLLABLE_FEATURES)expect(probes.filter(p=>p.usage===usage&&p.evidenceFeatures?.includes(feature))).toHaveLength(4);
  const isolated={...structuredClone(skill),evidenceRequirements:{[mode]:{...skill.evidenceRequirements[mode],novelWordsRequired:false}}};
  const evidence:Observation[]=probes.filter(p=>p.evidenceFeatures?.includes(WRITTEN_SYLLABLE_FEATURES[0])).map((p,i)=>({...p,itemId:p.id,correct:true,unaided:true,occasionId:`fixture-${i%2}`,activeSeconds:30}));
  expect(assessSkills([isolated],evidence)[0].status).not.toBe('mastered');
 }
});
it('keeps the old contract without replacement questions and closes the approved prerequisite chain',()=>{
 const old={id:'old',branch:'spelling',level:0,prerequisites:[],modes:['recognition' as const]};applyWrittenSyllableCoverage([old],[]);expect(old).not.toHaveProperty('evidenceRequirements');
 for(const nodeKey of ['segmenter_syllabes_ecrites','associer_phoneme_graphie_frequente','employer_cedille'])for(const mode of ['recognition','production']){
  const skill=candidate.assessment.skills.find((s:{nodeKey:string;modes:string[]})=>s.nodeKey===nodeKey&&s.modes.includes(mode));
  expect(candidate.teachingContent.some((l:{nodeKey:string;mode:string})=>l.nodeKey===nodeKey&&l.mode===mode)).toBe(true);
  for(const id of skill.prerequisites)expect(candidate.assessment.probes.some((p:Probe)=>p.skillId===id)).toBe(true);
 }
});
