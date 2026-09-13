-- Evaluate the authenticated caller's staff role once per scan on the exercise
-- review read path. These policies keep their original commands, roles and
-- authorization predicates; only the stable role check becomes an InitPlan.

begin;

alter policy competency_items_read on public.competency_items
  using (
    (auth.uid() is not null and review_status in ('auto_approved','human_approved'))
    or (select public.is_staff())
  );
alter policy competency_items_staff_write on public.competency_items
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

alter policy competency_nodes_read on public.competency_nodes
  using (
    (auth.uid() is not null and review_status in ('auto_approved','human_approved'))
    or (select public.is_staff())
  );
alter policy competency_item_choices_staff_write on public.competency_item_choices
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

alter policy diagnostic_bank_staff_write on public.diagnostic_item_bank_releases
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
alter policy diagnostic_bank_membership_staff_write on public.diagnostic_item_bank_memberships
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

alter policy taxonomy_releases_staff_write on public.taxonomy_releases
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
alter policy taxonomy_release_memberships_staff_write on public.taxonomy_release_memberships
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

commit;
