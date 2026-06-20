-- French mastery platform — knowledge-graph foundation (Roadmap Phase 7, Stream A).
--
-- This is the pivot from a reading-only app to a graph-based French mastery
-- engine. French is decomposed into atomic *competency nodes* connected by typed
-- *edges* (prerequisite, misconception, …). One shared graph serves every learner
-- type; "overlays" (native school-literacy vs FSL communicative proficiency) are
-- expressed as tags/mappings on universal nodes — never duplicated nodes. A goal
-- is a scoping function over this graph (see learning_goals).
--
-- Lives in Postgres (not a separate graph DB): the graph is small (hundreds to a
-- few thousand nodes), read-heavy, and must join tightly to per-student state
-- under the existing RLS/consent/audit. Traversal is done with recursive CTEs
-- (migration 0010). RLS for these tables is in 0009.

-- ─────────────────────────────── Enumerations ──────────────────────────────
-- Kept as CHECK constraints (matches the repo's existing style) rather than PG
-- enum types, so values can evolve without ALTER TYPE migrations.

-- The 10 strands French is decomposed into.
--   orthographe_lexicale   — spelling of words themselves
--   orthographe_grammaticale — spelling driven by grammar (accords, homophones)
--   grammaire_syntaxe      — classes de mots, fonctions, subordination
--   conjugaison            — verbal morphology, tenses, moods
--   lexique                — vocabulary, morphology, register, collocations
--   comprehension_orale    — listening comprehension
--   production_orale       — speaking / oral production
--   comprehension_ecrite   — reading comprehension
--   expression_ecrite      — writing / expression écrite
--   analyse                — literary, cultural, analytical reasoning

-- CEFR rank helper: lets us range/monotonicity-check A1<A2<B1<B2<C1<C2 in SQL.
create or replace function public.cefr_rank(level text)
returns int language sql immutable set search_path = public as $$
  select case level
    when 'A1' then 1 when 'A2' then 2
    when 'B1' then 3 when 'B2' then 4
    when 'C1' then 5 when 'C2' then 6
    else null end
$$;

-- ─────────────────────────── Competency nodes (§E) ─────────────────────────

create table competency_nodes (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- stable slug, e.g. 'passe_compose_avoir'
  strand text not null check (strand in (
    'orthographe_lexicale','orthographe_grammaticale','grammaire_syntaxe',
    'conjugaison','lexique','comprehension_orale','production_orale',
    'comprehension_ecrite','expression_ecrite','analyse'
  )),
  label_fr text not null,
  description_fr text,
  -- Granularity 1 = broad/composite, 5 = atomic single-rule competency.
  atomicity_level int not null default 3 check (atomicity_level between 1 and 5),
  -- Primary overlays (hot path for goal-conditioned scoping). Extended framework
  -- mappings (ACTFL/AP/DELF/exam) live in framework_mappings to avoid column sprawl.
  native_grade_min numeric,                 -- e.g. 6 = 6e / grade 6
  native_grade_max numeric,
  cefr_min text check (cefr_min in ('A1','A2','B1','B2','C1','C2')),
  cefr_max text check (cefr_max in ('A1','A2','B1','B2','C1','C2')),
  -- Which modalities this competency can be exercised in (drives item authoring).
  requires_reading boolean not null default false,
  requires_writing boolean not null default false,
  requires_listening boolean not null default false,
  requires_speaking boolean not null default false,
  -- Relevance flags per learner overlay (a node may matter more to one group).
  is_native_relevant boolean not null default true,
  is_fsl_relevant boolean not null default true,
  is_heritage_relevant boolean not null default true,
  -- Authoring provenance + review state (mirrors text_versions.review_status).
  generation_type text not null default 'ai'
    check (generation_type in ('human','ai','ai_human_reviewed')),
  review_status text not null default 'draft'
    check (review_status in ('draft','auto_approved','needs_human_review',
                             'human_approved','rejected','retired')),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A node's CEFR range must be ordered when both ends are present.
  constraint cefr_ordered check (
    cefr_min is null or cefr_max is null
    or public.cefr_rank(cefr_min) <= public.cefr_rank(cefr_max)
  )
);

-- ─────────────────────────── Typed edges (the graph) ───────────────────────
-- Direction convention: source → target means "source is required BEFORE target"
-- for prerequisite edges (source is the prerequisite, target the dependent).
-- To find a node's prerequisites: edges where target = node.
-- To find what a node unlocks:     edges where source = node.

create table competency_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references competency_nodes(id) on delete cascade,
  target_node_id uuid not null references competency_nodes(id) on delete cascade,
  edge_type text not null check (edge_type in (
    'prerequisite',          -- source must be mastered before target
    'encompasses',           -- target is a sub-skill of source (part-of)
    'misconception_related', -- nodes commonly confused / co-failing
    'contrastive_transfer',  -- L1→French interference relationship (FSL)
    'same_family',           -- sibling competencies (e.g. tense family)
    'remediates'             -- source is a repair lesson for target's gap
  )),
  strength numeric not null default 1 check (strength >= 0 and strength <= 1),
  notes text,
  created_at timestamptz not null default now(),
  generation_type text not null default 'ai'
    check (generation_type in ('human','ai','ai_human_reviewed')),
  -- Production-validated lift (Gate 5): does mastering source predict target?
  -- Null until psychometrics run; lets us flag wrong LLM-guessed edges later.
  predictive_lift numeric,
  unique (source_node_id, target_node_id, edge_type),
  constraint no_self_loop check (source_node_id <> target_node_id)
);

