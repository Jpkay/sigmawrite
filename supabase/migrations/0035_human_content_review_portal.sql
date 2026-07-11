-- Human content review portal: independent assignments, immutable submissions,
-- audited editorial resolution, and version-pinned gold benchmarks.

create table public.content_reviewer_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  active boolean not null default true,
  invite_status text not null default 'active'
    check (invite_status in ('pending','invited','active','deactivated')),
  invited_email text,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz,
  activated_at timestamptz,
  deactivated_at timestamptz,
  last_activity_at timestamptz,
  instructions_version text,
  instructions_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_review_settings (
  id boolean primary key default true check (id),
  required_reviewers smallint not null default 3 check (required_reviewers between 2 and 5),
  instructions_version text not null default '2026-07-10',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.content_review_settings (id) values (true) on conflict do nothing;

create table public.content_review_versions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.ai_generated_candidates(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  previous_version_id uuid references public.content_review_versions(id) on delete restrict,
  payload jsonb not null,
  workflow_status text not null default 'ready_for_review'
    check (workflow_status in ('generated','ready_for_review','in_review','review_complete','needs_revision','approved','rejected','published','retired')),
  required_reviewers smallint not null default 3 check (required_reviewers between 2 and 5),
  agreement_classification text
    check (agreement_classification is null or agreement_classification in ('unanimous','strong_agreement','mixed','high_disagreement')),
  average_score numeric(4,2),
  rating_spread smallint,
  final_resolution_id uuid,
  published_text_version_id uuid references public.text_versions(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  revision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, version_number)
);

create table public.review_assignments (
  id uuid primary key default gen_random_uuid(),
  review_version_id uuid not null references public.content_review_versions(id) on delete restrict,
  reviewer_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned','draft','submitted')),
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (review_version_id, reviewer_profile_id)
);

create table public.passage_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.review_assignments(id) on delete restrict,
  reviewer_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','submitted')),
  naturalness_score smallint check (naturalness_score between 1 and 4),
  pedagogical_quality_score smallint check (pedagogical_quality_score between 1 and 4),
  engagement_score smallint check (engagement_score between 1 and 4),
  difficulty_match_score smallint check (difficulty_match_score between 1 and 4),
  vocabulary_score smallint check (vocabulary_score between 1 and 4),
  grammar_score smallint check (grammar_score between 1 and 4),
  question_quality_score smallint check (question_quality_score between 1 and 4),
  cultural_age_score smallint check (cultural_age_score between 1 and 4),
  overall_decision text check (overall_decision is null or overall_decision in ('approve','approve_minor','needs_revision','reject')),
  general_comment text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table public.passage_review_issue_tags (
  review_id uuid not null references public.passage_reviews(id) on delete restrict,
  issue_tag text not null check (issue_tag in (
    'unnatural_language','vocabulary_too_difficult','vocabulary_too_easy','difficulty_mismatch',
    'grammar_error','factual_issue','ambiguous_question','multiple_correct_answers','weak_distractors',
    'low_engagement','cultural_issue','age_inappropriate','repetition','other'
  )),
  created_at timestamptz not null default now(),
  primary key (review_id, issue_tag)
);

create table public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  passage_review_id uuid not null references public.passage_reviews(id) on delete restrict,
  question_index integer not null check (question_index >= 0),
  outcome text not null check (outcome in ('correct_clear','minor_issue','ambiguous','incorrect')),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (passage_review_id, question_index)
);

