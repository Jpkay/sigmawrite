import type {Mode,SkillResult} from './engine';
export const SKILL_EVIDENCE_COPY={title:'Tes réponses prises en compte',help:'Ces réponses servent au bilan actuel. Elles ne suffisent pas toujours à confirmer un acquis.'};
/** Accuracy for free writing counts language opportunities, not whole answers.
 * Never turn that rate into a fictitious number of correct texts. */
export function skillEvidenceDisplay(result:SkillResult,labels:Record<Mode,string>):string[]{
 return result.modes.flatMap(mode=>{
  if(mode.mode==='independent_production'||!Number.isInteger(mode.distinctItems)||mode.distinctItems<1||!Number.isFinite(mode.accuracy)||mode.accuracy<0||mode.accuracy>1)return [];
  const value=mode.accuracy*mode.distinctItems,correct=Math.round(value);
  if(Math.abs(value-correct)>1e-6)return [];
  return [`${labels[mode.mode]} : ${correct} réponse${correct>1?'s':''} réussie${correct>1?'s':''} sur ${mode.distinctItems}.`];
 });
}
