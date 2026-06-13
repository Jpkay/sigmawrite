-- Reading to Learn — initial schema (PRD §21).
-- Source of truth: Supabase Postgres. All ids are uuid; timestamps are timestamptz.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";     -- pgvector (PRD §15)

-- ───────────────────────── Organizations & schools ─────────────────────────

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('school', 'tutoring_center', 'family', 'internal')),
  created_at timestamptz not null default now()
);

create table schools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  country text,
  city text,
  curriculum_type text,
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  grade_level int,
  academic_year text,
  join_code text unique,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── Users & profiles ────────────────────────────

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','parent','teacher','school_admin','platform_admin','content_reviewer')),
  first_name text,
  last_name text,
  display_name text,
  preferred_language text not null default 'fr',
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  current_grade int,
  french_background text,
  date_of_birth date,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table student_guardians (
  student_id uuid references students(id) on delete cascade,
  guardian_profile_id uuid references profiles(id) on delete cascade,
  relationship text,
  primary key (student_id, guardian_profile_id)
);

create table teacher_classes (
  teacher_profile_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  primary key (teacher_profile_id, class_id)
);

create table enrollments (
  student_id uuid references students(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  status text not null default 'active',
  primary key (student_id, class_id)
);

-- ─────────────────────────── Student interests (§D) ────────────────────────

create table student_interests (
  student_id uuid references students(id) on delete cascade,
  interest_key text not null,
  declared_strength numeric default 0,
  inferred_strength numeric default 0,
  sessions_completed int default 0,
  avg_completion_rate numeric default 0,
  avg_success_rate numeric default 0,
  avg_time_on_task numeric default 0,
  last_used_at timestamptz,
  primary key (student_id, interest_key)
);

-- ─────────────────────────── Skills & knowledge ────────────────────────────

create table skills (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label_fr text not null,
  category text not null,
  description_fr text,
  prerequisite_skill_ids uuid[] default '{}',
  grade_band_min numeric,
  grade_band_max numeric
);

create table knowledge_domains (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label_fr text not null
);

create table knowledge_concepts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid references knowledge_domains(id) on delete set null,
  label_fr text not null,
  description_fr text,
  prerequisite_concept_ids uuid[] default '{}',
  related_concept_ids uuid[] default '{}',
  grade_band_min numeric,
  grade_band_max numeric
);

-- ──────────────────────────────── Content ──────────────────────────────────

create table texts (
  id uuid primary key default gen_random_uuid(),
  canonical_title text not null,
  primary_interest text,
  primary_domain_id uuid references knowledge_domains(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table text_versions (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references texts(id) on delete cascade,
  version_number int not null,
  title text not null,
  body text not null,
  language text not null default 'fr',
  word_count int,
  text_type text,
  estimated_grade_min numeric,
  estimated_grade_max numeric,
  difficulty_band text,
  lexical_difficulty numeric,
  syntax_difficulty numeric,
  knowledge_difficulty numeric,
  inference_difficulty numeric,
  stamina_difficulty numeric,
  overall_difficulty numeric,
  generation_type text check (generation_type in ('human','ai','ai_human_reviewed')),
  review_status text not null default 'draft'
    check (review_status in ('draft','auto_approved','needs_human_review','human_approved','rejected','retired','benchmark_locked')),
  source_policy text check (source_policy in ('generated','licensed','public_domain','original_human')),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (text_id, version_number)
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  text_version_id uuid not null references text_versions(id) on delete cascade,
  question_text text not null,
  question_type text not null,
  answer_format text not null,
  correct_answer text,
  rubric jsonb,
  difficulty numeric,
  created_at timestamptz not null default now()
);

create table question_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false
);

create table text_skills (
  text_version_id uuid references text_versions(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (text_version_id, skill_id)
);

create table question_skills (
  question_id uuid references questions(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (question_id, skill_id)
);

-- ──────────────────────────────── Vocabulary ───────────────────────────────

create table vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  lemma text not null,
  display_word text not null,
  definition_fr text,
  example_fr text,
  difficulty numeric,
  domain_id uuid references knowledge_domains(id) on delete set null,
  created_at timestamptz not null default now()
);

create table text_vocabulary (
  text_version_id uuid references text_versions(id) on delete cascade,
  vocabulary_item_id uuid references vocabulary_items(id) on delete cascade,
  is_target_word boolean not null default false,
  primary key (text_version_id, vocabulary_item_id)
);

create table student_word_mastery (
  student_id uuid references students(id) on delete cascade,
  vocabulary_item_id uuid references vocabulary_items(id) on delete cascade,
  mastery numeric not null default 0,
  exposures int not null default 0,
  retrieval_successes int not null default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz,
  primary key (student_id, vocabulary_item_id)
);

-- ───────────────────────────── Student estimates ───────────────────────────

create table student_reading_estimates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  estimate_type text,
  grade_min numeric,
  grade_max numeric,
  confidence text,
  evidence_count int default 0,
  created_at timestamptz not null default now()
);

create table student_skill_estimates (
  student_id uuid references students(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  ability numeric,
  uncertainty numeric,
  evidence_count int default 0,
  last_evidence_at timestamptz,
  primary key (student_id, skill_id)
);

create table student_domain_estimates (
  student_id uuid references students(id) on delete cascade,
  domain_id uuid references knowledge_domains(id) on delete cascade,
  familiarity numeric,
  evidence_count int default 0,
  last_evidence_at timestamptz,
  primary key (student_id, domain_id)
);

-- ────────────────────────────── Reading sessions ───────────────────────────

create table reading_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  text_version_id uuid not null references text_versions(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned boolean not null default false,
  success_rate numeric,
  literal_score numeric,
  inference_score numeric,
  vocabulary_score numeric,
  summary_score numeric,
  retrieval_score numeric,
  time_on_task_seconds int,
  hints_used int not null default 0,
  recommended_next_action text
);

create table student_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references reading_sessions(id) on delete cascade,
  question_id uuid not null references questions(id),
  answer_text text,
  selected_choice_id uuid references question_choices(id),
  is_correct boolean,
  score numeric,
  feedback text,
  answered_at timestamptz not null default now()
);

create table student_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references reading_sessions(id) on delete cascade,
  summary_text text not null,
  ai_score jsonb,
  teacher_score jsonb,
  created_at timestamptz not null default now()
);

