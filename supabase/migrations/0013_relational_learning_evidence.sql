-- Sprint 2 — relational learning evidence and immutable seed content.

-- Stable application keys let the UI use readable slugs while evidence keeps
-- immutable UUID foreign keys.
alter table texts add column if not exists slug text;
create unique index if not exists texts_slug_unique on texts (slug) where slug is not null;

alter table questions add column if not exists question_key text;
create unique index if not exists questions_version_key_unique
  on questions (text_version_id, question_key) where question_key is not null;

alter table question_choices add column if not exists choice_index int;
create unique index if not exists question_choices_question_index_unique
  on question_choices (question_id, choice_index) where choice_index is not null;

create unique index if not exists student_answers_session_question_unique
  on student_answers (session_id, question_id);
create unique index if not exists student_summaries_session_unique
  on student_summaries (session_id);

alter table retrieval_cards add column if not exists source_session_id uuid
  references reading_sessions(id) on delete cascade;
alter table retrieval_schedules add column if not exists repetitions int not null default 0;
alter table retrieval_schedules add column if not exists last_result text
  check (last_result in ('forgot','hard','good','easy'));
create unique index if not exists retrieval_schedules_card_unique
  on retrieval_schedules (retrieval_card_id);
create unique index if not exists retrieval_cards_session_prompt_unique
  on retrieval_cards (source_session_id, prompt_fr);

-- Fixed-form diagnostic evidence stays relational until Sprint 8 replaces the
-- form with competency_attempts.
create table diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  grade_min numeric not null,
  grade_max numeric not null,
  confidence text not null check (confidence in ('low','medium','high')),
  recommended_starting_level text not null,
  narrative_estimate numeric not null,
  expository_estimate numeric not null,
  argumentative_estimate numeric not null,
  source_based_estimate numeric not null,
  summary_text text,
  completed_at timestamptz not null default now()
);

create table diagnostic_skill_results (
  diagnostic_result_id uuid not null references diagnostic_results(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  ability numeric not null,
  is_foundation_gap boolean not null default false,
  primary key (diagnostic_result_id, skill_id)
);

create index diagnostic_results_student_completed_idx
  on diagnostic_results (student_id, completed_at desc);
alter table diagnostic_results enable row level security;
alter table diagnostic_skill_results enable row level security;

create policy diagnostic_results_insert on diagnostic_results
  for insert with check (public.owns_student(student_id));
create policy diagnostic_results_select on diagnostic_results
  for select using (public.can_view_student(student_id));
create policy diagnostic_skill_results_insert on diagnostic_skill_results
  for insert with check (exists (
    select 1 from diagnostic_results d
    where d.id = diagnostic_result_id and public.owns_student(d.student_id)
  ));
create policy diagnostic_skill_results_select on diagnostic_skill_results
  for select using (exists (
    select 1 from diagnostic_results d
    where d.id = diagnostic_result_id and public.can_view_student(d.student_id)
  ));

-- Server actions use the authenticated RLS client, so students need explicit
-- write paths for their own estimates/cards/schedules.
create policy reading_est_insert on student_reading_estimates
  for insert with check (public.owns_student(student_id));
create policy skill_est_insert on student_skill_estimates
  for insert with check (public.owns_student(student_id));
create policy skill_est_update on student_skill_estimates
  for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy retrieval_cards_insert on retrieval_cards
  for insert with check (public.owns_student(student_id));
create policy retrieval_cards_update on retrieval_cards
  for update using (public.owns_student(student_id)) with check (public.owns_student(student_id));
create policy retrieval_schedules_insert on retrieval_schedules
  for insert with check (exists (
    select 1 from retrieval_cards c
    where c.id = retrieval_card_id and public.owns_student(c.student_id)
  ));
create policy retrieval_schedules_update on retrieval_schedules
  for update using (exists (
    select 1 from retrieval_cards c
    where c.id = retrieval_card_id and public.owns_student(c.student_id)
  )) with check (exists (
    select 1 from retrieval_cards c
    where c.id = retrieval_card_id and public.owns_student(c.student_id)
  ));
create policy summaries_update on student_summaries
  for update using (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.owns_student(s.student_id)
  ));
