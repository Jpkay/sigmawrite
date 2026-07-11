-- Sprint 10: writing evidence, deterministic error-to-node mappings and one revision.

create table if not exists public.error_node_mappings (
  rule_id text primary key,
  node_id uuid not null references public.competency_nodes(id) on delete cascade,
  explanation_fr text not null,
  evidence_weight numeric not null default 0.35 check (evidence_weight > 0 and evidence_weight <= 1)
);
create table if not exists public.writing_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_summary_id uuid not null references public.student_summaries(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  revision_number integer not null default 0 check (revision_number between 0 and 1),
  submitted_text text not null,
  rubric jsonb not null,
  annotations jsonb not null default '[]'::jsonb,
  revision_plan jsonb not null default '[]'::jsonb,
  degraded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_summary_id, revision_number)
);
alter table public.error_node_mappings enable row level security;
alter table public.writing_evaluations enable row level security;
create policy error_node_mappings_read on public.error_node_mappings for select using (auth.uid() is not null);
create policy error_node_mappings_staff_write on public.error_node_mappings for all using (public.is_staff()) with check (public.is_staff());
create policy writing_evaluations_select on public.writing_evaluations for select using (public.can_view_student(student_id));

insert into public.error_node_mappings (rule_id, node_id, explanation_fr, evidence_weight)
select seed.rule_id, n.id, seed.explanation_fr, seed.weight
from (values
  ('QUE_AVOIR', 'accord_pp_avoir_cod', 'Avec avoir, le participe passé s’accorde avec le COD placé avant.', 0.35::numeric),
  ('ETRE_VPPA', 'accord_pp_etre', 'Avec être, le participe passé s’accorde avec le sujet.', 0.35::numeric),
  ('FR_AGREEMENT', 'accord_genre_nombre', 'Vérifie les accords en genre et en nombre.', 0.30::numeric),
  ('MORFOLOGIK_RULE_FR', 'terminaison_er_e_ez', 'Vérifie la forme et la terminaison du mot.', 0.20::numeric),
  ('CONFUSION_A_A', 'homophone_a_a', 'Distingue « a » du verbe avoir et « à » préposition.', 0.35::numeric),
  ('CONFUSION_ET_EST', 'homophone_et_est', 'Distingue « et » conjonction et « est » du verbe être.', 0.35::numeric)
) as seed(rule_id, node_key, explanation_fr, weight)
join public.competency_nodes n on n.key = seed.node_key
on conflict (rule_id) do update set node_id = excluded.node_id, explanation_fr = excluded.explanation_fr, evidence_weight = excluded.evidence_weight;
