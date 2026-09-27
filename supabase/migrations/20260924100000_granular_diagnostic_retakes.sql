-- A diagnostic sitting is an immutable historical record once another sitting
-- replaces it. Multiple sittings may use the same published release.
begin;

alter table public.granular_assessment_sessions
 drop constraint granular_assessment_sessions_student_id_release_id_key;

create table public.granular_assessment_retakes (
 source_session_id uuid primary key references public.granular_assessment_sessions(id) on delete cascade,
 successor_session_id uuid not null references public.granular_assessment_sessions(id) on delete cascade,
 source_revision integer not null check (source_revision >= 0),
 created_at timestamptz not null default now(),
 check (source_session_id <> successor_session_id)
);
alter table public.granular_assessment_retakes enable row level security;
revoke all on public.granular_assessment_retakes from public, anon, authenticated, service_role;
grant select on public.granular_assessment_retakes to service_role;

create function public.reject_retaken_granular_session_write() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from granular_assessment_retakes where source_session_id=old.id) then
  raise exception 'Diagnostic session has a retake';
 end if;
 return new;
end $$;
create trigger granular_retake_write_guard before update on public.granular_assessment_sessions
for each row execute function public.reject_retaken_granular_session_write();

-- A stale learning-upgrade request must never fork a retaken sitting.
create function public.reject_granular_successor_fork() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from granular_assessment_retakes where source_session_id=new.source_session_id)
  or exists(select 1 from granular_learning_successors where source_session_id=new.source_session_id) then
  raise exception 'Diagnostic session already has a successor';
 end if;
 return new;
end $$;
create trigger granular_learning_fork_guard before insert on public.granular_learning_successors
for each row execute function public.reject_granular_successor_fork();

create or replace view public.granular_active_assessment_sessions with (security_invoker=true) as
select session.* from public.granular_assessment_sessions session
where not exists(select 1 from public.granular_learning_successors link where link.source_session_id=session.id)
 and not exists(select 1 from public.granular_assessment_retakes link where link.source_session_id=session.id);
revoke all on public.granular_active_assessment_sessions from public, anon, authenticated;
grant select on public.granular_active_assessment_sessions to service_role;

