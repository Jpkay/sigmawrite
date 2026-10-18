-- Roadmap E.4: once a student's interests are known, the diagnostic prefers
-- an interest-tagged bank item (competency_items.validator_config.interestKeys,
-- e.g. the v2 reading items tagged by migration 0133) over an equivalent one.
--
-- "Equivalent" means: same node, same evidence urgency, same uncertainty and a
-- difficulty within the same 10-point bucket of the learner's estimate. The
-- interest never overrides what the diagnostic needs to measure. With no
-- interest match the order is exactly the previous one (the bucket is a
-- monotone function of the distance it replaces).
--
-- The function body is patched in place (one ORDER BY term inside the
-- per-node item_rank window) rather than copied, so later fixes to the rest of
-- the function are kept. The migration fails loudly if the anchor moved.
begin;

do $migration$
declare
  current_definition text;
  patched_definition text;
begin
  current_definition := pg_get_functiondef('public.next_section_diagnostic_item(uuid,uuid,text)'::regprocedure);
  if position('student_interests' in current_definition) > 0 then
    return;
  end if;
  patched_definition := regexp_replace(
    current_definition,
    'abs\(membership\.difficulty-(.*?)\*100\),\s*item\.id\) item_rank',
    'floor(abs(membership.difficulty-\1*100)/10),
      exists(select 1 from public.student_interests student_interest
        where student_interest.student_id=p_student_id
          and coalesce(item.validator_config->''interestKeys'',''[]''::jsonb) ? student_interest.interest_key) desc,
      abs(membership.difficulty-\1*100),
      item.id) item_rank'
  );
  if patched_definition = current_definition then
    raise exception 'next_section_diagnostic_item: item_rank ordering anchor not found';
  end if;
  execute patched_definition;
end
$migration$;

commit;