create policy answers_update on student_answers
  for update using (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.owns_student(s.student_id)
  )) with check (exists (
    select 1 from reading_sessions s
    where s.id = session_id and public.owns_student(s.student_id)
  ));

-- Core reference rows are needed during the one-time projection, before
-- supabase/seed.sql runs on a fresh database.
insert into skills (key, label_fr, category, grade_band_min, grade_band_max) values
  ('literal_comprehension', 'Compréhension littérale', 'comprehension', 5, 12),
  ('main_idea', 'Idée principale', 'comprehension', 5, 12),
  ('inference', 'Inférence', 'comprehension', 6, 12),
  ('cause_consequence', 'Cause et conséquence', 'reasoning', 6, 12),
  ('academic_connectors', 'Connecteurs académiques', 'language', 6, 12),
  ('sentence_parsing', 'Analyse de phrases', 'language', 5, 11),
  ('vocabulary_in_context', 'Vocabulaire en contexte', 'vocabulary', 5, 12),
  ('summarization', 'Résumé', 'writing', 6, 12),
  ('argument_structure', 'Structure argumentative', 'reasoning', 8, 12)
on conflict (key) do nothing;

insert into knowledge_domains (key, label_fr) values
  ('geography', 'Géographie'), ('media_literacy', 'Éducation aux médias')
on conflict (key) do nothing;

insert into texts (id, slug, canonical_title, primary_interest, primary_domain_id, status)
select '20000000-0000-4000-8000-000000000001', 'football-migration',
  'Pourquoi de jeunes footballeurs quittent leur pays', 'football', id, 'active'
from knowledge_domains where key = 'geography'
on conflict (id) do update set slug = excluded.slug, status = 'active';

insert into texts (id, slug, canonical_title, primary_interest, primary_domain_id, status)
select '20000000-0000-4000-8000-000000000002', 'social-media-attention',
  'Pourquoi les applications cherchent à capter ton attention', 'social_media', id, 'active'
from knowledge_domains where key = 'media_literacy'
on conflict (id) do update set slug = excluded.slug, status = 'active';

insert into text_versions
  (id, text_id, version_number, title, body, language, word_count, text_type,
   difficulty_band, generation_type, review_status, source_policy)
values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1,
   'Pourquoi de jeunes footballeurs quittent leur pays',
   'Chaque année, de jeunes footballeurs quittent leur pays pour rejoindre un club étranger. Beaucoup rêvent de jouer un jour dans un grand championnat européen. Ce déplacement de personnes d''un endroit vers un autre porte un nom : la migration.\n\nPourquoi partir si loin de sa famille ? La raison principale est l''opportunité économique. Dans certains pays, il existe peu de clubs capables de payer correctement les joueurs. Ailleurs, les salaires sont plus élevés et les installations sont meilleures. Un jeune talent pense donc qu''il aura de meilleures chances de réussir en partant.\n\nCette migration n''est pas toujours simple. Le jeune joueur doit s''adapter à une nouvelle langue, à un climat différent et à une autre culture. Certains réussissent et deviennent des stars. D''autres, en revanche, ne trouvent pas de club et se retrouvent dans une situation difficile, loin de chez eux.\n\nLe football ressemble ainsi à d''autres formes de migration. Partout dans le monde, des personnes quittent leur région pour chercher du travail, souvent dans les grandes villes. Comprendre la migration des footballeurs aide donc à comprendre un phénomène bien plus large.',
   'fr', 320, 'expository', 'Secondary 7A', 'human', 'human_approved', 'original_human'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 1,
   'Pourquoi les applications cherchent à capter ton attention',
   'Quand tu ouvres une application de réseau social, tout semble pensé pour que tu restes le plus longtemps possible. Ce n''est pas un hasard. Les entreprises gagnent de l''argent grâce à la publicité : plus tu regardes, plus elles peuvent te montrer d''annonces.\n\nPour te garder, les applications utilisent des techniques précises. Les notifications attirent ton attention. Le défilement sans fin t''empêche de t''arrêter. Les vidéos courtes s''enchaînent automatiquement. Chaque détail vise un même but : capter ton attention le plus souvent possible.\n\nCe système peut créer un biais dans ta façon de voir le monde. Comme l''application te montre surtout ce qui te fait réagir, tu vois toujours le même type de contenu. Tu peux alors croire que tout le monde pense comme toi, alors que ce n''est pas le cas.\n\nComprendre ce fonctionnement ne signifie pas qu''il faut tout supprimer. Cela permet plutôt de choisir : décider quand utiliser ces applications, et garder ton esprit critique face à ce qu''elles te montrent.',
   'fr', 340, 'expository', 'Secondary 7B', 'human', 'human_approved', 'original_human')
