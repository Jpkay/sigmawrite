begin;
-- Exact delivered strings, including corrections/hints/options shipped in the
-- payload. This is an audit source, not a completeness or novelty certificate.
create table public.student_material_delivery_journal (
 student_id uuid not null references public.students(id) on delete cascade,
 boundary text not null check(boundary ~ '^[a-z][a-z0-9:_-]{1,99}$'),
 payload_checksum text not null check(payload_checksum ~ '^sha256:[0-9a-f]{64}$'),
 text_fragments text[] not null check(cardinality(text_fragments) between 1 and 20000),
 first_delivered_at timestamptz not null default clock_timestamp(),
 primary key(student_id,boundary,payload_checksum)
);
alter table public.student_material_delivery_journal enable row level security;
revoke all on public.student_material_delivery_journal from public,anon,authenticated,service_role;
grant select on public.student_material_delivery_journal to service_role;
create function public.record_student_material_delivery_text(p_student_id uuid,p_boundary text,p_payload_checksum text,p_text_fragments text[])
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_existing text[];
begin
 if p_text_fragments is null or array_position(p_text_fragments,null) is not null
 or cardinality(p_text_fragments) not between 1 and 20000
 or (select coalesce(sum(length(t)),0) from unnest(p_text_fragments) t)>2000000
 then raise exception 'Invalid delivery text journal payload'; end if;
 -- A raw snapshot does not prove semantic material coverage. Until a verified
 -- capture contract consumes it, fail closed for later novelty assertions.
 perform invalidate_student_material_coverage(p_student_id,'unverified_delivery_payload:'||p_boundary);
 insert into student_material_delivery_journal(student_id,boundary,payload_checksum,text_fragments)
 values(p_student_id,p_boundary,p_payload_checksum,p_text_fragments) on conflict do nothing;
 select text_fragments into strict v_existing from student_material_delivery_journal
 where student_id=p_student_id and boundary=p_boundary and payload_checksum=p_payload_checksum;
 if v_existing<>p_text_fragments then raise exception 'Delivery journal identity reused'; end if;
end $$;
revoke all on function public.record_student_material_delivery_text(uuid,text,text,text[]) from public,anon,authenticated;
grant execute on function public.record_student_material_delivery_text(uuid,text,text,text[]) to service_role;
commit;
