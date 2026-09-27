-- Teachers may comment on approved teaching material without joining the
-- editorial review workflow or changing a release decision.
create table public.teacher_content_feedback (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.profiles(id),
  content_kind text not null check (content_kind in ('lesson', 'passage', 'exercise', 'granular_lesson', 'granular_exercise')),
  content_id uuid,
  release_id uuid references public.granular_assessment_releases(id),
  content_key text check (content_key is null or char_length(content_key) between 1 and 500),
  comment text not null check (char_length(btrim(comment)) between 3 and 2000),
  created_at timestamptz not null default now(),
  check (
    (content_kind in ('lesson', 'passage', 'exercise') and content_id is not null and release_id is null and content_key is null)
    or (content_kind in ('granular_lesson', 'granular_exercise') and content_id is null and release_id is not null and content_key is not null)
  )
);

create index teacher_content_feedback_target_idx
  on public.teacher_content_feedback(content_kind, content_id, created_at desc);
create index teacher_content_feedback_release_target_idx
  on public.teacher_content_feedback(release_id, content_kind, content_key, created_at desc);
create index teacher_content_feedback_author_idx
  on public.teacher_content_feedback(teacher_profile_id, created_at desc);

create function public.validate_teacher_content_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.teacher_profile_id
      and p.auth_user_id = auth.uid()
      and p.role = 'teacher'
      and p.deactivated_at is null
  ) then
    raise exception 'teacher_feedback_forbidden' using errcode = '42501';
  end if;

  if not (
    (new.content_kind = 'lesson' and exists (
      select 1 from public.competency_lessons l
      join public.competency_nodes n on n.id = l.node_id
      where l.id = new.content_id and l.review_status in ('auto_approved', 'human_approved')
        and n.review_status in ('auto_approved', 'human_approved')
    ))
    or (new.content_kind = 'passage' and exists (
      select 1 from public.text_versions v join public.texts t on t.id = v.text_id
      where v.id = new.content_id and t.status = 'active'
        and v.review_status in ('human_approved', 'benchmark_locked')
    ))
    or (new.content_kind = 'exercise' and exists (
      select 1 from public.competency_items i
      join public.competency_nodes n on n.id = i.primary_node_id
      where i.id = new.content_id and i.review_status in ('auto_approved', 'human_approved')
        and n.review_status in ('auto_approved', 'human_approved')
    ))
    or (new.content_kind = 'granular_lesson' and exists (
      select 1 from public.granular_assessment_releases r
      join public.taxonomy_releases t on t.id = r.taxonomy_release_id and t.status = 'published'
      join public.diagnostic_item_bank_releases b on b.id = r.bank_release_id and b.status = 'published'
      where r.id = new.release_id and r.status = 'published'
        and exists (
          select 1 from jsonb_array_elements(coalesce(r.bundle->'teachingContent', '[]'::jsonb)) lesson
          where lesson->>'id' = new.content_key
            and lesson->>'status' in ('published', 'published_pending_review')
            and exists (
              select 1 from jsonb_array_elements(coalesce(r.bundle->'activities', '[]'::jsonb)) activity
              where activity->>'contentId' = new.content_key and activity->>'status' = 'published'
            )
        )
    ))
    or (new.content_kind = 'granular_exercise' and exists (
      select 1 from public.granular_assessment_releases r
      join public.taxonomy_releases t on t.id = r.taxonomy_release_id and t.status = 'published'
      join public.diagnostic_item_bank_releases b on b.id = r.bank_release_id and b.status = 'published'
      where r.id = new.release_id and r.status = 'published'
        and exists (
          select 1 from jsonb_array_elements(coalesce(r.bundle #> '{assessment,probes}', '[]'::jsonb)) probe
          where probe->>'id' = new.content_key
        )
        and exists (
          select 1 from jsonb_array_elements(coalesce(r.bundle #> '{bank,items}', '[]'::jsonb)) item
          where item->>'itemKey' = new.content_key
        )
    ))
  ) then
    raise exception 'teacher_feedback_target_unavailable' using errcode = '23503';
  end if;
  new.comment := btrim(new.comment);
  return new;
end $$;

create trigger validate_teacher_content_feedback
before insert on public.teacher_content_feedback
for each row execute function public.validate_teacher_content_feedback();

alter table public.teacher_content_feedback enable row level security;
create policy teacher_content_feedback_read on public.teacher_content_feedback
for select to authenticated using (
  (teacher_profile_id = (select public.current_profile_id())
    and (select public.app_role()) = 'teacher'
    and exists (select 1 from public.profiles p
      where p.id = teacher_profile_id and p.deactivated_at is null))
  or (select public.is_platform_admin())
);
create policy teacher_content_feedback_insert on public.teacher_content_feedback
for insert to authenticated with check (
  teacher_profile_id = (select public.current_profile_id())
  and (select public.app_role()) = 'teacher'
);
grant select, insert on public.teacher_content_feedback to authenticated;
revoke all on function public.validate_teacher_content_feedback() from public, anon, authenticated;
