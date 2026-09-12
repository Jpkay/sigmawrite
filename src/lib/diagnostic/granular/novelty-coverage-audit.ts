import type {Observation,Skill} from './engine';
import {hasVerifiedNovelMaterial} from './material-receipt';
/** Audit delivery coverage separately from mastery correctness. Conservative
 * exclusion can be correct while the delivery integration is incomplete. */
export function auditNoveltyCoverage(skills:readonly Skill[],observations:readonly Observation[]){
 const required=observations.filter(o=>{
  const rule=skills.find(s=>s.id===o.skillId)?.evidenceRequirements?.[o.mode];
  return !o.skipped&&o.unaided!==false&&(rule?.novelWordsRequired||rule?.novelSentencesRequired);
 });
 const rows=required.map(o=>{
  const rule=skills.find(s=>s.id===o.skillId)!.evidenceRequirements![o.mode]!;
  const verified=(!rule.novelWordsRequired||hasVerifiedNovelMaterial(o.materialReceipt,'word'))&&(!rule.novelSentencesRequired||hasVerifiedNovelMaterial(o.materialReceipt,'sentence'));
  return {skillId:o.skillId,itemId:o.itemId,mode:o.mode,verified,historyComplete:o.materialReceipt?.historyComplete===true,
   reason:verified?'verified_novel_material':o.materialReceipt?.historyComplete!==true?'material_history_incomplete':'material_previously_seen_or_missing_identity'} as const;
 });
 return {requiredObservations:rows.length,verifiedObservations:rows.filter(r=>r.verified).length,incompleteHistoryObservations:rows.filter(r=>!r.historyComplete).length,rows};
}
