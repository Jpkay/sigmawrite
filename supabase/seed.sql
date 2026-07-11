-- Reading to Learn — seed reference data (PRD §7, §E, §K).
-- Idempotent: safe to re-run.

insert into knowledge_domains (key, label_fr) values
  ('history', 'Histoire'),
  ('geography', 'Géographie'),
  ('science', 'Sciences'),
  ('biology', 'Biologie'),
  ('physics', 'Physique'),
  ('economics', 'Économie'),
  ('society', 'Société'),
  ('technology', 'Technologie'),
  ('media_literacy', 'Éducation aux médias'),
  ('environment', 'Environnement'),
  ('culture', 'Culture'),
  ('health', 'Santé'),
  ('psychology', 'Psychologie'),
  ('law_ethics', 'Droit et éthique')
on conflict (key) do nothing;

insert into skills (key, label_fr, category, grade_band_min, grade_band_max) values
  ('literal_comprehension', 'Compréhension littérale', 'comprehension', 5, 12),
  ('main_idea', 'Idée principale', 'comprehension', 5, 12),
  ('inference', 'Inférence', 'comprehension', 6, 12),
  ('evidence_selection', 'Sélection de preuves', 'comprehension', 7, 12),
  ('cause_consequence', 'Cause et conséquence', 'reasoning', 6, 12),
  ('compare_contrast', 'Comparer et opposer', 'reasoning', 7, 12),
  ('academic_connectors', 'Connecteurs académiques', 'language', 6, 12),
  ('sentence_parsing', 'Analyse de phrases', 'language', 5, 11),
  ('pronoun_reference', 'Suivi des références/pronoms', 'language', 5, 11),
  ('vocabulary_in_context', 'Vocabulaire en contexte', 'vocabulary', 5, 12),
  ('summarization', 'Résumé', 'writing', 6, 12),
  ('argument_structure', 'Structure argumentative', 'reasoning', 8, 12),
  ('disciplinary_vocabulary', 'Vocabulaire disciplinaire', 'vocabulary', 7, 12),
  ('reading_stamina', 'Endurance de lecture', 'fluency', 5, 12)
on conflict (key) do nothing;

-- A few starter concepts mapped to domains.
insert into knowledge_concepts (concept_key, domain_id, label_fr, description_fr, grade_band_min, grade_band_max)
select c.concept_key, d.id, c.label_fr, c.description_fr, c.gmin, c.gmax
from (values
  ('migration_seed', 'geography', 'Migration', 'Le déplacement de personnes d''un lieu à un autre.', 6, 10),
  ('opportunite_economique_seed', 'economics', 'Opportunité économique', 'Les chances d''améliorer sa situation économique.', 7, 11),
  ('changement_climatique_seed', 'environment', 'Changement climatique', 'L''évolution durable du climat de la Terre.', 7, 11),
  ('biais_seed', 'media_literacy', 'Biais', 'Une inclination qui influence le jugement.', 8, 12),
  ('colonialisme_seed', 'history', 'Colonialisme', 'La domination d''un territoire par une puissance étrangère.', 8, 12)
) as c(concept_key, domain_key, label_fr, description_fr, gmin, gmax)
join knowledge_domains d on d.key = c.domain_key
on conflict (concept_key) do nothing;
