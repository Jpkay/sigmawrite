import type {V3Assessment} from "./v3-adapter";
import {allocateQuestionPools} from "./question-pools";
import {materialIdentity} from "./material-identity";
const PAIRS:Record<string,readonly string[]>={
 distinguer_homophones_a_a:["a","à"],distinguer_homophones_et_est:["et","est"],
 distinguer_homophones_son_sont:["son","sont"],distinguer_homophones_on_ont:["on","ont"],
 distinguer_homophones_ce_se:["ce","se"],distinguer_homophones_ces_ses:["ces","ses"],
 distinguer_homophones_ou_ou:["ou","où"],
};
/** Feasibility experiment, never a runtime override or content approval. Even
 * generously treating both surface forms as distinct target words cannot supply
 * three novel target words from a fixed pair. */
export function auditHomophoneNovelty(assessment:V3Assessment){
 return assessment.skills.filter(skill=>PAIRS[skill.nodeKey]).map(skill=>{
  const pair=PAIRS[skill.nodeKey],mode=skill.modes[0];
  const fixture:V3Assessment={taxonomyChecksum:"test-only",bankChecksum:"test-only",skills:[structuredClone(skill)],probes:Array.from({length:16},(_,index)=>{
   const word=materialIdentity("word",pair[index%2]),sentence=materialIdentity("sentence",`Synthetic homophone context ${skill.id} ${index}.`);
   return {id:`homophone-test-${index}`,skillId:skill.id,mode,contextId:`context-${index}`,difficulty:.5,expectedSeconds:30,guessProbability:mode==="recognition"?.5:.05,
    materialKeys:[word,sentence],assessedMaterialKeys:[word,sentence],contrastingErrorKeys:[`wrong-substitution-${index%2}`]};
  })};
  const current=allocateQuestionPools(fixture);
  const proposed=structuredClone(fixture),rule=proposed.skills[0].evidenceRequirements![mode]!;
  rule.novelWordsRequired=false;rule.novelSentencesRequired=true;
  const alternative=allocateQuestionPools(proposed);
  return {nodeKey:skill.nodeKey,evidenceKey:skill.evidenceKey,mode,pair,
   currentRequirements:skill.evidenceRequirements![mode]!,proposedRequirements:rule,
   distinctTargetWords:pair.length,minimumItems:rule.minimumItems,uniqueTestContexts:16,
   currentPoolsReady:current.ready,proposedPoolsReady:alternative.ready,
   proposalStatus:"unapproved_feasibility_experiment" as const};
 });
}