on conflict (id) do update set body = excluded.body, review_status = 'human_approved';

insert into questions
  (id, text_version_id, question_key, question_text, question_type, answer_format, correct_answer)
values
  ('22000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001','q1','D''après le texte, qu''est-ce que la migration ?','literal','multiple_choice','Le déplacement de personnes d''un endroit vers un autre'),
  ('22000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000001','q2','Quelle est la raison principale pour laquelle ces jeunes partent ?','cause_consequence','multiple_choice','L''opportunité économique : de meilleures chances de réussir'),
  ('22000000-0000-4000-8000-000000000003','21000000-0000-4000-8000-000000000001','q3','Dans le texte, « s''adapter » à une nouvelle langue signifie…','vocabulary_in_context','multiple_choice','se modifier pour convenir à la nouvelle situation'),
  ('22000000-0000-4000-8000-000000000004','21000000-0000-4000-8000-000000000001','q4','Que peut-on déduire du texte au sujet de cette migration ?','inference','multiple_choice','Elle peut réussir pour certains et échouer pour d''autres'),
  ('22000000-0000-4000-8000-000000000005','21000000-0000-4000-8000-000000000001','q5','Quelle est l''idée principale du texte ?','main_idea','multiple_choice','La migration des footballeurs éclaire un phénomène plus large'),
  ('22000000-0000-4000-8000-000000000006','21000000-0000-4000-8000-000000000002','q1','Comment les entreprises de réseaux sociaux gagnent-elles de l''argent, d''après le texte ?','literal','multiple_choice','Grâce à la publicité'),
  ('22000000-0000-4000-8000-000000000007','21000000-0000-4000-8000-000000000002','q2','Pourquoi les applications utilisent-elles des notifications et le défilement sans fin ?','cause_consequence','multiple_choice','Pour capter ton attention le plus longtemps possible'),
  ('22000000-0000-4000-8000-000000000008','21000000-0000-4000-8000-000000000002','q3','Dans le texte, un « biais » est…','vocabulary_in_context','multiple_choice','une inclination qui déforme le jugement'),
  ('22000000-0000-4000-8000-000000000009','21000000-0000-4000-8000-000000000002','q4','Que suggère le texte sur la solution à adopter ?','inference','multiple_choice','Choisir quand les utiliser et garder son esprit critique'),
  ('22000000-0000-4000-8000-000000000010','21000000-0000-4000-8000-000000000002','q5','Quelle est l''idée principale du texte ?','main_idea','multiple_choice','Les applications sont conçues pour capter l''attention, et le comprendre aide à mieux choisir')
on conflict (id) do update set question_text = excluded.question_text, correct_answer = excluded.correct_answer;

