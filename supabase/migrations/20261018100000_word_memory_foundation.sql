-- Word memory foundation (roadmap 2026-10, Phases A–C).
--
-- A word = a lexical sense (0037). Each student × sense gets two FSRS cards
-- in learning_retrieval_schedules (facet spelling | meaning). Every place a
-- word is seen writes vocabulary_learning_evidence (0092, until now unused)
-- and every card review writes word_review_log (needed to fit parameters).
-- All writes go through service-only SECURITY DEFINER functions: students can
-- read their memory but can no longer forge mastery, cards or evidence.

-- ---------------------------------------------------------------------------
-- A.3 Lexical anchoring: every vocabulary item can resolve to lemma + sense.
-- No trigger on vocabulary_items (catalog imports manage their own lemma ids);
-- anchors are created lazily, with the vocabulary item id as lemma id.
-- ---------------------------------------------------------------------------
alter table public.text_vocabulary
  add column if not exists lexical_sense_id uuid references public.lexical_senses(id) on delete set null;
comment on column public.text_vocabulary.lexical_sense_id is
  'Optional sense pin for ambiguous lemmas (bureau: furniture vs office). Null = the lemma''s only teachable sense.';

create or replace function public.ensure_vocabulary_lexical_anchors(p_item_ids uuid[])
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer := 0; v_rows integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  insert into lexical_lemmas(id, vocabulary_item_id, lemma, normalized_lemma)
  select v.id, v.id, v.lemma, lower(trim(v.lemma))
  from vocabulary_items v
  where v.id = any(p_item_ids)
    and not exists (select 1 from lexical_lemmas l where l.vocabulary_item_id = v.id)
    and not exists (select 1 from lexical_lemmas l where l.id = v.id)
  on conflict do nothing;
  get diagnostics v_rows = row_count; v_count := v_count + v_rows;
  insert into lexical_senses(lemma_id, sense_key, definition_fr, review_status)
  select l.id, 'legacy_default', trim(v.definition_fr), 'human_approved'
  from vocabulary_items v
  join lexical_lemmas l on l.vocabulary_item_id = v.id
  where v.id = any(p_item_ids)
    and nullif(trim(v.definition_fr), '') is not null
    and not exists (select 1 from lexical_senses s where s.lemma_id = l.id)
  on conflict (lemma_id, sense_key) do nothing;
  get diagnostics v_rows = row_count; v_count := v_count + v_rows;
  return v_count;
end $$;
revoke all on function public.ensure_vocabulary_lexical_anchors(uuid[]) from public, anon, authenticated;
grant execute on function public.ensure_vocabulary_lexical_anchors(uuid[]) to service_role;

-- One-off backfill for items created after 0037.
insert into public.lexical_lemmas(id, vocabulary_item_id, lemma, normalized_lemma)
select v.id, v.id, v.lemma, lower(trim(v.lemma)) from public.vocabulary_items v
where not exists (select 1 from public.lexical_lemmas l where l.vocabulary_item_id = v.id)
  and not exists (select 1 from public.lexical_lemmas l where l.id = v.id)
on conflict do nothing;
insert into public.lexical_senses(lemma_id, sense_key, definition_fr, review_status)
select l.id, 'legacy_default', trim(v.definition_fr), 'human_approved'
from public.vocabulary_items v join public.lexical_lemmas l on l.vocabulary_item_id = v.id
where nullif(trim(v.definition_fr), '') is not null
  and not exists (select 1 from public.lexical_senses s where s.lemma_id = l.id)
on conflict (lemma_id, sense_key) do nothing;

