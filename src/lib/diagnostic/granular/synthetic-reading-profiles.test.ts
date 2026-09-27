import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {INFERENTIAL_READING_GAPS,REFERENCE_READING_GAPS,syntheticReadingKnowledge} from './synthetic-reading-profiles';
it('uses existing approved reading nodes for each explicitly defined synthetic gap',()=>{
 const {taxonomy}=JSON.parse(readFileSync('generated/french-taxonomy-v3.json','utf8'));
 for(const key of [...INFERENTIAL_READING_GAPS,...REFERENCE_READING_GAPS])expect(taxonomy.nodes.find((n:{key:string})=>n.key===key)?.strand).toBe('comprehension_ecrite');
});
it('does not use locating evidence or identifying a stated argument as proof of inference weakness',()=>{
 for(const key of ['localiser_information_explicite','associer_information_question','localiser_span_preuve','identifier_these_argument','identifier_raison_argument'])expect(syntheticReadingKnowledge('literal_vs_inference',key)).toBe(true);
 for(const key of ['inferer_cause_locale','inferer_consequence_locale','inferer_motivation_personnage','evaluer_pertinence_preuve','relier_preuve_interpretation'])expect(syntheticReadingKnowledge('literal_vs_inference',key)).toBe(false);
});
it('distinguishes reference resolution from otherwise successful reading',()=>{
 expect(syntheticReadingKnowledge('reading_reference_gap','resoudre_pronom_objet')).toBe(false);
 expect(syntheticReadingKnowledge('reading_reference_gap','suivre_chaine_lexicale')).toBe(false);
 expect(syntheticReadingKnowledge('reading_reference_gap','localiser_span_preuve')).toBe(true);
 expect(syntheticReadingKnowledge('reading_reference_gap','inferer_cause_locale')).toBe(true);
});