create table public.editorial_resolutions (
  id uuid primary key default gen_random_uuid(),
  review_version_id uuid not null references public.content_review_versions(id) on delete restrict,
  action text not null check (action in ('approve','approve_with_edits','send_for_revision','reject','request_another_review')),
  admin_note text not null check (length(btrim(admin_note)) > 0),
  reviewer_results_snapshot jsonb not null,
  resolved_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.content_review_versions
  add constraint content_review_versions_resolution_fk
  foreign key (final_resolution_id) references public.editorial_resolutions(id) on delete restrict;

create table public.benchmark_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  benchmark_version integer not null default 1 check (benchmark_version > 0),
  target_count smallint not null default 6 check (target_count = 6),
  status text not null default 'draft' check (status in ('draft','locked')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  locked_at timestamptz
);
insert into public.benchmark_sets (code) values ('INITIAL-GOLD') on conflict do nothing;

create table public.content_benchmarks (
  id uuid primary key default gen_random_uuid(),
  benchmark_set_id uuid not null references public.benchmark_sets(id) on delete restrict,
  benchmark_code text not null,
  benchmark_version integer not null default 1 check (benchmark_version > 0),
  review_version_id uuid not null references public.content_review_versions(id) on delete restrict,
  text_version_id uuid not null references public.text_versions(id) on delete restrict,
  question_snapshot jsonb not null,
  locked boolean not null default true,
  locked_by uuid not null references public.profiles(id) on delete restrict,
  locked_at timestamptz not null default now(),
  unlocked_by uuid references public.profiles(id) on delete restrict,
  unlocked_at timestamptz,
  unlock_reason text,
  created_at timestamptz not null default now(),
  unique (benchmark_set_id, benchmark_code, benchmark_version)
);
create unique index content_benchmarks_one_locked_version
  on public.content_benchmarks (benchmark_set_id, review_version_id) where locked;
create unique index content_benchmarks_locked_code
  on public.content_benchmarks (benchmark_set_id, benchmark_code) where locked;

create table public.review_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('assignments_created','assignments_incomplete','review_complete','high_disagreement')),
  title text not null,
  body text not null,
  review_version_id uuid references public.content_review_versions(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index content_review_versions_queue_idx on public.content_review_versions (workflow_status, updated_at desc);
create index review_assignments_reviewer_queue_idx on public.review_assignments (reviewer_profile_id, status, assigned_at);
create index review_assignments_version_idx on public.review_assignments (review_version_id, status);
create index passage_reviews_reviewer_idx on public.passage_reviews (reviewer_profile_id, status);
create index editorial_resolutions_version_idx on public.editorial_resolutions (review_version_id, created_at desc);
create index review_notifications_recipient_idx on public.review_notifications (recipient_profile_id, read_at, created_at desc);

-- Reviewers use only the dedicated portal. Existing staff helpers are narrowed
-- so the role no longer inherits the AI studio or catalog administration RLS.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('platform_admin','school_admin'), false)
$$;
create or replace function public.is_content_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'platform_admin', false)
$$;
create or replace function public.is_catalog_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'platform_admin', false)
$$;

create or replace function public.is_active_content_reviewer(p_profile_id uuid default public.current_profile_id())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.content_reviewer_profiles rp on rp.profile_id = p.id
    where p.id = p_profile_id
      and p.auth_user_id = auth.uid()
      and p.role in ('platform_admin','content_reviewer')
      and rp.active
  )
$$;

create or replace function public.review_score_average(p public.passage_reviews)
returns numeric language sql immutable as $$
  select (
    p.naturalness_score + p.pedagogical_quality_score + p.engagement_score + p.difficulty_match_score +
    p.vocabulary_score + p.grammar_score + p.question_quality_score + p.cultural_age_score
  )::numeric / 8
$$;

create or replace function public.protect_submitted_passage_review()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status='submitted' then raise exception 'submitted_review_is_immutable'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger passage_reviews_immutable
before update or delete on public.passage_reviews
for each row execute function public.protect_submitted_passage_review();

create or replace function public.protect_submitted_question_review()
returns trigger language plpgsql set search_path = public as $$
declare v_review uuid := coalesce(new.passage_review_id,old.passage_review_id);
begin
  if exists(select 1 from public.passage_reviews where id=v_review and status='submitted') then
    raise exception 'submitted_review_is_immutable';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger question_reviews_immutable
before insert or update or delete on public.question_reviews
for each row execute function public.protect_submitted_question_review();

create or replace function public.protect_submitted_issue_tag()
returns trigger language plpgsql set search_path = public as $$
declare v_review uuid := coalesce(new.review_id,old.review_id);
begin
  if exists(select 1 from public.passage_reviews where id=v_review and status='submitted') then
    raise exception 'submitted_review_is_immutable';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
create trigger review_issue_tags_immutable
before insert or update or delete on public.passage_review_issue_tags
for each row execute function public.protect_submitted_issue_tag();

create or replace function public.protect_review_version_snapshot()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.candidate_id<>old.candidate_id or new.version_number<>old.version_number or new.payload<>old.payload or new.previous_version_id is distinct from old.previous_version_id then
    raise exception 'review_version_snapshot_is_immutable';
  end if;
  return new;
