-- Automatic approval of dictées (roadmap 2026-10, G.2).
-- A dictée that passed the automatic gates is `auto_approved` with the
-- pipeline version and the gate results, never marked as reviewed by a
-- person. `auto_approved` and `human_approved` are both enough for students
-- (once audio is ready). The admin portal stays as an audit and takedown
-- tool: `taken_down` removes a dictée from students immediately.

alter table public.dictations drop constraint if exists dictations_review_status_check;
alter table public.dictations
  add constraint dictations_review_status_check
  check (review_status in ('needs_human_review','human_approved','auto_approved','rejected','taken_down'));

alter table public.dictations
  add column if not exists pipeline_version text,
  add column if not exists gate_results jsonb,
  add column if not exists auto_approved_at timestamptz,
  add column if not exists taken_down_at timestamptz,
  add column if not exists takedown_reason text;

-- Automatic approval always carries its provenance and a passing gate record.
alter table public.dictations
  add constraint dictations_auto_approval_provenance check (
    review_status <> 'auto_approved'
    or (
      pipeline_version is not null and length(btrim(pipeline_version)) > 0
      and gate_results is not null and jsonb_typeof(gate_results) = 'object'
      and gate_results -> 'passed' = 'true'::jsonb
      and auto_approved_at is not null
    )
  ),
  add constraint dictations_takedown_reason_length check (takedown_reason is null or length(takedown_reason) <= 500);

comment on column public.dictations.pipeline_version is 'Version of the automatic pipeline that approved the dictée (auto_approved only).';
comment on column public.dictations.gate_results is 'Gate results bound to the approved text: {passed, textSha256, gates:[{gate,version,status,blocking,details}]}.';

-- Students (and guardians/teachers) read published dictées; content staff read everything.
drop policy if exists dictations_read_published on public.dictations;
create policy dictations_read_published
  on public.dictations for select
  using (
    (review_status in ('human_approved','auto_approved') and audio_status = 'ready')
    or (select public.is_content_staff())
  );

comment on table public.dictations is
  'Dictée texts split into replayable segments. Served when human_approved or auto_approved and audio ready; taken_down removes them.';

-- A published text that changes goes back through review: approval and audio
-- are bound to the exact text.
create or replace function public.reset_dictation_review_on_text_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.text_fr is distinct from old.text_fr and old.review_status in ('human_approved','auto_approved') then
    new.review_status := 'needs_human_review';
    new.pipeline_version := null;
    new.gate_results := null;
    new.auto_approved_at := null;
    new.audio_status := 'pending';
  end if;
  return new;
end $$;

drop trigger if exists dictations_reset_review_on_text_change on public.dictations;
create trigger dictations_reset_review_on_text_change
  before update of text_fr on public.dictations
  for each row execute function public.reset_dictation_review_on_text_change();

-- Service-only automatic approval. The gate record must be bound to the
-- current text (sha256 of text_fr) and passing. Never overrides a human
-- decision: human-approved rows stay as they are and taken-down rows are
-- refused.
create or replace function public.auto_approve_dictation(p_dictation_id uuid, p_pipeline_version text, p_gate_results jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.dictations%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_pipeline_version is null or length(btrim(p_pipeline_version)) = 0 then
    raise exception 'pipeline_version_required';
  end if;
  if p_gate_results is null or jsonb_typeof(p_gate_results) <> 'object' or p_gate_results -> 'passed' <> 'true'::jsonb then
    raise exception 'gates_not_passed';
  end if;
  select * into v_row from public.dictations where id = p_dictation_id for update;
  if not found then raise exception 'dictation_not_found'; end if;
  if v_row.review_status = 'taken_down' then raise exception 'dictation_taken_down'; end if;
  if v_row.review_status = 'human_approved' then return v_row.review_status; end if;
  if p_gate_results ->> 'textSha256' is distinct from encode(sha256(convert_to(v_row.text_fr, 'UTF8')), 'hex') then
    raise exception 'gate_results_stale';
  end if;
  update public.dictations
  set review_status = 'auto_approved',
      pipeline_version = btrim(p_pipeline_version),
      gate_results = p_gate_results,
      auto_approved_at = now(),
      audio_status = case when audio_status = 'failed' then 'pending' else audio_status end,
      audio_error = case when audio_status = 'failed' then null else audio_error end
  where id = p_dictation_id;
  return 'auto_approved';
end $$;

revoke all on function public.auto_approve_dictation(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.auto_approve_dictation(uuid,text,jsonb) to service_role;

-- Takedown from the audit portal: immediate, audited by the caller.
create or replace function public.take_down_dictation(p_dictation_id uuid, p_reason text, p_reviewer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.dictations
  set review_status = 'taken_down', taken_down_at = now(),
      takedown_reason = nullif(left(btrim(coalesce(p_reason, '')), 500), ''),
      reviewed_by = p_reviewer, reviewed_at = now()
  where id = p_dictation_id;
  if not found then raise exception 'dictation_not_found'; end if;
end $$;

revoke all on function public.take_down_dictation(uuid,text,uuid) from public, anon;
grant execute on function public.take_down_dictation(uuid,text,uuid) to authenticated, service_role;
