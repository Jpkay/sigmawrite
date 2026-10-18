begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(20);

select has_column('public','dictations','themes','Dictées carry themes');
select has_column('public','dictations','interests','Dictées carry interests');
select has_column('public','dictations','tenses','Dictées carry tenses');
select has_column('public','dictations','target_lemmas','Dictées carry target lemmas');
select has_column('public','dictations','grammar_node_keys','Dictées carry grammar nodes');
select has_column('public','dictations','cefr_band','Dictées carry a CEFR band');
select has_column('public','dictations','gate_results','Automatic approval keeps its gate results');
select has_function('public','auto_approve_dictation',array['uuid','text','jsonb'],'Automatic approval is a function');
select has_function('public','take_down_dictation',array['uuid','text','uuid'],'Takedown is a function');

insert into public.dictations(id,key,title_fr,kind,text_fr,segments,word_count,grade_min,grade_max,themes,interests,tenses,target_lemmas)
values
  ('20261018-1200-4000-8000-000000000001','pgtap-auto','Auto','flash','Les enfants jouent.','[{"text":"Les enfants jouent."}]',3,6,7,'{école}','{football}','{present}','{enfant}'),
  ('20261018-1200-4000-8000-000000000002','pgtap-human','Humain','flash','Le chat dort.','[{"text":"Le chat dort."}]',3,6,7,'{}','{}','{}','{}');

select throws_ok(
  $$update public.dictations set tenses = '{aoriste}' where key = 'pgtap-auto'$$,
  '23514', null, 'Unknown tenses are rejected');
select throws_ok(
  $$update public.dictations set review_status = 'auto_approved' where key = 'pgtap-auto'$$,
  '23514', null, 'Automatic approval without provenance is rejected');

-- Only the service role may approve automatically.
select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok(
  $$select public.auto_approve_dictation('20261018-1200-4000-8000-000000000001','test-1','{"passed":true}'::jsonb)$$,
  '42501', null, 'Clients cannot approve automatically');

select set_config('request.jwt.claim.role','service_role',true);
select throws_ok(
  $$select public.auto_approve_dictation('20261018-1200-4000-8000-000000000001','test-1','{"passed":true,"textSha256":"stale"}'::jsonb)$$,
  'P0001', 'gate_results_stale', 'Gate results must match the current text');
select throws_ok(
  $$select public.auto_approve_dictation('20261018-1200-4000-8000-000000000001','test-1','{"passed":false}'::jsonb)$$,
  'P0001', 'gates_not_passed', 'Failed gates cannot approve');
select is(
  public.auto_approve_dictation('20261018-1200-4000-8000-000000000001','test-1',
    jsonb_build_object('passed',true,'textSha256',encode(sha256(convert_to('Les enfants jouent.','UTF8')),'hex'),'gates','[]'::jsonb)),
  'auto_approved', 'Passing gates bound to the text approve automatically');
update public.dictations set review_status = 'human_approved' where key = 'pgtap-human';
update public.dictations set audio_status = 'ready' where key in ('pgtap-auto','pgtap-human');

-- A student sees both automatic and human approvals once audio is ready.
insert into auth.users(id, email, raw_user_meta_data) values
  ('20261018-1200-4000-8000-0000000000a1', 'dictation-student@example.invalid', '{"role":"parent"}');
update public.profiles set role = 'student' where auth_user_id = '20261018-1200-4000-8000-0000000000a1';
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','20261018-1200-4000-8000-0000000000a1',true);
set local role authenticated;
select is((select count(*)::int from public.dictations where key in ('pgtap-auto','pgtap-human')), 2, 'Students read auto- and human-approved dictées');
reset role;

select set_config('request.jwt.claim.role','service_role',true);
select lives_ok($$select public.take_down_dictation('20261018-1200-4000-8000-000000000001','Signalé',null)$$, 'Service role may take a dictée down');
select is((select review_status from public.dictations where key = 'pgtap-auto'), 'taken_down', 'Takedown is recorded');

select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select is((select count(*)::int from public.dictations where key = 'pgtap-auto'), 0, 'A taken-down dictée disappears for students immediately');
reset role;

-- Editing the text of an approved dictée sends it back to review.
update public.dictations set text_fr = 'Le chat dort encore.' where key = 'pgtap-human';
select is((select review_status || '/' || audio_status from public.dictations where key = 'pgtap-human'), 'needs_human_review/pending', 'A changed text loses its approval and audio');

select * from finish();
rollback;
