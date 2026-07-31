-- Encompassing edges for the past-narration slice (gap-analysis Phase 2).
--
-- source ENCOMPASSES target: practicing the source implicitly practices the
-- target sub-skill. strength = fraction of source exercises that genuinely
-- exercise the target (FIRe credit weight, see src/lib/graph/fire.ts).
-- Expert-authored, sparse by design: only non-trivial, non-transitive,
-- graph-local weights (Math Academy authoring rule).

insert into competency_edges (source_node_id, target_node_id, edge_type, strength, generation_type)
select s.id, t.id, 'encompasses', e.strength::numeric, 'human'
from (values
    -- Compound past tenses exercise their components nearly every time.
    ('passe_compose_avoir', 'present_indicatif',        0.80),
    ('passe_compose_avoir', 'participe_passe_formation', 0.90),
    ('passe_compose_avoir', 'auxiliaire_choix',          0.60),
    ('passe_compose_etre',  'present_indicatif',         0.80),
    ('passe_compose_etre',  'participe_passe_formation', 0.90),
    ('passe_compose_etre',  'auxiliaire_choix',          0.60),
    ('passe_compose_etre',  'accord_pp_etre',            0.70),
    -- Agreement chains.
    ('accord_pp_etre',      'accord_genre_nombre',       0.70),
    ('accord_pp_avoir_cod', 'cod_identification',        0.70),
    ('accord_pp_avoir_cod', 'participe_passe_formation', 0.50),
    ('accord_pp_avoir_cod', 'accord_genre_nombre',       0.50),
    ('accord_sujet_verbe',  'fonction_sujet',            0.60),
    -- Imparfait exercises stem/ending analysis and subject agreement.
    ('imparfait_formation', 'radical_terminaison',       0.70),
    ('imparfait_formation', 'accord_sujet_verbe',        0.50),
    -- The tense contrast exercises both tenses; narration exercises the
    -- contrast and tense concordance.
    ('pc_vs_imparfait',     'passe_compose_avoir',       0.50),
    ('pc_vs_imparfait',     'imparfait_formation',       0.50),
    ('narration_passe',     'pc_vs_imparfait',           0.70),
    ('narration_passe',     'concordance_temps_recit',   0.60),
    ('concordance_temps_recit', 'pc_vs_imparfait',       0.50),
    -- Pronominalisation exercises COD identification.
    ('pronom_personnel_cod', 'cod_identification',       0.60)
) as e(source_key, target_key, strength)
join competency_nodes s on s.key = e.source_key
join competency_nodes t on t.key = e.target_key
on conflict (source_node_id, target_node_id, edge_type) do update
  set strength = excluded.strength;
