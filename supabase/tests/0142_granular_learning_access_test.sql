begin;
insert into students(id) values ('10000000-0000-4000-8000-000000000001');
insert into taxonomy_releases(id,status,release_key) values ('20000000-0000-4000-8000-000000000001','published','french-taxonomy-v3');
insert into diagnostic_item_bank_releases(id,status,taxonomy_release_id) values ('30000000-0000-4000-8000-000000000001','published','20000000-0000-4000-8000-000000000001');
insert into granular_assessment_releases(id,release_key,taxonomy_release_id,bank_release_id,status,content_checksum,bundle)
values ('40000000-0000-4000-8000-000000000001','test-granular','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','published','test','{}');
insert into granular_assessment_sessions(student_id,release_id,state) values
('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','{"revision":0,"phase":"learning","completionReason":"time_budget"}');
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('test.student_id','10000000-0000-4000-8000-000000000001',true);
select set_config('test.authorized','true',true);
do $$ declare student uuid:='10000000-0000-4000-8000-000000000001'; begin
 if not student_learning_is_unlocked(student) then raise exception 'Time-budget completion must permit learning'; end if;
 if student_granular_learning_ready('10000000-0000-4000-8000-000000000002') then raise exception 'Cross-student unlock'; end if;
 perform set_config('test.authorized','false',true);
 if student_learning_is_unlocked(student) then raise exception 'Unauthorized invitation unlock'; end if;
 perform set_config('test.authorized','true',true);
 update granular_assessment_sessions set revision=1,state='{"revision":1,"phase":"learning","completionReason":"coverage_gap"}';
 if student_learning_is_unlocked(student) then raise exception 'Bank failure must not complete assessment'; end if;
 perform set_config('test.legacy','true',true);
 if not student_learning_is_unlocked(student) then raise exception 'Legacy completion no longer valid'; end if;
 perform set_config('test.legacy','false',true);
 update granular_assessment_sessions set revision=2,state='{"revision":2,"phase":"learning","completionReason":"later_evidence_required"}';
 if not student_learning_is_unlocked(student) then raise exception 'Deferred independent writing must not require another diagnostic'; end if;
 update granular_assessment_releases set status='withdrawn';
 if student_granular_learning_ready(student) then raise exception 'Withdrawn release unlocked learning'; end if;
end $$;
rollback;
