-- Sprint 3: shared, versioned and auditable content workflow.

create or replace function public.is_content_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('platform_admin','content_reviewer'), false)
$$;

alter table ai_generated_candidates
  add column if not exists approved_text_version_id uuid references text_versions(id) on delete set null,
  add column if not exists reviewer_profile_id uuid references profiles(id) on delete set null,
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ai_scoring_results_candidate_unique
  on ai_scoring_results (candidate_id);
create unique index if not exists ai_moderation_results_candidate_unique
  on ai_moderation_results (candidate_id);
create index if not exists ai_candidates_review_status_idx
  on ai_generated_candidates (review_status, updated_at desc);

do $$
declare t text;
begin
  foreach t in array array[
    'ai_generation_jobs','ai_generated_candidates','ai_scoring_results','ai_moderation_results'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_staff_write', t);
    execute format(
      'create policy %I on %I for all using (public.is_content_staff()) with check (public.is_content_staff())',
      t || '_content_staff', t
    );
  end loop;
end $$;

comment on table ai_generated_candidates is
  'Persistent review candidates. payload is the validated generation contract; decisions and approved immutable versions are relationally linked.';
