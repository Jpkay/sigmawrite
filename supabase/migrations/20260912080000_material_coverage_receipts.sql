begin;
-- Capture is deliberately disabled until every delivery boundary for this
-- contract has been verified. No existing student receives a fresh baseline.
create table public.material_capture_contracts (
 contract_key text primary key check(length(btrim(contract_key))>0),
 enabled boolean not null default false,
 created_at timestamptz not null default clock_timestamp()
);
create unique index one_enabled_material_capture_contract on public.material_capture_contracts ((true)) where enabled;
insert into public.material_capture_contracts(contract_key) values ('plume-material-capture-v1');
create table public.student_material_coverage_epochs (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null unique references public.students(id) on delete cascade,
 contract_key text not null references public.material_capture_contracts(contract_key),
 started_at timestamptz not null default clock_timestamp(),
 invalidated_at timestamptz,
 invalidation_reason text,
 baseline_kind text not null default 'fresh_student' check(baseline_kind='fresh_student'),
 check((invalidated_at is null)=(invalidation_reason is null))
);
create table public.student_material_coverage_receipts (
 presentation_id uuid primary key references public.student_material_presentations(id) on delete cascade,
 coverage_epoch_id uuid references public.student_material_coverage_epochs(id),
 history_complete boolean not null,
 recorded_at timestamptz not null default clock_timestamp(),
 check(not history_complete or coverage_epoch_id is not null)
);
alter table public.material_capture_contracts enable row level security;
alter table public.student_material_coverage_epochs enable row level security;
alter table public.student_material_coverage_receipts enable row level security;
revoke all on public.material_capture_contracts,public.student_material_coverage_epochs,public.student_material_coverage_receipts from public,anon,authenticated,service_role;
grant select on public.material_capture_contracts,public.student_material_coverage_epochs,public.student_material_coverage_receipts to service_role;

create function public.begin_new_student_material_coverage() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into student_material_coverage_epochs(student_id,contract_key)
 select new.id,contract_key from material_capture_contracts where enabled;
 return new;
end $$;
revoke all on function public.begin_new_student_material_coverage() from public,anon,authenticated,service_role;
create trigger begin_new_student_material_coverage after insert on public.students
 for each row execute function public.begin_new_student_material_coverage();

-- Called before any delivery whose material coverage is not known. This also
-- serializes against receipt creation for the same student. No reset operation.
create function public.invalidate_student_material_coverage(p_student_id uuid,p_reason text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_student_id is null or p_reason is null or length(btrim(p_reason))=0 then raise exception 'Invalid coverage invalidation'; end if;
 perform 1 from student_material_coverage_epochs where student_id=p_student_id for update;
 update student_material_coverage_epochs set invalidated_at=clock_timestamp(),invalidation_reason=left(p_reason,300)
 where student_id=p_student_id and invalidated_at is null;
end $$;
revoke all on function public.invalidate_student_material_coverage(uuid,text) from public,anon,authenticated;
grant execute on function public.invalidate_student_material_coverage(uuid,text) to service_role;

create function public.capture_material_presentation_coverage() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_epoch student_material_coverage_epochs%rowtype; v_complete boolean:=false;
begin
 select * into v_epoch from student_material_coverage_epochs where student_id=new.student_id for update;
 if found then
  v_complete:=v_epoch.invalidated_at is null
   and current_setting('plume.material_capture_contract',true)=v_epoch.contract_key
   and exists(select 1 from material_capture_contracts where contract_key=v_epoch.contract_key and enabled);
  v_complete:=coalesce(v_complete,false);
  if not v_complete and v_epoch.invalidated_at is null then
   update student_material_coverage_epochs set invalidated_at=clock_timestamp(),invalidation_reason='unverified_material_delivery'
    where id=v_epoch.id;
  end if;
 end if;
 insert into student_material_coverage_receipts(presentation_id,coverage_epoch_id,history_complete)
 values(new.id,v_epoch.id,v_complete);
 return new;
end $$;
revoke all on function public.capture_material_presentation_coverage() from public,anon,authenticated,service_role;
create trigger capture_material_presentation_coverage after insert on public.student_material_presentations
 for each row execute function public.capture_material_presentation_coverage();

-- Trusted recorder only, after verifying complete payload capture. The existing
-- recorder still enforces source/owner identity and idempotent first exposure.
create function public.record_covered_student_material_presentation(
 p_presentation_id uuid,p_student_id uuid,p_source_checksum text,p_material_keys text[],p_contract_key text
) returns table(material_key text,first_recorded_exposure boolean)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_previous text:=current_setting('plume.material_capture_contract',true);
begin
 if p_contract_key is null or not exists(select 1 from material_capture_contracts where contract_key=p_contract_key and enabled)
 then raise exception 'Material capture contract is not enabled'; end if;
 perform 1 from student_material_coverage_epochs where student_id=p_student_id for update;
 perform set_config('plume.material_capture_contract',p_contract_key,true);
 return query select * from record_student_material_presentation(p_presentation_id,p_student_id,p_source_checksum,p_material_keys);
 perform set_config('plume.material_capture_contract',coalesce(v_previous,''),true);
end $$;
revoke all on function public.record_covered_student_material_presentation(uuid,uuid,text,text[],text) from public,anon,authenticated;
grant execute on function public.record_covered_student_material_presentation(uuid,uuid,text,text[],text) to service_role;

create function public.student_material_history_complete(p_student_id uuid,p_presentation_id uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce((select c.history_complete
 from student_material_coverage_receipts c join student_material_presentations p on p.id=c.presentation_id
 where p.id=p_presentation_id and p.student_id=p_student_id),false)
$$;
revoke all on function public.student_material_history_complete(uuid,uuid) from public,anon,authenticated;
grant execute on function public.student_material_history_complete(uuid,uuid) to service_role;
commit;
