-- Approved learning content is for signed-in learners and staff, not anonymous
-- internet clients. Explicit API grants in 0032 make this policy requirement
-- visible on clean databases, so state it directly on every content root.

drop policy if exists texts_read on public.texts;
create policy texts_read on public.texts for select using (
  (auth.uid() is not null and status = 'active') or public.is_staff()
);

drop policy if exists text_versions_read on public.text_versions;
create policy text_versions_read on public.text_versions for select using (
  (auth.uid() is not null and review_status in ('human_approved','benchmark_locked'))
  or public.is_staff()
);

drop policy if exists competency_nodes_read on public.competency_nodes;
create policy competency_nodes_read on public.competency_nodes for select using (
  (auth.uid() is not null and review_status in ('auto_approved','human_approved'))
  or public.is_staff()
);

drop policy if exists competency_items_read on public.competency_items;
create policy competency_items_read on public.competency_items for select using (
  (auth.uid() is not null and review_status in ('auto_approved','human_approved'))
  or public.is_staff()
);
