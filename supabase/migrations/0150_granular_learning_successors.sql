-- Trusted server prepares compatible content; this transaction preserves the
-- source snapshot and prevents forks or later writes to a superseded session.
begin;
create table public.granular_learning_successors (
 source_session_id uuid primary key references public.granular_assessment_sessions(id) on delete cascade,
 successor_session_id uuid not null unique references public.granular_assessment_sessions(id) on delete cascade,
 source_revision integer not null check(source_revision>=0),
 created_at timestamptz not null default now(),
 check(source_session_id<>successor_session_id)
);
alter table public.granular_learning_successors enable row level security;
revoke all on public.granular_learning_successors from public,anon,authenticated,service_role;
grant select on public.granular_learning_successors to service_role;

create function public.reject_superseded_granular_session_write() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from granular_learning_successors where source_session_id=old.id) then
  raise exception 'Learning session has a successor';
 end if;
 return new;
end $$;
create trigger granular_successor_write_guard before update on public.granular_assessment_sessions
for each row execute function public.reject_superseded_granular_session_write();

create view public.granular_active_assessment_sessions with (security_invoker=true) as
select session.* from public.granular_assessment_sessions session
where not exists(select 1 from public.granular_learning_successors link where link.source_session_id=session.id);
revoke all on public.granular_active_assessment_sessions from public,anon,authenticated;
grant select on public.granular_active_assessment_sessions to service_role;

create function public.create_granular_learning_successor(
 p_student_id uuid,p_source_session_id uuid,p_source_revision integer,
 p_target_release_id uuid,p_target_bundle_checksum text,p_target_state jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare
 source_row granular_assessment_sessions%rowtype;
 target_row granular_assessment_releases%rowtype;
 existing_link granular_learning_successors%rowtype;
 expected_state jsonb; preserved_responses jsonb; successor_id uuid;
begin
 -- Ownership is resolved by the authenticated server, never browser input.
 select * into source_row from granular_assessment_sessions
 where id=p_source_session_id and student_id=p_student_id for update;
 if not found then raise exception 'Learning predecessor unavailable'; end if;
 select * into target_row from granular_assessment_releases where id=p_target_release_id for share;
 if not found or target_row.status<>'published'
  or target_row.content_checksum is distinct from p_target_bundle_checksum then
  raise exception 'Learning target release unavailable';
 end if;
 select * into existing_link from granular_learning_successors where source_session_id=source_row.id;
 if found then
  if existing_link.source_revision<>p_source_revision or not exists(
   select 1 from granular_assessment_sessions where id=existing_link.successor_session_id
    and student_id=p_student_id and release_id=p_target_release_id
  ) then raise exception 'Learning successor conflict'; end if;
  return existing_link.successor_session_id;
 end if;
 if source_row.revision<>p_source_revision then raise exception 'Learning predecessor revision changed'; end if;
 if source_row.release_id=p_target_release_id then raise exception 'Learning release has not changed'; end if;
 if source_row.state->>'phase' is distinct from 'learning'
  or source_row.state->'paused' is distinct from 'true'::jsonb
  or coalesce(source_row.state->>'completionReason','') not in ('time_budget','evidence_complete','later_evidence_required')
  or coalesce(source_row.state->'learningCheck','null'::jsonb)<>'null'::jsonb
  or coalesce(source_row.state->'teaching','null'::jsonb)<>'null'::jsonb
  or coalesce(source_row.state->'pendingItemId','null'::jsonb)<>'null'::jsonb
 then raise exception 'Learning predecessor is not idle and complete'; end if;
 if jsonb_typeof(p_target_state) is distinct from 'object'
  or p_target_state#>>'{release,taxonomyId}' is distinct from target_row.taxonomy_release_id::text
  or p_target_state#>>'{release,bankId}' is distinct from target_row.bank_release_id::text
  or nullif(p_target_state#>>'{release,checksum}','') is null then
  raise exception 'Invalid learning successor binding';
 end if;
 expected_state:=source_row.state||jsonb_build_object(
  'release',p_target_state->'release','revision',0,'lastPulseAt',null,
  'learningPredecessor',jsonb_build_object('sessionId',source_row.id,'releaseId',source_row.release_id,'revision',source_row.revision));
 if source_row.state ? 'diagnosticResponses' then
  select coalesce(jsonb_agg(response.value||jsonb_build_object('sourceSessionId',
   coalesce(response.value->>'sourceSessionId',source_row.id::text)) order by response.ordinality),'[]'::jsonb)
  into preserved_responses from jsonb_array_elements(source_row.state->'diagnosticResponses') with ordinality response;
  expected_state:=expected_state||jsonb_build_object('diagnosticResponses',preserved_responses);
 end if;
 if p_target_state is distinct from expected_state then raise exception 'Learning successor changed historical state'; end if;
 -- The normal insertion guard checks published target taxonomy and bank.
 -- The caller must also verify both live releases and content compatibility.
 insert into granular_assessment_sessions(student_id,release_id,revision,state)
 values(p_student_id,p_target_release_id,0,p_target_state) returning id into successor_id;
 insert into granular_learning_successors(source_session_id,successor_session_id,source_revision)
 values(source_row.id,successor_id,source_row.revision);
 return successor_id;
end $$;
revoke all on function public.create_granular_learning_successor(uuid,uuid,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_granular_learning_successor(uuid,uuid,integer,uuid,text,jsonb) to service_role;
commit;
