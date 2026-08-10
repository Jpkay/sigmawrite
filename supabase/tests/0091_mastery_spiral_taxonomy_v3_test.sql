begin;
select plan(6);

select has_table('public','competency_lessons','approved micro-lessons table exists');
select col_is_unique('public','competency_lessons','node_id','one approved lesson per competency');
select function_returns('public','advance_student_learning_path',array['uuid','uuid','numeric','timestamp with time zone','text'],'jsonb','mastery spiral function exists');
select like(pg_get_functiondef('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure),'%<.65%','readiness threshold is encoded separately from mastery');
select like(obj_description('public.advance_student_learning_path(uuid,uuid,numeric,timestamp with time zone,text)'::regprocedure,'pg_proc'),'%0.85%','function documents the mastery threshold');
select has_trigger('public','competency_nodes','competency_nodes_ensure_lesson','future approved nodes automatically receive a lesson');

select * from finish();
rollback;
