begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
select extensions.plan(1);
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000002','granular-publisher-142@example.invalid','{"role":"parent"}');
insert into ontology_versions(id,version,document_path) values
 ('20000000-0000-4000-8000-000000000099','granular-test-142','tests/0142');
insert into students(id) values ('10000000-0000-4000-8000-000000000001');
update students set profile_id=(select id from profiles where auth_user_id='10000000-0000-4000-8000-000000000002')
where id='10000000-0000-4000-8000-000000000001';
insert into consent_records(student_id,consent_type,consent_version,privacy_policy_version)
values ('10000000-0000-4000-8000-000000000001','student_over_15','test-v1','test-v1');
insert into taxonomy_releases(id,release_key,version,ontology_version_id,status,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('20000000-0000-4000-8000-000000000001','french-taxonomy-v3','3.0.0','20000000-0000-4000-8000-000000000099','published','{"fixture":true}','granular-test-142','{"valid":true}',
 (select id from profiles where auth_user_id='10000000-0000-4000-8000-000000000002'),now());
alter table diagnostic_item_bank_releases disable trigger diagnostic_bank_publication_guard;
insert into diagnostic_item_bank_releases(id,bank_key,version,status,taxonomy_release_id,manifest,manifest_checksum,validation_report,published_by,published_at)
values ('30000000-0000-4000-8000-000000000001','granular-test-bank-142','granular-test-142','published','20000000-0000-4000-8000-000000000001',
 '{"checksum":"granular-test-142"}','granular-test-142','{"valid":true}',(select id from profiles where auth_user_id='10000000-0000-4000-8000-000000000002'),now());
alter table diagnostic_item_bank_releases enable trigger diagnostic_bank_publication_guard;
insert into granular_assessment_releases(id,release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
values ('40000000-0000-4000-8000-000000000001','test-granular','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','published','test',
 '{"assessment":{"taxonomyChecksum":"granular-test-142","bankChecksum":"granular-test-142"}}');
insert into granular_assessment_sessions(student_id,release_id,state) values
('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','{"revision":0,"phase":"learning","completionReason":"time_budget"}');
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$ declare student uuid:='10000000-0000-4000-8000-000000000001'; begin
 if not student_learning_is_unlocked(student) then raise exception 'Time-budget completion must permit learning'; end if;
 if student_granular_learning_ready('10000000-0000-4000-8000-000000000002') then raise exception 'Cross-student unlock'; end if;
 perform set_config('request.jwt.claim.role','anon',true);
 if student_learning_is_unlocked(student) then raise exception 'Unauthorized invitation unlock'; end if;
 perform set_config('request.jwt.claim.role','authenticated',true);
 update granular_assessment_sessions set revision=1,state='{"revision":1,"phase":"learning","completionReason":"coverage_gap"}';
 if student_learning_is_unlocked(student) then raise exception 'Bank failure must not complete assessment'; end if;
 update granular_assessment_sessions set revision=2,state='{"revision":2,"phase":"learning","completionReason":"later_evidence_required"}';
 if not student_learning_is_unlocked(student) then raise exception 'Deferred independent writing must not require another diagnostic'; end if;
 update granular_assessment_releases set status='withdrawn';
 if student_granular_learning_ready(student) then raise exception 'Withdrawn release unlocked learning'; end if;
end $$;
select extensions.pass('Granular learning access guards hold');
select * from extensions.finish();
rollback;
