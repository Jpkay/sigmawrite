import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {conjugationFormFamily} from './conjugation-form-family';
import {assessSkills,selectProbe,DEFAULT_POLICY,type Skill,type Probe,type Observation} from './engine';
import {inspectAssessmentGraph} from './release-graph';
import {bindAssessmentRelease} from './release-binding';
import type {V3Assessment} from './v3-adapter';
const assessment=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8')).assessment as V3Assessment;
it('surveys forms early while collecting enough evidence before repeatedly switching categories',()=>{
 const skills:Skill[]=(['simple','compound','periphrastic'] as const).map(formFamily=>({id:formFamily,formFamily,branch:'verb',domain:'conjugation',level:1,prerequisites:[],modes:['production']}));
 const probes:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,index)=>({id:`${skill.id}:${index}`,skillId:skill.id,mode:'production',contextId:`context:${index}`,difficulty:.5,expectedSeconds:30,guessProbability:.05})));
 const history:Observation[]=[];
 for(let index=0;index<7;index++){
  const next=selectProbe(skills,probes,history);if(next.kind!=='question')throw Error('Expected available question');
  history.push({...next.item,itemId:next.item.id,correct:true,activeSeconds:30});
 }
 expect(new Set(history.slice(0,3).map(answer=>answer.skillId)).size).toBe(3);
 expect(assessSkills(skills,history).filter(result=>result.status==='mastered').length).toBeGreaterThanOrEqual(2);
 expect(history.reduce((sum,answer)=>sum+answer.activeSeconds,0)).toBe(210);
});
function simulate(correctFor:(skill:Skill)=>boolean){
 const history:Observation[]=[];
 for(let i=0;i<180;i++){
  const next=selectProbe(assessment.skills,assessment.probes,history,DEFAULT_POLICY,[],assessment.releaseScope);
  if(next.kind!=='question')return history;
  const p=next.item,s=assessment.skills.find(s=>s.id===p.skillId)!;
  const known=new Set(history.flatMap(o=>assessment.probes.find(p=>p.id===o.itemId)?.materialKeys??[]));
  history.push({...p,itemId:p.id,correct:correctFor(s),unaided:true,activeSeconds:p.expectedSeconds,occasionId:'synthetic-sitting',materialReceipt:{presentationId:`synthetic:${p.id}`,sourceChecksum:'synthetic',historyComplete:true,firstRecordedKeys:(p.materialKeys??[]).filter(k=>!known.has(k)),previouslySeenKeys:(p.materialKeys??[]).filter(k=>known.has(k)),assessedMaterialKeys:p.assessedMaterialKeys}});
 }
 throw Error('Unbounded selection');
}
it('samples both simple and compound production within the full graph time budget',()=>{
 const history=simulate(()=>true);
 const compound=history.findIndex(o=>o.mode==='production'&&assessment.skills.find(s=>s.id===o.skillId)?.formFamily==='compound');
 expect(compound).toBeGreaterThanOrEqual(0);
 expect(history.slice(0,compound+1).reduce((sum,o)=>sum+o.activeSeconds,0)).toBeLessThan(DEFAULT_POLICY.activeSeconds/2);
 expect(history.some(o=>o.mode==='production'&&assessment.skills.find(s=>s.id===o.skillId)?.formFamily==='simple')).toBe(true);
 expect(history.reduce((sum,o)=>sum+o.activeSeconds,0)).toBeLessThanOrEqual(DEFAULT_POLICY.activeSeconds);
 expect(new Set(history.map(o=>assessment.skills.find(s=>s.id===o.skillId)!.domain)).size).toBe(4);
 const verbs=new Set(history.map(o=>assessment.skills.find(s=>s.id===o.skillId)!.branch).filter(branch=>branch.startsWith('conjugation:verb:')));
 expect(verbs.size).toBeGreaterThanOrEqual(2);
 const results=assessSkills(assessment.skills,history);
 expect(results).toHaveLength(542);
 for(const r of results)if(!history.some(o=>o.skillId===r.skillId))expect(r.status).toBe('unknown');
 expect(results.some(r=>r.status==='mastered')).toBe(false);
});
it('does not transfer correct simple-form answers into wrong compound-form evidence',()=>{
 const history=simulate(s=>s.formFamily!=='compound');
 const sampledCompound=history.filter(o=>assessment.skills.find(s=>s.id===o.skillId)?.formFamily==='compound');
 expect(sampledCompound.length).toBeGreaterThan(0);
 const results=assessSkills(assessment.skills,history);
 for(const id of new Set(sampledCompound.map(o=>o.skillId))){
  const result=results.find(r=>r.skillId===id)!;
  expect(result.status).not.toBe('mastered');
  for(const m of result.modes)expect(m.accuracy).toBe(0);
 }
});
it('follows an actual prerequisite across form categories after a failed challenge',()=>{
 const skills:Skill[]=[{id:'simple',branch:'verb',domain:'conjugation',level:1,formFamily:'simple',prerequisites:[],modes:['production']},{id:'compound',branch:'verb',domain:'conjugation',level:3,formFamily:'compound',prerequisites:['simple'],modes:['production']}];
 const bank:Probe[]=skills.flatMap(s=>Array.from({length:5},(_,i)=>({id:`${s.id}:${i}`,skillId:s.id,contextId:`context:${i}`,mode:'production',guessProbability:.05,difficulty:.5,expectedSeconds:30})));
 const failed:Observation={...bank[5],itemId:bank[5].id,correct:false,activeSeconds:30};
 expect(selectProbe(skills,bank,[failed])).toMatchObject({kind:'question',reason:'step_down',item:{skillId:'simple'}});
 expect(assessSkills(skills,[failed])[0].status).toBe('unknown');
});
it('pins category changes and rejects a false classification without requiring metadata on old releases',()=>{
 expect(conjugationFormFamily('produire_passe_compose')).toBe('compound');
 expect(conjugationFormFamily('produire_futur_proche')).toBe('periphrastic');
 expect(conjugationFormFamily('produire_conditionnel_present')).toBe('simple');
 expect(conjugationFormFamily('produire_contraste_pc_imparfait')).toBe('contrast');
 expect(conjugationFormFamily('identifier_sujet_verbe')).toBeUndefined();
 expect(inspectAssessmentGraph(assessment.skills)).toBe(true);
 const legacy=structuredClone(assessment);for(const s of legacy.skills)delete s.formFamily;
 expect(inspectAssessmentGraph(legacy.skills)).toBe(true);
 const ids={taxonomyId:'test',bankId:'test'};
 expect(bindAssessmentRelease(assessment,ids).checksum).not.toBe(bindAssessmentRelease(legacy,ids).checksum);
 const bad=structuredClone(assessment);bad.skills.find(s=>s.formFamily==='compound')!.formFamily='simple';
 expect(inspectAssessmentGraph(bad.skills)).toBe(false);
});
it('shares the initial form survey across verb families without sharing their evidence',()=>{
 const skills:Skill[]=['conjugation:verb:aller','conjugation:pattern:regular_er'].flatMap(branch=>
  (['simple','compound','periphrastic'] as const).map(formFamily=>({id:`${branch}:${formFamily}`,branch,formFamily,domain:'conjugation',samplingGroup:'conjugaison',level:1,prerequisites:[],modes:['production']})));
 const bank:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,i)=>({id:`${skill.id}:${i}`,skillId:skill.id,mode:'production',contextId:`context:${i}`,difficulty:.5,expectedSeconds:30,guessProbability:.05})));
 const history:Observation[]=[];
 for(let i=0;i<3;i++){
  const next=selectProbe(skills,bank,history);if(next.kind!=='question')throw Error('Expected survey');
  history.push({...next.item,itemId:next.item.id,correct:true,activeSeconds:30});
 }
 expect(new Set(history.map(o=>skills.find(s=>s.id===o.skillId)!.formFamily)).size).toBe(3);
 expect(new Set(history.map(o=>skills.find(s=>s.id===o.skillId)!.branch)).size).toBe(2);
 for(const result of assessSkills(skills,history)){
  if(!history.some(o=>o.skillId===result.skillId))expect(result.status).toBe('unknown');
  expect(result.status).not.toBe('mastered');
 }
});

