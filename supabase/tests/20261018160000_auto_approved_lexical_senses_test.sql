begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_column('public','lexical_senses','examples_fr','Senses carry interest examples');
select has_column('public','lexical_senses','definition_validation','Senses carry own-words validation criteria');
select has_column('public','lexical_senses','close_words','Senses carry distractor material');
select has_column('public','lexical_senses','gate_results','Automatic senses keep their gate results');
select has_column('public','vocabulary_items','content_pipeline_version','Vocabulary items remember which pipeline wrote them');

insert into vocabulary_items(id,lemma,display_word) values
  ('a6000000-0000-4000-8000-000000000001','courage','courage'),
  ('a6000000-0000-4000-8000-000000000002','bureau','bureau');
insert into lexical_lemmas(id,vocabulary_item_id,lemma,normalized_lemma) values
  ('a6000000-0000-4000-8000-000000000001','a6000000-0000-4000-8000-000000000001','courage','courage'),
  ('a6000000-0000-4000-8000-000000000002','a6000000-0000-4000-8000-000000000002','bureau','bureau');

select throws_ok(
  $$insert into lexical_senses(lemma_id,sense_key,definition_fr,review_status)
    values ('a6000000-0000-4000-8000-000000000001','auto_core','Force qui aide à affronter la peur.','auto_approved')$$,
  '23514', null, 'Automatic approval without provenance is rejected');
select throws_ok(
  $$insert into lexical_senses(lemma_id,sense_key,definition_fr,review_status,pipeline_version,gate_results,auto_approved_at)
    values ('a6000000-0000-4000-8000-000000000001','auto_core','Force qui aide à affronter la peur.','auto_approved','lexicon-defs-v1','{"passed":false}',now())$$,
  '23514', null, 'Failed gates cannot approve automatically');
select lives_ok(
  $$insert into lexical_senses(id,lemma_id,sense_key,definition_fr,review_status,pipeline_version,gate_results,auto_approved_at,examples_fr,definition_validation,close_words,grade_level)
    values ('a6000000-0000-4000-8000-0000000000c1','a6000000-0000-4000-8000-000000000001','auto_core','Force qui aide à affronter la peur.','auto_approved','lexicon-defs-v1',
      '{"passed":true,"gates":[]}',now(),
      '[{"text":"Le gardien montre du courage face au penalty.","interest":"football"}]',
      '[{"kind":"key_idea","idea":"ne pas se laisser arrêter par la peur","keywords":["peur","oser"],"required":true}]',
      '{"synonyms":["bravoure"],"antonyms":["peur"],"semantic":[],"orthographic":[]}',5)$$,
  'Automatic approval with passing gates is accepted');
select throws_ok(
  $$update lexical_senses set examples_fr = '{}'::jsonb where id = 'a6000000-0000-4000-8000-0000000000c1'$$,
  '23514', null, 'Examples must be an array');

-- Word memory resolves automatic senses; a retired (taken down) sense disappears.
select set_config('request.jwt.claim.role','service_role',true);
select is((select count(*)::int from public.resolve_word_senses(array['a6000000-0000-4000-8000-000000000001'::uuid], array[]::text[]) where sense_id is not null),
  1, 'An auto-approved sense is a trackable word');
update lexical_senses set review_status = 'retired' where id = 'a6000000-0000-4000-8000-0000000000c1';
select is((select count(*)::int from public.resolve_word_senses(array['a6000000-0000-4000-8000-000000000001'::uuid], array[]::text[]) where sense_id is not null),
  0, 'A retired sense is no longer tracked');

-- Students read auto-approved senses through RLS.
update lexical_senses set review_status = 'auto_approved' where id = 'a6000000-0000-4000-8000-0000000000c1';
insert into lexical_senses(lemma_id,sense_key,definition_fr,review_status)
values ('a6000000-0000-4000-8000-000000000002','draft_sense','Brouillon.','draft');
insert into auth.users(id, email, raw_user_meta_data) values
  ('a6000000-0000-4000-8000-0000000000a1', 'lexicon-student@example.invalid', '{"role":"parent"}');
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a6000000-0000-4000-8000-0000000000a1',true);
set local role authenticated;
select is((select count(*)::int from public.lexical_senses where lemma_id in ('a6000000-0000-4000-8000-000000000001','a6000000-0000-4000-8000-000000000002')),
  1, 'Signed-in users read auto-approved senses but not drafts');
reset role;

select * from finish();
rollback;
