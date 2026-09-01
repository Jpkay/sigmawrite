begin;

create or replace function public.mark_pilot_diagnostic_evidence()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_run_id uuid;
begin
  if tg_table_name='diagnostic_responses' then
    v_run_id:=new.run_id;
  else
    v_run_id:=new.diagnostic_run_id;
  end if;
  if v_run_id is not null and exists (
    select 1 from public.diagnostic_runs run where run.id=v_run_id and run.is_pilot
  ) then new.provisional:=true; end if;
  return new;
end
$$;

commit;