end;
$$;
create trigger content_review_version_snapshot_immutable
before update on public.content_review_versions
for each row execute function public.protect_review_version_snapshot();

create or replace function public.refresh_content_review_status(p_review_version_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_required integer;
  v_submitted integer;
  v_min integer;
  v_max integer;
  v_distinct_decisions integer;
  v_has_approve boolean;
  v_has_reject boolean;
  v_only_approval boolean;
  v_classification text;
begin
  select required_reviewers into v_required from public.content_review_versions where id = p_review_version_id for update;
  select count(*), min(least(naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score)),
    max(greatest(naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score)),
    count(distinct overall_decision), bool_or(overall_decision in ('approve','approve_minor')), bool_or(overall_decision = 'reject'), bool_and(overall_decision in ('approve','approve_minor'))
  into v_submitted, v_min, v_max, v_distinct_decisions, v_has_approve, v_has_reject, v_only_approval
  from public.passage_reviews pr
  join public.review_assignments ra on ra.id = pr.assignment_id
  where ra.review_version_id = p_review_version_id and pr.status = 'submitted';

  if v_submitted < v_required then
    update public.content_review_versions set workflow_status = 'in_review', updated_at = now() where id = p_review_version_id;
    return;
  end if;

  if v_distinct_decisions = 1 then v_classification := 'unanimous';
  elsif v_has_approve and v_has_reject or (v_max - v_min) >= 3 then v_classification := 'high_disagreement';
  elsif v_only_approval then v_classification := 'strong_agreement';
  else v_classification := 'mixed';
  end if;

  update public.content_review_versions rv set
    workflow_status = 'review_complete',
    agreement_classification = v_classification,
    average_score = (select round(avg(public.review_score_average(pr)),2) from public.passage_reviews pr join public.review_assignments ra on ra.id=pr.assignment_id where ra.review_version_id=p_review_version_id and pr.status='submitted'),
    rating_spread = v_max - v_min,
    updated_at = now()
  where rv.id = p_review_version_id;

  insert into public.review_notifications (recipient_profile_id,notification_type,title,body,review_version_id)
  select p.id, 'review_complete', 'Évaluation terminée', 'Toutes les évaluations requises ont été soumises.', p_review_version_id
  from public.profiles p where p.role='platform_admin';
  if v_classification = 'high_disagreement' then
    insert into public.review_notifications (recipient_profile_id,notification_type,title,body,review_version_id)
    select p.id, 'high_disagreement', 'Désaccord important', 'Une décision éditoriale est requise.', p_review_version_id
    from public.profiles p where p.role='platform_admin';
  end if;
end;
$$;

create or replace function public.acknowledge_review_instructions()
returns void language plpgsql security definer set search_path = public as $$
declare v_profile uuid := public.current_profile_id(); v_version text;
begin
  if not public.is_active_content_reviewer(v_profile) then raise exception 'reviewer_access_denied'; end if;
  select instructions_version into v_version from public.content_review_settings where id;
  update public.content_reviewer_profiles set instructions_version=v_version,instructions_acknowledged_at=now(),last_activity_at=now(),updated_at=now() where profile_id=v_profile;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_profile,'review.instructions_acknowledged','profile',v_profile,jsonb_build_object('version',v_version));
end;
$$;