-- Choice UUIDs are fixed so projected and future answers always retain the FK.
insert into question_choices (id, question_id, choice_index, choice_text, is_correct) values
  ('23000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001',0,'Le déplacement de personnes d''un endroit vers un autre',true),
  ('23000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000001',1,'Le fait de gagner un match important',false),
  ('23000000-0000-4000-8000-000000000003','22000000-0000-4000-8000-000000000001',2,'Le changement de poste sur le terrain',false),
  ('23000000-0000-4000-8000-000000000004','22000000-0000-4000-8000-000000000001',3,'L''entraînement quotidien d''un joueur',false),
  ('23000000-0000-4000-8000-000000000005','22000000-0000-4000-8000-000000000002',0,'Ils n''aiment pas leur pays',false),
  ('23000000-0000-4000-8000-000000000006','22000000-0000-4000-8000-000000000002',1,'L''opportunité économique : de meilleures chances de réussir',true),
  ('23000000-0000-4000-8000-000000000007','22000000-0000-4000-8000-000000000002',2,'Ils veulent apprendre une nouvelle langue',false),
  ('23000000-0000-4000-8000-000000000008','22000000-0000-4000-8000-000000000002',3,'Le climat est trop chaud chez eux',false),
  ('23000000-0000-4000-8000-000000000009','22000000-0000-4000-8000-000000000003',0,'refuser de parler',false),
  ('23000000-0000-4000-8000-000000000010','22000000-0000-4000-8000-000000000003',1,'oublier sa langue d''origine',false),
  ('23000000-0000-4000-8000-000000000011','22000000-0000-4000-8000-000000000003',2,'se modifier pour convenir à la nouvelle situation',true),
  ('23000000-0000-4000-8000-000000000012','22000000-0000-4000-8000-000000000003',3,'voyager rapidement',false),
  ('23000000-0000-4000-8000-000000000013','22000000-0000-4000-8000-000000000004',0,'Elle réussit toujours',false),
  ('23000000-0000-4000-8000-000000000014','22000000-0000-4000-8000-000000000004',1,'Elle est sans risque',false),
  ('23000000-0000-4000-8000-000000000015','22000000-0000-4000-8000-000000000004',2,'Elle peut réussir pour certains et échouer pour d''autres',true),
  ('23000000-0000-4000-8000-000000000016','22000000-0000-4000-8000-000000000004',3,'Elle concerne seulement le football',false),
  ('23000000-0000-4000-8000-000000000017','22000000-0000-4000-8000-000000000005',0,'Le football est un sport difficile',false),
  ('23000000-0000-4000-8000-000000000018','22000000-0000-4000-8000-000000000005',1,'La migration des footballeurs éclaire un phénomène plus large',true),
  ('23000000-0000-4000-8000-000000000019','22000000-0000-4000-8000-000000000005',2,'Les grandes villes sont surpeuplées',false),
  ('23000000-0000-4000-8000-000000000020','22000000-0000-4000-8000-000000000005',3,'Les salaires des joueurs sont trop élevés',false),
  ('23000000-0000-4000-8000-000000000021','22000000-0000-4000-8000-000000000006',0,'En vendant des téléphones',false),
  ('23000000-0000-4000-8000-000000000022','22000000-0000-4000-8000-000000000006',1,'Grâce à la publicité',true),
  ('23000000-0000-4000-8000-000000000023','22000000-0000-4000-8000-000000000006',2,'En faisant payer chaque message',false),
  ('23000000-0000-4000-8000-000000000024','22000000-0000-4000-8000-000000000006',3,'En organisant des concours',false),
  ('23000000-0000-4000-8000-000000000025','22000000-0000-4000-8000-000000000007',0,'Pour te faire payer',false),
  ('23000000-0000-4000-8000-000000000026','22000000-0000-4000-8000-000000000007',1,'Pour capter ton attention le plus longtemps possible',true),
  ('23000000-0000-4000-8000-000000000027','22000000-0000-4000-8000-000000000007',2,'Pour économiser de la batterie',false),
  ('23000000-0000-4000-8000-000000000028','22000000-0000-4000-8000-000000000007',3,'Pour t''apprendre à lire',false),
  ('23000000-0000-4000-8000-000000000029','22000000-0000-4000-8000-000000000008',0,'une publicité',false),
  ('23000000-0000-4000-8000-000000000030','22000000-0000-4000-8000-000000000008',1,'une inclination qui déforme le jugement',true),
  ('23000000-0000-4000-8000-000000000031','22000000-0000-4000-8000-000000000008',2,'un type de vidéo',false),
  ('23000000-0000-4000-8000-000000000032','22000000-0000-4000-8000-000000000008',3,'une notification',false),
  ('23000000-0000-4000-8000-000000000033','22000000-0000-4000-8000-000000000009',0,'Tout supprimer immédiatement',false),
  ('23000000-0000-4000-8000-000000000034','22000000-0000-4000-8000-000000000009',1,'Ne jamais utiliser de réseaux sociaux',false),
  ('23000000-0000-4000-8000-000000000035','22000000-0000-4000-8000-000000000009',2,'Choisir quand les utiliser et garder son esprit critique',true),
  ('23000000-0000-4000-8000-000000000036','22000000-0000-4000-8000-000000000009',3,'Croire tout ce qu''on y voit',false),
  ('23000000-0000-4000-8000-000000000037','22000000-0000-4000-8000-000000000010',0,'Les réseaux sociaux sont dangereux',false),
  ('23000000-0000-4000-8000-000000000038','22000000-0000-4000-8000-000000000010',1,'Les applications sont conçues pour capter l''attention, et le comprendre aide à mieux choisir',true),
  ('23000000-0000-4000-8000-000000000039','22000000-0000-4000-8000-000000000010',2,'La publicité est interdite',false),
  ('23000000-0000-4000-8000-000000000040','22000000-0000-4000-8000-000000000010',3,'Les vidéos courtes sont les meilleures',false)
