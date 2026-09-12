import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {loadDiagnosticAnswerReview} from './answer-review';
import {createSession} from './session';
import {publicQuestion,type AssessmentBundle,type StoredSession} from './service';
import {adaptV3ForAssessment} from './v3-adapter';
import {bindAssessmentRelease} from './release-binding';
import type {MaterialDeliveryStore} from './material-delivery';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const bank=read('generated/diagnostic-bank-v3-draft.json');
const assessment=adaptV3ForAssessment({artifact:read('generated/french-taxonomy-v3.json'),bank});
const bundle:AssessmentBundle={bank,assessment,taxonomyId:'taxonomy',bankId:'bank'};
const id='11111111-1111-4111-8111-111111111111';
function fixture(){
 const state=createSession(bindAssessmentRelease(assessment,bundle));state.phase='learning';
 const probe=assessment.probes.find(p=>bank.items.find((e:{itemKey:string})=>e.itemKey===p.id)?.item.responseType==='mcq')!;
 state.observations=[{itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:false,guessProbability:.25,activeSeconds:10,occasionId:'initial'}];
 const session:StoredSession={id,studentId:'owner',releaseId:'release',state};
 const receipt=vi.fn(async()=>{});
 const store:MaterialDeliveryStore={load:async(student,sessionId)=>student==='owner'&&sessionId===id?session:null,release:async()=>bundle,save:async()=>false,recordMaterialPresentation:receipt};
 return {session,store,receipt,probe};
}
it('restricts review to the owner and a completed sitting without an active check',async()=>{
 const f=fixture();await expect(loadDiagnosticAnswerReview(f.store,'other',id)).rejects.toThrow('introuvable');
 f.session.state.phase='assessing';await expect(loadDiagnosticAnswerReview(f.store,'owner',id)).rejects.toThrow('Termine le diagnostic');
 f.session.state.phase='learning';f.session.state.learningCheck={id:'check',activityId:'a',itemId:'q',occasionId:'later'};
 await expect(loadDiagnosticAnswerReview(f.store,'owner',id)).rejects.toThrow('activité');expect(f.receipt).not.toHaveBeenCalled();
});
it('shows the actual selected choice and preserves the server grade',async()=>{
 const f=fixture(),question=publicQuestion(id,f.probe.id,bundle)!;
 f.session.state.diagnosticResponses=[{itemId:f.probe.id,answer:question.choices[0].id}];
 const result=await loadDiagnosticAnswerReview(f.store,'owner',id);
 expect(result.rows[0]).toMatchObject({status:'wrong',submittedAnswer:question.choices[0].text});
 expect(result.rows[0].expectedAnswer).toBeTruthy();expect(f.receipt).toHaveBeenCalled();
 expect(JSON.stringify(result)).not.toMatch(/validatorConfig|acceptableAnswers/);
 const before=JSON.stringify(f.receipt.mock.calls);
 await loadDiagnosticAnswerReview(f.store,'owner',id);
 expect(JSON.stringify(f.receipt.mock.calls.slice(1))).toBe(before);
});
it('does not fabricate historical responses and withholds review on receipt failure',async()=>{
 const f=fixture();expect((await loadDiagnosticAnswerReview(f.store,'owner',id)).rows[0].submittedAnswer).toBeNull();
 f.receipt.mockRejectedValueOnce(new Error('database unavailable'));
 await expect(loadDiagnosticAnswerReview(f.store,'owner',id)).rejects.toThrow('database unavailable');
});
it('resolves a retained answer using its original session after a learning upgrade',async()=>{
 const f=fixture(),oldId='22222222-2222-4222-8222-222222222222';
 const question=publicQuestion(oldId,f.probe.id,bundle)!;
 f.session.state.diagnosticResponses=[{itemId:f.probe.id,answer:question.choices[0].id,sourceSessionId:oldId}];
 expect((await loadDiagnosticAnswerReview(f.store,'owner',id)).rows[0].submittedAnswer).toBe(question.choices[0].text);
});
it('journals corrections and actual answers before returning the review and fails closed on journal failure',async()=>{
 const f=fixture(),journal=vi.fn(async()=>{});f.store.recordDeliveredText=journal;
 const result=await loadDiagnosticAnswerReview(f.store,'owner',id);
 expect(journal).toHaveBeenCalledWith(expect.objectContaining({boundary:'granular:answer-review',studentId:'owner',textFragments:expect.arrayContaining([result.rows[0].promptFr,result.rows[0].expectedAnswer])}));
 journal.mockRejectedValueOnce(Error('journal unavailable'));
 await expect(loadDiagnosticAnswerReview(f.store,'owner',id)).rejects.toThrow('journal unavailable');
});
