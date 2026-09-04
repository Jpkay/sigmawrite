-- Shorter placement diagnostic (roadmap 8.1): protocol graph-sections-v3 runs
-- 6–12 probes per section (24–48 in total) instead of 8–20 (32–80). Runs
-- completed under v2 stay valid; the unlock guard accepts both protocols.

create or replace function public.student_learning_is_unlocked(
  p_student_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when coalesce(auth.role(),'') not in ('service_role','authenticated')
      then false
    when auth.role()='authenticated'
      and not public.owns_student(p_student_id)
      then false
    when not public.student_access_is_authorized(p_student_id)
      then false
    else exists (
      select 1
      from public.diagnostic_runs run
      join public.taxonomy_releases taxonomy
        on taxonomy.id=run.taxonomy_release_id
      join public.diagnostic_item_bank_releases bank
        on bank.id=run.item_bank_release_id
        and bank.taxonomy_release_id=taxonomy.id
      join public.learning_goals goal
        on goal.id=run.learning_goal_id
        and goal.student_id=run.student_id
        and goal.status='active'
      where run.student_id=p_student_id
        and run.status='completed'
        and run.completed_at is not null
        and run.current_section is null
        and (
          (run.protocol_version='graph-sections-v2'
            and run.total_min_probes=32 and run.total_max_probes=80
            and run.probe_count between 32 and 80)
          or (run.protocol_version='graph-sections-v3'
            and run.total_min_probes=24 and run.total_max_probes=48
            and run.probe_count between 24 and 48)
        )
        and taxonomy.release_key='french-taxonomy-v2'
        and taxonomy.version='2.0.0'
        and taxonomy.status='published'
        and taxonomy.manifest_checksum=
          'sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b'
        and taxonomy.validation_report @> '{"valid":true}'::jsonb
        and bank.bank_key='french-diagnostic-bank-v2'
        and bank.version='2.0.0'
        and bank.status='published'
        and nullif(btrim(bank.manifest_checksum),'') is not null
        and bank.manifest->>'checksum'=bank.manifest_checksum
        and bank.validation_report @> '{"valid":true}'::jsonb
        and (
          select count(*)=4 and coalesce(bool_and(
            section.status='completed'
            and section.min_probes=(case when run.protocol_version='graph-sections-v3' then 6 else 8 end)
            and section.max_probes=(case when run.protocol_version='graph-sections-v3' then 12 else 20 end)
            and section.min_distinct_nodes=(case when run.protocol_version='graph-sections-v3' then 5 else 6 end)
            and section.probe_count between (case when run.protocol_version='graph-sections-v3' then 6 else 8 end) and (case when run.protocol_version='graph-sections-v3' then 12 else 20 end)
            and section.distinct_nodes_tested>=(case when run.protocol_version='graph-sections-v3' then 5 else 6 end)
            and section.completed_at is not null
          ),false)
          from public.diagnostic_run_sections section
          where section.run_id=run.id
        )
        and exists (
          select 1 from public.diagnostic_results result
          where result.diagnostic_run_id=run.id
            and result.student_id=run.student_id
            and result.completed_at=run.completed_at
        )
        and exists (
          select 1 from public.student_reading_estimates estimate
          where estimate.diagnostic_run_id=run.id
            and estimate.student_id=run.student_id
            and estimate.estimate_type='adaptive_diagnostic'
            and estimate.evidence_count=run.probe_count
        )
        and exists (
          select 1
          from public.student_learning_paths path
          join public.taxonomy_releases path_taxonomy
            on path_taxonomy.id=path.taxonomy_release_id
          where path.source_diagnostic_run_id=run.id
            and path.student_id=run.student_id
            and path.learning_goal_id=run.learning_goal_id
            and path.diagnostic_taxonomy_release_id=run.taxonomy_release_id
            and path.status in ('active','completed')
            and (
              path.taxonomy_release_id=run.taxonomy_release_id
              or (
                path.taxonomy_transition_key='french-v2-to-v3-stable-key-v1'
                and path_taxonomy.release_key='french-taxonomy-v3'
                and path_taxonomy.version='3.0.0'
                and path_taxonomy.status='published'
                and path_taxonomy.manifest_checksum=
                  'sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880'
                and path_taxonomy.validation_report @> '{"valid":true}'::jsonb
                and not exists (
                  select 1
                  from public.student_learning_path_steps step
                  where step.path_id=path.id
                    and not exists (
                      select 1
                      from public.taxonomy_release_memberships membership
                      where membership.release_id=path.taxonomy_release_id
                        and membership.record_type='competency_node'
                        and membership.record_id=step.node_id
                    )
                )
              )
            )
        )
    )
  end
$$;

revoke all on function public.student_learning_is_unlocked(uuid) from public,anon;
grant execute on function public.student_learning_is_unlocked(uuid) to authenticated,service_role;

