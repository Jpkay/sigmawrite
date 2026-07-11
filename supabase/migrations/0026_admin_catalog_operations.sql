-- Sprint 14: safe catalog lifecycle and frequency-backed vocabulary.

alter table public.skills add column if not exists active boolean not null default true;
alter table public.vocabulary_items
  add column if not exists frequency_per_million numeric,
  add column if not exists frequency_source text,
  add column if not exists active boolean not null default true;
alter table public.misconceptions add column if not exists active boolean not null default true;

create or replace function public.is_content_operator()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where auth_user_id=auth.uid() and role in ('platform_admin','content_reviewer'))
$$;

drop policy if exists skills_staff_write on public.skills;
drop policy if exists vocabulary_items_staff_write on public.vocabulary_items;
drop policy if exists competency_nodes_staff_write on public.competency_nodes;
drop policy if exists competency_edges_staff_write on public.competency_edges;
drop policy if exists misconceptions_staff_write on public.misconceptions;
create policy skills_content_write on public.skills for all using (public.is_content_operator()) with check (public.is_content_operator());
create policy vocabulary_content_write on public.vocabulary_items for all using (public.is_content_operator()) with check (public.is_content_operator());
create policy nodes_content_write on public.competency_nodes for all using (public.is_content_operator()) with check (public.is_content_operator());
create policy edges_content_write on public.competency_edges for all using (public.is_content_operator()) with check (public.is_content_operator());
create policy misconceptions_content_write on public.misconceptions for all using (public.is_content_operator()) with check (public.is_content_operator());
