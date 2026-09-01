begin;
set local role postgres;
set local search_path=public,extensions;
create extension if not exists pgtap with schema extensions;
select plan(7);

select has_function('public','guard_reviewed_diagnostic_prompt_uniqueness',array[]::text[],'Reviewed prompt uniqueness has a database guard');
select has_trigger('public','competency_items','reviewed_diagnostic_prompt_uniqueness','Every reviewed diagnostic write is guarded');

insert into public.competency_nodes(id,key,strand,label_fr,review_status)
values
('a5000000-0000-4000-8000-000000000001','prompt-guard-a','grammaire_syntaxe','Garde A','human_approved'),
('a5000000-0000-4000-8000-000000000002','prompt-guard-b','grammaire_syntaxe','Garde B','human_approved');

insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status)
values
('a5100000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001','grammaire_syntaxe','grammar_analysis','short_answer','Choisis la première réponse.','Réponse A','exact',10,'diagnostic-bank-v2','needs_human_review'),
('a5100000-0000-4000-8000-000000000002','a5000000-0000-4000-8000-000000000001','grammaire_syntaxe','grammar_analysis','short_answer','Choisis la deuxième réponse.','Réponse B','exact',20,'diagnostic-bank-v2','needs_human_review');

select lives_ok(
  $$update public.competency_items set review_status='human_approved' where id='a5100000-0000-4000-8000-000000000001'$$,
  'A unique diagnostic prompt can be approved'
);
select throws_ok(
  $$update public.competency_items set prompt_fr='  CHOISIS   LA PREMIÈRE RÉPONSE. ',review_status='human_approved' where id='a5100000-0000-4000-8000-000000000002'$$,
  null,'duplicate_diagnostic_prompt','Whitespace and case cannot hide an approval-time duplicate'
);
select lives_ok(
  $$update public.competency_items set prompt_fr='Choisis la première réponse.',review_status='rejected' where id='a5100000-0000-4000-8000-000000000002'$$,
  'A rejected tombstone may retain the duplicate text for review history'
);
select lives_ok(
  $$insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status) values('a5100000-0000-4000-8000-000000000003','a5000000-0000-4000-8000-000000000002','grammaire_syntaxe','grammar_analysis','short_answer','Choisis la première réponse.','Réponse C','exact',30,'diagnostic-bank-v2','human_approved')$$,
  'The same wording may measure a different competency node'
);
select throws_ok(
  $$insert into public.competency_items(id,primary_node_id,strand,modality,response_type,prompt_fr,correct_answer,validator_type,difficulty,prompt_version,review_status) values('a5100000-0000-4000-8000-000000000004','a5000000-0000-4000-8000-000000000001','grammaire_syntaxe','grammar_analysis','short_answer','Choisis la première réponse.','Réponse D','exact',40,'diagnostic-bank-v2','auto_approved')$$,
  null,'duplicate_diagnostic_prompt','Automated imports cannot bypass the same duplicate guard'
);

select * from finish();
rollback;
