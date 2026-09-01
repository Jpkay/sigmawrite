begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public','competency_lessons','approved micro-lessons table exists');
select col_is_unique('public','competency_lessons','node_id','one approved lesson per competency');
select function_returns('public','advance_student_learning_path',array['uuid','uuid','numeric','timestamp with time zone','text'],'jsonb','mastery spiral function exists');
select matches(pg_get_functiondef('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure),'<[.]65','readiness threshold is encoded separately from mastery');
select matches(obj_description('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure,'pg_proc'),'0[.]85','function documents the mastery threshold');
select has_trigger('public','competency_nodes','competency_nodes_ensure_lesson','future approved nodes automatically receive a lesson');
select has_table('public','competency_mastery_evidence_occurrences','direct mastery evidence ledger exists');
select col_is_unique('public','competency_mastery_evidence_occurrences',array['student_id','node_id','occurrence_key'],'retries cannot duplicate a mastery occasion');
select matches(pg_get_functiondef('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure),'v_successes[[:space:]]*>=[[:space:]]*2','completion requires repeated successful evidence');
select matches(pg_get_functiondef('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure),'v_distinct_items[[:space:]]*>=[[:space:]]*3','controlled completion requires three distinct items');
select has_table('public','independent_production_submissions','independent writing submissions are durable evidence');

select * from finish();
rollback;