create table reading_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references reading_sessions(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  event_type text not null,
  event_payload jsonb,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────── Retrieval ────────────────────────────────

create table retrieval_cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  concept_id uuid references knowledge_concepts(id) on delete set null,
  source_text_version_id uuid references text_versions(id) on delete set null,
  card_type text,
  prompt_fr text not null,
  expected_answer_fr text,
  rubric jsonb,
  created_at timestamptz not null default now()
);

create table retrieval_schedules (
  id uuid primary key default gen_random_uuid(),
  retrieval_card_id uuid not null references retrieval_cards(id) on delete cascade,
  due_at timestamptz not null,
  interval_days int,
  ease_factor numeric not null default 2.5,
  status text not null default 'due'
);

create table retrieval_attempts (
  id uuid primary key default gen_random_uuid(),
  retrieval_card_id uuid not null references retrieval_cards(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  answer_text text,
  score numeric,
  result text,
  attempted_at timestamptz not null default now()
);

-- ─────────────────────────────── AI workflow ───────────────────────────────

create table ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table ai_generated_candidates (
  id uuid primary key default gen_random_uuid(),
  generation_job_id uuid references ai_generation_jobs(id) on delete cascade,
  candidate_type text,
  payload jsonb not null,
  review_status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table ai_scoring_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references ai_generated_candidates(id) on delete cascade,
  score_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table ai_moderation_results (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references ai_generated_candidates(id) on delete cascade,
  moderation_payload jsonb not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  version_number int not null,
  prompt_text text not null,
  schema jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prompt_key, version_number)
);

-- ──────────────────────────────── Reports ──────────────────────────────────

create table parent_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  report_period_start date,
  report_period_end date,
  report_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table teacher_reports (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  report_period_start date,
  report_period_end date,
  report_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table benchmark_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  text_version_id uuid references text_versions(id),
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Privacy & compliance (§10) ──────────────────────

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  guardian_profile_id uuid references profiles(id) on delete set null,
  consent_type text not null check (consent_type in ('guardian','school','student_over_15')),
  consent_version text not null,
  privacy_policy_version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────── Indexes ──────────────────────────────────

create index on text_versions (text_id);
create index on text_versions (review_status);
create index on questions (text_version_id);
create index on reading_sessions (student_id);
create index on reading_sessions (text_version_id);
create index on student_answers (session_id);
create index on reading_session_events (session_id);
create index on retrieval_schedules (due_at) where status = 'due';
create index on enrollments (class_id);
create index on teacher_classes (class_id);
create index on student_guardians (guardian_profile_id);
-- Approximate-nearest-neighbour index for interest/text matching (§15).
create index on text_versions using ivfflat (embedding vector_cosine_ops) with (lists = 100);
