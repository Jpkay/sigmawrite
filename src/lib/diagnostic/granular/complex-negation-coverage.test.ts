import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {assessSkills,type Skill,type Probe,type Observation} from './engine';
import {COMPLEX_NEGATION_FEATURES,applyComplexNegationCoverage,complexNegationFeature} from './complex-negation-coverage';
import {canonicalProbeMetrics} from './probe-metrics';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
const items:CanonicalDiagnosticBankItem[]=JSON.parse(readFileSync('generated/french-v3-complex-negation-expansion.json','utf8')).items;
const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
function fixture(){
 const skill:Skill=structuredClone(candidate.assessment.skills.find((s:{id:string})=>s.id==='construction_negation_complexe::reading-analysis'));
 const probes:Probe[]=items.map(entry=>({id:entry.itemKey,skillId:skill.id,mode:'recognition',contextId:entry.itemKey,...canonicalProbeMetrics(entry),negativeExampleAssessed:Boolean(entry.item.validatorConfig?.negativeExample)}));
 return {skill,probes};
}
it('requires every meaning even when the overall accuracy would conceal one gap',()=>{
 const {skill,probes}=fixture();applyComplexNegationCoverage([skill],probes);
 const observations:Observation[]=probes.map((p,i)=>({...p,itemId:p.id,correct:true,unaided:true,occasionId:`day-${i%2}`,activeSeconds:30}));
 const all=assessSkills([skill],observations)[0];expect(all.status).toBe('mastered');
 const plusOnly=assessSkills([skill],observations.filter(o=>o.evidenceFeatures?.includes(COMPLEX_NEGATION_FEATURES[0])))[0];
 expect(plusOnly.status).not.toBe('mastered');expect(plusOnly.modes[0].unconfirmedFeatures).toEqual(COMPLEX_NEGATION_FEATURES.slice(1));
 const gap=assessSkills([skill],observations.map(o=>({...o,correct:!o.evidenceFeatures?.includes('complex-negation:rien')})))[0];
 expect(gap.modes[0].accuracy).toBeGreaterThan(.8);expect(gap.status).not.toBe('mastered');expect(gap.modes[0].unconfirmedFeatures).toContain('complex-negation:rien');
});
it('retains parent criteria and leaves historical formats unchanged',()=>{
 const {skill,probes}=fixture(),before=structuredClone(skill);
 applyComplexNegationCoverage([skill],[]);expect(skill).toEqual(before);
 applyComplexNegationCoverage([skill],probes);
 const {featureRequirements,...rest}=skill.evidenceRequirements!.recognition!;
 const {featureRequirements:oldFeatures,...oldRest}=before.evidenceRequirements!.recognition!;
 expect(rest).toEqual(oldRest);
 expect(featureRequirements).toHaveLength(5);
 expect(featureRequirements!.every(f=>f.minimumItems===4&&f.minimumContexts===4)).toBe(true);
 const once=structuredClone(skill);applyComplexNegationCoverage([skill],probes);expect(skill).toEqual(once);
 expect(()=>complexNegationFeature({...items[0],evidenceKey:'writing-controlled-production'})).toThrow(/metadata/);
});

it('keeps legacy banks usable but binds the new target only to tracked meaning questions',async()=>{
 const {adaptV3ForAssessment}=await import('./v3-adapter');
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const artifact=read('generated/french-taxonomy-v3.json');
 const old=adaptV3ForAssessment({artifact,bank:read('generated/diagnostic-bank-v3-draft.json')});
 const legacy=old.probes.filter(p=>p.skillId==='construction_negation_complexe::reading-analysis');
 expect(legacy.length).toBeGreaterThan(0);
 const current=adaptV3ForAssessment({artifact,bank:read('generated/diagnostic-bank-v3-consolidated-draft.json'),reviewPolicy:read('generated/french-v3-parallel-review-policy.json')});
 const probes=current.probes.filter(p=>p.skillId==='construction_negation_complexe::reading-analysis');
 expect(probes).toHaveLength(46);expect(probes.every(p=>p.id.startsWith('v3-complex-negation:'))).toBe(true);
 for(const p of legacy){expect(current.unsupportedEvidenceItemKeys).toContain(p.id);}
 for(const usage of ['initial','learning'])for(const feature of COMPLEX_NEGATION_FEATURES){
  expect(candidate.assessment.probes.filter((p:Probe)=>p.skillId==='construction_negation_complexe::reading-analysis'&&p.usage===usage&&p.evidenceFeatures?.includes(feature))).toHaveLength(4);
 }
});
