begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_column('public','content_reuse_policies','trial_cohort_percent','Live trial exposure is bounded');
select has_table('public','content_reuse_policy_events','Reuse policy transitions retain evidence');
select has_function('public','transition_content_reuse_policy',array['uuid','text','numeric','jsonb','uuid'],'Promotion is an atomic evidence-gated transition');
select has_column('public','content_reuse_observations','matcher_exposed','Calibration distinguishes actual matcher exposure');
select has_column('public','content_reuse_calibration_outcomes','matcher_exposed','Calibration view exposes assignment state');

set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok(
  $$select public.transition_content_reuse_policy((select id from public.content_reuse_policies where active),'trial',.78,'{"decision":"eligible_for_trial"}'::jsonb,null)$$,
  '42501','service_role_required','Authenticated callers cannot forge a rollout transition'
);

set local request.jwt.claims = '{"role":"service_role"}';
select throws_ok(
  $$select public.transition_content_reuse_policy((select id from public.content_reuse_policies where active),'trial',.78,'{"decision":"keep_shadow"}'::jsonb,null)$$,
  null,'shadow_calibration_evidence_required','A trial cannot start without qualifying shadow evidence'
);
select throws_ok(
  $$select public.transition_content_reuse_policy((select id from public.content_reuse_policies where active),'live',.78,'{"decision":"eligible_for_live"}'::jsonb,null)$$,
  null,'live_requires_trial','Shadow mode cannot skip the bounded trial'
);
select lives_ok(
  $$select public.transition_content_reuse_policy((select id from public.content_reuse_policies where active),'trial',.82,'{"decision":"eligible_for_trial"}'::jsonb,null)$$,
  'Qualifying shadow evidence starts a bounded trial'
);
select is(
  (select mode from public.content_reuse_policies where active),'trial','The trial policy becomes active'
);
select lives_ok(
  $$select public.transition_content_reuse_policy((select id from public.content_reuse_policies where active),'live',.82,'{"decision":"eligible_for_live"}'::jsonb,null)$$,
  'Qualifying exposed-trial evidence can promote live reuse'
);
select is(
  (select mode from public.content_reuse_policies where active),'live','The live policy becomes active'
);
select is(
  (select count(*) from public.content_reuse_policy_events),2::bigint,'Both transitions retain evidence events'
);

select * from finish();
rollback;
