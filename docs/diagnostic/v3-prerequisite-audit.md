# French prerequisite refinement audit

Uses the approved French v3 graph. No Allotey dependencies.

542 targets; 1335 compiled prerequisite edges. 73 targets inherit multiple finer prerequisites that need a scope review. This is a review queue, not a list of proven errors.

Near-future production now depends on present-tense aller, and recent-past production on present-tense venir. The approved parent edges remain intact.

| Approved source | Target | Affected targets | Maximum finer prerequisites per source evidence |
| --- | --- | ---: | ---: |
| choisir_auxiliaire_compose | produire_passe_compose | 18 | 4 |
| produire_passe_compose | placer_pronom_complement | 4 | 18 |
| produire_passe_compose | accorder_participe_etre | 3 | 18 |
| produire_passe_compose | accorder_participe_avoir_cod | 3 | 18 |
| former_participe_passe | produire_passe_compose | 18 | 3 |
| former_participe_passe | produire_plus_que_parfait | 18 | 3 |
| produire_present_indicatif | interpreter_usages_present | 1 | 18 |
| produire_futur_proche | interpreter_futur_proche | 1 | 18 |
| produire_passe_recent | interpreter_passe_recent | 1 | 18 |
| produire_passe_compose | interpreter_passe_compose | 1 | 18 |
| produire_imparfait | interpreter_imparfait | 1 | 18 |
| produire_passe_compose | produire_contraste_pc_imparfait | 1 | 18 |
| produire_imparfait | produire_contraste_pc_imparfait | 1 | 18 |
| produire_passe_simple | interpreter_passe_simple | 1 | 18 |
| produire_futur_simple | interpreter_futur_simple | 1 | 18 |
| produire_plus_que_parfait | interpreter_anteriorite_passee | 1 | 18 |
| produire_conditionnel_present | interpreter_conditionnel_present | 1 | 18 |
| produire_subjonctif_present_frequent | interpreter_declencheur_subjonctif | 1 | 18 |
| produire_plus_que_parfait | produire_sequence_temporelle | 1 | 18 |
| produire_imperatif | interpreter_valeur_imperatif | 1 | 17 |
| produire_pronoms_y_en | ordonner_doubles_pronoms | 3 | 5 |
| accorder_sujet_verbe_ecrit | maintenir_orthographe_grammaticale_phrase | 3 | 4 |
| placer_pronom_complement | accorder_participe_cod_antepose | 2 | 4 |
| former_participe_passe | construction_accord_participe | 2 | 3 |
| localiser_information_explicite | relation_addition | 2 | 3 |
| accorder_participe_avoir_cod | accorder_participe_cod_antepose | 2 | 3 |
| produire_pronom_cod | distinguer_pronom_cod_coi | 1 | 4 |
| placer_pronom_complement | ordonner_doubles_pronoms | 1 | 4 |
| ordonner_doubles_pronoms | employer_pronoms_complements_en_contexte | 1 | 3 |
| produire_pronom_coi_personne | distinguer_pronom_cod_coi | 1 | 2 |

For each row, determine which finer prerequisites are necessary for the target, retain the approved parent relationship, and validate the resulting pathway with uneven student profiles. Full target IDs and selected prerequisites are in the JSON companion. Broad prerequisite expansion must not be mistaken for confirmed pedagogical necessity.
