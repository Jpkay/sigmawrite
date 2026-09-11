import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {adaptV3ForAssessment} from './v3-adapter';
import {bindAssessmentRelease} from './release-binding';
import {createSession} from './session';
import {prepareLearningSuccessor} from './learning-successor';
import {publicQuestion,type AssessmentBundle,type StoredSession} from './service';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const bank=read('generated/diagnostic-bank-v3-draft.json');
const source:AssessmentBundle={bank,assessment:adaptV3ForAssessment({artifact:read('generated/french-taxonomy-v3.json'),bank}),taxonomyId:'taxonomy',bankId:'old-bank'};
function fixture(){
 const target=structuredClone(source);target.bankId='new-bank';
 const state=createSession(bindAssessmentRelease(source.assessment,source));
 state.phase='learning';state.completionReason='time_budget';state.activeSeconds=2100;state.revision=42;
 const probe=source.assessment.probes.find(p=>bank.items.find((i:{itemKey:string})=>i.itemKey===p.id).item.responseType==='mcq')!;
 const answer=publicQuestion('old-session',probe.id,source)!.choices[0].id;
 state.observations=[{itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:false,guessProbability:.25,activeSeconds:30,occasionId:'original-day'}];
 state.diagnosticResponses=[{itemId:probe.id,answer}];state.exposedMaterialKeys=['word:original'];
 const session:StoredSession={id:'old-session',studentId:'student',releaseId:'old-release',state};
 return {session,target};
}
it('preserves evidence, elapsed time, exposure and answer origin without changing the predecessor',()=>{
 const {session,target}=fixture(),before=structuredClone(session);
 const next=prepareLearningSuccessor(session,source,target);
 expect(session).toEqual(before);expect(next.observations).toEqual(before.state.observations);
 expect(next.refinements).toEqual(before.state.refinements);expect(next.exposedMaterialKeys).toEqual(before.state.exposedMaterialKeys);
 expect(next).toMatchObject({phase:'learning',activeSeconds:2100,revision:0,learningPredecessor:{sessionId:'old-session',releaseId:'old-release',revision:42}});
 expect(next.diagnosticResponses![0]).toMatchObject({...before.state.diagnosticResponses![0],sourceSessionId:'old-session'});
 expect(next.release.bankId).toBe('new-bank');
 next.observations[0].correct=true;expect(session.state.observations[0].correct).toBe(false);
});
it('keeps the original answer identity across successive upgrades',()=>{
 const {session,target}=fixture();session.state.diagnosticResponses![0].sourceSessionId='original-session';
 expect(prepareLearningSuccessor(session,source,target).diagnosticResponses![0].sourceSessionId).toBe('original-session');
});
it('refuses unfinished, busy, unchanged or incompatible sessions',()=>{
 for(const mutate of [
  (s:StoredSession)=>{s.state.phase='assessing';},
  (s:StoredSession)=>{s.state.learningCheck={id:'check',activityId:'a',itemId:'q',occasionId:'day'};},
  (s:StoredSession)=>{s.state.completionReason='coverage_gap';},
  (s:StoredSession)=>{s.state.release.checksum='changed';},
 ]){const {session,target}=fixture();mutate(session);expect(()=>prepareLearningSuccessor(session,source,target)).toThrow();}
 const {session,target}=fixture();expect(()=>prepareLearningSuccessor(session,source,source)).toThrow('not changed');
 target.assessment.skills[0].level++;expect(()=>prepareLearningSuccessor(session,source,target)).toThrow('incompatible');
});
