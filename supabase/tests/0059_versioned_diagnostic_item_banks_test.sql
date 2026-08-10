begin;
set local role postgres;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(19);

select has_table('public','diagnostic_item_bank_releases','Diagnostic banks are versioned releases');
select has_table('public','diagnostic_item_bank_memberships','Items map to canonical evidence');
select has_column('public','diagnostic_runs','item_bank_release_id','Every run pins its item bank');
select has_column('public','diagnostic_item_bank_memberships','mastery_evidence_id','Question identifies its mastery evidence');
select has_column('public','diagnostic_item_bank_memberships','evidence_expectation','Recognition and production stay distinct');
select has_column('public','diagnostic_item_bank_memberships','prompt_family','Prompt-family diversity is measurable');
select has_column('public','diagnostic_item_bank_memberships','difficulty_tier','Difficulty-tier coverage is measurable');
select has_column('public','diagnostic_item_bank_memberships','difficulty','The release freezes the selection difficulty prior');
select has_function('public','diagnostic_bank_readiness',array['uuid','uuid'],'Publication gate checks taxonomy and bank together');
select has_function('public','next_section_diagnostic_item',array['uuid','uuid','text'],'Pinned bank selector replaces the legacy selector');
select is(
  (public.diagnostic_bank_readiness(gen_random_uuid(),gen_random_uuid())->>'ready')::boolean,
  false,
  'An absent or unpublished bank fails closed'
);
select col_is_pk('public','diagnostic_item_bank_memberships',array['bank_release_id','item_id'],'An item occurs once per bank');
select fk_ok('public','diagnostic_item_bank_memberships','mastery_evidence_id','public','competency_mastery_evidence','id','Membership references reviewed mastery evidence');
select fk_ok('public','diagnostic_item_bank_releases','taxonomy_release_id','public','taxonomy_releases','id','Bank is pinned to one taxonomy release');
select fk_ok('public','diagnostic_runs','item_bank_release_id','public','diagnostic_item_bank_releases','id','Run references an immutable bank release');
select trigger_is(
  'public',
  'diagnostic_item_bank_memberships',
  'diagnostic_bank_membership_consistency',
  'public',
  'validate_diagnostic_bank_membership',
  'Invalid node/evidence mappings fail at the database boundary'
);
select trigger_is(
  'public',
  'competency_items',
  'diagnostic_bank_item_content_immutability',
  'public',
  'guard_published_diagnostic_item_content',
  'Published diagnostic item content is immutable'
);
select trigger_is(
  'public',
  'competency_item_choices',
  'diagnostic_bank_item_choice_immutability',
  'public',
  'guard_published_diagnostic_item_choice',
  'Published diagnostic answer keys are immutable'
);
select trigger_is(
  'public',
  'competency_mastery_evidence',
  'diagnostic_bank_mastery_evidence_immutability',
  'public',
  'guard_published_diagnostic_mastery_evidence',
  'Published diagnostic evidence definitions are immutable'
);

select * from finish();
rollback;