-- ───────────────────── Extended framework mappings (§3 targets) ─────────────
-- Rows, not columns: one node maps to many external frameworks without column
-- sprawl. The two primary overlays (native grade, CEFR) stay on the node itself.

create table framework_mappings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references competency_nodes(id) on delete cascade,
  framework text not null check (framework in (
    'native_grade','cefr','actfl','ap','delf_dalf','exam_task','socle_commun'
  )),
  level_min text,                 -- framework-specific (e.g. 'Intermediate Low', 'B1')
  level_max text,
  relevance numeric default 1 check (relevance >= 0 and relevance <= 1),
  notes text,
  unique (node_id, framework)
);

-- ──────────────────────────── Misconceptions (§J) ──────────────────────────

create table misconceptions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label_fr text not null,
  description_fr text,
  strand text check (strand in (
    'orthographe_lexicale','orthographe_grammaticale','grammaire_syntaxe',
    'conjugaison','lexique','comprehension_orale','production_orale',
    'comprehension_ecrite','expression_ecrite','analyse'
  )),
  primary_node_id uuid references competency_nodes(id) on delete set null,
  -- e.g. {"pattern":"present_for_past","example":"Hier je vais au cinéma"}
  diagnostic_signature jsonb,
  -- Confirmed by error-clustering on real data (Gate 5); null until validated.
  empirically_confirmed boolean,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── Items (§H, §I) ──────────────────────────────
-- The assessment/practice atoms. Sparse by design: we author items for the
-- high-value (node × modality × learner_mode) cells, not the full cross-product.

