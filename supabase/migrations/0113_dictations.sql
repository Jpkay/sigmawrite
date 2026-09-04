-- Dictée module (roadmap 1.1, 1.2, 1.4–1.7).
-- Dictées are reviewed content: students only see human-approved texts whose
-- audio has been rendered server-side. Attempts store the learner's
-- transcription, the deterministic Catach error profile and the justification
-- step, and feed competency evidence through the application layer.

create table public.dictations (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title_fr text not null,
  kind text not null check (kind in ('flash','trous','choix','negociee','brevet')),
  source_note text,
  text_fr text not null,
  segments jsonb not null,
  word_count integer not null check (word_count > 0),
  grade_min integer not null check (grade_min between 4 and 9),
  grade_max integer not null check (grade_max between 4 and 9),
  target_node_keys text[] not null default '{}',
  focus_fr text,
  review_status text not null default 'needs_human_review'
    check (review_status in ('needs_human_review','human_approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  audio_status text not null default 'pending' check (audio_status in ('pending','rendering','ready','failed')),
  audio_provider text,
  audio_model text,
  audio_voice text,
  audio_error text,
  audio_rendered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grade_min <= grade_max),
  check (jsonb_typeof(segments) = 'array' and jsonb_array_length(segments) between 1 and 40)
);

comment on table public.dictations is
  'Reviewed dictée texts split into replayable segments. Served only when human_approved and audio ready.';
comment on column public.dictations.segments is
  'Ordered array of {text, audioPath|null}. Audio paths point into the private dictation-audio bucket.';

create table public.dictation_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  dictation_id uuid not null references public.dictations(id) on delete restrict,
  client_request_id uuid not null,
  mode text not null check (mode in ('flash','trous','choix','negociee','brevet')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  error_profile jsonb not null default '{}'::jsonb,
  score numeric(4,2) check (score between 0 and 10),
  accuracy numeric(5,4) check (accuracy between 0 and 1),
  replays integer not null default 0 check (replays >= 0),
  justifications jsonb not null default '[]'::jsonb,
  justification_correct integer not null default 0 check (justification_correct >= 0),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  unique (student_id, client_request_id),
  check (submitted_at is null or submitted_at >= started_at)
);

create index dictation_attempts_student_idx on public.dictation_attempts (student_id, started_at desc);
create index dictation_attempts_dictation_idx on public.dictation_attempts (dictation_id);

alter table public.dictations enable row level security;
alter table public.dictation_attempts enable row level security;

-- Students and their guardians/teachers may read published dictées; admins read everything.
create policy dictations_read_published
  on public.dictations for select
  using (
    (review_status = 'human_approved' and audio_status = 'ready')
    or public.is_content_staff()
  );

create policy dictation_attempts_read
  on public.dictation_attempts for select
  using (public.can_view_student(student_id));

grant select on public.dictations, public.dictation_attempts to authenticated;

-- Private audio bucket; signed URLs are minted by the service layer per session.
-- Storage is absent on bare test databases, so the bucket is created only when
-- the storage schema exists; the audio job also ensures it through the API.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('dictation-audio', 'dictation-audio', false, 5242880, array['audio/mpeg','audio/mp4','audio/ogg','audio/wav'])
    on conflict (id) do nothing;
  end if;
end $$;

create or replace function public.touch_dictation_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger dictations_touch_updated_at
  before update on public.dictations
  for each row execute function public.touch_dictation_updated_at();

-- Approval and audio state are administrative: no direct writes from clients.
create or replace function public.review_dictation(p_dictation_id uuid, p_decision text, p_reviewer uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_decision not in ('human_approved','rejected','needs_human_review') then
    raise exception 'invalid_decision';
  end if;
  update public.dictations
  set review_status = p_decision, reviewed_by = p_reviewer, reviewed_at = now()
  where id = p_dictation_id;
  if not found then raise exception 'dictation_not_found'; end if;
end $$;

revoke all on function public.review_dictation(uuid,text,uuid) from public;
grant execute on function public.review_dictation(uuid,text,uuid) to authenticated, service_role;
