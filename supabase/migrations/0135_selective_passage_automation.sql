-- Separate automated approval provenance from human editorial approval.
create table public.passage_automation_calibrations (
 id uuid primary key default gen_random_uuid(), pipeline_version text not null,
 evaluator_model text not null, report jsonb not null, passed boolean not null,
 created_at timestamptz not null default now()
);
create table public.passage_automation_policy (
 id boolean primary key default true check(id), enabled boolean not null default false,
 pipeline_version text not null default 'selective-passage-1', evaluator_model text,
 calibration_id uuid references public.passage_automation_calibrations(id),
 sample_percent int not null default 5 check(sample_percent between 0 and 100),
 cohort_percent int not null default 10 check(cohort_percent between 1 and 100),
 exposure_cap int not null default 100 check(exposure_cap between 1 and 1000),
 reviewer_ids uuid[] not null default '{}', created_at timestamptz not null default now()
);
insert into public.passage_automation_policy(id) values(true);
create table public.passage_qa_runs (
 id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.ai_generated_candidates(id),
 pipeline_version text not null, payload_snapshot jsonb not null,
 evaluator_model text not null, decision text not null check(decision in ('pass','human_review','reject','error')),
 report jsonb not null, sampled boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.automated_passage_publications (
 text_version_id uuid primary key references public.text_versions(id),
 qa_run_id uuid not null unique references public.passage_qa_runs(id),
 exposure_count int not null default 0 check(exposure_count>=0), withdrawn boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.content_review_versions add column publication_origin text not null default 'human' check(publication_origin in ('human','automated'));
alter table public.text_versions drop constraint text_versions_generation_type_check;
alter table public.text_versions add constraint text_versions_generation_type_check check(generation_type in ('human','ai','ai_human_reviewed','ai_automated'));
do $$ declare t text; begin
 foreach t in array array['passage_automation_calibrations','passage_automation_policy','passage_qa_runs','automated_passage_publications'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy automation_admin_read on public.%I for select to authenticated using(public.is_platform_admin())',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create function public.immutable_passage_qa() returns trigger language plpgsql as $$ begin raise exception 'automated_evidence_is_immutable'; end $$;
create trigger immutable_passage_qa before update or delete on public.passage_qa_runs for each row execute function public.immutable_passage_qa();
create trigger immutable_passage_calibration before update or delete on public.passage_automation_calibrations for each row execute function public.immutable_passage_qa();

create function public.guard_passage_automation_policy() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.enabled then
  if (select count(distinct profile_id) from content_reviewer_profiles where profile_id=any(new.reviewer_ids) and active and invite_status='active')<2 or not exists(
   select 1 from passage_automation_calibrations c where c.id=new.calibration_id and c.passed
    and c.pipeline_version=new.pipeline_version and c.evaluator_model=new.evaluator_model
    and (c.report->>'reviewedCases')::int>=6 and (c.report->>'negativeCases')::int>=2
    and (c.report->>'falseAccepts')::int=0 and (c.report->>'acceptedCases')::int>=1
  ) then raise exception 'automation_calibration_required'; end if;
 end if;
 return new;
end $$;
create trigger calibrated_automation_policy before insert or update on public.passage_automation_policy for each row execute function public.guard_passage_automation_policy();

create function public.authorize_automated_passage(p_run_id uuid,p_candidate_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare r passage_qa_runs; p passage_automation_policy; c ai_generated_candidates;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
 select * into p from passage_automation_policy where id for share;
 select * into r from passage_qa_runs where id=p_run_id;
 select * into c from ai_generated_candidates where id=p_candidate_id for update;
 if p.id is null or not p.enabled or r.id is null or c.id is null or r.candidate_id<>c.id or r.decision<>'pass'
   or r.pipeline_version<>p.pipeline_version or r.evaluator_model is distinct from p.evaluator_model
   or r.payload_snapshot<>c.payload or r.created_at<now()-interval '24 hours'
   or c.review_status in ('rejected','retired') then raise exception 'automated_publication_not_authorized'; end if;
 -- Existing human decisions always stay in their editorial workflow.
 if exists(select 1 from content_review_versions v join review_assignments a on a.review_version_id=v.id
    where v.candidate_id=c.id and a.status='submitted') then raise exception 'existing_human_review_requires_editor'; end if;
end $$;

create function public.finalize_automated_passage(p_run_id uuid,p_text_version_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare r passage_qa_runs; v text_versions;
begin
 select * into r from passage_qa_runs where id=p_run_id;
 perform authorize_automated_passage(p_run_id,r.candidate_id);
 select * into v from text_versions where id=p_text_version_id for update;
 if v.id is null or v.body is distinct from r.payload_snapshot#>>'{generated,body}'
    or v.title is distinct from r.payload_snapshot#>>'{generated,title}'
    or v.generation_type<>'ai_automated'
    or (select count(*) from questions where text_version_id=v.id)<>jsonb_array_length(r.payload_snapshot#>'{generated,questions}')

    or exists (
      select 1 from jsonb_array_elements(r.payload_snapshot#>'{generated,questions}') with ordinality expected(q,n)
      left join questions actual on actual.text_version_id=v.id and actual.question_key='q'||expected.n
      where actual.id is null or actual.question_text is distinct from expected.q->>'questionText'
        or actual.correct_answer is distinct from expected.q->>'correctAnswer'
        or actual.answer_format is distinct from expected.q->>'answerFormat'
        or (select jsonb_agg(choice_text order by choice_index) from question_choices where question_id=actual.id) is distinct from expected.q->'choices'
        or exists(select 1 from question_choices where question_id=actual.id and is_correct is distinct from (choice_text=actual.correct_answer))
    )
 then raise exception 'automated_publication_payload_mismatch'; end if;
 insert into automated_passage_publications(text_version_id,qa_run_id) values(v.id,r.id);
 update ai_generated_candidates set review_status='auto_approved',approved_text_version_id=v.id,reviewer_profile_id=null,reviewed_at=null,updated_at=now() where id=r.candidate_id;
 update content_review_versions set workflow_status='published',publication_origin='automated',published_text_version_id=v.id,updated_at=now() where candidate_id=r.candidate_id and workflow_status not in ('retired','rejected');
 update text_versions set review_status='auto_approved' where id=v.id;
 insert into audit_logs(action,target_type,target_id,metadata) values('content.automatically_published','text_version',v.id,jsonb_build_object('qaRunId',r.id,'pipelineVersion',r.pipeline_version,'sampled',r.sampled));
end $$;
create function public.rollback_automated_passage(p_run_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required'; end if;
 select text_version_id into v_id from automated_passage_publications where qa_run_id=p_run_id;
 update text_versions set review_status='draft' where id=v_id;
 update content_review_versions set workflow_status='in_review',published_text_version_id=null where published_text_version_id=v_id;
 delete from automated_passage_publications where qa_run_id=p_run_id;
end $$;
create function public.guard_automated_passage_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.review_status='auto_approved' and not exists(select 1 from automated_passage_publications where text_version_id=new.id) then raise exception 'automated_evidence_required'; end if;
 if tg_op='UPDATE' and old.review_status='auto_approved' and (new.body is distinct from old.body or new.title is distinct from old.title) then raise exception 'automated_passage_is_immutable'; end if;
 return new;
end $$;
create trigger guarded_automated_passage before insert or update on public.text_versions for each row execute function public.guard_automated_passage_status();

create function public.can_read_automated_passage(p_version uuid) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(
  select 1 from automated_passage_publications a cross join passage_automation_policy p where a.text_version_id=p_version and p.id
  and ((p.enabled and not a.withdrawn and a.exposure_count<p.exposure_cap
        and mod(('x'||substr(md5(auth.uid()::text),1,8))::bit(32)::bigint,100)<p.cohort_percent)
    or exists(select 1 from reading_sessions s where s.text_version_id=p_version and owns_student(s.student_id)))
 )
$$;
drop policy text_versions_read on public.text_versions;
create policy text_versions_read on public.text_versions for select using(
 public.is_content_staff() or (auth.uid() is not null and review_status in ('human_approved','benchmark_locked'))
 or (review_status='auto_approved' and public.can_read_automated_passage(id))
);
create function public.cap_automated_passage_session() returns trigger language plpgsql security definer set search_path=public as $$
declare a automated_passage_publications; p passage_automation_policy; user_id uuid;
begin
 select * into a from automated_passage_publications where text_version_id=new.text_version_id for update;
 if not found then return new; end if;
 select * into p from passage_automation_policy where id;
 select pr.auth_user_id into user_id from students s join profiles pr on pr.id=s.profile_id where s.id=new.student_id;
 if not p.enabled or a.withdrawn or a.exposure_count>=p.exposure_cap or user_id is null
  or mod(('x'||substr(md5(user_id::text),1,8))::bit(32)::bigint,100)>=p.cohort_percent
 then raise exception 'automated_passage_cohort_or_cap'; end if;
 update automated_passage_publications set exposure_count=exposure_count+1 where text_version_id=a.text_version_id;
 return new;
end $$;
create trigger cap_automated_passage before insert on public.reading_sessions for each row execute function public.cap_automated_passage_session();
revoke all on function public.authorize_automated_passage(uuid,uuid),public.finalize_automated_passage(uuid,uuid),public.rollback_automated_passage(uuid) from public,anon,authenticated;
grant execute on function public.authorize_automated_passage(uuid,uuid),public.finalize_automated_passage(uuid,uuid),public.rollback_automated_passage(uuid) to service_role;
revoke all on function public.can_read_automated_passage(uuid) from public,anon;
grant execute on function public.can_read_automated_passage(uuid) to authenticated,service_role;

-- Include previously auto-published content in semantic duplicate checks (caller RLS still applies).
create or replace function public.match_text_versions(p_embedding vector(1536),p_threshold numeric default 0.92,p_limit integer default 5)
returns table(text_version_id uuid,title text,similarity numeric)
language sql stable set search_path=public as $$
 select tv.id,tv.title,(1-(tv.embedding <=> p_embedding))::numeric from text_versions tv
 where tv.embedding is not null and tv.review_status in ('human_approved','benchmark_locked','auto_approved')
 and 1-(tv.embedding <=> p_embedding)>=p_threshold order by tv.embedding <=> p_embedding limit p_limit
$$;
-- Questions and keys must stay identical to their QA evidence. Create a new version to correct them.
create function public.guard_automated_passage_questions() returns trigger language plpgsql security definer set search_path=public as $$
declare old_version uuid; new_version uuid;
begin
 if tg_table_name='questions' then
  if tg_op<>'INSERT' then old_version=old.text_version_id; end if;
  if tg_op<>'DELETE' then new_version=new.text_version_id; end if;
 else
  if tg_op<>'INSERT' then select text_version_id into old_version from questions where id=old.question_id; end if;
  if tg_op<>'DELETE' then select text_version_id into new_version from questions where id=new.question_id; end if;
 end if;
 if exists(select 1 from automated_passage_publications where text_version_id in (old_version,new_version)) then raise exception 'automated_questions_are_immutable'; end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger guarded_automated_questions before insert or update or delete on questions for each row execute function public.guard_automated_passage_questions();
create trigger guarded_automated_choices before insert or update or delete on question_choices for each row execute function public.guard_automated_passage_questions();

-- Select work in SQL so older held cases cannot starve newly generated candidates.
create function public.pending_automated_passages(p_limit int default 3) returns setof ai_generated_candidates
language plpgsql security definer set search_path=public as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service_role_required'; end if;
 return query select c.* from ai_generated_candidates c cross join passage_automation_policy p
 where p.id and c.candidate_type='reading_text' and c.approved_text_version_id is null
 and c.review_status in ('auto_approved','needs_human_review') and c.created_at>=p.created_at
 and not exists(select 1 from content_review_versions v join review_assignments a on a.review_version_id=v.id where v.candidate_id=c.id and a.status='submitted')
 and not exists(select 1 from passage_qa_runs r where r.candidate_id=c.id and r.pipeline_version=p.pipeline_version and r.payload_snapshot=c.payload and (r.decision<>'pass' or not p.enabled))
 order by c.created_at limit greatest(1,least(p_limit,10));
end $$;
revoke all on function public.pending_automated_passages(int) from public,anon,authenticated;
grant execute on function public.pending_automated_passages(int) to service_role;
-- Adverse sample feedback immediately removes the affected text from new sessions.
create function public.withdraw_automated_passage_on_review() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='submitted' and new.overall_decision in ('reject','needs_revision') then
  update automated_passage_publications ap set withdrawn=true
  from content_review_versions v join review_assignments a on a.review_version_id=v.id
  where a.id=new.assignment_id and ap.text_version_id=v.published_text_version_id;
 end if;
 return new;
end $$;
create trigger withdraw_adverse_automated_review after insert or update on passage_reviews for each row execute function public.withdraw_automated_passage_on_review();
