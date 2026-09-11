begin;

-- Server-owned, release-pinned granular sessions. Existing diagnostics remain intact.
create table public.granular_assessment_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  taxonomy_release_id uuid not null references public.taxonomy_releases(id) on delete restrict,
  bank_release_id uuid not null references public.diagnostic_item_bank_releases(id) on delete restrict,
  status text not null default 'draft' check(status in ('draft','published','withdrawn')),
  content_checksum text not null,
  bundle jsonb not null check(jsonb_typeof(bundle)='object'),
  created_at timestamptz not null default now()
);
create table public.granular_assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  release_id uuid not null references public.granular_assessment_releases(id) on delete restrict,
  revision integer not null default 0 check(revision>=0),
  state jsonb not null check(jsonb_typeof(state)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id,release_id),
  check(((state->>'revision')::integer=revision) is true),
  check((state->>'phase' in ('assessing','learning')) is true)
);
-- Contains assessment keys/state. Only authenticated server code using service_role
-- may read/write; public DTOs are constructed explicitly in the action layer.
alter table public.granular_assessment_releases enable row level security;
alter table public.granular_assessment_sessions enable row level security;
revoke all on public.granular_assessment_releases,public.granular_assessment_sessions from public,anon,authenticated;
grant all on public.granular_assessment_releases,public.granular_assessment_sessions to service_role;

create function public.guard_granular_assessment_release() returns trigger
language plpgsql set search_path=public as $$
begin
  if TG_OP='UPDATE' and old.status in ('published','withdrawn') and
    (new.bundle is distinct from old.bundle or new.content_checksum is distinct from old.content_checksum
     or new.taxonomy_release_id is distinct from old.taxonomy_release_id or new.bank_release_id is distinct from old.bank_release_id
     or new.release_key is distinct from old.release_key or (old.status='withdrawn' and new.status<>'withdrawn')
     or new.status='draft') then
    raise exception 'Published assessment releases are immutable';
  end if;
  if new.status='published' and (
    not exists(select 1 from taxonomy_releases where id=new.taxonomy_release_id and status='published')
    or not exists(select 1 from diagnostic_item_bank_releases where id=new.bank_release_id and status='published' and taxonomy_release_id=new.taxonomy_release_id)
  ) then raise exception 'Published taxonomy and bank required'; end if;
  return new;
end $$;
create trigger granular_release_guard before insert or update on public.granular_assessment_releases
for each row execute function public.guard_granular_assessment_release();

create function public.guard_granular_assessment_session() returns trigger
language plpgsql set search_path=public as $$
begin
  if not exists(
    select 1 from granular_assessment_releases release
    join taxonomy_releases taxonomy on taxonomy.id=release.taxonomy_release_id and taxonomy.status='published'
    join diagnostic_item_bank_releases bank on bank.id=release.bank_release_id
      and bank.taxonomy_release_id=taxonomy.id and bank.status='published'
    where release.id=new.release_id and release.status='published'
  ) then
    raise exception 'Assessment release unavailable';
  end if;
  if TG_OP='UPDATE' then
    if new.student_id<>old.student_id or new.release_id<>old.release_id or new.state->'release' is distinct from old.state->'release' then raise exception 'Session ownership and release are immutable'; end if;
    if new.revision<>old.revision+1 then raise exception 'Session revision must advance exactly once'; end if;
  elsif new.revision<>0 then raise exception 'Initial revision must be zero'; end if;
  new.updated_at=now();
  return new;
end $$;
create trigger granular_session_guard before insert or update on public.granular_assessment_sessions
for each row execute function public.guard_granular_assessment_session();
commit;
