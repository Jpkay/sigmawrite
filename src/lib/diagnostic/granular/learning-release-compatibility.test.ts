import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {adaptV3ForAssessment} from './v3-adapter';
import type {AssessmentBundle} from './service';
import {inspectLearningReleaseCompatibility} from './learning-release-compatibility';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const bank=read('generated/diagnostic-bank-v3-draft.json');
const source:AssessmentBundle={bank,assessment:adaptV3ForAssessment({artifact:read('generated/french-taxonomy-v3.json'),bank}),taxonomyId:'taxonomy',bankId:'bank-v1'};
it('allows unchanged content under a new bank identity without changing the source',()=>{
 const target=structuredClone(source);target.bankId='bank-v2';
 const before=JSON.stringify(source);
 expect(inspectLearningReleaseCompatibility(source,target).compatible).toBe(true);
 expect(JSON.stringify(source)).toBe(before);
});
it('rejects changed answer keys, evidence rules, pool assignments and graph identities',()=>{
 for(const mutate of [
  (b:AssessmentBundle)=>{b.bank.items[0].item.correctAnswer='changed';},
  (b:AssessmentBundle)=>{b.assessment.skills[0].level+=1;},
  (b:AssessmentBundle)=>{b.assessment.probes[0].usage=b.assessment.probes[0].usage==='initial'?'learning':'initial';},
  (b:AssessmentBundle)=>{b.taxonomyId='other';},
  (b:AssessmentBundle)=>{b.assessment.facetChecksum='other';},
 ]){const target=structuredClone(source);mutate(target);expect(inspectLearningReleaseCompatibility(source,target).compatible).toBe(false);}
});
it('reports expanded scope but refuses to remove previously supported targets',()=>{
 const a=structuredClone(source),b=structuredClone(source),ids=a.assessment.skills.slice(0,2).map(skill=>skill.id);
 a.assessment.releaseScope={version:'french-granular-release-scope-v1',assessmentSkillIds:ids.slice(0,1),teachingSkillIds:[],limitationFr:'Partiel'};
 b.assessment.releaseScope={...a.assessment.releaseScope,assessmentSkillIds:ids};
 expect(inspectLearningReleaseCompatibility(a,b)).toMatchObject({compatible:true,addedScopeTargets:[ids[1]]});
 expect(inspectLearningReleaseCompatibility(b,a)).toMatchObject({compatible:false,removedScopeTargets:[ids[1]]});
});
it('rejects changed teaching or activity destinations before carrying completions forward',()=>{
 const a=structuredClone(source),prepared=read('docs/diagnostic/v3-scoped-review-candidate.json');
 a.teachingContent=[prepared.teachingContent[0]];a.activities=[prepared.activities[0]];
 const b=structuredClone(a);b.teachingContent![0].practice[0].answerFr='changed';
 expect(inspectLearningReleaseCompatibility(a,b)).toMatchObject({compatible:false,changedTeaching:[a.teachingContent![0].id]});
 const c=structuredClone(a);c.activities![0].href='/student/other';
 expect(inspectLearningReleaseCompatibility(a,c)).toMatchObject({compatible:false,changedActivities:[a.activities![0].id]});
});

it('allows an aggregate facet checksum change from added questions only when old semantics remain exact',()=>{
 const target=structuredClone(source);
 target.bank.items.push({...structuredClone(source.bank.items[0]),itemKey:'new-question'});
 target.assessment.probes.push({...structuredClone(source.assessment.probes[0]),id:'new-question'});
 target.assessment.facetChecksum='expanded-compiled-bank';
 expect(inspectLearningReleaseCompatibility(source,target)).toMatchObject({compatible:true,facetsUnchanged:false,addedItems:['new-question'],addedProbes:['new-question']});
 target.assessment.probes[0].skillId='different-skill';
 expect(inspectLearningReleaseCompatibility(source,target).compatible).toBe(false);
});

it('allows a previously unused bank question to become available without changing existing evidence',()=>{
 const before=structuredClone(source),target=structuredClone(source);
 const previouslyUnused=before.assessment.probes.pop()!;
 target.assessment.facetChecksum='newly-available-question';
 expect(inspectLearningReleaseCompatibility(before,target)).toMatchObject({compatible:true,addedItems:[],addedProbes:[previouslyUnused.id]});
 target.assessment.probes.push({...previouslyUnused,id:'not-backed-by-bank'});
 expect(inspectLearningReleaseCompatibility(before,target).compatible).toBe(false);
});
