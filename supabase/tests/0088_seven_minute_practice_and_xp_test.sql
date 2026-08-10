begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select set_config(
  'search_path',
  format('public,%I', n.nspname),
  true
)
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where e.extname = 'pgtap';
select extensions.plan(15);

select extensions.has_table('public','practice_learning_sessions','Practice sessions are persisted');
select extensions.has_table('public','student_xp_ledger','XP has an append-only ledger');
select extensions.has_column('public','student_competency_estimates','next_review_at','FSRS exposes an explicit next review date');
select extensions.has_column('public','competency_attempts','practice_session_id','Attempts belong to a timed practice session');
select extensions.has_column('public','competency_attempts','exercise_position','Repeated reviewed items remain distinct exercise slots');
select extensions.col_is_fk('public','competency_attempts','practice_session_id','Practice attempt session reference is protected');
select extensions.has_function('public','complete_practice_learning_session',array['uuid','uuid','timestamp with time zone'],'Practice completion is atomic');
select extensions.has_index('public','practice_learning_sessions','practice_learning_sessions_student_id_client_request_id_key','Session starts are idempotent');
select extensions.has_index('public','student_xp_ledger','student_xp_ledger_student_id_event_key_key','XP events are idempotent');
select extensions.has_index('public','student_competency_estimates','student_competency_next_review_idx','Due-node lookup is indexed');
select extensions.is(
  (select relrowsecurity from pg_class where oid = 'public.practice_learning_sessions'::regclass),
  true,
  'Practice sessions use RLS'
);
select extensions.is(
  (select relrowsecurity from pg_class where oid = 'public.student_xp_ledger'::regclass),
  true,
  'XP ledger uses RLS'
);
select extensions.policies_are('public','practice_learning_sessions',array['practice_learning_sessions_read'],'Only the intended practice-session policy exists');
select extensions.policies_are('public','student_xp_ledger',array['student_xp_ledger_read'],'Only the intended XP policy exists');
select extensions.function_privs_are(
  'public','complete_practice_learning_session',array['uuid','uuid','timestamp with time zone'],
  'authenticated',array['EXECUTE'],'Authenticated students may complete their guarded session'
);

select * from extensions.finish();
rollback;
