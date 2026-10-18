-- H.3 completion: comprehension questions and bonus scenes for story chapters.
-- The author writes both in the same call as the chapter; code gates them
-- (src/lib/content/editorial/chapter-extras.ts). They hold an answer and an
-- unlockable scene, so only staff read them directly; students receive the
-- question without its answer, and the scene only after a right first answer.

create table public.story_chapter_extras (
  chapter_id uuid primary key references public.story_chapters(id) on delete cascade,
  -- { question, options[3], correctIndex, explanation, type }
  comprehension jsonb check (
    comprehension is null or (
      jsonb_typeof(comprehension->'options') = 'array'
      and jsonb_array_length(comprehension->'options') = 3
      and (comprehension->>'correctIndex')::int between 0 and 2
      and char_length(coalesce(comprehension->>'question', '')) between 10 and 160
    )
  ),
  -- Written with the same hero markers as the chapter; the name is inserted at read time.
  bonus_scene text check (bonus_scene is null or char_length(bonus_scene) between 1 and 1500),
  gate_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (comprehension is not null or bonus_scene is not null)
);

-- Fallback chapters written in library mode keep their bonus scene next to their questions.
alter table public.editorial_library_items
  add column bonus_scene text check (bonus_scene is null or char_length(bonus_scene) between 1 and 1500);

-- The micro-task can now be a comprehension question (no word attached).
alter table public.story_chapter_tasks drop constraint if exists story_chapter_tasks_kind_check;
alter table public.story_chapter_tasks add constraint story_chapter_tasks_kind_check check (kind in ('vocabulary','comprehension'));
alter table public.story_chapter_tasks alter column word drop not null;
alter table public.story_chapter_tasks add constraint story_chapter_tasks_word_for_vocabulary check (kind <> 'vocabulary' or word is not null);
alter table public.story_chapter_tasks add column bonus_unlocked boolean not null default false;

alter table public.story_chapter_extras enable row level security;
create policy story_chapter_extras_read on public.story_chapter_extras for select to authenticated using (public.is_staff());
revoke all on public.story_chapter_extras from anon, authenticated;
grant select on public.story_chapter_extras to authenticated;
grant all on public.story_chapter_extras to service_role;

comment on table public.story_chapter_extras is 'Comprehension question and bonus scene of a story chapter (H.3), written with the chapter and gated by code. Staff read only: holds the answer.';
comment on column public.story_chapter_tasks.bonus_unlocked is 'True when a right first answer unlocked the chapter''s bonus scene (H.3).';
