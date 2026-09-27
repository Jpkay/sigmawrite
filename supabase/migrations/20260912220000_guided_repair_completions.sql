begin;
-- Guided practice is completion history, not independent skill evidence.
create table public.student_repair_completions (
 student_id uuid not null references public.students(id) on delete cascade,
 submission_id uuid not null,
 skill_key text not null,
 lesson_checksum text not null,
 answers integer[] not null,
 corrects boolean[] not null,
 completed_at timestamptz not null default now(),
 primary key(student_id,submission_id),
 check(cardinality(answers) between 1 and 30 and cardinality(answers)=cardinality(corrects)),
 check(array_position(answers,null) is null and array_position(corrects,null) is null),
 check(0 <= all(answers)),
 check(lesson_checksum ~ '^sha256:[a-f0-9]{64}$')
);
alter table public.student_repair_completions enable row level security;
create policy repair_completion_select on public.student_repair_completions for select to authenticated using(public.can_view_student(student_id));
revoke all on public.student_repair_completions from anon,authenticated;
grant select on public.student_repair_completions to authenticated;
grant all on public.student_repair_completions to service_role;
create function public.record_student_repair_completion(p_student_id uuid,p_submission_id uuid,p_skill_key text,p_lesson_checksum text,p_answers integer[],p_corrects boolean[]) returns void
language plpgsql security definer set search_path=public as $$
declare saved public.student_repair_completions;
begin
 if not public.student_learning_is_unlocked(p_student_id) then raise exception 'Diagnostic required'; end if;
 -- The unique key serializes concurrent retries. The second statement reads
 -- the committed row after a conflicting insert has finished waiting.
 insert into public.student_repair_completions(student_id,submission_id,skill_key,lesson_checksum,answers,corrects)
 values(p_student_id,p_submission_id,p_skill_key,p_lesson_checksum,p_answers,p_corrects)
 on conflict(student_id,submission_id) do nothing;
 select * into strict saved from public.student_repair_completions where student_id=p_student_id and submission_id=p_submission_id;
 if saved.skill_key is distinct from p_skill_key or saved.lesson_checksum is distinct from p_lesson_checksum or saved.answers is distinct from p_answers or saved.corrects is distinct from p_corrects then
  raise exception 'Submission identity reused with different answers';
 end if;
 -- Intentionally no estimate or diagnostic evidence writes.
end $$;
revoke all on function public.record_student_repair_completion(uuid,uuid,text,text,integer[],boolean[]) from public,anon,authenticated;
grant execute on function public.record_student_repair_completion(uuid,uuid,text,text,integer[],boolean[]) to service_role;
commit;