create or replace function public.save_content_review(
  p_assignment_id uuid, p_scores jsonb, p_decision text, p_general_comment text,
  p_issue_tags text[], p_question_reviews jsonb, p_submit boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid := public.current_profile_id(); v_assignment public.review_assignments; v_review_id uuid;
  v_question jsonb; v_question_count integer; v_score integer; v_requires_comment boolean := false;
  v_keys text[] := array['naturalness','pedagogical_quality','engagement','difficulty_match','vocabulary','grammar','question_quality','cultural_age'];
  v_key text; v_started timestamptz;
begin
  if not public.is_active_content_reviewer(v_profile) then raise exception 'reviewer_access_denied'; end if;
  select * into v_assignment from public.review_assignments where id=p_assignment_id and reviewer_profile_id=v_profile for update;
  if not found then raise exception 'assignment_not_found'; end if;
  if v_assignment.status='submitted' then raise exception 'submitted_review_is_immutable'; end if;
  select jsonb_array_length(coalesce(payload#>'{generated,questions}','[]'::jsonb)) into v_question_count
  from public.content_review_versions where id=v_assignment.review_version_id;

  if p_submit then
    if p_decision not in ('approve','approve_minor','needs_revision','reject') then raise exception 'decision_required'; end if;
    foreach v_key in array v_keys loop
      v_score := nullif(p_scores->>v_key,'')::integer;
      if v_score is null or v_score not between 1 and 4 then raise exception 'all_scores_required'; end if;
      if v_score=1 then v_requires_comment:=true; end if;
    end loop;
    if p_decision in ('needs_revision','reject') then v_requires_comment:=true; end if;
    if v_requires_comment and length(btrim(coalesce(p_general_comment,'')))=0 then raise exception 'general_comment_required'; end if;
    if jsonb_array_length(coalesce(p_question_reviews,'[]'::jsonb)) <> v_question_count then raise exception 'all_questions_required'; end if;
  end if;

  insert into public.passage_reviews(assignment_id,reviewer_profile_id,status,naturalness_score,pedagogical_quality_score,engagement_score,difficulty_match_score,vocabulary_score,grammar_score,question_quality_score,cultural_age_score,overall_decision,general_comment,submitted_at)
  values(p_assignment_id,v_profile,'draft',
    nullif(p_scores->>'naturalness','')::integer,nullif(p_scores->>'pedagogical_quality','')::integer,nullif(p_scores->>'engagement','')::integer,nullif(p_scores->>'difficulty_match','')::integer,
    nullif(p_scores->>'vocabulary','')::integer,nullif(p_scores->>'grammar','')::integer,nullif(p_scores->>'question_quality','')::integer,nullif(p_scores->>'cultural_age','')::integer,
    nullif(p_decision,''),nullif(btrim(coalesce(p_general_comment,'')),''),null)
  on conflict(assignment_id) do update set
    status=excluded.status,naturalness_score=excluded.naturalness_score,pedagogical_quality_score=excluded.pedagogical_quality_score,engagement_score=excluded.engagement_score,difficulty_match_score=excluded.difficulty_match_score,
    vocabulary_score=excluded.vocabulary_score,grammar_score=excluded.grammar_score,question_quality_score=excluded.question_quality_score,cultural_age_score=excluded.cultural_age_score,
    overall_decision=excluded.overall_decision,general_comment=excluded.general_comment,submitted_at=excluded.submitted_at,updated_at=now()
  returning id into v_review_id;

  delete from public.passage_review_issue_tags where review_id=v_review_id;
  insert into public.passage_review_issue_tags(review_id,issue_tag) select v_review_id,unnest(coalesce(p_issue_tags,'{}'));
  delete from public.question_reviews where passage_review_id=v_review_id;
  for v_question in select * from jsonb_array_elements(coalesce(p_question_reviews,'[]'::jsonb)) loop
    if (v_question->>'questionIndex')::integer < 0 or (v_question->>'questionIndex')::integer >= v_question_count then raise exception 'invalid_question_index'; end if;
    if v_question->>'outcome' not in ('correct_clear','minor_issue','ambiguous','incorrect') then raise exception 'invalid_question_outcome'; end if;
    if v_question->>'outcome' in ('ambiguous','incorrect') and length(btrim(coalesce(v_question->>'comment','')))=0 then raise exception 'question_comment_required'; end if;
    insert into public.question_reviews(passage_review_id,question_index,outcome,comment)
    values(v_review_id,(v_question->>'questionIndex')::integer,v_question->>'outcome',nullif(btrim(coalesce(v_question->>'comment','')),''));
  end loop;

  v_started := coalesce(v_assignment.started_at,now());
  update public.review_assignments set status=case when p_submit then 'submitted' else 'draft' end,started_at=v_started,submitted_at=case when p_submit then now() else null end,updated_at=now() where id=p_assignment_id;
  update public.passage_reviews set status=case when p_submit then 'submitted' else 'draft' end,
    submitted_at=case when p_submit then now() else null end,
    duration_seconds=case when p_submit then greatest(0,extract(epoch from (now()-v_started))::integer) else duration_seconds end,
    updated_at=now() where id=v_review_id;
  update public.content_reviewer_profiles set last_activity_at=now(),updated_at=now() where profile_id=v_profile;
  if p_submit then
    insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_profile,'review.submitted','review_assignment',p_assignment_id,jsonb_build_object('reviewId',v_review_id));
    perform public.refresh_content_review_status(v_assignment.review_version_id);
  end if;
  return v_review_id;
end;
$$;

create or replace function public.assign_content_reviews(p_review_version_ids uuid[], p_reviewer_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare v_admin uuid := public.current_profile_id(); v_version uuid; v_reviewer uuid; v_count integer:=0;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if coalesce(array_length(p_reviewer_ids,1),0) < 2 or array_length(p_reviewer_ids,1) > 3 then raise exception 'select_two_or_three_reviewers'; end if;
  foreach v_reviewer in array p_reviewer_ids loop
    if not exists(select 1 from public.content_reviewer_profiles where profile_id=v_reviewer and active) then raise exception 'inactive_reviewer'; end if;
  end loop;
  foreach v_version in array p_review_version_ids loop
    if not exists(select 1 from public.content_review_versions where id=v_version and workflow_status in ('ready_for_review','in_review')) then raise exception 'review_version_not_assignable'; end if;
    foreach v_reviewer in array p_reviewer_ids loop
      insert into public.review_assignments(review_version_id,reviewer_profile_id,assigned_by) values(v_version,v_reviewer,v_admin) on conflict do nothing;
      if found then v_count:=v_count+1; end if;
    end loop;
    update public.content_review_versions set required_reviewers=array_length(p_reviewer_ids,1),workflow_status='in_review',updated_at=now() where id=v_version;
  end loop;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body)
  select reviewer,'assignments_created','Nouveaux textes à évaluer',format('%s nouvelle(s) évaluation(s) vous ont été attribuée(s).',cardinality(p_review_version_ids)) from unnest(p_reviewer_ids) reviewer;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body)
  select reviewer,'assignments_incomplete','Évaluations en attente','Votre file contient des passages qui ne sont pas encore validés.' from unnest(p_reviewer_ids) reviewer;
  insert into public.audit_logs(actor_profile_id,action,target_type,metadata) values(v_admin,'review.assignments_created','content_review_version',jsonb_build_object('versions',p_review_version_ids,'reviewers',p_reviewer_ids,'created',v_count));
  return v_count;
end;
$$;

create or replace function public.reassign_content_review(p_assignment_id uuid,p_new_reviewer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_assignment public.review_assignments;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  select * into v_assignment from public.review_assignments where id=p_assignment_id for update;
  if not found then raise exception 'assignment_not_found'; end if;
  if v_assignment.status='submitted' then raise exception 'submitted_assignment_preserved'; end if;
  if not exists(select 1 from public.content_reviewer_profiles where profile_id=p_new_reviewer_id and active) then raise exception 'inactive_reviewer'; end if;
  delete from public.question_reviews where passage_review_id in (select id from public.passage_reviews where assignment_id=p_assignment_id);
  delete from public.passage_review_issue_tags where review_id in (select id from public.passage_reviews where assignment_id=p_assignment_id);
  delete from public.passage_reviews where assignment_id=p_assignment_id;
  update public.review_assignments set reviewer_profile_id=p_new_reviewer_id,assigned_by=v_admin,assigned_at=now(),updated_at=now() where id=p_assignment_id;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body,review_version_id) values(p_new_reviewer_id,'assignments_created','Nouveau texte à évaluer','Une évaluation vous a été réattribuée.',v_assignment.review_version_id);
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_admin,'review.assignment_reassigned','review_assignment',p_assignment_id,jsonb_build_object('previousReviewer',v_assignment.reviewer_profile_id,'newReviewer',p_new_reviewer_id));
end;
$$;