on conflict (id) do update set choice_text = excluded.choice_text, is_correct = excluded.is_correct;

insert into vocabulary_items (id, lemma, display_word, definition_fr) values
  ('24000000-0000-4000-8000-000000000001','migration','migration','Le déplacement de personnes d''un lieu vers un autre.'),
  ('24000000-0000-4000-8000-000000000002','opportunité','opportunité','Une occasion favorable d''améliorer sa situation.'),
  ('24000000-0000-4000-8000-000000000003','s''adapter','s''adapter','Se modifier pour convenir à une nouvelle situation.'),
  ('24000000-0000-4000-8000-000000000004','phénomène','phénomène','Un fait que l''on peut observer et étudier.'),
  ('24000000-0000-4000-8000-000000000005','capter','capter','Attirer et retenir, par exemple l''attention.'),
  ('24000000-0000-4000-8000-000000000006','biais','biais','Une inclination qui déforme le jugement.'),
  ('24000000-0000-4000-8000-000000000007','esprit critique','esprit critique','La capacité à analyser une information avant de l''accepter.'),
  ('24000000-0000-4000-8000-000000000008','notification','notification','Un message qui signale une nouveauté dans une application.')
on conflict (id) do update set definition_fr = excluded.definition_fr;

insert into text_vocabulary (text_version_id, vocabulary_item_id, is_target_word)
select '21000000-0000-4000-8000-000000000001', id, true from vocabulary_items
where id between '24000000-0000-4000-8000-000000000001' and '24000000-0000-4000-8000-000000000004'
on conflict do nothing;
insert into text_vocabulary (text_version_id, vocabulary_item_id, is_target_word)
select '21000000-0000-4000-8000-000000000002', id, true from vocabulary_items
where id between '24000000-0000-4000-8000-000000000005' and '24000000-0000-4000-8000-000000000008'
on conflict do nothing;

-- Deterministic UUID helper used only for one-time JSON projection.
create or replace function public.sprint2_uuid(value text)
returns uuid language sql immutable set search_path = public as $$
  select (substr(md5(value),1,8) || '-' || substr(md5(value),9,4) || '-4' ||
          substr(md5(value),14,3) || '-8' || substr(md5(value),18,3) || '-' ||
          substr(md5(value),21,12))::uuid
$$;

insert into student_interests (student_id, interest_key, declared_strength)
select s.id, i.value, 1
from students s
cross join lateral jsonb_array_elements_text(coalesce(s.app_state->'interests','[]'::jsonb)) i
where s.app_state is not null
on conflict (student_id, interest_key) do nothing;

insert into diagnostic_results
  (id, student_id, grade_min, grade_max, confidence, recommended_starting_level,
   narrative_estimate, expository_estimate, argumentative_estimate, source_based_estimate,
   completed_at)
