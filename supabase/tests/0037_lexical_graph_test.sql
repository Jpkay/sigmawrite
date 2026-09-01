begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public','lexical_lemmas','Lexical lemmas exist');
select has_table('public','lexical_senses','Lexical senses exist');
select has_table('public','lexical_forms','Lexical forms exist');
select has_table('public','lexical_frequencies','Source-specific frequencies exist');
select has_table('public','lexical_relationships','Sense relationships exist');
select has_table('public','lexical_progression_mappings','Independent progression mappings exist');
select has_table('public','lexical_releases','Versioned lexical releases exist');

select is(
  (select count(*) from public.vocabulary_items v left join public.lexical_lemmas l on l.vocabulary_item_id=v.id where l.id is null),
  0::bigint,
  'Every legacy vocabulary item retains a lexical anchor'
);
select is(
  (select count(*) from public.student_word_mastery m join public.lexical_lemmas l on l.vocabulary_item_id=m.vocabulary_item_id),
  (select count(*) from public.student_word_mastery),
  'Current student word mastery remains linked'
);

insert into public.vocabulary_items(id,lemma,display_word,definition_fr)
values('81000000-0000-4000-8000-000000000001','vol','vol','Action de voler.') on conflict(id) do nothing;
insert into public.lexical_lemmas(id,vocabulary_item_id,lemma,normalized_lemma)
values('82000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','vol','vol') on conflict(vocabulary_item_id) do update set normalized_lemma=excluded.normalized_lemma;
insert into public.lexical_senses(id,lemma_id,sense_key,definition_fr,review_status) values
('83000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','flight','Déplacement dans les airs.','human_approved'),
('83000000-0000-4000-8000-000000000002','82000000-0000-4000-8000-000000000001','theft','Action de dérober.','human_approved');
insert into public.lexical_forms(lemma_id,surface_form,normalized_form,form_type,features) values
('82000000-0000-4000-8000-000000000001','vols','vols','inflected','{"number":"plural"}');

select is((select count(*) from public.lexical_senses where lemma_id='82000000-0000-4000-8000-000000000001'),2::bigint,'One lemma supports multiple senses');
select is((select count(*) from public.lexical_forms where lemma_id='82000000-0000-4000-8000-000000000001'),1::bigint,'One lemma supports multiple forms independently');

insert into public.lexical_releases(id,release_key,version,status)
values('84000000-0000-4000-8000-000000000001','lex-test','0.0.1','draft');
insert into public.lexical_release_entries(release_id,sense_id,stable_key,record_snapshot,record_checksum) values
('84000000-0000-4000-8000-000000000001','83000000-0000-4000-8000-000000000001','vol:flight','{"lemma":"vol","forms":["vols"]}','sha256:test');

select is(
  (select coverage from public.lexical_release_token_coverage('84000000-0000-4000-8000-000000000001',array['vol','vols','inconnu'])),
  0.6667::numeric,
  'Passage tokens are measured against an exact lexical release'
);
select is(
  (select unknown_tokens from public.lexical_release_token_coverage('84000000-0000-4000-8000-000000000001',array['vol','inconnu'])),
  array['inconnu']::text[],
  'Coverage reports unknown tokens explicitly'
);

select * from finish();
rollback;

