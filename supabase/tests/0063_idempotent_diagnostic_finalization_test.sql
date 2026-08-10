begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(2);
select has_column('public','student_reading_estimates','diagnostic_run_id','Reading placement is linked to its diagnostic');
select col_is_unique('public','student_reading_estimates',array['diagnostic_run_id'],'A retry cannot duplicate reading placement');
select * from finish();
rollback;
