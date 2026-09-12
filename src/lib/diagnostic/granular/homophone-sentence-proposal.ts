import {checksum} from '@/lib/taxonomy/validate';
import type {V3Assessment} from './v3-adapter';
export const HOMOPHONE_SENTENCE_TARGETS=['distinguer_homophones_son_sont::reading-receptive','distinguer_homophones_on_ont::reading-receptive'] as const;
/** Authoring experiment only. Never called when loading a student's release. */
export function proposeHomophoneSentenceEvidence(source:V3Assessment){
 const assessment=structuredClone(source),changes=[];
 for(const id of HOMOPHONE_SENTENCE_TARGETS){
  const skill=assessment.skills.find(s=>s.id===id),before=skill?.evidenceRequirements?.recognition;
  if(!skill||!before||skill.modes.length!==1||skill.modes[0]!=='recognition'||before.novelWordsRequired!==true||before.novelSentencesRequired===true)throw Error(`Unexpected source contract: ${id}`);
  const after={...before,novelWordsRequired:false,novelSentencesRequired:true};
  skill.evidenceRequirements={...skill.evidenceRequirements,recognition:after};
  const selected=assessment.probes.filter(p=>p.skillId===id&&p.id.startsWith('v3-homophone-recognition:'));
  if(selected.length!==16)throw Error(`Incomplete reviewed-context draft: ${id}`);
  for(const probe of selected){
   const sentences=probe.assessedMaterialKeys?.filter(k=>k.startsWith('sentence:'))??[];
   if(!sentences.length||!probe.materialKeys?.some(k=>k.startsWith('word:'))||sentences.some(k=>!probe.materialKeys!.includes(k)))throw Error(`Missing material provenance: ${probe.id}`);
   // Keep every delivered word in materialKeys. Only the application sentence
   // is proposed as the target of the new contextual evidence contract.
   probe.assessedMaterialKeys=sentences;
  }
  const selectedIds=new Set(selected.map(p=>p.id));
  const excluded=assessment.probes.filter(p=>p.skillId===id&&!selectedIds.has(p.id)).map(p=>p.id);
  assessment.probes=assessment.probes.filter(p=>p.skillId!==id||selectedIds.has(p.id));
  changes.push({skillId:id,before:structuredClone(before),after:structuredClone(after),questionIds:[...selectedIds],excludedQuestionIds:excluded});
 }
 return {status:'proposal_requires_owner_decision' as const,sourceChecksum:checksum(source),changes,assessment};
}
