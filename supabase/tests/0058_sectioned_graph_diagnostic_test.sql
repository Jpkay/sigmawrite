begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public','diagnostic_run_sections','Each diagnostic section has independent state');
select has_table('public','diagnostic_run_items','Assigned questions are frozen per run');
select has_table('public','diagnostic_responses','Responses are idempotent records');
select has_table('public','diagnostic_node_results','Direct and inferred graph evidence is separated');
select has_table('public','student_learning_paths','A completed diagnostic creates a path');
select has_table('public','student_learning_path_steps','The path has ordered graph-node steps');
select has_column('public','diagnostic_runs','protocol_version','Run pins the diagnostic protocol');
select has_column('public','diagnostic_runs','current_section','Run records the active section');
select has_column('public','diagnostic_run_sections','confirmed_node_count','One lucky item cannot confirm a section');
select has_column('public','student_competency_estimates','estimate_source','Graph inference remains distinguishable');
select has_column('public','student_competency_estimates','last_diagnostic_run_id','Live estimates retain diagnostic provenance');
select col_is_unique('public','diagnostic_responses',array['run_item_id'],'An assigned occurrence is answered once');
select col_is_unique('public','diagnostic_responses',array['student_id','idempotency_key'],'Client retries are idempotent');
select col_is_unique('public','student_learning_paths',array['source_diagnostic_run_id'],'One run creates one path');
select has_function('public','diagnostic_section_for_strand',array['text'],'Strands map to the four stable sections');
select has_function('public','next_section_diagnostic_item',array['uuid','uuid','text'],'Selector is section-aware');
select has_function('public','apply_diagnostic_graph_inference',array['uuid','uuid','uuid','text','numeric','numeric','boolean'],'Hard prerequisites receive explicit inference');
select is(public.diagnostic_section_for_strand('comprehension_ecrite'),'reading_comprehension','Reading maps correctly');
select is(public.diagnostic_section_for_strand('orthographe_lexicale'),'spelling','Lexical spelling maps correctly');
select is(public.diagnostic_section_for_strand('conjugaison'),'conjugation','Conjugation maps correctly');

select * from finish();
rollback;
