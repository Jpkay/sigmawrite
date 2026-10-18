begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(4);

select has_table('public', 'live_practice_sentences', 'Live practice sentences are cached');
select table_privs_are('public', 'live_practice_sentences', 'authenticated', array['SELECT'], 'Clients cannot write live practice sentences');
select col_default_is('public', 'live_practice_sentences', 'review_status', 'auto_approved'::text, 'Live sentences are auto_approved, never human-approved');
select throws_ok($$insert into public.live_practice_sentences(item_id, interest, sentence, prompt_fr, expected_form, pipeline_version, review_status)
  values (gen_random_uuid(), 'football', 'Nous dribblons jusqu''au but.', '« Nous _____ jusqu''au but. »', 'dribblons', 'live-sentence-1', 'human_approved')$$,
  '23514', null, 'Only auto_approved or withdrawn statuses exist');

select * from finish();
rollback;