-- Resolves vocabulary items and/or normalised surface forms to teachable
-- senses. "courait" → courir through lexical_forms; ambiguous lemmas return
-- one row per sense with sense_count > 1.
create or replace function public.resolve_word_senses(p_item_ids uuid[], p_forms text[])
returns table(match_key text, vocabulary_item_id uuid, lemma_id uuid, sense_id uuid, sense_count integer, display_word text, definition_fr text)
language sql stable security definer set search_path=public as $$
  with matches as (
    select v.id::text as match_key, l.id as lemma_id
    from vocabulary_items v join lexical_lemmas l on l.vocabulary_item_id = v.id
    where v.id = any(coalesce(p_item_ids, '{}'::uuid[]))
    union
    select f.normalized_form, f.lemma_id from lexical_forms f
    where f.normalized_form = any(coalesce(p_forms, '{}'::text[]))
    union
    select l.normalized_lemma, l.id from lexical_lemmas l
    where l.active and l.normalized_lemma = any(coalesce(p_forms, '{}'::text[]))
    union
    select lower(trim(v.display_word)), l.id
    from vocabulary_items v join lexical_lemmas l on l.vocabulary_item_id = v.id
    where lower(trim(v.display_word)) = any(coalesce(p_forms, '{}'::text[]))
  ), senses as (
    select s.id, s.lemma_id, s.definition_fr, count(*) over (partition by s.lemma_id)::integer as sense_count
    from lexical_senses s
    where s.review_status = 'human_approved' and s.is_teachable and not s.is_proper_noun
  )
  select m.match_key, l.vocabulary_item_id, l.id, s.id, coalesce(s.sense_count, 0), v.display_word, s.definition_fr
  from matches m
  join lexical_lemmas l on l.id = m.lemma_id and l.vocabulary_item_id is not null
  join vocabulary_items v on v.id = l.vocabulary_item_id
  left join senses s on s.lemma_id = l.id
$$;
revoke all on function public.resolve_word_senses(uuid[], text[]) from public, anon, authenticated;
grant execute on function public.resolve_word_senses(uuid[], text[]) to service_role;

-- ---------------------------------------------------------------------------
-- A.1/A.4 Evidence: richer rows, idempotent, service-only writes.
-- ---------------------------------------------------------------------------
alter table public.vocabulary_learning_evidence
  add column if not exists lexical_sense_id uuid references public.lexical_senses(id) on delete set null,
  add column if not exists facet text check (facet in ('spelling','meaning')),
  add column if not exists source text not null default 'legacy'
    check (source in ('reading','dictation','practice','diagnostic','writing','story','review','embedded','introduction','legacy_review','legacy')),
  add column if not exists activity_format text,
  add column if not exists hint_level smallint not null default 0 check (hint_level between 0 and 3),
  add column if not exists answer_revealed boolean not null default false,
  add column if not exists accent_only boolean not null default false,
  add column if not exists novel_context boolean not null default false,
  add column if not exists response_ms integer check (response_ms is null or response_ms >= 0),
  add column if not exists rating smallint check (rating between 1 and 4),
  add column if not exists counts_for_fsrs boolean not null default false,
  add column if not exists occurrence_key text,
  add column if not exists review_log_id uuid;
create unique index if not exists vocabulary_learning_evidence_occurrence
  on public.vocabulary_learning_evidence(student_id, occurrence_key) where occurrence_key is not null;
create index if not exists vocabulary_learning_evidence_sense_idx
  on public.vocabulary_learning_evidence(student_id, lexical_sense_id, occurred_at);
drop policy if exists vocabulary_learning_evidence_student_insert on public.vocabulary_learning_evidence;
drop policy if exists vocabulary_learning_evidence_student_read on public.vocabulary_learning_evidence;
create policy vocabulary_learning_evidence_view on public.vocabulary_learning_evidence
  for select using (public.can_view_student(student_id));
revoke insert, update, delete on public.vocabulary_learning_evidence from anon, authenticated;

-- Mastery is derived on the server from evidence and cards; students read it.
-- word_mastery_rw stays bound to the unified gate (0142 + 20260912120000) for
-- reads; table privileges now keep writes on the service path.
revoke insert, update, delete on public.student_word_mastery from anon, authenticated;
alter table public.student_word_mastery
  add column if not exists word_status text not null default 'decouvert'
    check (word_status in ('decouvert','en_route','presque','a_revoir','maitrise','ancre')),
  add column if not exists status_note text check (status_note in ('a_confirmer')),
  add column if not exists to_introduce boolean not null default false,
  add column if not exists first_seen_at timestamptz,
  add column if not exists first_seen_sentence text check (char_length(first_seen_sentence) <= 400),
  add column if not exists first_seen_interest text,
  add column if not exists status_updated_at timestamptz;
