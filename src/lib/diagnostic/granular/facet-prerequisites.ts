import type {EvidenceSkill} from "./v3-adapter";
import type {AssessmentFacet} from "./facets";
/** Draft refinements of existing approved parent edges, never additional graph
 * edges or approval decisions. These constructions conjugate the support verb,
 * not the lexical infinitive named by the target facet. */
export const FACET_PREREQUISITE_RULES=[
 {targetNodeKey:"produire_futur_proche",sourceNodeKey:"produire_present_indicatif",dimension:"verb",value:"aller",rationaleFr:"Le futur proche se forme avec aller au présent suivi de l’infinitif : je vais finir."},
 {targetNodeKey:"produire_passe_recent",sourceNodeKey:"produire_present_indicatif",dimension:"verb",value:"venir",rationaleFr:"Le passé récent se forme avec venir au présent, de et l’infinitif : je viens de finir."},
] as const;
export function refinedPrerequisites(skill:EvidenceSkill,alternatives:readonly EvidenceSkill[],facets:ReadonlyMap<string,AssessmentFacet>):EvidenceSkill[]{
 const current=skill.facetKey?facets.get(skill.facetKey):undefined;
 const rule=current?FACET_PREREQUISITE_RULES.find(rule=>rule.targetNodeKey===skill.nodeKey&&alternatives.some(prior=>prior.nodeKey===rule.sourceNodeKey)):undefined;
 if(rule){
  const required=alternatives.filter(prior=>{const facet=prior.facetKey?facets.get(prior.facetKey):undefined;return facet?.dimension===rule.dimension&&facet.value===rule.value;});
  if(!required.length)throw Error(`Missing construction prerequisite: ${rule.sourceNodeKey} ${rule.value}`);
  return required;
 }
 const matching=current?alternatives.filter(prior=>{
  const facet=prior.facetKey?facets.get(prior.facetKey):undefined;
  return facet?.dimension===current.dimension&&facet.value===current.value;
 }):[];
 return matching.length?matching:[...alternatives];
}
