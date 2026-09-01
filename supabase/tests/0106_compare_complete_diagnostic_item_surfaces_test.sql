begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_function(
  'public','normalized_diagnostic_item_surface',array['uuid','text','text'],
  'Diagnostic uniqueness has a complete student-surface normalizer'
);
select has_function(
  'public','guard_reviewed_diagnostic_choice_uniqueness',array[]::text[],
  'Reviewed MCQ choices have a database guard'
);
select has_trigger(
  'public','competency_item_choices','reviewed_diagnostic_choice_uniqueness_insert_delete',
  'Choice insertion and deletion cannot bypass surface uniqueness'
);
select has_trigger(
  'public','competency_item_choices','reviewed_diagnostic_choice_uniqueness_update',
  'Choice edits cannot bypass surface uniqueness'
);

insert into public.competency_nodes(id,key,strand,label_fr,review_status)
values
('a6000000-0000-4000-8000-000000000001','surface-guard-a','orthographe_lexicale','Surface A','human_approved'),
('a6000000-0000-4000-8000-000000000002','surface-guard-b','orthographe_lexicale','Surface B','human_approved');

insert into public.competency_items(
  id,primary_node_id,strand,modality,response_type,prompt_fr,validator_type,
  difficulty,prompt_version,review_status
) values
('a6100000-0000-4000-8000-000000000001','a6000000-0000-4000-8000-000000000001','orthographe_lexicale','reading','mcq','Quel mot est correctement orthographié ?','exact',10,'diagnostic-bank-v2','needs_human_review'),
('a6100000-0000-4000-8000-000000000002','a6000000-0000-4000-8000-000000000001','orthographe_lexicale','reading','mcq','  QUEL mot est correctement   orthographié ? ','exact',20,'diagnostic-bank-v2','needs_human_review'),
('a6100000-0000-4000-8000-000000000003','a6000000-0000-4000-8000-000000000001','orthographe_lexicale','writing','short_answer','Écris le mot demandé.','exact',30,'diagnostic-bank-v2','needs_human_review'),
('a6100000-0000-4000-8000-000000000004','a6000000-0000-4000-8000-000000000001','orthographe_lexicale','writing','cloze','Écris le deuxième mot demandé.','exact',40,'diagnostic-bank-v2','needs_human_review'),
('a6100000-0000-4000-8000-000000000005','a6000000-0000-4000-8000-000000000002','orthographe_lexicale','writing','short_answer','Écris le mot demandé.','exact',50,'diagnostic-bank-v2','needs_human_review');

insert into public.competency_item_choices(item_id,choice_text,is_correct,position)
values
('a6100000-0000-4000-8000-000000000001','bateau',true,1),
('a6100000-0000-4000-8000-000000000001','bato',false,2),
('a6100000-0000-4000-8000-000000000002','vélo',true,1),
('a6100000-0000-4000-8000-000000000002','vélau',false,2);

select lives_ok(
  $$update public.competency_items set review_status='human_approved' where id='a6100000-0000-4000-8000-000000000001'$$,
  'The first MCQ surface can be approved'
);
select lives_ok(
  $$update public.competency_items set review_status='human_approved' where id='a6100000-0000-4000-8000-000000000002'$$,
  'The same generic stem with different visible choices is a distinct exercise'
);
select throws_ok(
  $$update public.competency_item_choices
    set choice_text=case when is_correct then ' BATEAU ' else 'BATO' end
    where item_id='a6100000-0000-4000-8000-000000000002'$$,
  null,'duplicate_diagnostic_prompt',
  'Case, whitespace and choice order cannot disguise a duplicate MCQ surface'
);

select lives_ok(
  $$update public.competency_items set review_status='human_approved' where id='a6100000-0000-4000-8000-000000000003'$$,
  'A unique open-response prompt can be approved'
);
select throws_ok(
  $$update public.competency_items
    set prompt_fr='  ÉCRIS   LE MOT DEMANDÉ. ',review_status='human_approved'
    where id='a6100000-0000-4000-8000-000000000004'$$,
  null,'duplicate_diagnostic_prompt',
  'Different open-response controls cannot disguise a duplicate prompt'
);
select lives_ok(
  $$update public.competency_items set review_status='human_approved' where id='a6100000-0000-4000-8000-000000000005'$$,
  'The same open prompt may measure a different competency node'
);

insert into public.competency_items(
  id,primary_node_id,strand,modality,response_type,prompt_fr,validator_type,
  difficulty,prompt_version,review_status
) values(
  'a6100000-0000-4000-8000-000000000006','a6000000-0000-4000-8000-000000000001',
  'orthographe_lexicale','reading','mcq','Quel mot est correctement orthographié ?',
  'exact',60,'diagnostic-bank-v2','human_approved'
);
select lives_ok(
  $$insert into public.competency_item_choices(item_id,choice_text,is_correct,position)
    values
    ('a6100000-0000-4000-8000-000000000006','kilo',true,1),
    ('a6100000-0000-4000-8000-000000000006','quilo',false,2)$$,
  'A newly imported approved MCQ may add a genuinely different choice surface'
);

insert into public.competency_items(
  id,primary_node_id,strand,modality,response_type,prompt_fr,validator_type,
  difficulty,prompt_version,review_status
) values(
  'a6100000-0000-4000-8000-000000000007','a6000000-0000-4000-8000-000000000001',
  'orthographe_lexicale','reading','mcq','Quel mot est correctement orthographié ?',
  'exact',70,'diagnostic-bank-v2','human_approved'
);
select throws_ok(
  $$insert into public.competency_item_choices(item_id,choice_text,is_correct,position)
    values
    ('a6100000-0000-4000-8000-000000000007','bato',false,1),
    ('a6100000-0000-4000-8000-000000000007','bateau',true,2)$$,
  null,'duplicate_diagnostic_prompt',
  'A newly imported approved MCQ cannot add a shuffled duplicate choice surface'
);

select * from finish();
rollback;
