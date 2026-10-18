-- Story mode for the student (roadmap H.1–H.6), on top of the editorial
-- pipeline tables (20261018130000). Students read their own rows; every
-- write goes through the service role from server actions.

-- H.2: the hero the student chose, reused from one saga to the next.
-- The nickname is shown in the text only (inserted at read time) and is
-- never sent to a model.
create table public.story_hero_profiles (
  student_id uuid primary key references public.students(id) on delete cascade,
  nickname text check (nickname is null or char_length(nickname) between 2 and 24),
  avatar text not null default 'plume' check (avatar in ('renard','chouette','dragon','loup','chat','robot','fusee','boussole','plume','etoile','ballon','manette')),
  gender text not null default 'n' check (gender in ('f','m','n')),
  updated_at timestamptz not null default now()
);

-- H.3: the micro-task that opens the next chapter. Holds the answer, so
-- only staff read it directly; students receive the task without it.
create table public.story_chapter_tasks (
  chapter_id uuid primary key references public.story_chapters(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null default 'vocabulary' check (kind in ('vocabulary')),
  word text not null check (char_length(word) between 1 and 60),
  sense_id uuid references public.lexical_senses(id) on delete set null,
  due boolean not null default false,
  task jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  answer_index integer check (answer_index between 0 and 3),
  correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  check ((answer_index is null) = (answered_at is null))
);
create index story_chapter_tasks_student_idx on public.story_chapter_tasks (student_id, created_at desc);

-- H.4: the alternative ending the student writes, shown in the recueil.
create table public.story_endings (
  id uuid primary key default gen_random_uuid(),
  saga_id uuid not null unique references public.story_sagas(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  target_words text[] not null default '{}',
  style_key text not null,
  style_challenge boolean not null default false,
  word_count integer not null check (word_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index story_endings_student_idx on public.story_endings (student_id, created_at);

alter table public.story_hero_profiles enable row level security;
alter table public.story_chapter_tasks enable row level security;
alter table public.story_endings enable row level security;

create policy story_hero_profiles_read on public.story_hero_profiles for select to authenticated using (public.can_view_student(student_id));
create policy story_endings_read on public.story_endings for select to authenticated using (public.can_view_student(student_id));
create policy story_chapter_tasks_read on public.story_chapter_tasks for select to authenticated using (public.is_staff());

revoke all on public.story_hero_profiles, public.story_chapter_tasks, public.story_endings from anon, authenticated;
grant select on public.story_hero_profiles, public.story_chapter_tasks, public.story_endings to authenticated;
grant all on public.story_hero_profiles, public.story_chapter_tasks, public.story_endings to service_role;

comment on table public.story_hero_profiles is 'Hero chosen by the student for story mode (H.2). The nickname is inserted at read time and never sent to a model.';
comment on table public.story_chapter_tasks is 'Deterministic vocabulary micro-task that opens the next chapter (H.3). Answers feed word memory as embedded evidence.';
comment on table public.story_endings is 'Alternative endings written by students at the end of a saga (H.4), shown in the recueil.';
