import {expect,it} from 'vitest';
import {auditNoveltyCoverage} from './novelty-coverage-audit';
import type {Skill,Observation} from './engine';
const skill={id:'target',modes:['production'],evidenceRequirements:{production:{novelWordsRequired:true}}} as unknown as Skill;
const key='word:sha256:'+'a'.repeat(64);
const observation={skillId:'target',itemId:'item',contextId:'context',guessProbability:.25,activeSeconds:30,mode:'production',unaided:true,correct:true,materialReceipt:{presentationId:'p',sourceChecksum:'source',historyComplete:false,firstRecordedKeys:[key],previouslySeenKeys:[],assessedMaterialKeys:[key]}} as Observation;
it('reports incomplete production history even when a first-exposure receipt exists',()=>{
 expect(auditNoveltyCoverage([skill],[observation])).toMatchObject({requiredObservations:1,verifiedObservations:0,incompleteHistoryObservations:1});
});
it('distinguishes independently verified material from a complete but previously seen history',()=>{
 const fresh={...observation,materialReceipt:{...observation.materialReceipt!,historyComplete:true}};
 const seen={...fresh,itemId:'seen',materialReceipt:{...fresh.materialReceipt,firstRecordedKeys:[],previouslySeenKeys:[key]}};
 const audit=auditNoveltyCoverage([skill],[fresh,seen]);
 expect(audit).toMatchObject({requiredObservations:2,verifiedObservations:1,incompleteHistoryObservations:0});
 expect(audit.rows[1].reason).toBe('material_previously_seen_or_missing_identity');
});
it('does not misclassify skipped, assisted or unrelated observations as missing novelty integration',()=>{
 expect(auditNoveltyCoverage([skill],[{...observation,skipped:true},{...observation,unaided:false},{...observation,skillId:'other'}]).requiredObservations).toBe(0);
});