create or replace function public.resolve_content_review(p_review_version_id uuid,p_action text,p_admin_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_resolution uuid; v_snapshot jsonb;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if p_action not in ('approve','approve_with_edits','send_for_revision','reject','request_another_review') then raise exception 'invalid_resolution'; end if;
  if length(btrim(coalesce(p_admin_note,'')))=0 then raise exception 'admin_note_required'; end if;
  if not exists(select 1 from public.content_review_versions where id=p_review_version_id and workflow_status='review_complete') then raise exception 'review_not_complete'; end if;
  select jsonb_agg(jsonb_build_object('reviewId',pr.id,'reviewerProfileId',pr.reviewer_profile_id,'decision',pr.overall_decision,'averageScore',public.review_score_average(pr),'submittedAt',pr.submitted_at) order by pr.submitted_at)
  into v_snapshot from public.passage_reviews pr join public.review_assignments ra on ra.id=pr.assignment_id where ra.review_version_id=p_review_version_id and pr.status='submitted';
  insert into public.editorial_resolutions(review_version_id,action,admin_note,reviewer_results_snapshot,resolved_by)
  values(p_review_version_id,p_action,btrim(p_admin_note),coalesce(v_snapshot,'[]'::jsonb),v_admin) returning id into v_resolution;
  update public.content_review_versions set final_resolution_id=v_resolution,
    workflow_status=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'request_another_review' then 'in_review' else 'needs_revision' end,updated_at=now()
    ,required_reviewers=case when p_action='request_another_review' then least(required_reviewers+1,5) else required_reviewers end
  where id=p_review_version_id;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_admin,'review.editorial_resolution','content_review_version',p_review_version_id,jsonb_build_object('resolutionId',v_resolution,'action',p_action,'note',btrim(p_admin_note),'reviewerResults',v_snapshot));
  return v_resolution;
