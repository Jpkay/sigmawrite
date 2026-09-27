-- QA v2 separates affirmative evaluator observations from defects and permits unpunctuated headings.
-- Re-evaluate shadow candidates; never activate automatically or reuse v1 calibration.
update public.passage_automation_policy set pipeline_version='selective-passage-2',calibration_id=null where id and not enabled;
do $$begin if not exists(select 1 from public.passage_automation_policy where id and pipeline_version='selective-passage-2' and not enabled) then raise exception 'disable_automation_before_qa_upgrade'; end if;end$$;
