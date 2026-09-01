-- Hosted environments import the versioned taxonomy artifact before this
-- content migration. A clean database reset has no opportunity to run that
-- external importer between migrations, so retain the v2 source node as a
-- deterministic compatibility anchor. The importer reuses existing node ids by
-- stable key and migration 0091 remaps every item to the atomic v3 nodes.
insert into public.competency_nodes(
  id,key,strand,label_fr,description_fr,atomicity_level,
  native_grade_min,native_grade_max,cefr_min,cefr_max,
  requires_reading,requires_writing,modality_scope,expectation_scope,
  generation_type,review_status
)
values(
  md5('sigmawrite-migration-node:construction_pronom_objet')::uuid,
  'construction_pronom_objet','grammaire_syntaxe',
  'Interpréter un pronom complément',
  'Relier un pronom objet, datif, en ou y à l''élément repris.',
  4,6,6,'A2','A2',true,true,
  array['reading','writing']::text[],
  array['receptive','controlled_production']::text[],
  'human','human_approved'
)
on conflict(key) do nothing;

with target as (
  select id from public.competency_nodes where key = 'construction_pronom_objet'
), seed(module, position, prompt_fr, correct_answer, acceptable_answers, difficulty) as (
  values
    ('direct_objects',1,'Complète avec le pronom seul : « Je regarde le film. → Je ___ regarde. »','le','{}'::text[],20),
    ('direct_objects',2,'Complète avec le pronom seul : « Je ferme la porte. → Je ___ ferme. »','la','{}'::text[],30),
    ('direct_objects',3,'Complète avec le pronom seul : « J’invite Amine. → Je ___ invite. »','l''',array['l’'],40),
    ('direct_objects',4,'Complète avec le pronom seul : « Je vois les voisines. → Je ___ vois. »','les','{}'::text[],50),
    ('direct_objects',5,'Complète avec le pronom seul : « Elle lit la lettre. → Elle ___ lit. »','la','{}'::text[],60),
    ('direct_objects',6,'Complète avec le pronom seul : « Nous attendons les élèves. → Nous ___ attendons. »','les','{}'::text[],70),

    ('indirect_people',1,'Remplace « à sa mère » par un pronom : « Il parle à sa mère. → Il ___ parle. »','lui','{}'::text[],20),
    ('indirect_people',2,'Remplace « à son père » par un pronom : « Elle téléphone à son père. → Elle ___ téléphone. »','lui','{}'::text[],30),
    ('indirect_people',3,'Remplace « à ses parents » par un pronom : « Il écrit à ses parents. → Il ___ écrit. »','leur','{}'::text[],40),
    ('indirect_people',4,'Remplace « à la professeure » par un pronom : « Nous répondons à la professeure. → Nous ___ répondons. »','lui','{}'::text[],50),
    ('indirect_people',5,'Remplace « aux enfants » par un pronom : « Elle explique la règle aux enfants. → Elle ___ explique la règle. »','leur','{}'::text[],60),
    ('indirect_people',6,'Remplace « à Léa et Omar » par un pronom : « Il dit le secret à Léa et Omar. → Il ___ dit le secret. »','leur','{}'::text[],70),

    ('direct_or_indirect',1,'Choisis le pronom seul : « Je vois ma sœur. → Je ___ vois. »','la','{}'::text[],20),
    ('direct_or_indirect',2,'Choisis le pronom seul : « Je réponds à ma sœur. → Je ___ réponds. »','lui','{}'::text[],30),
    ('direct_or_indirect',3,'Choisis le pronom seul : « Nous invitons nos cousins. → Nous ___ invitons. »','les','{}'::text[],40),
    ('direct_or_indirect',4,'Choisis le pronom seul : « Nous téléphonons à nos cousins. → Nous ___ téléphonons. »','leur','{}'::text[],50),
    ('direct_or_indirect',5,'Choisis le pronom seul : « Elle écoute le professeur. → Elle ___ écoute. »','l''',array['l’'],60),
    ('direct_or_indirect',6,'Choisis le pronom seul : « Elle répond au professeur. → Elle ___ répond. »','lui','{}'::text[],70),

    ('y_and_en',1,'Remplace le groupe par un pronom : « Elle va à la bibliothèque. → Elle ___ va. »','y','{}'::text[],20),
    ('y_and_en',2,'Remplace le groupe par un pronom : « Il pense à ce problème. → Il ___ pense. »','y','{}'::text[],30),
    ('y_and_en',3,'Remplace le groupe par un pronom : « Nous revenons du marché. → Nous ___ revenons. »','en','{}'::text[],40),
    ('y_and_en',4,'Complète avec le pronom seul : « Elle veut trois pommes. → Elle ___ veut trois. »','en','{}'::text[],50),
    ('y_and_en',5,'Remplace le groupe par un pronom : « Tu parles de ton projet. → Tu ___ parles. »','en','{}'::text[],60),
    ('y_and_en',6,'Complète l’exception avec le pronom tonique seul : « Il pense à Léa. → Il pense à ___. »','elle','{}'::text[],70),

    ('position_and_agreement',1,'Complète avec le pronom seul : « Il a parlé à Mina. → Il ___ a parlé. »','lui','{}'::text[],20),
    ('position_and_agreement',2,'Complète avec le pronom seul : « Il a dit la vérité à Mina. → Il ___ a dit la vérité. »','lui','{}'::text[],30),
    ('position_and_agreement',3,'Complète le groupe manquant : « Nora ? Je ___ hier. » (voir, passé composé)','l''ai vue',array['l’ai vue'],40),
    ('position_and_agreement',4,'Complète le groupe manquant : « Karim ? Je ___ hier. » (voir, passé composé)','l''ai vu',array['l’ai vu'],50),
    ('position_and_agreement',5,'Complète le groupe manquant : « Les filles ? Je ___ hier. » (voir, passé composé)','les ai vues','{}'::text[],60),
    ('position_and_agreement',6,'Complète le groupe manquant : « Les filles ? Je ___ ce matin. » (parler à, passé composé)','leur ai parlé','{}'::text[],70),

    ('double_pronouns',1,'Écris seulement les deux pronoms : « Il donne le livre à Nora. → Il ___ donne. »','le lui','{}'::text[],20),
    ('double_pronouns',2,'Écris seulement les deux pronoms : « Il montre les clés aux voisins. → Il ___ montre. »','les leur','{}'::text[],30),
    ('double_pronouns',3,'Écris seulement les deux pronoms : « Tu montres la photo à tes parents. → Tu ___ montres. »','la leur','{}'::text[],40),
    ('double_pronouns',4,'Complète seulement les pronoms et les traits d’union : « Donne-___-___ ! » (le livre, à Nora)','le-lui','{}'::text[],50),
    ('double_pronouns',5,'Écris seulement les deux pronoms : « Ne donne pas le livre à Nora. → Ne ___ donne pas. »','le lui','{}'::text[],60),
    ('double_pronouns',6,'Complète avec le pronom seul : « Parle à Nora ! → Parle-___ ! »','lui','{}'::text[],70)
)
insert into public.competency_items(
  id, primary_node_id, strand, modality, learner_mode, response_type,
  prompt_fr, instructions_fr, correct_answer, acceptable_answers,
  validator_type, validator_config, difficulty, cefr_level,
  generation_type, prompt_version, qc_gates, review_status
)
select
  md5('sigmawrite-pronoun-practice-v1:' || seed.module || ':' || seed.position)::uuid,
  target.id,
  'grammaire_syntaxe','writing','shared','cloze',
  seed.prompt_fr,
  'Écris uniquement le pronom ou le groupe de pronoms demandé.',
  seed.correct_answer, seed.acceptable_answers,
  'exact', jsonb_build_object('practiceModule', seed.module, 'answerScope', 'pronoun_only'),
  seed.difficulty, 'A2',
  'human','pronoun-practice-v1',
  '{"gate1_schema":true,"gate1_invariants":{"ok":true},"gate2_answer_key":{"ok":true},"verdict":"auto_approved"}'::jsonb,
  'auto_approved'
from seed cross join target
on conflict (id) do update set
  primary_node_id = excluded.primary_node_id,
  prompt_fr = excluded.prompt_fr,
  instructions_fr = excluded.instructions_fr,
  correct_answer = excluded.correct_answer,
  acceptable_answers = excluded.acceptable_answers,
  validator_config = excluded.validator_config,
  difficulty = excluded.difficulty,
  qc_gates = excluded.qc_gates,
  review_status = excluded.review_status,
  updated_at = now();
