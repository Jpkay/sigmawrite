-- Lycée (2de–Terminale, grades 10–12) joins the editorial pipeline as band 'lycee'.
-- Additive: existing CM1–3e bands and rows are unchanged.

alter table public.story_sagas drop constraint story_sagas_grade_band_check;
alter table public.story_sagas add constraint story_sagas_grade_band_check check (grade_band in ('cm','6e-5e','4e-3e','lycee'));

alter table public.editorial_library_items drop constraint editorial_library_items_grade_band_check;
alter table public.editorial_library_items add constraint editorial_library_items_grade_band_check check (grade_band in ('cm','6e-5e','4e-3e','lycee'));
alter table public.editorial_library_items drop constraint editorial_library_items_grade_check;
alter table public.editorial_library_items add constraint editorial_library_items_grade_check check (grade between 4 and 12);

alter table public.editorial_passage_publications drop constraint editorial_passage_publications_grade_band_check;
alter table public.editorial_passage_publications add constraint editorial_passage_publications_grade_band_check check (grade_band in ('cm','6e-5e','4e-3e','lycee'));
alter table public.editorial_passage_publications drop constraint editorial_passage_publications_grade_check;
alter table public.editorial_passage_publications add constraint editorial_passage_publications_grade_check check (grade between 4 and 12);

alter table public.dictations drop constraint dictations_grade_min_check;
alter table public.dictations add constraint dictations_grade_min_check check (grade_min between 4 and 12);
alter table public.dictations drop constraint dictations_grade_max_check;
alter table public.dictations add constraint dictations_grade_max_check check (grade_max between 4 and 12);

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
  if v_band is null or v_band not in ('cm','6e-5e','4e-3e','lycee') or coalesce(p->>'interest', '') = '' then raise exception 'editorial_evidence_missing'; end if;
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
    v_grade, least(12, v_grade + 1), p_metrics->>'difficultyBand', nullif(p_metrics->>'lexical', '')::numeric,
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
