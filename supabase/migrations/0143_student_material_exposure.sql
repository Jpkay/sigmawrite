begin;
-- A material identity is a reviewed, normalized word/lemma or sentence hash.
-- This ledger records first *tracked* exposure, not outside-app familiarity.
create table public.student_material_presentations (
 id uuid primary key,
 student_id uuid not null references public.students(id) on delete cascade,
 source_checksum text not null check(length(btrim(source_checksum))>0),
 material_keys text[] not null check(cardinality(material_keys)>0),
 created_at timestamptz not null default now(),
 unique(id,student_id)
);
create table public.student_material_exposures (
 student_id uuid not null references public.students(id) on delete cascade,
 material_key text not null check(material_key ~ '^(word|sentence):sha256:[0-9a-f]{64}$'),
 first_presentation_id uuid not null,
 first_seen_at timestamptz not null default now(),
 primary key(student_id,material_key),
 foreign key(first_presentation_id,student_id) references public.student_material_presentations(id,student_id) on delete cascade
);
alter table public.student_material_presentations enable row level security;
alter table public.student_material_exposures enable row level security;
revoke all on public.student_material_presentations,public.student_material_exposures from public,anon,authenticated,service_role;
grant select,insert on public.student_material_presentations,public.student_material_exposures to service_role;

create function public.record_student_material_presentation(
 p_presentation_id uuid,p_student_id uuid,p_source_checksum text,p_material_keys text[]
) returns table(material_key text,first_recorded_exposure boolean)
language plpgsql security invoker set search_path=public as $$
declare
 v_keys text[];
 v_existing public.student_material_presentations%rowtype;
begin
 if p_presentation_id is null or p_student_id is null
  or p_source_checksum is null or length(btrim(p_source_checksum))=0
  or p_material_keys is null or cardinality(p_material_keys)=0
  or cardinality(p_material_keys)>1000
  or exists(select 1 from unnest(p_material_keys) k where k is null or k !~ '^(word|sentence):sha256:[0-9a-f]{64}$')
 then raise exception 'Invalid material presentation'; end if;
 select array_agg(distinct k order by k) into v_keys from unnest(p_material_keys) k;
 -- A stable server-generated presentation ID makes retries idempotent. Never
 -- accept a replay that changes the owner, source version or exposed material.
 insert into student_material_presentations(id,student_id,source_checksum,material_keys)
 values(p_presentation_id,p_student_id,p_source_checksum,v_keys) on conflict(id) do nothing;
 select * into strict v_existing from student_material_presentations where id=p_presentation_id;
 if v_existing.student_id<>p_student_id or v_existing.source_checksum<>p_source_checksum or v_existing.material_keys<>v_keys
 then raise exception 'Material presentation identity reused'; end if;
 insert into student_material_exposures(student_id,material_key,first_presentation_id)
 select p_student_id,k,p_presentation_id from unnest(v_keys) k
 on conflict on constraint student_material_exposures_pkey do nothing;
 return query select e.material_key,e.first_presentation_id=p_presentation_id
 from student_material_exposures e where e.student_id=p_student_id and e.material_key=any(v_keys)
 order by e.material_key;
end $$;
revoke all on function public.record_student_material_presentation(uuid,uuid,text,text[]) from public,anon,authenticated;
grant execute on function public.record_student_material_presentation(uuid,uuid,text,text[]) to service_role;
-- Read a previously committed receipt without turning an answer submission into
-- a new presentation. Missing or mismatched source identity yields no evidence.
create function public.read_student_material_presentation(
 p_presentation_id uuid,p_student_id uuid,p_source_checksum text
) returns table(material_key text,first_recorded_exposure boolean)
language sql stable security invoker set search_path=public as $$
 select e.material_key,e.first_presentation_id=p.id
 from student_material_presentations p
 join student_material_exposures e on e.student_id=p.student_id and e.material_key=any(p.material_keys)
 where p.id=p_presentation_id and p.student_id=p_student_id and p.source_checksum=p_source_checksum
 order by e.material_key
$$;
revoke all on function public.read_student_material_presentation(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.read_student_material_presentation(uuid,uuid,text) to service_role;
create function public.known_student_material_keys(p_student_id uuid,p_material_keys text[])
returns setof text language sql stable security invoker set search_path=public as $$
 select e.material_key from student_material_exposures e
 where e.student_id=p_student_id and e.material_key=any(p_material_keys)
 order by e.material_key
$$;
revoke all on function public.known_student_material_keys(uuid,text[]) from public,anon,authenticated;
grant execute on function public.known_student_material_keys(uuid,text[]) to service_role;
commit;
