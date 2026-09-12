import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBJONCTIF_RECOGNITION_EXAMPLES,SUBJONCTIF_RECOGNITION_TEACHING} from './subjonctif-recognition';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
it('includes counterexamples to que-only recognition and identical-form contrasts',()=>{
 expect(SUBJONCTIF_RECOGNITION_EXAMPLES).toHaveLength(24);
 expect(SUBJONCTIF_RECOGNITION_EXAMPLES.filter(r=>r[2]==='Subjonctif présent')).toHaveLength(12);
 for(const form of ['prenions','veniez','voyions','lisiez'])expect(new Set(SUBJONCTIF_RECOGNITION_EXAMPLES.filter(r=>r[1]===form).map(r=>r[2]))).toEqual(new Set(['Subjonctif présent','Indicatif imparfait']));
 expect(SUBJONCTIF_RECOGNITION_EXAMPLES.filter(r=>r[2]==='Subjonctif passé')).toHaveLength(4);
});
it('preserves exact target and draft status with untaught assessment sentences',()=>{
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 validateTeachingTargets(read('docs/diagnostic/v3-parallel-review-candidate.json').assessment,SUBJONCTIF_RECOGNITION_TEACHING);
 const taught=teachingMaterialKeys(SUBJONCTIF_RECOGNITION_TEACHING[0]);
 const entries=read('generated/french-v3-tense-recognition-expansion.json').items.filter((i:{itemKey:string})=>i.itemKey.startsWith('v3-tense-recognition:subjonctif-recognition-'));
 expect(entries).toHaveLength(24);
 const seen=new Set<string>();
 for(const entry of entries){
  expect(entry.promptFamily).toBe('recognize-simple-tense');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.choices.filter((c:{correct:boolean})=>c.correct)).toHaveLength(1);
  for(const key of questionAssessedMaterialKeys(entry.item)){expect(taught).not.toContain(key);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
});

it('preserves the recognition contrasts in both reserves even beside older uncategorized probes',async()=>{
 const {canonicalProbeMetrics}=await import('./probe-metrics');
 const {allocateQuestionPools}=await import('./question-pools');
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8')).assessment;
 const skill=candidate.skills.find((s:{id:string})=>s.id==='reconnaitre_subjonctif_present::reading-receptive');
 const entries=JSON.parse(readFileSync('generated/french-v3-tense-recognition-expansion.json','utf8')).items.filter((i:{itemKey:string})=>i.itemKey.startsWith('v3-tense-recognition:subjonctif-recognition-'));
 const probes=entries.map((entry:{itemKey:string},i:number)=>({id:entry.itemKey,skillId:skill.id,mode:'recognition' as const,contextId:`context-${i}`,...canonicalProbeMetrics(entry as never)}));
 const source={...candidate,skills:[skill],probes:[...probes,...[0,1].map(i=>({...probes[0],id:`older-${i}`,samplingCategory:undefined}))]};
 const allocated=allocateQuestionPools(source);
 expect(allocated.ready).toBe(true);
 for(const usage of ['initial','learning'])for(let category=0;category<4;category++)expect(allocated.assessment.probes.some(p=>p.usage===usage&&p.samplingCategory===`subjonctif-recognition:${category}`)).toBe(true);
 const unrelated=structuredClone(entries[0]);unrelated.item.nodeKey='reconnaitre_futur_simple';expect(canonicalProbeMetrics(unrelated).samplingCategory).toBeUndefined();
});

it('retires untracked recognition only in a bank with tracked replacements',async()=>{
 const {adaptV3ForAssessment}=await import('./v3-adapter');
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const artifact=read('generated/french-taxonomy-v3.json');
 const old=adaptV3ForAssessment({artifact,bank:read('generated/diagnostic-bank-v3-draft.json')});
 const legacy=old.probes.filter(p=>['reconnaitre_subjonctif_present::reading-receptive','produire_subjonctif_present_frequent::writing-controlled-production'].includes(p.skillId)&&!p.assessedMaterialKeys?.length);
 expect(legacy.length).toBeGreaterThan(0);
 const current=adaptV3ForAssessment({artifact,bank:read('generated/diagnostic-bank-v3-consolidated-draft.json'),reviewPolicy:read('generated/french-v3-parallel-review-policy.json')});
 for(const p of legacy){expect(current.probes.some(q=>q.id===p.id)).toBe(false);expect(current.unsupportedEvidenceItemKeys).toContain(p.id);}
 expect(current.probes.filter(p=>p.skillId==='reconnaitre_subjonctif_present::reading-receptive')).toHaveLength(24);
});
