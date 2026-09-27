import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {proposeHomophoneSentenceEvidence,HOMOPHONE_SENTENCE_TARGETS as targets} from './homophone-sentence-proposal';
import {allocateTeachingQuestionPools} from './teaching-question-pools';
import {HOMOPHONE_TEACHING} from './homophone-teaching';
import {hasVerifiedNovelMaterial} from './material-receipt';
import type {V3Assessment} from './v3-adapter';
const read=()=>JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8')).assessment as V3Assessment;
it('keeps the source and other targets unchanged, preserves thresholds and separates adequate pools',()=>{
 const source=read(),snapshot=structuredClone(source),result=proposeHomophoneSentenceEvidence(source);
 expect(source).toEqual(snapshot);expect(result.status).toBe('proposal_requires_owner_decision');
 for(const original of source.skills){
  const next=result.assessment.skills.find(s=>s.id===original.id)!;
  if(!targets.some(id=>id===original.id)){expect(next).toEqual(original);continue;}
  expect(next.evidenceRequirements!.recognition).toEqual({...original.evidenceRequirements!.recognition,novelWordsRequired:false,novelSentencesRequired:true});
 }
 const allocation=allocateTeachingQuestionPools(result.assessment,HOMOPHONE_TEACHING);
 for(const id of targets){
  expect(allocation.coverage.find(c=>c.skillId===id)).toMatchObject({status:'allocated',initialItems:8,learningItems:8});
  for(const p of result.assessment.probes.filter(p=>p.skillId===id)){
   expect(p.materialKeys).toEqual(source.probes.find(q=>q.id===p.id)!.materialKeys);
   expect(p.assessedMaterialKeys!.every(k=>k.startsWith('sentence:'))).toBe(true);
  }
 }
});
it('still rejects seen sentences and incomplete history even when word familiarity is allowed',()=>{
 const result=proposeHomophoneSentenceEvidence(read());
 const p=result.assessment.probes.find(p=>p.id.startsWith('v3-homophone-recognition:'))!;
 const sentences=p.assessedMaterialKeys!,words=p.materialKeys!.filter(k=>k.startsWith('word:'));
 const receipt={presentationId:'synthetic',sourceChecksum:'synthetic',assessedMaterialKeys:sentences,firstRecordedKeys:sentences,previouslySeenKeys:words,historyComplete:true};
 expect(hasVerifiedNovelMaterial(receipt,'sentence')).toBe(true);
 expect(hasVerifiedNovelMaterial({...receipt,historyComplete:false},'sentence')).toBe(false);
 expect(hasVerifiedNovelMaterial({...receipt,firstRecordedKeys:[],previouslySeenKeys:[...words,...sentences]},'sentence')).toBe(false);
});
it('fails closed if the source rule or source material has changed',()=>{
 const source=read();source.skills.find(s=>s.id===targets[0])!.evidenceRequirements!.recognition!.novelWordsRequired=false;
 expect(()=>proposeHomophoneSentenceEvidence(source)).toThrow('Unexpected source contract');
 const missing=read();missing.probes.find(p=>p.id.startsWith('v3-homophone-recognition:'))!.assessedMaterialKeys=[];
 expect(()=>proposeHomophoneSentenceEvidence(missing)).toThrow('Missing material provenance');
});
