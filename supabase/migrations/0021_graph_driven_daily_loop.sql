-- Sprint 9: unify reading content, graph practice and retrieval around nodes.

create table if not exists public.text_version_nodes (
  text_version_id uuid not null references public.text_versions(id) on delete cascade,
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  source text not null default 'human_confirmed' check (source in ('ai_proposed','human_confirmed','seeded')),
  confidence numeric check (confidence is null or confidence between 0 and 1),
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (text_version_id, node_id)
);
alter table public.text_version_nodes enable row level security;
create policy text_version_nodes_read on public.text_version_nodes for select using (auth.uid() is not null);
create policy text_version_nodes_staff_write on public.text_version_nodes for all using (public.is_staff()) with check (public.is_staff());

alter table public.retrieval_cards
  add column if not exists node_id uuid references public.competency_nodes(id) on delete set null;
alter table public.retrieval_cards
  add constraint retrieval_cards_student_node_unique unique (student_id, node_id);
alter table public.reading_sessions
  add column if not exists target_node_id uuid references public.competency_nodes(id) on delete set null;

create index if not exists text_version_nodes_node_idx on public.text_version_nodes (node_id, text_version_id);
create index if not exists retrieval_cards_node_idx on public.retrieval_cards (student_id, node_id);

insert into public.text_version_nodes (text_version_id, node_id, source, confidence)
select tv.id, n.id, 'seeded', 0.8
from public.text_versions tv
cross join lateral (
  select id from public.competency_nodes
  where key = 'comprehension_recit_passe'
  limit 1
) n
where tv.review_status in ('human_approved','benchmark_locked')
on conflict do nothing;
