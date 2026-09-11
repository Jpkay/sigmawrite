/** Reading operations used only to schedule questions. Separate operation
 * exposure never supplies evidence or mastery for another graph target. */
const operations:Record<string,string>={
 localiser_information_explicite:'reading_retrieval',
 associer_information_question:'reading_retrieval',
 ordonner_evenements_explicites:'reading_retrieval',
 localiser_span_preuve:'reading_retrieval',
 resoudre_pronom_sujet:'reading_reference',
 resoudre_pronom_objet:'reading_reference',
 resoudre_demonstratif:'reading_reference',
 suivre_chaine_lexicale:'reading_reference',
 inferer_cause_locale:'reading_inference',
 inferer_consequence_locale:'reading_inference',
 inferer_chronologie_implicite:'reading_inference',
 inferer_motivation_personnage:'reading_inference',
 inferer_hypothese_informationnelle:'reading_inference',
 evaluer_pertinence_preuve:'reading_inference',
 relier_preuve_interpretation:'reading_inference',
};
export function readingSamplingFamily(branch:string):string{
 const node=branch.startsWith('reading_comprehension:')?branch.slice('reading_comprehension:'.length):'';
 return operations[node]??'reading_other';
}
export const READING_FAMILY_ORDER:Readonly<Record<string,number>>={reading_retrieval:0,reading_reference:1,reading_inference:2,reading_other:3};
