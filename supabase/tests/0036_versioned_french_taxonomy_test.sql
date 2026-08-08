begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into public.ontology_versions(id,version,document_path,status,approved_at)
values('71000000-0000-4000-8000-000000000001','test-1.0.0','docs/french-ontology-v1.md','active',now());

insert into public.taxonomy_sources(id,source_key,title,owner_name,source_kind,steward)
values('72000000-0000-4000-8000-000000000001','test-sigma-original-taxonomy','SigmaWrite French Taxonomy test fixture','SigmaWrite','original','taxonomy-steward');

select throws_ok(
  $$insert into public.taxonomy_source_versions(source_id,version_label,rights_status,attribution_template,commercial_use_allowed,decision_notes) values('72000000-0000-4000-8000-000000000001','bad','importable','© SigmaWrite',true,'Missing exact terms')$$,
  '23514', null, 'Importable sources fail closed without complete terms'
);

insert into public.taxonomy_source_versions(
  id,source_id,version_label,artifact_checksum,rights_status,license_identifier,
  terms_snapshot,permitted_fields,attribution_template,commercial_use_allowed,
  decision_notes,approved_at
) values (
  '73000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001',
  'test-1.0.0','sha256:test','importable','Proprietary-SigmaWrite-v1','Original SigmaWrite records',
  array['competency_nodes','competency_edges','mastery_evidence'],
  '© SigmaWrite, French Taxonomy {release_version}.',true,'Original taxonomy source.',now()
);

select has_column('public','competency_nodes','ontology_version_id','Existing nodes gain ontology version without replacement');
select has_column('public','competency_nodes','node_type','Existing nodes gain structured node type');
select has_column('public','competency_edges','prerequisite_class','Edges gain hard/soft classification');
select has_column('public','competency_edges','rationale','Edges gain a queryable rationale');
select has_table('public','competency_mastery_evidence','Structured mastery evidence exists');
select has_table('public','competency_progression_mappings','Independent learner progression mappings exist');
select has_table('public','taxonomy_record_sources','Relational provenance links exist');
select has_table('public','taxonomy_release_memberships','Release membership snapshots exist');

select is(
  (select count(*) from public.competency_edges where edge_type='prerequisite' and prerequisite_class is null),
  0::bigint,
  'Legacy prerequisites remain compatible as hard prerequisites'
);

insert into public.taxonomy_releases(
  id,release_key,version,ontology_version_id,status,manifest,manifest_checksum,
  validation_report,published_at
) values (
  '74000000-0000-4000-8000-000000000001','test-release','test-0.0.1',
  '71000000-0000-4000-8000-000000000001','draft','{"counts":{"competency_node":1}}',
  'sha256:manifest','{"valid":true}',now()
);

insert into public.taxonomy_release_memberships(
  release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum
) values (
  '74000000-0000-4000-8000-000000000001','competency_node',
  '75000000-0000-4000-8000-000000000001','test-node',1,'{"key":"test-node"}','sha256:node'
);

-- The fixture has no profile, so a temporary publishing identity is unnecessary:
-- published_by is nullable at draft time but required by the publication check.
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('76000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','taxonomy-admin@test.local','',now(),'{}','{"role":"platform_admin","display_name":"Taxonomy Admin"}',now(),now());
update public.profiles set role='platform_admin'
where auth_user_id='76000000-0000-4000-8000-000000000001';

update public.taxonomy_releases
set status='published', published_by=(select id from public.profiles where auth_user_id='76000000-0000-4000-8000-000000000001')
where id='74000000-0000-4000-8000-000000000001';

select throws_ok(
  $$update public.taxonomy_releases set manifest_checksum='changed' where id='74000000-0000-4000-8000-000000000001'$$,
  null, 'published_taxonomy_release_is_immutable', 'Published release payload cannot change'
);
select throws_ok(
  $$delete from public.taxonomy_releases where id='74000000-0000-4000-8000-000000000001'$$,
  null, 'published_taxonomy_release_is_immutable', 'Published release cannot be deleted'
);
select throws_ok(
  $$update public.taxonomy_release_memberships set record_checksum='changed' where release_id='74000000-0000-4000-8000-000000000001'$$,
  null, 'published_taxonomy_membership_is_immutable', 'Published membership cannot change'
);
select throws_ok(
  $$insert into public.taxonomy_release_memberships(release_id,record_type,record_id,stable_key,record_version,record_snapshot,record_checksum) values('74000000-0000-4000-8000-000000000001','competency_node','75000000-0000-4000-8000-000000000002','late-node',1,'{}','sha256:late')$$,
  null, 'published_taxonomy_membership_is_immutable', 'Published release cannot gain members'
);
select lives_ok(
  $$update public.taxonomy_releases set status='withdrawn', withdrawn_at=now() where id='74000000-0000-4000-8000-000000000001'$$,
  'Published release can be withdrawn without mutating its content'
);
select is(
  (select record_snapshot->>'key' from public.taxonomy_release_memberships where release_id='74000000-0000-4000-8000-000000000001'),
  'test-node',
  'Withdrawal preserves the immutable snapshot'
);

select * from finish();
rollback;
