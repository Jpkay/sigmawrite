begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public','dictations','Dictées are persisted content');
select has_table('public','dictation_attempts','Dictée attempts are relational evidence');
select has_column('public','dictations','segments','Dictées are split into replayable segments');
select has_column('public','dictation_attempts','error_profile','Attempts keep the Catach error profile');
select has_function('public','review_dictation',array['uuid','text','uuid'],'Approval is an audited function');
select policies_are('public','dictations',array['dictations_read_published'],'Only the publication policy exists');
select policies_are('public','dictation_attempts',array['dictation_attempts_read'],'Attempts are readable through the student view helper');

insert into public.dictations(id,key,title_fr,kind,text_fr,segments,word_count,grade_min,grade_max)
values ('11300000-0000-0000-0000-000000000001','pgtap-flash','Test','flash','Les enfants jouent.','[{"text":"Les enfants jouent."}]',3,6,7);

select is((select review_status from public.dictations where key='pgtap-flash'),'needs_human_review','New dictées wait for review');
select lives_ok($$select public.review_dictation('11300000-0000-0000-0000-000000000001','human_approved',null)$$,'Service role may approve');
select is((select review_status from public.dictations where key='pgtap-flash'),'human_approved','Approval is recorded');

select * from finish();
rollback;
