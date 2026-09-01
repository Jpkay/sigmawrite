begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(10);
select has_column('public','knowledge_concepts','concept_key','Concepts gain stable keys');
select has_column('public','knowledge_concepts','risk_class','Concept risk is explicit');
select has_column('public','knowledge_concepts','source_requirement','Source policy is explicit');
select has_table('public','content_concept_edges','Concept prerequisites are relational');
select has_table('public','topic_aliases','Topic aliases are relational');
select has_table('public','interest_concepts','Interests map many-to-many to concepts');
select is((select count(*) from public.knowledge_concepts where concept_key in ('cycle_eau','election_democratique')),2::bigint,'Pilot concepts are seeded');
select is((select source_requirement from public.knowledge_concepts where concept_key='election_democratique'),'current_primary_sources','High-risk politics requires current primary sources');
select is((select count(*) from public.content_concept_edges e join public.knowledge_concepts t on t.id=e.target_concept_id where t.concept_key='cycle_eau' and e.edge_type='prerequisite'),1::bigint,'Concept prerequisite is explicit');
select throws_ok($$insert into public.knowledge_concepts(concept_key,label_fr,risk_class,source_requirement) values('bad_high','Bad','high','none')$$,'23514',null,'High-risk concept cannot omit current-source policy');
select * from finish(); rollback;

