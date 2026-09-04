begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('public','content_reuse_policies','Reuse rollout policy exists');
select has_column('public','content_reuse_policies','mode','Reuse can run off, shadow, or live');
select is((select mode from public.content_reuse_policies where active),'shadow','Reuse starts in shadow mode');
select has_table('public','content_reuse_observations','Recommendation decisions are observable');
select has_column('public','content_reuse_observations','baseline_text_version_ids','Baseline recommendations are retained');
select has_column('public','content_reuse_observations','recommended_text_version_ids','Actually displayed recommendations are retained');
select has_column('public','reading_sessions','reuse_observation_id','Reading outcomes link to reuse decisions');
select has_view('public','content_reuse_calibration_outcomes','Calibration outcomes are queryable');
select has_trigger('public','reading_sessions','bind_reading_session_reuse_observation','Reading starts bind to recent recommendations');
select has_function('public','refresh_content_contract_profile',array['uuid'],'Profiles can be rebuilt deterministically');
select has_function('public','refresh_all_content_contract_profiles',array[]::text[],'All profiles can be backfilled');
select has_column('public','content_contract_profiles','interest_key','Reuse profiles retain interest');
select has_column('public','content_contract_profiles','text_type','Reuse profiles retain text type');
select has_column('public','content_contract_profiles','empirical_session_count','Empirical evidence count is explicit');

select has_table('public','text_version_concepts','Texts map to background concepts');
select has_table('public','knowledge_concept_packets','Versioned knowledge packets exist');
select has_column('public','knowledge_concept_packets','claims','Packets contain atomic claims');
select has_column('public','knowledge_concept_packets','misconceptions','Packets contain misconceptions');
select has_column('public','knowledge_concept_packets','vocabulary','Packets contain vocabulary');
select has_column('public','knowledge_concept_packets','review_after','Packet freshness is explicit');
select has_table('public','knowledge_packet_sources','Packet sources have structured provenance');
select has_function('public','get_published_knowledge_packets',array['text','text[]'],'Only publishable grounding is retrieved');
select has_trigger('public','knowledge_concept_packets','guard_knowledge_packet_publication','Packet approval fails closed');
select is(
  (select count(*) from public.knowledge_concept_packets p join public.knowledge_concepts c on c.id=p.concept_id where c.source_requirement='none' and c.review_status='human_approved' and p.status='human_approved') > 0,
  true,
  'Previously approved source-free descriptions become starter packets'
);

select * from finish();
rollback;