select public.sprint2_uuid(s.id::text || ':diagnostic'), s.id,
  (s.app_state #>> '{diagnostic,overallReadingBand,minGrade}')::numeric,
  (s.app_state #>> '{diagnostic,overallReadingBand,maxGrade}')::numeric,
  s.app_state #>> '{diagnostic,overallReadingBand,confidence}',
  s.app_state #>> '{diagnostic,recommendedStartingLevel}',
  (s.app_state #>> '{diagnostic,textTypeEstimates,narrative}')::numeric,
  (s.app_state #>> '{diagnostic,textTypeEstimates,expository}')::numeric,
  (s.app_state #>> '{diagnostic,textTypeEstimates,argumentative}')::numeric,
  (s.app_state #>> '{diagnostic,textTypeEstimates,sourceBased}')::numeric,
  coalesce(s.onboarding_completed_at, s.created_at)
from students s
where s.app_state->'diagnostic' is not null
on conflict (id) do nothing;

insert into diagnostic_skill_results (diagnostic_result_id, skill_id, ability, is_foundation_gap)
select public.sprint2_uuid(s.id::text || ':diagnostic'), sk.id, v.value::text::numeric, v.value::text::numeric < 50
from students s
cross join lateral jsonb_each(s.app_state #> '{diagnostic,skillEstimates}') v
join skills sk on sk.key = case v.key
  when 'literalComprehension' then 'literal_comprehension'
  when 'vocabularyInContext' then 'vocabulary_in_context'
  when 'sentenceParsing' then 'sentence_parsing'
  when 'argumentStructure' then 'argument_structure'
  when 'academicConnectors' then 'academic_connectors'
  when 'summary' then 'summarization'
  else v.key end
where s.app_state->'diagnostic' is not null
on conflict do nothing;

insert into student_reading_estimates
  (id, student_id, estimate_type, grade_min, grade_max, confidence, evidence_count, created_at)
select public.sprint2_uuid(s.id::text || ':reading-estimate'), s.id, 'diagnostic',
  (s.app_state #>> '{diagnostic,overallReadingBand,minGrade}')::numeric,
  (s.app_state #>> '{diagnostic,overallReadingBand,maxGrade}')::numeric,
  s.app_state #>> '{diagnostic,overallReadingBand,confidence}', 1,
  coalesce(s.onboarding_completed_at, s.created_at)
from students s where s.app_state->'diagnostic' is not null
on conflict (id) do nothing;

insert into reading_sessions
  (id, student_id, text_version_id, started_at, completed_at, abandoned,
   success_rate, literal_score, inference_score, vocabulary_score, summary_score,
   retrieval_score, time_on_task_seconds, hints_used, recommended_next_action)
select public.sprint2_uuid(s.id::text || ':session:' || x.ord), s.id, tv.id,
  (x.item->>'startedAt')::timestamptz, nullif(x.item->>'completedAt','')::timestamptz,
  coalesce((x.item->>'abandoned')::boolean,false), (x.item->>'successRate')::numeric,
  (x.item->>'literalScore')::numeric, (x.item->>'inferenceScore')::numeric,
  (x.item->>'vocabularyScore')::numeric, (x.item->>'summaryScore')::numeric,
  (x.item->>'retrievalScore')::numeric, (x.item->>'timeOnTaskSeconds')::int,
  coalesce((x.item->>'hintsUsed')::int,0), x.item->>'recommendedNextAction'
from students s
cross join lateral jsonb_array_elements(coalesce(s.app_state->'sessions','[]'::jsonb)) with ordinality x(item,ord)
join texts t on t.slug = x.item->>'textVersionId'
join text_versions tv on tv.text_id = t.id and tv.version_number = 1
on conflict (id) do nothing;

insert into student_answers (id, session_id, question_id, selected_choice_id, is_correct, score)
select public.sprint2_uuid(rs.id::text || ':' || q.id::text), rs.id, q.id, qc.id, qc.is_correct,
  case when qc.is_correct then 1 else 0 end
from students s
cross join lateral jsonb_each(coalesce(s.app_state->'answersByText','{}'::jsonb)) text_answers(text_key,answers)
cross join lateral jsonb_each_text(text_answers.answers) answer(question_key,choice_index)
join lateral (
  select r.* from reading_sessions r
  join text_versions tv on tv.id = r.text_version_id
  join texts t on t.id = tv.text_id
  where r.student_id = s.id and t.slug = text_answers.text_key
  order by r.started_at desc limit 1
) rs on true
join questions q on q.text_version_id = rs.text_version_id and q.question_key = answer.question_key
join question_choices qc on qc.question_id = q.id and qc.choice_index = answer.choice_index::int
on conflict (session_id, question_id) do nothing;

insert into student_skill_estimates
  (student_id, skill_id, ability, uncertainty, evidence_count, last_evidence_at)
select s.id, sk.id, (v.value->>'ability')::numeric, (v.value->>'uncertainty')::numeric,
  (v.value->>'evidenceCount')::int, now()
from students s
cross join lateral jsonb_each(coalesce(s.app_state->'skillEstimates','{}'::jsonb)) v
join skills sk on sk.key = v.key
on conflict (student_id, skill_id) do update set
  ability = excluded.ability, uncertainty = excluded.uncertainty,
  evidence_count = excluded.evidence_count, last_evidence_at = excluded.last_evidence_at;

insert into retrieval_cards
  (id, student_id, source_text_version_id, card_type, prompt_fr, rubric, created_at)
select public.sprint2_uuid(s.id::text || ':card:' || (c.item->>'id')), s.id, tv.id, 'concept',
  c.item->>'promptFr', jsonb_build_object(
    'keywords', coalesce(c.item->'keywords','[]'::jsonb),
    'concept_label', c.item->>'conceptLabel', 'source_text_key', c.item->>'sourceTextId'
  ), coalesce((c.item->>'dueAt')::timestamptz, now())
from students s
cross join lateral jsonb_array_elements(coalesce(s.app_state->'retrievalCards','[]'::jsonb)) c(item)
left join texts t on t.slug = c.item->>'sourceTextId'
left join text_versions tv on tv.text_id = t.id and tv.version_number = 1
on conflict (id) do nothing;

insert into retrieval_schedules
  (id, retrieval_card_id, due_at, interval_days, ease_factor, repetitions, last_result, status)
select public.sprint2_uuid(rc.id::text || ':schedule'), rc.id,
  (c.item->>'dueAt')::timestamptz, (c.item->>'intervalDays')::int,
  (c.item->>'ease')::numeric, coalesce((c.item->>'repetitions')::int,0),
  nullif(c.item->>'lastResult',''), 'due'
from students s
cross join lateral jsonb_array_elements(coalesce(s.app_state->'retrievalCards','[]'::jsonb)) c(item)
join retrieval_cards rc on rc.id = public.sprint2_uuid(s.id::text || ':card:' || (c.item->>'id'))
on conflict (retrieval_card_id) do nothing;

insert into vocabulary_items (id, lemma, display_word)
select public.sprint2_uuid('vocab:' || v.key), v.key, v.key
from students s cross join lateral jsonb_each(coalesce(s.app_state->'vocab','{}'::jsonb)) v
where not exists (select 1 from vocabulary_items vi where lower(vi.lemma) = lower(v.key))
on conflict (id) do nothing;

insert into student_word_mastery
  (student_id, vocabulary_item_id, mastery, exposures, last_seen_at)
select s.id, vi.id, least(1, coalesce((v.value->>'exposures')::numeric / 5,0)),
  coalesce((v.value->>'exposures')::int,0), nullif(v.value->>'lastSeenAt','')::timestamptz
from students s
cross join lateral jsonb_each(coalesce(s.app_state->'vocab','{}'::jsonb)) v
join lateral (select id from vocabulary_items where lower(lemma) = lower(v.key) order by created_at nulls last limit 1) vi on true
on conflict (student_id, vocabulary_item_id) do nothing;

drop function public.sprint2_uuid(text);

comment on column students.app_state is
  'Deprecated after Sprint 2. Read-only compatibility payload; relational evidence is authoritative.';

-- Authenticated app requests may no longer mutate the compatibility blob.
create or replace function public.prevent_authenticated_app_state_write()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated' and new.app_state is distinct from old.app_state then
    raise exception 'students.app_state is deprecated and read-only';
  end if;
  return new;
end;
$$;
drop trigger if exists students_app_state_read_only on students;
create trigger students_app_state_read_only
  before update of app_state on students
  for each row execute function public.prevent_authenticated_app_state_write();
