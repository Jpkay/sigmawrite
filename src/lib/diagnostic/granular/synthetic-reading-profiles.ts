/** Synthetic benchmark contracts, never student labels or inferred mastery.
 * Explicit node lists prevent substring matches from confusing locating text
 * with evaluating or inferring from it. */
export const INFERENTIAL_READING_GAPS=new Set([
 'inferer_cause_locale',
 'inferer_consequence_locale',
 'inferer_chronologie_implicite',
 'inferer_motivation_personnage',
 'inferer_hypothese_informationnelle',
 'evaluer_pertinence_preuve',
 'relier_preuve_interpretation',
]);
export const REFERENCE_READING_GAPS=new Set([
 'resoudre_pronom_sujet',
 'resoudre_pronom_objet',
 'resoudre_demonstratif',
 'suivre_chaine_lexicale',
]);
export function syntheticReadingKnowledge(profile:'literal_vs_inference'|'reading_reference_gap',nodeKey:string):boolean{
 return !(profile==='literal_vs_inference'?INFERENTIAL_READING_GAPS:REFERENCE_READING_GAPS).has(nodeKey);
}