it('counts a verb visit across tense categories before rotating to another verb',()=>{
 const forms=['simple','compound','periphrastic'] as const;
 const skills:Skill[]=['a','b'].flatMap(verb=>forms.map(form=>({id:`${verb}:${form}`,branch:`conjugation:verb:${verb}`,domain:'conjugation',samplingGroup:'conjugaison',formFamily:form,level:1,prerequisites:[],modes:['production']})));
 const probes:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,i)=>({id:`${skill.id}:${i}`,skillId:skill.id,mode:'production',contextId:`${skill.id}:${i}`,difficulty:.5,expectedSeconds:30,guessProbability:.05})));
 const history:Observation[]=forms.flatMap(form=>probes.filter(p=>p.skillId===`a:${form}`).slice(0,2).map(p=>({...p,itemId:p.id,correct:true,activeSeconds:30})));
 const next=selectProbe(skills,probes,history,{...DEFAULT_POLICY,itemsPerBranchVisit:6});
 expect(next.kind).toBe('question');if(next.kind!=='question')throw Error('Expected a fresh verb question');
 expect(next.item.skillId.startsWith('b:')).toBe(true);
 expect(assessSkills(skills,history).filter(s=>s.skillId.startsWith('b:')).every(s=>s.status==='unknown')).toBe(true);
});
