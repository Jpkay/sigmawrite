import {expect,it} from 'vitest';
import {optionalLessons} from './optional-lessons';
import {assessSkills} from './engine';
import type {V3Assessment,EvidenceSkill} from './v3-adapter';
import type {LearningActivityBinding} from './activity-plan';
const skills:EvidenceSkill[]=['foundation','dependent'].map((id,i)=>({id,nodeKey:id,evidenceKey:'production',labelFr:id,branch:id,level:i,modes:['production'],prerequisites:i?['foundation']:[]}));
const graph:V3Assessment={skills,probes:[],taxonomyChecksum:'test',bankChecksum:'test'};
const bindings:LearningActivityBinding[]=skills.map(s=>({id:s.id,nodeKey:s.nodeKey,mode:'production',kind:'instruction',contentId:s.id,status:'published',titleFr:s.id,href:'/student/diagnostic'}));
it('offers an untested foundation without diagnosing it or unlocking its dependent',()=>{
 const results=assessSkills(skills,[]),before=structuredClone(results);
 expect(optionalLessons(graph,results,bindings,new Set(),new Set()).map(a=>a.skillId)).toEqual(['foundation']);
 expect(results).toEqual(before);
});
it('does not offer draft, mismatched, completed or already recommended content',()=>{
 const results=assessSkills(skills,[]);
 for(const candidate of [{...bindings[0],status:'draft' as const},{...bindings[0],facetKey:'other'},{...bindings[0],mode:'recognition' as const}])expect(optionalLessons(graph,results,[candidate],new Set(),new Set())).toEqual([]);
 expect(optionalLessons(graph,results,bindings,new Set(['foundation']),new Set())).toEqual([]);
 expect(optionalLessons(graph,results,bindings,new Set(),new Set(['foundation']))).toEqual([]);
});
it('uses direct prerequisite readiness while retaining uncertain skill results',()=>{
 const results=assessSkills(skills,Array.from({length:2},(_,i)=>({itemId:String(i),skillId:'foundation',mode:'production' as const,contextId:String(i),correct:true,guessProbability:.05,activeSeconds:10})));
 expect(optionalLessons(graph,results,bindings,new Set(['foundation']),new Set()).map(a=>a.skillId)).toEqual(['dependent']);
});
it('respects the published teaching scope even when a lesson binding exists',()=>{
 const scoped={...graph,releaseScope:{version:'french-granular-release-scope-v1',assessmentSkillIds:['foundation'],teachingSkillIds:[],limitationFr:'Autres points à vérifier.'}};
 expect(optionalLessons(scoped,assessSkills(skills,[]),bindings,new Set(),new Set())).toEqual([]);
});
