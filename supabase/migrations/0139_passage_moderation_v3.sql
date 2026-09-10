-- Isolate passage moderation from the generation model; require fresh calibration.
do $$begin
 if not exists(select 1 from public.passage_automation_policy where id and not enabled and pipeline_version='selective-passage-2') then
  raise exception 'Expected disabled v2 policy before moderation upgrade';
 end if;
end$$;
update public.passage_automation_policy set pipeline_version='selective-passage-3',calibration_id=null where id;