comment on column public.student_word_mastery.word_status is
  'B.2 status from wordStatus(evidence, cards). Exposure, look-ups and recognition never exceed en_route.';
comment on column public.student_word_mastery.to_introduce is
  'C.2: seen but not yet introduced; no FSRS card exists until the word is introduced.';

-- ---------------------------------------------------------------------------
-- B.1 Two cards per student × sense.
-- ---------------------------------------------------------------------------
alter table public.learning_retrieval_schedules
  add column if not exists facet text not null default 'none' check (facet in ('none','spelling','meaning')),
  add column if not exists importance numeric not null default 1 check (importance between 0 and 10),
  add column if not exists introduced_at timestamptz;
alter table public.learning_retrieval_schedules
  add constraint learning_retrieval_lexical_facet check (target_type <> 'lexical_sense' or facet <> 'none') not valid;
do $$ declare c text; begin
  select conname into c from pg_constraint
  where conrelid = 'public.learning_retrieval_schedules'::regclass and contype = 'u'
    and pg_get_constraintdef(oid) = 'UNIQUE (student_id, target_type, target_id, retrieval_mode)';
  if c is not null then execute format('alter table public.learning_retrieval_schedules drop constraint %I', c); end if;
end $$;
alter table public.learning_retrieval_schedules
  add constraint learning_retrieval_schedules_target_facet_key unique (student_id, target_type, target_id, retrieval_mode, facet);
create index if not exists learning_retrieval_word_cards_idx
  on public.learning_retrieval_schedules(student_id, due_at) where target_type = 'lexical_sense';

-- Same body as 0042; only the conflict target gains the facet column.
create or replace function public.schedule_package_retrieval(p_student_id uuid,p_package_version_id uuid,p_completed_at timestamptz default now()) returns integer language plpgsql security definer set search_path=public as $$declare n integer;begin if auth.role()<>'service_role' and not public.owns_student(p_student_id) then raise exception 'forbidden';end if;insert into public.learning_retrieval_schedules(student_id,target_type,target_id,retrieval_mode,source_package_version_id,due_at,status) select p_student_id,'competency_node',m.node_id,mode.mode,p_package_version_id,p_completed_at+make_interval(days=>case when mode.mode='recognition' then coalesce(policy.initial_recognition_days,1) else coalesce(policy.initial_production_days,3) end),'scheduled' from public.learning_package_node_memberships m left join public.package_retrieval_policies policy on policy.package_version_id=m.package_version_id cross join lateral unnest(case when coalesce(policy.production_enabled,true) then array['recognition','production'] else array['recognition'] end) mode(mode) where m.package_version_id=p_package_version_id and m.membership_type='required' and coalesce(policy.recognition_enabled,true) on conflict(student_id,target_type,target_id,retrieval_mode,facet) do update set due_at=least(learning_retrieval_schedules.due_at,excluded.due_at),source_package_version_id=excluded.source_package_version_id,status='scheduled',updated_at=now();get diagnostics n=row_count;return n;end$$;
revoke all on function public.schedule_package_retrieval(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.schedule_package_retrieval(uuid,uuid,timestamptz) to service_role;

-- Students keep their own non-word schedules; word cards are service-only.
alter policy learning_retrieval_student_write on public.learning_retrieval_schedules
  using (public.owns_student(student_id) and public.student_learning_is_unlocked(student_id) and target_type <> 'lexical_sense')
  with check (public.owns_student(student_id) and public.student_learning_is_unlocked(student_id) and target_type <> 'lexical_sense');

-- Full review log (required for parameter fitting, C.3).
create table if not exists public.word_review_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  schedule_id uuid not null references public.learning_retrieval_schedules(id) on delete cascade,
  lexical_sense_id uuid not null references public.lexical_senses(id) on delete cascade,
  facet text not null check (facet in ('spelling','meaning')),
  reviewed_at timestamptz not null,
  rating smallint not null check (rating between 1 and 4),
  correct boolean not null,
  accent_only boolean not null default false,
  counts_for_fsrs boolean not null,
  elapsed_days numeric check (elapsed_days is null or elapsed_days >= 0),
  scheduled_days numeric check (scheduled_days is null or scheduled_days >= 0),
  activity_format text not null,
  hint_level smallint not null default 0 check (hint_level between 0 and 3),
  answer_revealed boolean not null default false,
  response_ms integer check (response_ms is null or response_ms >= 0),
  source text not null check (source in ('reading','dictation','practice','diagnostic','writing','story','review','embedded','introduction','legacy_review')),
  stability_before numeric,
  difficulty_before numeric,
  retrievability_before numeric check (retrievability_before is null or retrievability_before between 0 and 1),
  stability_after numeric,
  difficulty_after numeric,
  desired_retention numeric,
  params_version text not null default 'fsrs6-default',
  occurrence_key text not null,
  created_at timestamptz not null default now(),
  unique (student_id, occurrence_key)
);
create index if not exists word_review_log_student_time on public.word_review_log(student_id, reviewed_at desc);
create index if not exists word_review_log_schedule_time on public.word_review_log(schedule_id, reviewed_at);
create index if not exists word_review_log_time on public.word_review_log(reviewed_at);
alter table public.word_review_log enable row level security;
create policy word_review_log_view on public.word_review_log for select using (public.can_view_student(student_id));
revoke insert, update, delete on public.word_review_log from anon, authenticated;
comment on table public.word_review_log is
  'Every word-card answer: rating after hint/speed caps, real elapsed days, format, hint, response time, source. counts_for_fsrs=false for same-day retries (C.4).';

