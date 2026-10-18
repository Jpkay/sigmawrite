-- Editorial pipeline and story mode (roadmap Phase F + H.7–H.19).
-- All student texts written by the automatic editorial team. Nothing here
-- waits for a person: audits happen after publication (H.15). Writes go
-- through the service role from server code; students read their own story
-- rows; staff read everything.

-- ───────────── Switches (F.4, H.15) ─────────────
create table public.editorial_settings (
  id boolean primary key default true check (id),
  live_enabled boolean not null default true,
  live_mode text not null default 'live' check (live_mode in ('live','library_only')),
  auto_switch_reason text,
  auto_switched_at timestamptz,
  pipeline_version text not null default 'editorial-1.0.0',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.editorial_settings(id) values (true);

create table public.editorial_class_controls (
  class_id uuid primary key references public.classes(id) on delete cascade,
  live_enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ───────────── Runs (H.10) ─────────────
create table public.editorial_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('live','library','audit')),
  kind text not null check (kind in ('saga_outline','chapter','passage','dictation','fallback_chapter','audit')),
  pipeline_version text not null,
  brief jsonb not null default '{}'::jsonb,
  status text not null default 'running' check (status in ('running','published','fallback','discarded','failed')),
  decision_reasons text[] not null default '{}',
  rubric_mean numeric(3,2),
  ai_tells_score integer,
  gates jsonb not null default '[]'::jsonb,
  cost_usd numeric(10,5) not null default 0,
  latency_ms integer,
  saga_id uuid,
  chapter_id uuid,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index editorial_runs_created_idx on public.editorial_runs (created_at desc);
create index editorial_runs_status_idx on public.editorial_runs (mode, status, created_at desc);

create table public.editorial_run_steps (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.editorial_runs(id) on delete cascade,
  seq integer not null,
  role text not null,
  model text,
  prompt_version text,
  input_digest text,
  output jsonb,
  score numeric(5,2),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,5) not null default 0,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now(),
  unique (run_id, seq)
);

