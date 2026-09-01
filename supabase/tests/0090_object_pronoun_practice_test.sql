begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(8);

select is((select count(*) from public.competency_items where prompt_version='pronoun-practice-v1'),36::bigint,'Pronoun practice has six exercises in each of six modules');
select is((select count(distinct validator_config->>'practiceModule') from public.competency_items where prompt_version='pronoun-practice-v1'),6::bigint,'Pronoun practice separates six concepts');
select is((select min(module_count) from (select count(*) module_count from public.competency_items where prompt_version='pronoun-practice-v1' group by validator_config->>'practiceModule') counts),6::bigint,'Every pronoun module has six exercises');
select is((select count(*) from public.competency_items where prompt_version='pronoun-practice-v1' and (review_status<>'auto_approved' or validator_type<>'exact' or correct_answer is null)),0::bigint,'Every pronoun answer is deterministically gradable');
select is((select count(*) from public.competency_items item join public.competency_nodes node on node.id=item.primary_node_id where item.prompt_version='pronoun-practice-v1' and node.key in ('produire_pronom_cod','produire_pronom_coi_personne','distinguer_pronom_cod_coi','produire_pronoms_y_en','ordonner_doubles_pronoms','placer_pronom_complement','accorder_participe_cod_antepose')),36::bigint,'Every exercise belongs to its approved granular object-pronoun competency');
select is((select correct_answer from public.competency_items where prompt_version='pronoun-practice-v1' and prompt_fr like '%à sa mère%'),'lui','A female singular recipient uses lui');
select is((select correct_answer from public.competency_items where prompt_version='pronoun-practice-v1' and prompt_fr like '%à son père%'),'lui','A male singular recipient also uses lui');
select is((select correct_answer from public.competency_items where prompt_version='pronoun-practice-v1' and prompt_fr like '%à ses parents%'),'leur','Plural recipients use leur');

select * from finish();
rollback;
