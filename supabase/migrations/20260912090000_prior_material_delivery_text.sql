begin;
create index student_material_journal_chronology on public.student_material_delivery_journal(student_id,first_delivered_at,boundary,payload_checksum);
-- Strictly earlier delivered text, scoped to the immutable presentation owner.
-- A current question's own journal entry is excluded. Coverage receipt time is
-- captured after the student's coverage lock, unlike transaction-start now().
create function public.prior_student_material_delivery_text(p_student_id uuid,p_presentation_id uuid,p_offset integer default 0,p_limit integer default 100)
returns table(boundary text,payload_checksum text,text_fragments text[])
language sql stable security definer set search_path=public,pg_temp as $$
 select j.boundary,j.payload_checksum,j.text_fragments
 from student_material_delivery_journal j
 join student_material_presentations p on p.student_id=j.student_id
 left join student_material_coverage_receipts c on c.presentation_id=p.id
 where p.id=p_presentation_id and p.student_id=p_student_id
 and j.first_delivered_at<coalesce(c.recorded_at,p.created_at)
 order by j.first_delivered_at,j.boundary,j.payload_checksum
 offset greatest(0,p_offset) limit least(100,greatest(1,p_limit))
$$;
revoke all on function public.prior_student_material_delivery_text(uuid,uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.prior_student_material_delivery_text(uuid,uuid,integer,integer) to service_role;
commit;