-- ───────────── Story mode (H.1, H.13) ─────────────
create table public.story_sagas (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  interest text not null,
  style_key text not null,
  grade_band text not null check (grade_band in ('cm','6e-5e','4e-3e')),
  narration text not null default 'tu' check (narration in ('tu','il','je')),
  -- H.2: shown in the text only, inserted at read time; never sent to a model.
  hero_name text check (hero_name is null or char_length(hero_name) between 2 and 24),
  hero_gender text not null default 'n' check (hero_gender in ('f','m','n')),
  title text,
  outline jsonb,
  running_summary text not null default '',
  chapter_count integer not null check (chapter_count between 3 and 10),
  status text not null default 'writing' check (status in ('writing','active','completed','abandoned')),
  pipeline_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index story_sagas_student_idx on public.story_sagas (student_id, created_at desc);

create table public.story_chapters (
  id uuid primary key default gen_random_uuid(),
  saga_id uuid not null references public.story_sagas(id) on delete cascade,
  chapter_index integer not null check (chapter_index between 1 and 10),
  parent_choice_id uuid,
  title text,
  -- Written with {{HEROS}} / {{m:…|f:…}} markers; the hero's name is inserted at read time (H.2).
  body_template text,
  bridge text,
  target_lemmas jsonb not null default '[]'::jsonb,
  target_tenses text[] not null default '{}',
  chapter_summary text,
  status text not null default 'pending' check (status in ('pending','generating','ready','failed','discarded')),
  source text check (source in ('live','fallback')),
  fallback_item_id uuid,
  run_id uuid references public.editorial_runs(id) on delete set null,
  review_status text not null default 'auto_approved' check (review_status in ('auto_approved','withdrawn')),
  scores jsonb not null default '{}'::jsonb,
  word_count integer,
  pipeline_version text not null,
  created_at timestamptz not null default now(),
  ready_at timestamptz
);
create unique index story_chapters_branch_idx on public.story_chapters (saga_id, chapter_index, coalesce(parent_choice_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.story_choices (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.story_chapters(id) on delete cascade,
  choice_index integer not null check (choice_index between 0 and 1),
  label text not null,
  intent text,
  -- H.3: optional comprehension / vocabulary task that opens the branch (built by the UI stream).
  task jsonb,
  unique (chapter_id, choice_index)
);
alter table public.story_chapters add constraint story_chapters_parent_choice_fk foreign key (parent_choice_id) references public.story_choices(id) on delete cascade;

create table public.story_progress (
  saga_id uuid primary key references public.story_sagas(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  current_chapter_id uuid references public.story_chapters(id) on delete set null,
  path uuid[] not null default '{}',
  chapters_read integer not null default 0,
  last_read_at timestamptz,
  updated_at timestamptz not null default now()
);
create index story_progress_student_idx on public.story_progress (student_id);

create table public.story_chapter_reads (
  student_id uuid not null references public.students(id) on delete cascade,
  chapter_id uuid not null references public.story_chapters(id) on delete cascade,
  choice_id uuid references public.story_choices(id) on delete set null,
  rating text check (rating in ('happy','neutral','sad')),
  read_at timestamptz not null default now(),
  primary key (student_id, chapter_id)
);

-- ───────────── Library pool (H.14, H.16, H.17) ─────────────
create table public.editorial_library_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('passage','dictation','fallback_chapter')),
  interest text not null,
  grade_band text not null check (grade_band in ('cm','6e-5e','4e-3e')),
  grade integer check (grade between 4 and 9),
  style_key text not null,
  title text not null,
  body text not null,
  segments jsonb,
  choices jsonb,
  questions jsonb,
  target_lemmas jsonb not null default '[]'::jsonb,
  target_tenses text[] not null default '{}',
  rubric_mean numeric(3,2),
  scores jsonb not null default '{}'::jsonb,
  audio_check jsonb,
  status text not null default 'published' check (status in ('published','withdrawn')),
  published_ref jsonb not null default '{}'::jsonb,
  used_count integer not null default 0 check (used_count >= 0),
  run_id uuid references public.editorial_runs(id) on delete set null,
  pipeline_version text not null,
  created_at timestamptz not null default now()
);
create index editorial_library_lookup_idx on public.editorial_library_items (kind, grade_band, interest, status);

-- ───────────── Reports and audits (H.15) ─────────────
create table public.editorial_text_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  content_kind text not null check (content_kind in ('story_chapter','passage','dictation')),
  content_id uuid not null,
  reason text not null check (reason in ('inappropriate','confusing','boring','error','other')),
  note text check (char_length(note) <= 500),
  audited_at timestamptz,
  created_at timestamptz not null default now()
);
create index editorial_text_reports_content_idx on public.editorial_text_reports (content_kind, content_id);

create table public.editorial_audits (
  id uuid primary key default gen_random_uuid(),
  content_kind text not null check (content_kind in ('story_chapter','passage','dictation')),
  content_id uuid not null,
  reason text not null check (reason in ('sample','reported')),
  auditor_model text,
  rubric jsonb,
  rubric_mean numeric(3,2),
  ai_tells_score integer,
  flagged boolean not null default false,
  notes jsonb not null default '[]'::jsonb,
  human_notes text,
  human_reviewed_at timestamptz,
  human_reviewer uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index editorial_audits_created_idx on public.editorial_audits (created_at desc);

create table public.editorial_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  value numeric not null,
  threshold numeric not null,
  switched_to_library boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ───────────── Blind panel (H.12) ─────────────
create table public.editorial_panel_scores (
  id uuid primary key default gen_random_uuid(),
  panel_key text not null,
  pipeline_version text not null,
  item_code text not null,
  is_generated boolean not null,
  rater text not null,
  overall numeric(3,2) check (overall between 1 and 5),
  rubric jsonb,
  guessed_generated boolean,
  created_at timestamptz not null default now(),
  unique (panel_key, item_code, rater)
);

-- ───────────── RLS ─────────────
alter table public.editorial_settings enable row level security;
alter table public.editorial_class_controls enable row level security;
alter table public.editorial_runs enable row level security;
alter table public.editorial_run_steps enable row level security;
alter table public.story_sagas enable row level security;
alter table public.story_chapters enable row level security;
alter table public.story_choices enable row level security;
alter table public.story_progress enable row level security;
alter table public.story_chapter_reads enable row level security;
alter table public.editorial_library_items enable row level security;
alter table public.editorial_text_reports enable row level security;
alter table public.editorial_audits enable row level security;
alter table public.editorial_alerts enable row level security;
alter table public.editorial_panel_scores enable row level security;

create policy editorial_settings_read on public.editorial_settings for select to authenticated using (public.is_staff());
create policy editorial_class_controls_read on public.editorial_class_controls for select to authenticated using (public.teaches_class(class_id) or public.is_staff());
create policy editorial_runs_read on public.editorial_runs for select to authenticated using (public.is_platform_admin());
create policy editorial_run_steps_read on public.editorial_run_steps for select to authenticated using (public.is_platform_admin());
create policy editorial_library_read on public.editorial_library_items for select to authenticated using (public.is_staff());
create policy editorial_reports_read on public.editorial_text_reports for select to authenticated using (public.is_platform_admin());
create policy editorial_audits_read on public.editorial_audits for select to authenticated using (public.is_platform_admin());
create policy editorial_alerts_read on public.editorial_alerts for select to authenticated using (public.is_platform_admin());
create policy editorial_panel_read on public.editorial_panel_scores for select to authenticated using (public.is_platform_admin());

create policy story_sagas_read on public.story_sagas for select to authenticated using (public.can_view_student(student_id));
create policy story_progress_read on public.story_progress for select to authenticated using (public.can_view_student(student_id));
create policy story_reads_read on public.story_chapter_reads for select to authenticated using (public.can_view_student(student_id));
create policy story_chapters_read on public.story_chapters for select to authenticated using (
  exists (select 1 from public.story_sagas s where s.id = saga_id and public.can_view_student(s.student_id))
);
create policy story_choices_read on public.story_choices for select to authenticated using (
  exists (select 1 from public.story_chapters c join public.story_sagas s on s.id = c.saga_id where c.id = chapter_id and public.can_view_student(s.student_id))
);

grant select on public.editorial_settings, public.editorial_class_controls, public.editorial_runs, public.editorial_run_steps,
  public.story_sagas, public.story_chapters, public.story_choices, public.story_progress, public.story_chapter_reads,
  public.editorial_library_items, public.editorial_text_reports, public.editorial_audits, public.editorial_alerts,
  public.editorial_panel_scores to authenticated;

-- ───────────── Switch RPCs (F.4) ─────────────
create or replace function public.set_class_live_generation(p_class_id uuid, p_enabled boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.teaches_class(p_class_id) and not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.editorial_class_controls(class_id, live_enabled, updated_by, updated_at)
  values (p_class_id, p_enabled, public.current_profile_id(), now())
  on conflict (class_id) do update set live_enabled = excluded.live_enabled, updated_by = excluded.updated_by, updated_at = now();
  return p_enabled;
end $$;
revoke all on function public.set_class_live_generation(uuid, boolean) from public, anon;
grant execute on function public.set_class_live_generation(uuid, boolean) to authenticated, service_role;

create or replace function public.set_editorial_live_generation(p_enabled boolean, p_mode text default 'live')
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_mode not in ('live','library_only') then raise exception 'invalid_mode'; end if;
  update public.editorial_settings
  set live_enabled = p_enabled,
      live_mode = p_mode,
      auto_switch_reason = case when p_mode = 'live' then null else auto_switch_reason end,
      auto_switched_at = case when p_mode = 'live' then null else auto_switched_at end,
      updated_by = public.current_profile_id(),
      updated_at = now()
  where id;
end $$;
revoke all on function public.set_editorial_live_generation(boolean, text) from public, anon;
grant execute on function public.set_editorial_live_generation(boolean, text) to authenticated, service_role;

comment on table public.story_chapters is 'Story chapters written by the editorial pipeline (auto_approved, never human-approved). body_template carries hero placeholders; names are inserted at read time.';
comment on table public.editorial_library_items is 'Library-mode texts (passages, dictées, fallback chapters) that passed every gate and the 4.3 rubric bar.';
