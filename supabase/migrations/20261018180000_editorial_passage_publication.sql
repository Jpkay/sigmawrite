-- Roadmap H.16 / E.3: library-mode reading passages written by the editorial
-- pipeline become real reading passages (texts + text_versions + questions +
-- target vocabulary), served to every student through the existing reading
-- flow. They are auto_approved with the pipeline version and gate evidence;
-- no person approves them. Unlike the selective passage pilot (0135), they are
-- not limited to a cohort or an exposure cap: the editorial bar (rubric ≥ 4.3,
-- every hard and required gate passed, model reviewers) is the quality gate,
-- and the daily audit / takedown is the safety net (H.15).

create table public.editorial_passage_publications (
  text_version_id uuid primary key references public.text_versions(id) on delete cascade,
  candidate_id uuid not null unique references public.ai_generated_candidates(id) on delete cascade,
  library_item_id uuid references public.editorial_library_items(id) on delete set null,
  run_id uuid references public.editorial_runs(id) on delete set null,
  pipeline_version text not null,
  interest text not null,
  grade_band text not null check (grade_band in ('cm','6e-5e','4e-3e')),
  grade integer check (grade between 4 and 9),
  rubric_mean numeric(3,2) not null check (rubric_mean >= 4.3),
  gate_results jsonb not null,
  withdrawn boolean not null default false,
  withdrawn_reason text,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);
create index editorial_passage_publications_live_idx on public.editorial_passage_publications (interest, grade_band) where not withdrawn;

alter table public.editorial_passage_publications enable row level security;
create policy editorial_passage_publications_read on public.editorial_passage_publications
  for select to authenticated using (public.is_staff());
revoke all on public.editorial_passage_publications from anon, authenticated;
grant select on public.editorial_passage_publications to authenticated;

-- auto_approved text versions need evidence: the selective pilot's QA run or an editorial publication.
create or replace function public.guard_automated_passage_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.review_status = 'auto_approved'
     and not exists (select 1 from automated_passage_publications where text_version_id = new.id)
     and not exists (select 1 from editorial_passage_publications where text_version_id = new.id) then
    raise exception 'automated_evidence_required';
  end if;
  if tg_op = 'UPDATE' and old.review_status = 'auto_approved' and (new.body is distinct from old.body or new.title is distinct from old.title) then
    raise exception 'automated_passage_is_immutable';
  end if;
  return new;
end $$;

-- Published automatic questions and answer keys stay bound to their evidence.
create or replace function public.guard_automated_passage_questions() returns trigger
language plpgsql security definer set search_path = public as $$
declare old_version uuid; new_version uuid;
begin
  if tg_table_name = 'questions' then
    if tg_op <> 'INSERT' then old_version = old.text_version_id; end if;
    if tg_op <> 'DELETE' then new_version = new.text_version_id; end if;
  else
    if tg_op <> 'INSERT' then select text_version_id into old_version from questions where id = old.question_id; end if;
    if tg_op <> 'DELETE' then select text_version_id into new_version from questions where id = new.question_id; end if;
  end if;
  if exists (select 1 from automated_passage_publications where text_version_id in (old_version, new_version))
     or exists (select 1 from editorial_passage_publications where text_version_id in (old_version, new_version)) then
    raise exception 'automated_questions_are_immutable';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- Editorial passages are readable by every signed-in user until withdrawn;
-- a student who already started one keeps access to finish it.
create or replace function public.can_read_automated_passage(p_version uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (
      select 1 from editorial_passage_publications e
      where e.text_version_id = p_version
        and (not e.withdrawn
             or exists (select 1 from reading_sessions s where s.text_version_id = p_version and owns_student(s.student_id)))
    )
    or exists (
      select 1 from automated_passage_publications a cross join passage_automation_policy p
      where a.text_version_id = p_version and p.id
        and ((p.enabled and not a.withdrawn and a.exposure_count < p.exposure_cap
              and mod(('x' || substr(md5(auth.uid()::text), 1, 8))::bit(32)::bigint, 100) < p.cohort_percent)
          or exists (select 1 from reading_sessions s where s.text_version_id = p_version and owns_student(s.student_id)))
    )
  )
$$;

-- A withdrawn editorial passage accepts no new reading session.
create or replace function public.block_withdrawn_editorial_passage() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from editorial_passage_publications where text_version_id = new.text_version_id and withdrawn) then
    raise exception 'editorial_passage_withdrawn';
  end if;
  return new;
end $$;
create trigger block_withdrawn_editorial_passage before insert on public.reading_sessions
  for each row execute function public.block_withdrawn_editorial_passage();

