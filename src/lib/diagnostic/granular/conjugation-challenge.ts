import type { AssessmentFacet } from "./facets";

/** Draft assessment routing order, NOT graph edges or a student proficiency
 * scale. Requires pedagogical review/calibration with the refined release.
 * Equal ranks deliberately do not assert a strict ordering between those tenses.
 */
export const CONJUGATION_CHALLENGE_ORDER = {
  version: "french-conjugation-probing-v2",
  status: "draft_requires_review",
  ranks: {
    produire_present_indicatif: 1,
    produire_futur_proche: 2,
    produire_passe_recent: 2,
    produire_imperatif: 2,
    produire_passe_compose: 3,
    produire_imparfait: 3,
    produire_futur_simple: 3,
    produire_plus_que_parfait: 4,
    produire_conditionnel_present: 4,
    produire_passe_simple: 4,
    produire_subjonctif_present_frequent: 5,
    reconnaitre_present_indicatif: 1,
    interpreter_usages_present: 1,
    reconnaitre_futur_proche: 2,
    interpreter_futur_proche: 2,
    reconnaitre_passe_recent: 2,
    interpreter_passe_recent: 2,
    reconnaitre_imperatif: 2,
    interpreter_valeur_imperatif: 2,
    reconnaitre_passe_compose: 3,
    interpreter_passe_compose: 3,
    reconnaitre_imparfait: 3,
    interpreter_imparfait: 3,
    reconnaitre_futur_simple: 3,
    interpreter_futur_simple: 3,
    contraster_pc_imparfait: 3,
    produire_contraste_pc_imparfait: 3,
    reconnaitre_plus_que_parfait: 4,
    interpreter_anteriorite_passee: 4,
    reconnaitre_conditionnel_present: 4,
    interpreter_conditionnel_present: 4,
    reconnaitre_passe_simple: 4,
    interpreter_passe_simple: 4,
    reconnaitre_subjonctif_present: 5,
    interpreter_declencheur_subjonctif: 5,
  },
} as const;

export function conjugationChallengeOrder(facet: AssessmentFacet | undefined): number | undefined {
  if (!facet || (facet.dimension !== "verb" && facet.dimension !== "pattern")) return undefined;
  return conjugationNodeChallengeOrder(facet.nodeKey);
}

export function conjugationNodeChallengeOrder(nodeKey: string): number | undefined {
  return CONJUGATION_CHALLENGE_ORDER.ranks[nodeKey as keyof typeof CONJUGATION_CHALLENGE_ORDER.ranks];
}