create function public.start_granular_assessment_session(
 p_student_id uuid,p_target_release_id uuid,p_target_bundle_checksum text,p_target_state jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare existing_id uuid; target_row granular_assessment_releases%rowtype; new_id uuid;
begin
 perform 1 from students where id=p_student_id for update;
 if not found then raise exception 'Student unavailable'; end if;
 select * into target_row from granular_assessment_releases where id=p_target_release_id for share;
 if not found or target_row.status<>'published' or target_row.content_checksum is distinct from p_target_bundle_checksum then
  raise exception 'Diagnostic release unavailable';
 end if;
 select id into existing_id from granular_active_assessment_sessions
 where student_id=p_student_id and release_id=p_target_release_id
 order by created_at desc limit 1;
 if found then return existing_id; end if;
 if jsonb_typeof(p_target_state) is distinct from 'object'
  or p_target_state#>>'{release,taxonomyId}' is distinct from target_row.taxonomy_release_id::text
  or p_target_state#>>'{release,bankId}' is distinct from target_row.bank_release_id::text
  or nullif(p_target_state#>>'{release,checksum}','') is null
  or p_target_state->>'phase' is distinct from 'assessing'
  or p_target_state->'paused' is distinct from 'true'::jsonb
  or p_target_state->'revision' is distinct from '0'::jsonb
  or p_target_state->'observations' is distinct from '[]'::jsonb
  or p_target_state->'refinements' is distinct from '[]'::jsonb
  or p_target_state->'completionReason' is distinct from 'null'::jsonb
 then raise exception 'Invalid new diagnostic state'; end if;
 insert into granular_assessment_sessions(student_id,release_id,revision,state)
 values(p_student_id,p_target_release_id,0,p_target_state) returning id into new_id;
 return new_id;
end $$;
revoke all on function public.start_granular_assessment_session(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.start_granular_assessment_session(uuid,uuid,text,jsonb) to service_role;

create function public.create_granular_assessment_retake(
 p_student_id uuid,p_source_session_id uuid,p_source_revision integer,
 p_target_release_id uuid,p_target_bundle_checksum text,p_target_state jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare source_row granular_assessment_sessions%rowtype;
 target_row granular_assessment_releases%rowtype;
 existing_link granular_assessment_retakes%rowtype; successor_id uuid; expected_prior jsonb;
begin
 perform 1 from students where id=p_student_id for update;
 if not found then raise exception 'Student unavailable'; end if;
 -- Lock every existing sitting so stale tabs cannot write after the new
 -- sitting becomes current, including older sessions on other releases.
 perform 1 from granular_assessment_sessions where student_id=p_student_id for update;
 select * into source_row from granular_assessment_sessions
 where id=p_source_session_id and student_id=p_student_id for update;
 if not found then raise exception 'Diagnostic predecessor unavailable'; end if;
 select * into target_row from granular_assessment_releases where id=p_target_release_id for share;
 if not found or target_row.status<>'published' or target_row.content_checksum is distinct from p_target_bundle_checksum then
  raise exception 'Diagnostic target release unavailable';
 end if;
 select * into existing_link from granular_assessment_retakes where source_session_id=source_row.id;
 if found then
  if existing_link.source_revision<>p_source_revision or not exists(
   select 1 from granular_assessment_sessions where id=existing_link.successor_session_id
    and student_id=p_student_id and release_id=p_target_release_id
  ) then raise exception 'Diagnostic retake conflict'; end if;
  return existing_link.successor_session_id;
 end if;
 if exists(select 1 from granular_learning_successors where source_session_id=source_row.id) then
  raise exception 'Diagnostic predecessor already superseded';
 end if;
 if source_row.revision<>p_source_revision then raise exception 'Diagnostic predecessor revision changed'; end if;
 if source_row.state->>'phase' is distinct from 'learning'
  or source_row.state->'paused' is distinct from 'true'::jsonb
  or coalesce(source_row.state->>'completionReason','') not in ('time_budget','evidence_complete','later_evidence_required','coverage_gap')
  or coalesce(source_row.state->'learningCheck','null'::jsonb)<>'null'::jsonb
  or coalesce(source_row.state->'teaching','null'::jsonb)<>'null'::jsonb
  or coalesce(source_row.state->'pendingItemId','null'::jsonb)<>'null'::jsonb
 then raise exception 'Diagnostic predecessor is not idle and complete'; end if;
 select coalesce(jsonb_agg(item_id order by first_position),'[]'::jsonb) into expected_prior
 from (
  select item_id,min(position) as first_position from (
   select prior.value as item_id,prior.ordinality as position
   from jsonb_array_elements_text(coalesce(source_row.state->'priorDiagnosticItemIds','[]'::jsonb)) with ordinality prior
   union all
   select observation.value->>'itemId',observation.ordinality + coalesce(jsonb_array_length(source_row.state->'priorDiagnosticItemIds'),0)
   from jsonb_array_elements(source_row.state->'observations') with ordinality observation
  ) all_items group by item_id
 ) distinct_items;
 if jsonb_typeof(p_target_state) is distinct from 'object'
  or p_target_state#>>'{release,taxonomyId}' is distinct from target_row.taxonomy_release_id::text
  or p_target_state#>>'{release,bankId}' is distinct from target_row.bank_release_id::text
  or nullif(p_target_state#>>'{release,checksum}','') is null
  or p_target_state->>'phase' is distinct from 'assessing'
  or p_target_state->'paused' is distinct from 'true'::jsonb
  or p_target_state->'revision' is distinct from '0'::jsonb
  or p_target_state->'observations' is distinct from '[]'::jsonb
  or p_target_state->'priorDiagnosticItemIds' is distinct from expected_prior
  or p_target_state->'refinements' is distinct from '[]'::jsonb
  or p_target_state->'completionReason' is distinct from 'null'::jsonb
 then raise exception 'Invalid retake state'; end if;
 insert into granular_assessment_sessions(student_id,release_id,revision,state)
 values(p_student_id,p_target_release_id,0,p_target_state) returning id into successor_id;
 insert into granular_assessment_retakes(source_session_id,successor_session_id,source_revision)
 select session.id,successor_id,session.revision
 from granular_active_assessment_sessions session
 where session.student_id=p_student_id and session.id<>successor_id;
 return successor_id;
end $$;
revoke all on function public.create_granular_assessment_retake(uuid,uuid,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_granular_assessment_retake(uuid,uuid,integer,uuid,text,jsonb) to service_role;
commit;
