begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public','lexical_word_audio','Word audio cache exists');
select ok((select relrowsecurity from pg_class where oid = 'public.lexical_word_audio'::regclass), 'Word audio has RLS');

insert into public.vocabulary_items(id, lemma, display_word, definition_fr)
values ('20261018-1500-4000-8000-000000000001', 'intrépide', 'intrépide', 'Qui n''a pas peur du danger.');
insert into public.lexical_lemmas(id, vocabulary_item_id, lemma, normalized_lemma)
values ('20261018-1500-4000-8000-000000000002', '20261018-1500-4000-8000-000000000001', 'intrépide', 'intrépide');

select lives_ok($$insert into public.lexical_word_audio(lemma_id, spoken_text) values ('20261018-1500-4000-8000-000000000002', 'intrépide.')$$, 'A pending row needs no audio yet');
select throws_ok($$update public.lexical_word_audio set status = 'ready' where lemma_id = '20261018-1500-4000-8000-000000000002'$$, '23514', null, 'A ready row needs its audio path, checksum and type');
select lives_ok($$update public.lexical_word_audio set status = 'ready', audio_path = 'immutable/x.mp3', byte_checksum = 'sha256:' || repeat('a', 64), mime_type = 'audio/mpeg', rendered_at = now() where lemma_id = '20261018-1500-4000-8000-000000000002'$$, 'A complete ready row is accepted');

insert into auth.users(id, email, raw_user_meta_data) values
  ('20261018-1500-4000-8000-0000000000a1', 'word-audio-student@example.invalid', '{"role":"parent"}');
update public.profiles set role = 'student' where auth_user_id = '20261018-1500-4000-8000-0000000000a1';
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','20261018-1500-4000-8000-0000000000a1',true);
set local role authenticated;
select is((select count(*)::int from public.lexical_word_audio), 0, 'Students cannot read the audio cache');
select throws_ok($$insert into public.lexical_word_audio(lemma_id, spoken_text) values ('20261018-1500-4000-8000-000000000002', 'x')$$, '42501', null, 'Students cannot write the audio cache');
reset role;

select * from finish();
rollback;