-- ---------------------------------------------------------------------------
-- C.5 Per-student calendar and caps.
-- ---------------------------------------------------------------------------
create table if not exists public.student_memory_settings (
  student_id uuid primary key references public.students(id) on delete cascade,
  calendar_zone text check (calendar_zone in ('A','B','C','custom')),
  custom_holidays jsonb not null default '[]'::jsonb check (jsonb_typeof(custom_holidays) = 'array'),
  pause_during_holidays boolean not null default false,
  max_daily_reviews integer check (max_daily_reviews between 0 and 60),
  max_new_words integer check (max_new_words between 0 and 10),
  updated_at timestamptz not null default now()
);
alter table public.student_memory_settings enable row level security;
create policy student_memory_settings_view on public.student_memory_settings for select using (public.can_view_student(student_id));
create policy student_memory_settings_owner_write on public.student_memory_settings for all
  using (public.owns_student(student_id) or public.is_guardian_of(student_id))
  with check (public.owns_student(student_id) or public.is_guardian_of(student_id));
revoke insert, update, delete on public.student_memory_settings from anon;

-- ---------------------------------------------------------------------------
-- C.3 Versioned FSRS parameters and calibration reports; C.6 weekly reports.
-- ---------------------------------------------------------------------------
create table if not exists public.fsrs_parameter_sets (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  scope text not null check (scope in ('cohort','student')),
  cohort_key text check (cohort_key in ('cm','6e5e','4e3e')),
  facet text not null check (facet in ('spelling','meaning')),
  student_id uuid references public.students(id) on delete cascade,
  weights jsonb not null check (jsonb_typeof(weights) = 'array' and jsonb_array_length(weights) = 21),
  optimizer text not null,
  review_count integer not null check (review_count >= 0),
  holdout_log_loss_default numeric,
  holdout_log_loss_fitted numeric,
  calibration jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate','active','rejected','retired')),
  fitted_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint fsrs_parameter_scope check (
    (scope = 'cohort' and cohort_key is not null and student_id is null)
    or (scope = 'student' and student_id is not null)
  )
);
create unique index if not exists fsrs_parameter_sets_one_active
  on public.fsrs_parameter_sets(scope, coalesce(cohort_key, ''), facet, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'active';
alter table public.fsrs_parameter_sets enable row level security;
create policy fsrs_parameter_sets_staff_read on public.fsrs_parameter_sets for select using (public.is_staff());
revoke insert, update, delete on public.fsrs_parameter_sets from anon, authenticated;

create table if not exists public.fsrs_calibration_reports (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  optimizer_status text not null,
  report jsonb not null
);
alter table public.fsrs_calibration_reports enable row level security;
create policy fsrs_calibration_reports_staff_read on public.fsrs_calibration_reports for select using (public.is_staff());
revoke insert, update, delete on public.fsrs_calibration_reports from anon, authenticated;

create table if not exists public.word_memory_reports (
  week_start date primary key,
  generated_at timestamptz not null default now(),
  report jsonb not null
);
alter table public.word_memory_reports enable row level security;
create policy word_memory_reports_staff_read on public.word_memory_reports for select using (public.is_staff());
revoke insert, update, delete on public.word_memory_reports from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Writers (service-only).
-- ---------------------------------------------------------------------------

-- Inserts one evidence row (idempotent on occurrence_key) and updates the
-- per-word counters. Exposure only ever increments `exposures`: it never
-- touches mastery (A.1). Returns the new evidence id, or null if duplicate.
create or replace function public.apply_word_evidence_row(p_student_id uuid, p_row jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_kind text := p_row->>'evidence_kind'; v_item uuid := (p_row->>'vocabulary_item_id')::uuid;
  v_at timestamptz := coalesce((p_row->>'occurred_at')::timestamptz, now()); v_success boolean := coalesce((p_row->>'successful')::boolean, false);
begin
  insert into vocabulary_learning_evidence(
    student_id, vocabulary_item_id, lexical_sense_id, schedule_id, evidence_kind, successful, typed_production, facet, source,
    activity_format, hint_level, answer_revealed, accent_only, novel_context, response_ms, rating, counts_for_fsrs,
    occurrence_key, review_log_id, evidence_payload, occurred_at)
  values (
    p_student_id, v_item, nullif(p_row->>'lexical_sense_id','')::uuid, nullif(p_row->>'schedule_id','')::uuid, v_kind, v_success,
    coalesce((p_row->>'typed_production')::boolean, false), nullif(p_row->>'facet',''), coalesce(p_row->>'source','legacy'),
    p_row->>'activity_format', coalesce((p_row->>'hint_level')::smallint, 0), coalesce((p_row->>'answer_revealed')::boolean, false),
    coalesce((p_row->>'accent_only')::boolean, false), coalesce((p_row->>'novel_context')::boolean, false),
    nullif(p_row->>'response_ms','')::integer, nullif(p_row->>'rating','')::smallint, coalesce((p_row->>'counts_for_fsrs')::boolean, false),
    p_row->>'occurrence_key', nullif(p_row->>'review_log_id','')::uuid, coalesce(p_row->'payload', '{}'::jsonb), v_at)
  on conflict (student_id, occurrence_key) where occurrence_key is not null do nothing
  returning id into v_id;
  if v_id is null then return null; end if;

  insert into student_word_mastery(student_id, vocabulary_item_id, mastery, exposures, last_seen_at, first_seen_at, first_seen_sentence, first_seen_interest, to_introduce)
  values (p_student_id, v_item, 0, case when v_kind = 'exposure' then 1 else 0 end, v_at, v_at,
    left(nullif(p_row->>'first_seen_sentence',''), 400), nullif(p_row->>'first_seen_interest',''),
    coalesce((p_row->>'to_introduce')::boolean, false))
  on conflict (student_id, vocabulary_item_id) do update set
    exposures = student_word_mastery.exposures + case when v_kind = 'exposure' then 1 else 0 end,
    last_seen_at = greatest(coalesce(student_word_mastery.last_seen_at, v_at), v_at),
    first_seen_at = coalesce(student_word_mastery.first_seen_at, excluded.first_seen_at),
    first_seen_sentence = coalesce(student_word_mastery.first_seen_sentence, excluded.first_seen_sentence),
    first_seen_interest = coalesce(student_word_mastery.first_seen_interest, excluded.first_seen_interest),
    to_introduce = student_word_mastery.to_introduce or excluded.to_introduce;
  update student_word_mastery set evidence_counts = jsonb_set(
      evidence_counts, array[v_kind], to_jsonb(coalesce((evidence_counts->>v_kind)::integer, 0) + 1), true)
  where student_id = p_student_id and vocabulary_item_id = v_item;
  return v_id;
end $$;
revoke all on function public.apply_word_evidence_row(uuid, jsonb) from public, anon, authenticated, service_role;

-- Batch entry point for recordWordEvidence (non-review evidence).
create or replace function public.record_word_evidence(p_student_id uuid, p_rows jsonb)
returns integer language plpgsql security definer set search_path=public as $$
declare v_row jsonb; v_count integer := 0;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'invalid evidence batch'; end if;
  for v_row in select value from jsonb_array_elements(p_rows) loop
    if v_row->>'evidence_kind' not in ('exposure','help_lookup','recognition','meaning_recall','contextual_use','correct_spelling') then
      raise exception 'invalid evidence kind';
    end if;
    if public.apply_word_evidence_row(p_student_id, v_row) is not null then v_count := v_count + 1; end if;
  end loop;
  return v_count;
end $$;
revoke all on function public.record_word_evidence(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_word_evidence(uuid, jsonb) to service_role;

-- Creates the two cards when a word is introduced (D.1 → C.2). Idempotent.
create or replace function public.introduce_word_cards(p_student_id uuid, p_sense_id uuid, p_introduced_at timestamptz, p_due_at timestamptz, p_importance numeric default 1)
returns setof public.learning_retrieval_schedules language plpgsql security definer set search_path=public as $$
declare v_item uuid;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  select l.vocabulary_item_id into v_item from lexical_senses s join lexical_lemmas l on l.id = s.lemma_id where s.id = p_sense_id;
  if v_item is null then raise exception 'word sense not found' using errcode='P0002'; end if;
  insert into learning_retrieval_schedules(student_id, target_type, target_id, retrieval_mode, facet, due_at, status, introduced_at, importance, fsrs_state)
  select p_student_id, 'lexical_sense', p_sense_id, 'production', f.facet, p_due_at, 'scheduled', p_introduced_at, coalesce(p_importance, 1), '{}'::jsonb
  from unnest(array['spelling','meaning']) f(facet)
  on conflict (student_id, target_type, target_id, retrieval_mode, facet) do nothing;
  insert into student_word_mastery(student_id, vocabulary_item_id, mastery, first_seen_at, word_status)
  values (p_student_id, v_item, 0, p_introduced_at, 'en_route')
  on conflict (student_id, vocabulary_item_id) do update set
    to_introduce = false,
    word_status = case when student_word_mastery.word_status = 'decouvert' then 'en_route' else student_word_mastery.word_status end,
    first_seen_at = coalesce(student_word_mastery.first_seen_at, excluded.first_seen_at);
  return query select * from learning_retrieval_schedules
    where student_id = p_student_id and target_type = 'lexical_sense' and target_id = p_sense_id and retrieval_mode = 'production';
end $$;
revoke all on function public.introduce_word_cards(uuid, uuid, timestamptz, timestamptz, numeric) from public, anon, authenticated;
grant execute on function public.introduce_word_cards(uuid, uuid, timestamptz, timestamptz, numeric) to service_role;

-- One card review, atomically: log + evidence + (if counted) the new FSRS
-- state. Compare-and-set on last_reviewed_at rejects concurrent double
-- updates (errcode 40001, the caller reloads and retries). Idempotent on
-- occurrence_key: a replay returns the first log id.
create or replace function public.record_word_review(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_student uuid := (p_payload->>'student_id')::uuid;
  v_schedule uuid := (p_payload->>'schedule_id')::uuid;
  v_key text := p_payload->>'occurrence_key';
  v_counts boolean := coalesce((p_payload->>'counts_for_fsrs')::boolean, false);
  v_card learning_retrieval_schedules%rowtype;
  v_log uuid; v_at timestamptz := (p_payload->>'reviewed_at')::timestamptz; v_fsrs jsonb := p_payload->'fsrs';
  v_evidence jsonb;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  if v_key is null or v_at is null then raise exception 'invalid word review'; end if;
  select id into v_log from word_review_log where student_id = v_student and occurrence_key = v_key;
  if v_log is not null then return jsonb_build_object('log_id', v_log, 'duplicate', true); end if;
  select * into v_card from learning_retrieval_schedules where id = v_schedule and student_id = v_student and target_type = 'lexical_sense' for update;
  if not found then raise exception 'word card not found' using errcode='P0002'; end if;
  if v_counts then
    if v_card.last_reviewed_at is distinct from nullif(p_payload->>'expected_last_reviewed_at','')::timestamptz then
      raise exception 'stale word card' using errcode='40001';
    end if;
    if v_fsrs is null or (v_fsrs->>'stability')::numeric <= 0 or (v_fsrs->>'difficulty')::numeric not between 1 and 10 then
      raise exception 'invalid fsrs state';
    end if;
    update learning_retrieval_schedules set
      fsrs_state = v_fsrs,
      due_at = (v_fsrs->>'due_at')::timestamptz,
      interval_days = greatest(1, round((v_fsrs->>'interval_days')::numeric)::integer),
      repetitions = coalesce((v_fsrs->>'reps')::integer, repetitions + 1),
      lapse_count = coalesce((v_fsrs->>'lapses')::integer, lapse_count),
      last_reviewed_at = v_at,
      status = 'scheduled',
      updated_at = now()
    where id = v_schedule;
  else
    update learning_retrieval_schedules set exposure_count = exposure_count + 1, updated_at = now() where id = v_schedule;
  end if;
  insert into word_review_log(student_id, schedule_id, lexical_sense_id, facet, reviewed_at, rating, correct, accent_only, counts_for_fsrs,
    elapsed_days, scheduled_days, activity_format, hint_level, answer_revealed, response_ms, source, stability_before, difficulty_before,
    retrievability_before, stability_after, difficulty_after, desired_retention, params_version, occurrence_key)
  values (v_student, v_schedule, v_card.target_id, v_card.facet, v_at, (p_payload->>'rating')::smallint, coalesce((p_payload->>'correct')::boolean, false),
    coalesce((p_payload->>'accent_only')::boolean, false), v_counts,
    nullif(p_payload->>'elapsed_days','')::numeric, nullif(p_payload->>'scheduled_days','')::numeric, p_payload->>'activity_format',
    coalesce((p_payload->>'hint_level')::smallint, 0), coalesce((p_payload->>'answer_revealed')::boolean, false),
    nullif(p_payload->>'response_ms','')::integer, p_payload->>'source',
    nullif(p_payload->>'stability_before','')::numeric, nullif(p_payload->>'difficulty_before','')::numeric,
    nullif(p_payload->>'retrievability_before','')::numeric,
    case when v_counts then (v_fsrs->>'stability')::numeric else nullif(p_payload->>'stability_before','')::numeric end,
    case when v_counts then (v_fsrs->>'difficulty')::numeric else nullif(p_payload->>'difficulty_before','')::numeric end,
    nullif(p_payload->>'desired_retention','')::numeric, coalesce(p_payload->>'params_version', 'fsrs6-default'), v_key)
  returning id into v_log;
  v_evidence := coalesce(p_payload->'evidence', '{}'::jsonb) || jsonb_build_object(
    'review_log_id', v_log, 'schedule_id', v_schedule, 'lexical_sense_id', v_card.target_id, 'facet', v_card.facet,
    'occurrence_key', v_key, 'occurred_at', v_at, 'counts_for_fsrs', v_counts, 'rating', p_payload->>'rating');
  perform public.apply_word_evidence_row(v_student, v_evidence);
  return jsonb_build_object('log_id', v_log, 'duplicate', false);
end $$;
revoke all on function public.record_word_review(jsonb) from public, anon, authenticated;
grant execute on function public.record_word_review(jsonb) to service_role;