/**
 * Materialises one auto_approved editorial_reading_text candidate, atomically.
 * Re-checks the evidence carried by the candidate (pipeline version, rubric
 * ≥ 4.3, no failed hard/required gate, 3-choice questions whose answer is one
 * of the choices). Target words are linked only to existing vocabulary items
 * (vetted base): the model never creates a definition. Idempotent.
 * p_metrics: deterministic difficulty measures computed by the caller
 * (wordCount, difficultyBand, lexical, syntax, knowledge, inference, stamina,
 * overall, slug).
 */
create or replace function public.publish_editorial_passage(p_candidate_id uuid, p_metrics jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c ai_generated_candidates;
  p jsonb;
  v_text uuid;
  v_version uuid;
  v_question uuid;
  v_band text;
  v_grade int;
  q record;
  ch record;
  l record;
  v_item uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  select * into c from ai_generated_candidates where id = p_candidate_id for update;
  if c.id is null or c.candidate_type is distinct from 'editorial_reading_text' then
    raise exception 'editorial_candidate_not_found';
  end if;
  if c.approved_text_version_id is not null then
    return jsonb_build_object('textVersionId', c.approved_text_version_id, 'created', false);
  end if;
  if c.review_status <> 'auto_approved' then raise exception 'editorial_candidate_not_approved'; end if;
  p := c.payload;
  v_band := p->>'gradeBand';
  v_grade := nullif(p->>'grade', '')::int;
  if coalesce(p->>'pipelineVersion', '') !~ '^editorial-' then raise exception 'editorial_evidence_missing'; end if;
  if v_band is null or v_band not in ('cm','6e-5e','4e-3e') or coalesce(p->>'interest', '') = '' then raise exception 'editorial_evidence_missing'; end if;
  if coalesce((p->>'rubricMean')::numeric, 0) < 4.3 then raise exception 'editorial_rubric_below_bar'; end if;
  if jsonb_typeof(p->'gates') is distinct from 'array' or jsonb_array_length(p->'gates') = 0
     or exists (select 1 from jsonb_array_elements(p->'gates') g
                where g->>'level' in ('hard','required') and coalesce((g->>'passed')::boolean, false) = false) then
    raise exception 'editorial_gates_failed';
  end if;
  if jsonb_typeof(p->'questions') is distinct from 'array' or jsonb_array_length(p->'questions') not between 1 and 6
     or exists (select 1 from jsonb_array_elements(p->'questions') x
                where jsonb_typeof(x->'choices') is distinct from 'array' or jsonb_array_length(x->'choices') <> 3
                   or coalesce(x->>'questionText', '') = '' or not ((x->'choices') ? coalesce(x->>'correctAnswer', ''))) then
    raise exception 'editorial_questions_invalid';
  end if;
  if char_length(coalesce(p->>'body', '')) < 200 or char_length(coalesce(p->>'title', '')) < 1 then
    raise exception 'editorial_text_invalid';
  end if;

  insert into texts (slug, canonical_title, primary_interest, status)
  values (coalesce(nullif(p_metrics->>'slug', ''), 'texte') || '-' || substr(md5(c.id::text), 1, 6), p->>'title', p->>'interest', 'draft')
  returning id into v_text;

  insert into text_versions (text_id, version_number, title, body, language, word_count, text_type,
    estimated_grade_min, estimated_grade_max, difficulty_band, lexical_difficulty, syntax_difficulty,
    knowledge_difficulty, inference_difficulty, stamina_difficulty, overall_difficulty,
    generation_type, review_status, source_policy)
  values (v_text, 1, p->>'title', p->>'body', 'fr', nullif(p_metrics->>'wordCount', '')::int, 'narrative',
    v_grade, least(9, v_grade + 1), p_metrics->>'difficultyBand', nullif(p_metrics->>'lexical', '')::numeric,
    nullif(p_metrics->>'syntax', '')::numeric, nullif(p_metrics->>'knowledge', '')::numeric,
    nullif(p_metrics->>'inference', '')::numeric, nullif(p_metrics->>'stamina', '')::numeric,
    nullif(p_metrics->>'overall', '')::numeric, 'ai_automated', 'draft', 'generated')
  returning id into v_version;

  for q in select value as item, ordinality as n from jsonb_array_elements(p->'questions') with ordinality loop
    insert into questions (text_version_id, question_key, question_text, question_type, answer_format, correct_answer, rubric)
    values (v_version, 'q' || q.n, q.item->>'questionText', coalesce(q.item->>'questionType', 'literal'), 'multiple_choice',
      q.item->>'correctAnswer', jsonb_build_object('skill_key', coalesce(q.item->>'questionType', 'literal'), 'source', 'editorial'))
    returning id into v_question;
    for ch in select value #>> '{}' as choice_text, ordinality - 1 as idx from jsonb_array_elements(q.item->'choices') with ordinality loop
      insert into question_choices (question_id, choice_index, choice_text, is_correct)
      values (v_question, ch.idx, ch.choice_text, ch.choice_text = q.item->>'correctAnswer');
    end loop;
  end loop;

  insert into text_skills (text_version_id, skill_id)
  select distinct v_version, s.id from skills s
  where s.key in (select coalesce(x->>'questionType', 'literal') from jsonb_array_elements(p->'questions') x)
  on conflict do nothing;

  insert into text_version_nodes (text_version_id, node_id, source, confidence)
  select v_version, n.id, 'ai_proposed', 0.8 from competency_nodes n where n.key = 'comprehension_recit_passe'
  on conflict do nothing;

  insert into text_version_concepts (text_version_id, concept_id, source, confidence)
  select v_version, ic.concept_id, 'interest_backfill', ic.relevance from interest_concepts ic where ic.interest_key = p->>'interest'
  on conflict do nothing;

  -- Target words: link the vetted vocabulary items only (lemma match, case-insensitive).
  for l in select distinct lower(trim(value->>'lemma')) as lemma from jsonb_array_elements(coalesce(p->'targetLemmas', '[]'::jsonb)) loop
    select id into v_item from vocabulary_items where lower(lemma) = l.lemma order by created_at limit 1;
    if v_item is not null then
      insert into text_vocabulary (text_version_id, vocabulary_item_id, is_target_word) values (v_version, v_item, true)
      on conflict (text_version_id, vocabulary_item_id) do update set is_target_word = true;
    end if;
    v_item := null;
  end loop;

  insert into editorial_passage_publications (text_version_id, candidate_id, library_item_id, run_id, pipeline_version, interest, grade_band, grade, rubric_mean, gate_results)
  values (v_version, c.id, nullif(p->>'libraryItemId', '')::uuid, nullif(p->>'runId', '')::uuid, p->>'pipelineVersion', p->>'interest', v_band, v_grade,
    (p->>'rubricMean')::numeric, p->'gates');

  update text_versions set review_status = 'auto_approved' where id = v_version;
  update texts set status = 'active', updated_at = now() where id = v_text;
  update ai_generated_candidates set approved_text_version_id = v_version, updated_at = now() where id = c.id;
  insert into audit_logs (action, target_type, target_id, metadata)
  values ('content.editorial_passage_published', 'text_version', v_version,
    jsonb_build_object('candidateId', c.id, 'pipelineVersion', p->>'pipelineVersion', 'rubricMean', p->>'rubricMean', 'interest', p->>'interest', 'gradeBand', v_band));
  return jsonb_build_object('textVersionId', v_version, 'textId', v_text, 'created', true);
end $$;
revoke all on function public.publish_editorial_passage(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.publish_editorial_passage(uuid, jsonb) to service_role;

-- Candidates still waiting for materialisation (the library job sweeps them).
create or replace function public.pending_editorial_passages(p_limit int default 10) returns setof uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  return query select c.id from ai_generated_candidates c
    where c.candidate_type = 'editorial_reading_text' and c.review_status = 'auto_approved' and c.approved_text_version_id is null
    order by c.created_at limit greatest(1, least(p_limit, 50));
end $$;
revoke all on function public.pending_editorial_passages(int) from public, anon, authenticated;
grant execute on function public.pending_editorial_passages(int) to service_role;

-- H.15 takedown: the audit (service role) or a platform admin withdraws a passage from new sessions.
create or replace function public.withdraw_editorial_passage(p_text_version_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' and not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update editorial_passage_publications
  set withdrawn = true, withdrawn_reason = left(coalesce(p_reason, 'withdrawn'), 300), withdrawn_at = now()
  where text_version_id = p_text_version_id and not withdrawn;
  if not found then return false; end if;
  update editorial_library_items set status = 'withdrawn'
  where id = (select library_item_id from editorial_passage_publications where text_version_id = p_text_version_id);
  insert into audit_logs (action, target_type, target_id, metadata)
  values ('content.editorial_passage_withdrawn', 'text_version', p_text_version_id, jsonb_build_object('reason', p_reason));
  return true;
end $$;
revoke all on function public.withdraw_editorial_passage(uuid, text) from public, anon;
grant execute on function public.withdraw_editorial_passage(uuid, text) to authenticated, service_role;

comment on table public.editorial_passage_publications is 'Editorial library passages published as reading texts (auto_approved, pipeline evidence, no cohort limit). Withdrawn rows accept no new reading session.';
