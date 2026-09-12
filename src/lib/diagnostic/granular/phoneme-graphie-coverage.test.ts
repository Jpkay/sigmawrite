import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {applyPhonemeGraphieCoverage,PHONEME_GRAPHIE_FEATURES,phonemeGraphieFeature} from './phoneme-graphie-coverage';
import {canonicalProbeMetrics} from './probe-metrics';
import {assessSkills,type Skill,type Probe,type Observation} from './engine';
import {isQuestionPoolSufficient} from './question-pools';
import type {DraftExpansion} from './assemble-drafts';
const entries=(JSON.parse(readFileSync('generated/french-v3-phoneme-graphie-expansion.json','utf8')) as DraftExpansion).items;
const skill=():Skill=>({id:'auditory',branch:'spelling',level:0,prerequisites:[],modes:['recognition'],evidenceRequirements:{recognition:{minimumItems:3,minimumContexts:1,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true}}});
const probes:Probe[]=entries.filter(e=>e.evidenceKey==='reading-receptive').map(e=>({id:e.itemKey,skillId:'auditory',mode:'recognition',contextId:e.itemKey,...canonicalProbeMetrics(e)}));
const observe=(p:Probe,index:number):Observation=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,correct:true,unaided:true,occasionId:`day-${index%2}`,guessProbability:p.guessProbability,activeSeconds:30,evidenceFeatures:p.evidenceFeatures});
it('does not reinterpret older banks without the new source-bound audio format',()=>{
 const old=skill(),before=structuredClone(old);applyPhonemeGraphieCoverage([old],[]);expect(old).toEqual(before);
 const entry=entries[0];expect(()=>phonemeGraphieFeature({...entry,item:{...entry.item,validatorConfig:{phonemeGraphieGroup:'ch'}}})).toThrow();
});
it('requires each sound group, even with many correct answers in another group',()=>{
 const s=skill();applyPhonemeGraphieCoverage([s],probes);
 expect(s.evidenceRequirements!.recognition!.minimumOccasions).toBe(2);
 expect(s.evidenceRequirements!.recognition!.featureRequirements).toHaveLength(4);
 const oneGroup=probes.filter(p=>p.evidenceFeatures!.includes(PHONEME_GRAPHIE_FEATURES[0]));
 expect(assessSkills([s],oneGroup.map(observe))[0].status).not.toBe('mastered');
 expect(isQuestionPoolSufficient(oneGroup,s,'recognition',false)).toBe(false);
 const balanced=PHONEME_GRAPHIE_FEATURES.flatMap(f=>probes.filter(p=>p.evidenceFeatures!.includes(f)).slice(0,4));
 expect(assessSkills([s],balanced.map(observe))[0].status).toBe('mastered');
 expect(assessSkills([s],balanced.map((p,i)=>({...observe(p,i),occasionId:'same-day'})))[0].status).not.toBe('mastered');
 const reserve=probes.filter(p=>!balanced.includes(p));
 expect(isQuestionPoolSufficient(balanced,s,'recognition',false)).toBe(true);
 expect(isQuestionPoolSufficient(reserve,s,'recognition',true)).toBe(true);
 expect(isQuestionPoolSufficient(balanced.slice(1),s,'recognition',false)).toBe(false);
});

it('allocates the real novel-word inventory into four-pattern initial and reserve pools',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const mode of ['recognition','production']){
  const s=c.assessment.skills.find((s:{nodeKey:string;modes:string[]})=>s.nodeKey==='associer_phoneme_graphie_frequente'&&s.modes.includes(mode));
  const rows=c.assessment.probes.filter((p:Probe)=>p.skillId===s.id);
  expect(c.poolCoverage.find((r:{skillId:string})=>r.skillId===s.id).status).toBe('allocated');
  expect(rows.filter((p:Probe)=>p.usage==='initial')).toHaveLength(16);
  expect(rows.filter((p:Probe)=>p.usage==='learning')).toHaveLength(16);
  for(const phase of ['initial','learning'])for(const feature of PHONEME_GRAPHIE_FEATURES)expect(rows.filter((p:Probe)=>p.usage===phase&&p.evidenceFeatures?.includes(feature))).toHaveLength(4);
 }
});

it('rejects pooled duplicate recordings even when every written identity is different',()=>{
 const s=skill();s.evidenceRequirements!.recognition!.novelWordsRequired=true;
 const audio=`audio:sha256:${'a'.repeat(64)}`;
 const pool=probes.slice(0,4).map((p,index)=>{const word=`word:sha256:${String(index+1).repeat(64)}`;return {...p,materialKeys:[word,audio],assessedMaterialKeys:[word,audio]};});
 expect(isQuestionPoolSufficient(pool,s,'recognition',true)).toBe(false);
 const unique=pool.map((p,index)=>({...p,materialKeys:[p.materialKeys[0],`audio:sha256:${String(index+1).repeat(64)}`],assessedMaterialKeys:[p.materialKeys[0],`audio:sha256:${String(index+1).repeat(64)}`]}));
 expect(isQuestionPoolSufficient(unique,s,'recognition',true)).toBe(true);
});
