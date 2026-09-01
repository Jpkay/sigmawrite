-- Flat vocabulary memory tier: FSRS state and immutable review evidence.
alter table public.student_word_mastery
  add column if not exists stability numeric check(stability>0),
  add column if not exists difficulty numeric check(difficulty between 1 and 10),
  add column if not exists desired_retention numeric not null default .90 check(desired_retention between .70 and .97),
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists last_result text check(last_result in ('forgot','hard','good','easy'));

create table if not exists public.vocabulary_review_attempts(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  vocabulary_item_id uuid not null references public.vocabulary_items(id) on delete cascade,
  result text not null check(result in ('forgot','hard','good','easy')),
  previous_mastery numeric not null,
  next_mastery numeric not null,
  reviewed_at timestamptz not null default now()
);
alter table public.vocabulary_review_attempts enable row level security;
create policy vocabulary_attempts_own_insert on public.vocabulary_review_attempts for insert with check(public.owns_student(student_id));
create policy vocabulary_attempts_view on public.vocabulary_review_attempts for select using(public.can_view_student(student_id));
create index if not exists vocabulary_review_attempts_student_time on public.vocabulary_review_attempts(student_id,reviewed_at desc);
create index if not exists student_word_mastery_due on public.student_word_mastery(student_id,next_review_at);

create or replace function public.record_vocabulary_review(
  p_student_id uuid,p_item_id uuid,p_result text,p_stability numeric,p_difficulty numeric,p_next_review_at timestamptz,p_next_mastery numeric
) returns void language plpgsql security definer set search_path=public as $$
declare v_previous numeric;begin
  if current_setting('request.jwt.claim.role',true) is distinct from 'service_role' then raise exception 'service role required' using errcode='42501';end if;
  if p_result not in ('forgot','hard','good','easy') or p_stability<=0 or p_difficulty not between 1 and 10 or p_next_mastery not between 0 and 1 then raise exception 'invalid review';end if;
  select mastery into v_previous from public.student_word_mastery where student_id=p_student_id and vocabulary_item_id=p_item_id for update;
  if not found then raise exception 'word memory not found' using errcode='P0002';end if;
  update public.student_word_mastery set mastery=p_next_mastery,stability=p_stability,difficulty=p_difficulty,next_review_at=p_next_review_at,last_reviewed_at=now(),last_result=p_result,retrieval_successes=retrieval_successes+case when p_result in ('good','easy') then 1 else 0 end where student_id=p_student_id and vocabulary_item_id=p_item_id;
  insert into public.vocabulary_review_attempts(student_id,vocabulary_item_id,result,previous_mastery,next_mastery) values(p_student_id,p_item_id,p_result,v_previous,p_next_mastery);
end;$$;
revoke all on function public.record_vocabulary_review(uuid,uuid,text,numeric,numeric,timestamptz,numeric) from public,anon,authenticated;
grant execute on function public.record_vocabulary_review(uuid,uuid,text,numeric,numeric,timestamptz,numeric) to service_role;