end;
$$;

create or replace function public.request_additional_content_review(p_review_version_id uuid,p_reviewer_id uuid,p_admin_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_resolution uuid; v_assignment uuid;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if not exists(select 1 from public.content_reviewer_profiles where profile_id=p_reviewer_id and active) then raise exception 'inactive_reviewer'; end if;
  if exists(select 1 from public.review_assignments where review_version_id=p_review_version_id and reviewer_profile_id=p_reviewer_id) then raise exception 'reviewer_already_assigned'; end if;
  v_resolution:=public.resolve_content_review(p_review_version_id,'request_another_review',p_admin_note);
  insert into public.review_assignments(review_version_id,reviewer_profile_id,assigned_by) values(p_review_version_id,p_reviewer_id,v_admin) returning id into v_assignment;
  insert into public.review_notifications(recipient_profile_id,notification_type,title,body,review_version_id) values(p_reviewer_id,'assignments_created','Avis supplémentaire demandé','Un passage vous a été attribué pour départager les avis.',p_review_version_id);
  return v_assignment;
end;
$$;

create or replace function public.create_content_review_revision(p_review_version_id uuid,p_payload jsonb,p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_old public.content_review_versions; v_new uuid;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if length(btrim(coalesce(p_reason,'')))=0 then raise exception 'revision_reason_required'; end if;
  select * into v_old from public.content_review_versions where id=p_review_version_id for update;
  if not found then raise exception 'review_version_not_found'; end if;
  insert into public.content_review_versions(candidate_id,version_number,previous_version_id,payload,workflow_status,required_reviewers,created_by,revision_reason)
  values(v_old.candidate_id,v_old.version_number+1,v_old.id,p_payload,'ready_for_review',v_old.required_reviewers,v_admin,btrim(p_reason)) returning id into v_new;
  update public.content_review_versions set workflow_status='needs_revision',updated_at=now() where id=v_old.id;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_admin,'review.revision_created','content_review_version',v_new,jsonb_build_object('previousVersionId',v_old.id,'reason',btrim(p_reason)));
  return v_new;
end;
$$;

create or replace function public.lock_content_benchmark(p_review_version_id uuid,p_benchmark_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_set uuid; v_text_version uuid; v_benchmark uuid; v_count integer; v_questions jsonb;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if p_benchmark_code not in ('GOLD-01','GOLD-02','GOLD-03','GOLD-04','GOLD-05','GOLD-06') then raise exception 'invalid_benchmark_code'; end if;
  select id into v_set from public.benchmark_sets where code='INITIAL-GOLD' for update;
  select published_text_version_id into v_text_version from public.content_review_versions where id=p_review_version_id and workflow_status='published' and final_resolution_id is not null;
  if v_text_version is null then raise exception 'benchmark_not_eligible'; end if;
  if exists(select 1 from public.passage_review_issue_tags t join public.passage_reviews pr on pr.id=t.review_id join public.review_assignments ra on ra.id=pr.assignment_id where ra.review_version_id=p_review_version_id and t.issue_tag in ('factual_issue','cultural_issue','age_inappropriate','multiple_correct_answers')) then raise exception 'unresolved_critical_issue'; end if;
  select jsonb_agg(jsonb_build_object('id',q.id,'text',q.question_text,'type',q.question_type,'answer',q.correct_answer,'choices',(select jsonb_agg(jsonb_build_object('id',qc.id,'text',qc.choice_text,'correct',qc.is_correct) order by qc.choice_index) from public.question_choices qc where qc.question_id=q.id)) order by q.created_at)
  into v_questions from public.questions q where q.text_version_id=v_text_version;
  if coalesce(jsonb_array_length(v_questions),0)=0 then raise exception 'approved_questions_required'; end if;
  select count(*) into v_count from public.content_benchmarks where benchmark_set_id=v_set and locked;
  if v_count>=6 then raise exception 'six_benchmarks_already_locked'; end if;
  insert into public.content_benchmarks(benchmark_set_id,benchmark_code,review_version_id,text_version_id,question_snapshot,locked_by)
  values(v_set,p_benchmark_code,p_review_version_id,v_text_version,v_questions,v_admin) returning id into v_benchmark;
  update public.text_versions set review_status='benchmark_locked' where id=v_text_version;
  if v_count+1=6 then update public.benchmark_sets set status='locked',locked_at=now() where id=v_set; end if;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_admin,'benchmark.locked','content_benchmark',v_benchmark,jsonb_build_object('code',p_benchmark_code,'reviewVersionId',p_review_version_id,'textVersionId',v_text_version));
  return v_benchmark;
end;
$$;

create or replace function public.unlock_content_benchmark(p_benchmark_id uuid,p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid:=public.current_profile_id(); v_row public.content_benchmarks;
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if length(btrim(coalesce(p_reason,'')))=0 then raise exception 'unlock_reason_required'; end if;
  select * into v_row from public.content_benchmarks where id=p_benchmark_id and locked for update;
  if not found then raise exception 'locked_benchmark_not_found'; end if;
  update public.content_benchmarks set locked=false,unlocked_by=v_admin,unlocked_at=now(),unlock_reason=btrim(p_reason) where id=p_benchmark_id;
  update public.text_versions set review_status='human_approved' where id=v_row.text_version_id;
  update public.benchmark_sets set status='draft',locked_at=null where id=v_row.benchmark_set_id;
  insert into public.audit_logs(actor_profile_id,action,target_type,target_id,metadata) values(v_admin,'benchmark.unlocked','content_benchmark',p_benchmark_id,jsonb_build_object('reason',btrim(p_reason)));
end;
$$;

create or replace function public.lock_initial_benchmark_set(p_review_version_ids uuid[])
returns uuid[] language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_index integer:=0; v_results uuid[]:='{}';
begin
  if not public.is_platform_admin() then raise exception 'admin_required'; end if;
  if cardinality(p_review_version_ids)<>6 or (select count(distinct value) from unnest(p_review_version_ids) value)<>6 then raise exception 'exactly_six_unique_benchmarks_required'; end if;
  foreach v_id in array p_review_version_ids loop
    v_index:=v_index+1;
    v_results:=array_append(v_results,public.lock_content_benchmark(v_id,format('GOLD-%s',lpad(v_index::text,2,'0'))));
  end loop;
  return v_results;
end;
$$;

-- Prepare an immutable first review version for every candidate still waiting.
insert into public.content_review_versions(candidate_id,version_number,payload,workflow_status,required_reviewers)
select c.id,1,c.payload,'ready_for_review',s.required_reviewers
from public.ai_generated_candidates c cross join public.content_review_settings s
where c.review_status='needs_human_review'
on conflict(candidate_id,version_number) do nothing;

-- Existing platform administrators can participate as the first reviewer.
insert into public.content_reviewer_profiles(profile_id,active,invite_status,activated_at)
select id,true,'active',now() from public.profiles where role='platform_admin'
on conflict(profile_id) do nothing;

do $$ declare t text; begin
  foreach t in array array['content_reviewer_profiles','content_review_settings','content_review_versions','review_assignments','passage_reviews','passage_review_issue_tags','question_reviews','editorial_resolutions','benchmark_sets','content_benchmarks','review_notifications'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

create policy reviewer_profiles_self on public.content_reviewer_profiles for select using (profile_id=public.current_profile_id() or public.is_platform_admin());
create policy reviewer_profiles_admin on public.content_reviewer_profiles for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy review_settings_read on public.content_review_settings for select using (public.is_active_content_reviewer() or public.is_platform_admin());
create policy review_settings_admin on public.content_review_settings for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy review_versions_read on public.content_review_versions for select using (public.is_platform_admin() or (public.is_active_content_reviewer() and exists(select 1 from public.review_assignments a where a.review_version_id=content_review_versions.id and a.reviewer_profile_id=public.current_profile_id())));
create policy review_versions_admin on public.content_review_versions for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy review_assignments_read on public.review_assignments for select using (public.is_platform_admin() or (public.is_active_content_reviewer() and reviewer_profile_id=public.current_profile_id()));
create policy review_assignments_admin on public.review_assignments for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy passage_reviews_read on public.passage_reviews for select using (public.is_platform_admin() or (public.is_active_content_reviewer() and reviewer_profile_id=public.current_profile_id()));
create policy passage_reviews_admin on public.passage_reviews for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy issue_tags_read on public.passage_review_issue_tags for select using (public.is_platform_admin() or exists(select 1 from public.passage_reviews pr where pr.id=review_id and pr.reviewer_profile_id=public.current_profile_id() and public.is_active_content_reviewer()));
create policy issue_tags_admin on public.passage_review_issue_tags for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy question_reviews_read on public.question_reviews for select using (public.is_platform_admin() or exists(select 1 from public.passage_reviews pr where pr.id=passage_review_id and pr.reviewer_profile_id=public.current_profile_id() and public.is_active_content_reviewer()));
create policy question_reviews_admin on public.question_reviews for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy editorial_resolutions_admin on public.editorial_resolutions for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy benchmark_sets_admin on public.benchmark_sets for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy benchmarks_admin on public.content_benchmarks for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy notifications_read on public.review_notifications for select using (recipient_profile_id=public.current_profile_id() or public.is_platform_admin());
create policy notifications_update on public.review_notifications for update using (recipient_profile_id=public.current_profile_id()) with check (recipient_profile_id=public.current_profile_id());
create policy notifications_admin on public.review_notifications for all using (public.is_platform_admin()) with check (public.is_platform_admin());

grant select on public.content_reviewer_profiles,public.content_review_settings,public.content_review_versions,public.review_assignments,public.passage_reviews,public.passage_review_issue_tags,public.question_reviews,public.editorial_resolutions,public.benchmark_sets,public.content_benchmarks,public.review_notifications to authenticated;
revoke insert,update,delete on public.content_review_versions,public.review_assignments,public.passage_reviews,public.passage_review_issue_tags,public.question_reviews,public.editorial_resolutions,public.benchmark_sets,public.content_benchmarks from authenticated;
revoke insert,update,delete on public.review_notifications from authenticated;
grant update(read_at) on public.review_notifications to authenticated;

revoke execute on function public.refresh_content_review_status(uuid) from anon,authenticated,service_role;
grant execute on function public.acknowledge_review_instructions() to authenticated;
grant execute on function public.save_content_review(uuid,jsonb,text,text,text[],jsonb,boolean) to authenticated;
grant execute on function public.assign_content_reviews(uuid[],uuid[]) to authenticated;
grant execute on function public.reassign_content_review(uuid,uuid) to authenticated;
grant execute on function public.resolve_content_review(uuid,text,text) to authenticated;
grant execute on function public.request_additional_content_review(uuid,uuid,text) to authenticated;
grant execute on function public.create_content_review_revision(uuid,jsonb,text) to authenticated;
grant execute on function public.lock_content_benchmark(uuid,text) to authenticated;
grant execute on function public.unlock_content_benchmark(uuid,text) to authenticated;
grant execute on function public.lock_initial_benchmark_set(uuid[]) to authenticated;
revoke execute on all functions in schema public from anon;

comment on table public.content_review_versions is 'Immutable passage/question snapshots reviewed independently; revisions create a new row.';
comment on table public.passage_reviews is 'One rubric result per assignment. Submitted rows are mutated only through guarded RPCs and are immutable thereafter.';
