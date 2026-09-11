import {expect,it} from 'vitest';
import {readingSamplingFamily} from './reading-sampling-family';
import {assessWithinOccasion,selectProbe,DEFAULT_POLICY,type Skill,type Probe,type Observation} from './engine';
const nodes=['associer_information_question','resoudre_pronom_sujet','inferer_cause_locale','identifier_idee_phrase'];
const skills:Skill[]=nodes.map(id=>({id,branch:`reading_comprehension:${id}`,domain:'reading_comprehension',samplingGroup:'comprehension_ecrite',level:1,prerequisites:[],modes:['interpretation']}));
const probes:Probe[]=skills.flatMap(skill=>Array.from({length:8},(_,i)=>({id:`${skill.id}:${i}`,skillId:skill.id,mode:'interpretation',contextId:`${skill.id}:${i}`,difficulty:.5,expectedSeconds:60,guessProbability:.25})));
function run(wrong:string|null,limit=9){
 const observations:Observation[]=[];
 for(let i=0;i<limit;i++){
  const next=selectProbe(skills,probes,observations,{...DEFAULT_POLICY,activeSeconds:540});
  if(next.kind!=='question')break;
  observations.push({...next.item,itemId:next.item.id,correct:next.item.skillId!==wrong,activeSeconds:60});
 }
 return observations;
}
it('keeps locating evidence separate from interpreting it',()=>{
 expect(readingSamplingFamily('reading_comprehension:localiser_span_preuve')).toBe('reading_retrieval');
 expect(readingSamplingFamily('reading_comprehension:relier_preuve_interpretation')).toBe('reading_inference');
 expect(readingSamplingFamily('reading_comprehension:resoudre_pronom_objet')).toBe('reading_reference');
});
it('screens different reading operations before repeatedly testing retrieval',()=>{
 const observations=run(null,4);
 expect(observations.map(o=>o.skillId)).toEqual(nodes);
 expect(assessWithinOccasion(skills,observations).every(result=>!result.resolved)).toBe(true);
});
it.each(['resoudre_pronom_sujet','inferer_cause_locale'])('confirms a %s gap and a separate known operation within nine short passages',wrong=>{
 const observations=run(wrong),results=assessWithinOccasion(skills,observations);
 expect(results.find(r=>r.skillId===wrong)?.status).toBe('missing');
 expect(results.find(r=>r.skillId==='associer_information_question')?.status).toBe('mastered');
 expect(observations.reduce((total,o)=>total+o.activeSeconds,0)).toBeLessThanOrEqual(540);
 expect(new Set(observations.map(o=>o.itemId)).size).toBe(observations.length);
});
it('does not interpret a skipped reference item as an error needing immediate confirmation',()=>{
 const first=run(null,2);first[1]={...first[1],correct:false,skipped:true};
 const next=selectProbe(skills,probes,first);
 expect(next).toMatchObject({kind:'question',item:{skillId:'inferer_cause_locale'}});
});
