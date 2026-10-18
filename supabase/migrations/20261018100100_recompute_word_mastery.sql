-- A.2: recompute every student_word_mastery.mastery from typed review history
-- only (vocabulary_review_attempts). Reading used to set mastery =
-- exposures / 5, so a word read five times looked "mastered".
--
-- Replays the typed-recall deltas of the former review action
-- (forgot −0.20, hard +0.03, good +0.10, easy +0.15, clamped to [0,1]) and
-- caps the result below the mastery gate (0.84) unless the history shows
-- successes on at least three different days with the last one at least
-- seven days after the previous one (the B.2 spacing rule). Rows that drop
-- are flagged 'a_confirmer' — shown to the student as "À confirmer", never as
-- lost. Typed history is also copied into vocabulary_learning_evidence so the
-- new status function keeps it.
create or replace function public.recompute_word_mastery_from_typed_history(p_student_id uuid default null)
returns integer language plpgsql security definer set search_path=public as $$
declare
  r record; a record;
  v_mastery numeric; v_days date[]; v_changed integer := 0; v_spaced boolean;
begin
  if auth.role() is distinct from 'service_role' and current_user not in ('postgres','supabase_admin') then
    raise exception 'service role required' using errcode='42501';
  end if;
  for r in
    select m.student_id, m.vocabulary_item_id, m.mastery
    from student_word_mastery m
    where p_student_id is null or m.student_id = p_student_id
    for update
  loop
    v_mastery := 0; v_days := '{}';
    for a in
      select result, reviewed_at from vocabulary_review_attempts
      where student_id = r.student_id and vocabulary_item_id = r.vocabulary_item_id
      order by reviewed_at, id
    loop
      v_mastery := greatest(0, least(1, v_mastery + case a.result when 'forgot' then -0.2 when 'hard' then 0.03 when 'good' then 0.1 else 0.15 end));
      if a.result in ('good','easy') and not ((a.reviewed_at at time zone 'Europe/Paris')::date = any(v_days)) then
        v_days := v_days || (a.reviewed_at at time zone 'Europe/Paris')::date;
      end if;
    end loop;
    v_spaced := coalesce(array_length(v_days, 1), 0) >= 3
      and v_days[array_length(v_days, 1)] - v_days[array_length(v_days, 1) - 1] >= 7;
    if not v_spaced then v_mastery := least(v_mastery, 0.84); end if;
    v_mastery := round(v_mastery, 4);
    update student_word_mastery set
      mastery = v_mastery,
      status_note = case when v_mastery < r.mastery then 'a_confirmer' else status_note end,
      word_status = case when word_status = 'decouvert' and exists (
          select 1 from vocabulary_review_attempts t where t.student_id = r.student_id and t.vocabulary_item_id = r.vocabulary_item_id and t.result in ('good','easy','hard')
        ) then 'en_route' else word_status end
    where student_id = r.student_id and vocabulary_item_id = r.vocabulary_item_id;
    if v_mastery is distinct from r.mastery then v_changed := v_changed + 1; end if;
  end loop;
  return v_changed;
end $$;
revoke all on function public.recompute_word_mastery_from_typed_history(uuid) from public, anon, authenticated;
grant execute on function public.recompute_word_mastery_from_typed_history(uuid) to service_role;

-- Keep the typed history as evidence (type-the-word-from-its-definition
-- proves both traces). 'hard' was a one-letter or accent slip: not a success.
insert into public.vocabulary_learning_evidence(student_id, vocabulary_item_id, lexical_sense_id, evidence_kind, successful, typed_production,
  facet, source, activity_format, rating, counts_for_fsrs, occurrence_key, occurred_at)
select t.student_id, t.vocabulary_item_id,
  (select s.id from public.lexical_lemmas l join public.lexical_senses s on s.lemma_id = l.id
    where l.vocabulary_item_id = t.vocabulary_item_id and s.review_status = 'human_approved' order by s.created_at limit 1),
  case f.facet when 'spelling' then 'correct_spelling' else 'meaning_recall' end,
  t.result in ('good','easy'), true, f.facet, 'legacy_review', 'type_from_definition',
  case t.result when 'forgot' then 1 when 'hard' then 2 when 'good' then 3 else 4 end, true,
  'legacy_review:' || t.id::text || ':' || f.facet, t.reviewed_at
from public.vocabulary_review_attempts t
cross join (values ('spelling'), ('meaning')) f(facet)
on conflict (student_id, occurrence_key) where occurrence_key is not null do nothing;

select public.recompute_word_mastery_from_typed_history(null);

-- Words with typed history get no card yet (C.2: a card needs an
-- introduction); put them first on the "to introduce" list instead.
update public.student_word_mastery m set to_introduce = true
where exists (select 1 from public.vocabulary_review_attempts t where t.student_id = m.student_id and t.vocabulary_item_id = m.vocabulary_item_id);
