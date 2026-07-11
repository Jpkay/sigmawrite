-- G14: finite, versioned lessons/modules/courses over shared atomic mastery.
create table public.learning_packages(
  id uuid primary key default gen_random_uuid(),package_key text unique not null,
  package_type text not null check(package_type in('lesson','module','course')),
  created_at timestamptz not null default now(),retired_at timestamptz
);
create table public.learning_package_versions(
  id uuid primary key default gen_random_uuid(),package_id uuid not null references public.learning_packages(id) on delete restrict,
  version integer not null check(version>0),title_fr text not null,description_fr text,
  status text not null default 'draft' check(status in('draft','published','retired')),
  audience_rule jsonb not null default '{}'::jsonb,progression_overlay_rule jsonb not null default '{}'::jsonb,
  completion_criteria jsonb not null check(jsonb_typeof(completion_criteria)='array' and jsonb_array_length(completion_criteria)>0),
  summary_templates jsonb not null default '{}'::jsonb,published_at timestamptz,created_at timestamptz not null default now(),
  unique(package_id,version),check((status='published')=(published_at is not null))
);
create table public.learning_package_node_memberships(
  package_version_id uuid not null references public.learning_package_versions(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete restrict,
  membership_type text not null check(membership_type in('required','optional','remedial','enrichment')),
  position integer not null default 0,mastery_threshold numeric check(mastery_threshold between 0 and 1),
  primary key(package_version_id,node_id,membership_type)
);
create table public.learning_package_child_memberships(
  parent_version_id uuid not null references public.learning_package_versions(id) on delete cascade,
  child_version_id uuid not null references public.learning_package_versions(id) on delete restrict,
  membership_type text not null check(membership_type in('required','optional','remedial','enrichment')),
  position integer not null default 0,primary key(parent_version_id,child_version_id),check(parent_version_id<>child_version_id)
);
create table public.student_package_progress(
  student_id uuid not null references public.students(id) on delete cascade,package_version_id uuid not null references public.learning_package_versions(id) on delete restrict,
  status text not null default 'not_started' check(status in('not_started','in_progress','criteria_met')),
  criteria_evidence jsonb not null default '{}'::jsonb,started_at timestamptz,criteria_met_at timestamptz,updated_at timestamptz not null default now(),
  primary key(student_id,package_version_id)
);
create table public.student_package_completions(
  id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id) on delete restrict,
  package_id uuid not null references public.learning_packages(id) on delete restrict,package_version_id uuid not null references public.learning_package_versions(id) on delete restrict,
  criteria_snapshot jsonb not null,evidence_snapshot jsonb not null,summary_snapshot jsonb not null,completed_at timestamptz not null default now(),
  unique(student_id,package_version_id)
);
create or replace function public.prevent_package_completion_mutation() returns trigger language plpgsql as $$begin raise exception 'package_completion_is_immutable';end$$;
create trigger immutable_package_completion before update or delete on public.student_package_completions for each row execute function public.prevent_package_completion_mutation();
create or replace function public.prevent_published_package_mutation() returns trigger language plpgsql as $$begin if old.status='published' then raise exception 'published_package_version_is_immutable';end if;return new;end$$;
create trigger immutable_published_package before update or delete on public.learning_package_versions for each row execute function public.prevent_published_package_mutation();
create or replace function public.prevent_published_package_membership_mutation() returns trigger language plpgsql as $$
declare v_version uuid;
begin
  if tg_table_name='learning_package_node_memberships' then v_version:=coalesce(new.package_version_id,old.package_version_id);
  else v_version:=coalesce(new.parent_version_id,old.parent_version_id);end if;
  if exists(select 1 from public.learning_package_versions where id=v_version and status='published') then raise exception 'published_package_membership_is_immutable';end if;
  return coalesce(new,old);
end$$;
create trigger immutable_published_package_nodes before insert or update or delete on public.learning_package_node_memberships for each row execute function public.prevent_published_package_membership_mutation();
create trigger immutable_published_package_children before insert or update or delete on public.learning_package_child_memberships for each row execute function public.prevent_published_package_membership_mutation();

alter table public.learning_packages enable row level security;alter table public.learning_package_versions enable row level security;alter table public.learning_package_node_memberships enable row level security;alter table public.learning_package_child_memberships enable row level security;alter table public.student_package_progress enable row level security;alter table public.student_package_completions enable row level security;
create policy package_catalog_read on public.learning_packages for select using(true);create policy package_versions_read on public.learning_package_versions for select using(status='published' or public.is_platform_admin());
create policy package_nodes_read on public.learning_package_node_memberships for select using(exists(select 1 from public.learning_package_versions v where v.id=package_version_id and (v.status='published' or public.is_platform_admin())));
create policy package_children_read on public.learning_package_child_memberships for select using(exists(select 1 from public.learning_package_versions v where v.id=parent_version_id and (v.status='published' or public.is_platform_admin())));
create policy package_progress_read on public.student_package_progress for select using(public.can_view_student(student_id));create policy package_progress_student_write on public.student_package_progress for all using(public.owns_student(student_id)) with check(public.owns_student(student_id));
create policy package_completions_read on public.student_package_completions for select using(public.can_view_student(student_id));
grant select on public.learning_packages,public.learning_package_versions,public.learning_package_node_memberships,public.learning_package_child_memberships,public.student_package_progress,public.student_package_completions to authenticated;
comment on table public.student_package_completions is 'Immutable achievement events pinned to the completed package version; later review or package revisions cannot revoke them.';