create table competency_items (
  id uuid primary key default gen_random_uuid(),
  primary_node_id uuid not null references competency_nodes(id) on delete cascade,
  secondary_node_ids uuid[] not null default '{}',
  misconception_ids uuid[] not null default '{}',
  strand text not null,                     -- denormalized for fast filtering
  modality text not null check (modality in (
    'reading','writing','listening','speaking','grammar_analysis','dictee'
  )),
  learner_mode text not null default 'shared' check (learner_mode in (
    'native','fsl','heritage','allophone','immersion','shared'
  )),
  response_type text not null check (response_type in (
    'mcq','short_answer','cloze','transform','written','spoken','ordering'
  )),
  prompt_fr text not null,
  instructions_fr text,
  correct_answer text,                      -- canonical answer (short/cloze/transform)
  acceptable_answers text[] not null default '{}',
  rubric jsonb,                             -- for written/spoken rubric scoring
  -- How a response is graded — drives Gate-2 answer-key verification and live grading.
  validator_type text not null default 'exact' check (validator_type in (
    'exact','regex','conjugator','agreement','grammalecte','rubric','llm_assisted'
  )),
  validator_config jsonb,                   -- e.g. {"verb":"parler","tense":"passe_compose"}
  difficulty numeric,                       -- authored estimate, 0–100
  cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  native_grade_band numeric,
  -- Authoring provenance + QC gate audit trail.
  generation_type text not null default 'ai'
    check (generation_type in ('human','ai','ai_human_reviewed')),
  generation_model text,
  prompt_version text,
  qc_gates jsonb,                           -- {"schema":true,"answer_key":true,"ensemble":0.86}
  review_status text not null default 'draft'
    check (review_status in ('draft','auto_approved','needs_human_review',
                             'human_approved','rejected','retired')),
  -- Production psychometrics (Gate 5), null until enough attempts accrue.
  p_value numeric,                          -- proportion correct (difficulty)
  discrimination numeric,                   -- point-biserial
  attempts_count int not null default 0,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MCQ / ordering choices. A distractor may map to a misconception, so a wrong
-- pick is itself diagnostic evidence.
create table competency_item_choices (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references competency_items(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  misconception_id uuid references misconceptions(id) on delete set null,
  position int,
  feedback_fr text
);

-- ────────────────── Per-student multi-dimensional estimates (§J) ────────────
-- Receptive vs productive, written vs oral: an FSL learner may *recognize* a
-- tense in reading yet fail to *produce* it orally. That distinction is a
-- first-class diagnosable state here.

create table student_competency_estimates (
  student_id uuid not null references students(id) on delete cascade,
  node_id uuid not null references competency_nodes(id) on delete cascade,
  mastery_probability numeric not null default 0.1,  -- BKT p(known), 0–1
  uncertainty numeric not null default 1,            -- 0–1, shrinks with evidence
  receptive_score numeric,                           -- recognize/understand, 0–1
  productive_score numeric,                          -- produce/use, 0–1
  written_score numeric,
  oral_score numeric,
  fluency_score numeric,                             -- speed/automaticity
  accuracy_score numeric,
  decay_rate numeric not null default 0.05,          -- forgetting; feeds retrieval
  evidence_count int not null default 0,
  last_practiced_at timestamptz,
  last_evidence_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, node_id)
);

-- Evidence log: every item attempt. Source of truth for BKT updates and the
-- Gate-5 psychometrics (item p-value/discrimination, edge predictive lift).
create table competency_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  item_id uuid references competency_items(id) on delete set null,
  node_id uuid not null references competency_nodes(id) on delete cascade,
  learner_mode text,
  modality text,
  answer_text text,
  selected_choice_id uuid references competency_item_choices(id) on delete set null,
  is_correct boolean,
  score numeric,                            -- 0–1 partial credit
  result text check (result in ('forgot','hard','good','easy')),
  latency_ms int,
  hints_used int not null default 0,
  context text check (context in ('diagnostic','practice','retrieval','writing','assignment')),
  attempted_at timestamptz not null default now()
);

-- ───────────────────── Learner profile & goals (§ profiles) ─────────────────
-- The diagnostic is goal-conditioned: profile + goal determine which nodes are
-- in scope, which modalities count, and the success threshold.

create table learner_profiles (
  student_id uuid primary key references students(id) on delete cascade,
  student_type text not null check (student_type in (
    'french_first_language','french_second_language','heritage',
    'bilingual','allophone','immersion'
  )),
  home_language text,                       -- optional; for transfer/interference
  exposure text check (exposure in (
    'home','school','class_only','immersion','self_study'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table learning_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  goal_type text not null check (goal_type in (
    'catch_up','improve_writing','grammar_spelling','improve_speaking',
    'prepare_delf','prepare_ap_ib','enter_french_school','literature_class'
  )),
  -- The scoping target: which framework + level defines "done".
  target_framework text check (target_framework in ('native_grade','cefr','actfl')),
  target_level text,                        -- e.g. 'B1' or '8'
  target_grade numeric,
  -- Scope spec: strands in play, modalities that count, mastery threshold.
  -- e.g. {"strands":["conjugaison","expression_ecrite"],
  --       "modalities":["writing"],"mastery_threshold":0.85}
  scope jsonb,
  status text not null default 'active' check (status in ('active','achieved','paused')),
  created_at timestamptz not null default now()
);

-- ──────────────────────────────── Indexes ──────────────────────────────────

create index on competency_nodes (strand);
create index on competency_nodes (review_status);
create index on competency_edges (target_node_id, edge_type);  -- prereq lookups
create index on competency_edges (source_node_id, edge_type);  -- unlock lookups
create index on framework_mappings (node_id);
create index on framework_mappings (framework, level_min);
create index on competency_items (primary_node_id);
create index on competency_items (strand, learner_mode, modality);
create index on competency_items (review_status);
create index on competency_item_choices (item_id);
create index on student_competency_estimates (node_id);
create index on competency_attempts (item_id);
create index on competency_attempts (node_id);
create index on competency_attempts (student_id, attempted_at);
create index on learning_goals (student_id) where status = 'active';
