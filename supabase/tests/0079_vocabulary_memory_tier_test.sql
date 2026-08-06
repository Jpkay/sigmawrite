begin;create extension if not exists pgtap with schema extensions;select plan(9);
select has_column('public','student_word_mastery','stability','Word memory has FSRS stability');
select has_column('public','student_word_mastery','difficulty','Word memory has FSRS difficulty');
select has_column('public','student_word_mastery','desired_retention','Word memory pins retention policy');
select has_table('public','vocabulary_review_attempts','Word reviews retain immutable evidence');
select has_column('public','vocabulary_review_attempts','previous_mastery','Review stores prior state');
select has_column('public','vocabulary_review_attempts','next_mastery','Review stores next state');
select has_index('public','student_word_mastery','student_word_mastery_due','Due-word lookup is indexed');select has_function('public','record_vocabulary_review',array['uuid','uuid','text','numeric','numeric','timestamp with time zone','numeric'],'Atomic vocabulary review exists');select function_privs_are('public','record_vocabulary_review',array['uuid','uuid','text','numeric','numeric','timestamp with time zone','numeric'],'authenticated',array[]::text[],'Clients cannot forge word memory');select * from finish();rollback;
