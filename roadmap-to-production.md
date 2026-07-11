# Roadmap to Production — French Mastery Platform ("Reading to Learn")

> **Date**: 2026-07-10
> **Audience**: the LLM Coder working sprint by sprint.
> **Inputs**: `docs/reading_to_learn_full_prd_tech_stack.pdf` (PRD v1.0), `gap-analysis.md`, `.claude/roadmap.md` (pivot phases 7–15), the codebase on `feature/competency-graph`.
> **Goal**: ship a **superior** version of the PRD — the reading-to-learn application layer running on the pivot's competency-graph mastery engine — production-ready for a school/parent pilot.

---

## 0. How to use this document

- Work **one sprint at a time, in order** unless the dependency map says otherwise. Every sprint is self-contained: it starts from a working app and ends with a working app plus one verifiable increment.
- Each sprint has **Goal / Why / Tasks / Acceptance criteria / Out of scope**. Do not start tasks from a later sprint "while you're in there" — atomicity is the point.
- **Definition of done for every sprint** (in addition to its own acceptance criteria):
  1. `npm test` passes; new pure logic has unit tests.
  2. `npx tsc --noEmit` and `npm run lint` pass.
  3. New tables/columns ship as a numbered migration in `supabase/migrations/` with RLS policies in the same or adjacent migration. Never write a table without deciding its RLS.
  4. Every new server action starts with `requireRole(...)` and validates input with Zod.
  5. Anything RLS-sensitive is verified against the live/staging DB the way Phases 5–6 were (positive + negative case, e.g. teacher 201 / student 403).
  6. UI text is French, teen-respectful for students; dropdowns follow the global UI standard (`pr-10`, `appearance:none`, custom chevron, `bg-zinc-950` options).
  7. Update `README.md` (what shipped) and tick the sprint in §7 of this file.

### Non-negotiable architecture principles (from the PRD + pivot; never violate)

1. **AI generates, explains, assists. The platform scores, adapts, remembers, repairs, proves.** The LLM is never the sole authority for student level, text difficulty, next assignment, or progress claims.
2. **Computable vs judgmental split**: conjugation, spelling, agreement, frequency are decided by deterministic engines (`src/lib/linguistic/`); the LLM only proposes judgmental content (edges, phrasing, misconceptions, difficulty guesses), and it passes QC gates.
3. **Evidence is relational.** Every student answer references a versioned, immutable content id (`text_version_id` / `competency_items.id`). No learning evidence in JSONB blobs (Sprint 2 removes the existing one).
4. **RLS from day one** for every new table. Service-role keys never reach the client.
5. **Minors-first safety**: all student free text is moderated; sensitive domains require human review; no open AI chat.

### Current state (verified 2026-07-09, see `gap-analysis.md`)

- **Solid, keep**: schema+RLS (migrations 0001–0012), pure scoring core (text difficulty, adaptive rules, SM-2 retrieval, skill estimates, BKT), competency DAG + invariants (Gate 1), conjugation engine (Gate 0), LanguageTool validation (Gate 2), 6-gate item-generation pipeline with GLM 5.2 wired (Cloudflare/OpenRouter), goal-conditioned diagnostic engine, parent/teacher dashboards on RLS-scoped reads, privacy/audit foundations, assignments.
- **Broken/missing (P0)**: admin content store is `localStorage`; learning evidence is a `students.app_state` JSONB blob; no student signup path; consent not gated; §H text pipeline still on the mock provider; no moderation of student free text; the new diagnostic engine has **no UI**; no CI; single production Supabase project.

---

## 1. Epoch A — Make the foundation production-real (Sprints 1–5)

These sprints convert "works on my machine / demo data" into a system that can hold real students. Nothing user-visible changes much; everything underneath becomes trustworthy.

---

### Sprint 1 — CI, staging, and reproducible seed

**Goal**: every later sprint lands through a pipeline, against a non-production database.
**Why**: there is currently no CI of any kind and all verification hits the single production Supabase project (`tkasvcccucpsbjywgdyl`). One bad migration ends the pilot. This sprint goes first because every other sprint benefits from it.

**Tasks**
1. Add GitHub Actions workflow `.github/workflows/ci.yml`: install → `npx tsc --noEmit` → `npm run lint` → `npm test` on every PR and push to `main`.
2. Add a second job that boots local Supabase (`supabase start` via the Supabase CLI docker image), applies `supabase/migrations/*` in order, and fails on error — migrations are now tested before they ever reach a live project.
3. Create a **staging** Supabase project (or a Supabase branch); document both environments in `supabase/README.md`; add `.env.staging.example`.
4. Write `scripts/seed-demo.mts`: idempotently creates the demo org/school/class, the four demo accounts (student/parent/teacher/admin), links guardian + enrollment, and seeds the student's learning data. The README's demo accounts become reproducible from the repo.
5. Add `npm run typecheck`, `npm run ci` package scripts.

**Acceptance criteria**
- A PR with a failing test or a broken migration goes red in GitHub Actions.
- `npm run seed:demo` against a fresh staging project yields a working demo (login as all four roles, dashboards populated).

**Out of scope**: deploy automation to Vercel (Sprint 19).

---

### Sprint 2 — Learning evidence into relational tables (kill `app_state`)

**Goal**: diagnostic results, reading sessions, answers, summaries, skill estimates, retrieval cards/schedules/attempts, and word mastery persist in the §21 relational tables — not the `students.app_state` JSONB blob.
**Why**: the PRD's stated moat (§28) is *clean learning data*; psychometrics (Sprint 16), teacher analytics, and the §F non-negotiable (`answers reference text_version_id`) all require it. This is the largest debt in the codebase.

**Tasks**
1. Implement the real bodies of the student server actions (`src/lib/actions/student.ts`, currently `notImplemented`): `startReadingSession`, `submitAnswer`, `submitSummary`, `completeReadingSession`, `submitRetrievalAttempt`, `completeDiagnostic`, `selectInterests` — each writing to `reading_sessions`, `student_answers`, `student_summaries`, `reading_session_events`, `student_skill_estimates`, `student_reading_estimates`, `retrieval_cards`, `retrieval_schedules`, `retrieval_attempts`, `student_word_mastery`.
2. Refactor `src/lib/student-store.ts` call sites to call these actions (server-side persistence), keeping optimistic local state for UI responsiveness. The store becomes a cache, not the system of record.
3. Migration: one-time projection of existing `app_state` blobs into the relational tables (for the demo student), then drop or deprecate the column (keep it read-only for one release; delete in Sprint 19 cleanup).
4. Add missing RLS verified paths: student inserts own answers, cannot insert for another student; parent reads linked child sessions; teacher reads enrolled students' sessions.
5. Seed texts (`src/lib/content/texts.ts`) get real rows in `texts` / `text_versions` / `questions` / `question_choices` (migration or seeder script) so answers can FK to them.
6. Unit-test the projection/aggregation helpers; keep `src/lib/reports.ts` pure but feed it from SQL reads (`src/lib/db/dashboard.ts`).

**Acceptance criteria**
- A full student journey (onboarding → diagnostic → reading → results → memory review) writes **zero** bytes to `app_state` and the parent/teacher dashboards render identically from the relational tables.
- `select count(*) from student_answers where session_id is not null` grows during a session; every row has a valid `question_id` → `text_version_id` chain.
- Negative RLS case verified (student A cannot read/write student B's rows).

**Out of scope**: competency-graph attempts (already relational via `competency_attempts`); background recalculation jobs (Sprint 12).

---

### Sprint 3 — Content persistence: admin store off `localStorage`

**Goal**: generated candidates, review decisions, approved texts, benchmarks live in Postgres (`ai_generation_jobs`, `ai_generated_candidates`, `ai_scoring_results`, `ai_moderation_results`, `text_versions`).
**Why**: today an approved text exists only in the reviewing admin's browser. Content is the product; it must be shared, versioned, and auditable.

**Tasks**
1. Replace `src/lib/content-store.ts` (localStorage) with server actions + `src/lib/db/content.ts`: create job → store candidate → store scoring/moderation results → approve (creates `texts` + `text_versions` + `questions` rows) → reject → retire → benchmark-lock.
2. Wire `/admin/content/review`, `/admin/content`, `/admin/benchmarks`, `/admin/texts/[textId]` to the DB layer. Keep the live re-score-on-edit behavior.
3. RLS: only `platform_admin` / `content_reviewer` read-write the AI workflow tables; approved+active `text_versions` readable by authenticated users.
4. Audit-log approve/reject/retire/benchmark-lock via `src/lib/audit.ts`.
5. Student-facing text selection (`src/lib/content/recommend.ts`) reads the approved library from the DB (union with seed texts until the library outgrows them).

**Acceptance criteria**
- Admin A approves a text; Admin B (different browser) sees it in the library; a student can be served it.
- Rejected candidates and their moderation/scoring payloads are queryable in SQL.
- Audit log shows the review trail.

---

### Sprint 4 — Student account lifecycle + consent gating

**Goal**: students can actually get accounts, and no student uses the product before valid consent exists.
**Why**: there is currently **no student signup path** (signup offers parent/teacher only; the demo student was seeded by hand), `/join` is a disabled stub, and consent is recorded only post-hoc. CNIL requires parental involvement under 15. This blocks any real pilot.

**Tasks**
1. **Class join codes**: `class_join_codes` table (code, class_id, expires_at, max_uses, uses) + RLS; teacher UI to generate/rotate a code on `/teacher/classes/[classId]`; implement `inviteStudents()` in `src/lib/actions/teacher.ts`.
2. **Student signup via code** (`/join`): code → create auth user with `role=student` → create `students` row → enroll in the class → route to consent-pending state. School-consent mode: joining via a school class records a `consent_type='school'` `consent_records` row.
3. **Parent-created child accounts**: from `/parent`, a parent creates a child student account (no email needed for the child — generated username or email subaddress), which auto-links `student_guardians` and records `consent_type='guardian'` consent (implement `linkStudent()`).
4. **Consent gate**: proxy/layout check — a student whose `consent_records` has no active row is routed to a "waiting for consent" screen; parents see a pending-consent banner. Enable the currently-disabled `/consent` flow with real consent + privacy-policy versions.
5. Age logic: students ≥15 (from `date_of_birth`) may self-consent (`consent_type='student_over_15'`).
6. Update `scripts/seed-demo.mts` to use these real flows.

**Acceptance criteria**
- End to end on staging: teacher creates code → new student joins with it → lands in the class → parent (or school mode) consent recorded → student reaches `/student` only after consent exists.
- A student with revoked consent is locked out of learning routes (read-only "contact your parent" screen).
- RLS negative cases: student cannot mint codes; parent cannot consent for an unlinked child.

**Out of scope**: magic link / Google login (Sprint 18 polish), email verification flows beyond Supabase defaults.

---

### Sprint 5 — Safety layer for minors

**Goal**: every piece of student free text is moderated before scoring/storage; abuse is rate-limited.
**Why**: explicit PRD §11 requirement, currently absent — summaries and free-text retrieval answers go straight to heuristics.

**Tasks**
1. `src/lib/safety/moderate-input.ts`: a single `moderateStudentText(text): {allowed, categories}` used by `submitSummary`, `submitRetrievalAttempt`, diagnostic summary, and (later) writing evaluation. Provider-agnostic: route to the configured LLM provider's moderation (or a strict-prompt classification call on the existing OpenAI-compatible client) with a conservative deny-list fallback when no key is configured.
2. On flag: store nothing verbatim, return a neutral French message ("Ta réponse n'a pas pu être enregistrée."), write an audit-log entry, never show model output to the student.
3. Rate limiting: per-user limits on auth attempts and on free-text submissions (simple Postgres counter table or Upstash-style token bucket in a `rate_limits` table); per-student daily LLM budget constant.
4. Safety tests (PRD §17 list): unsafe student prompt, generated unsafe topic, invalid JSON from provider, cross-student access attempts — as integration tests where feasible, else scripted staging checks documented in `docs/safety-checks.md`.

**Acceptance criteria**
- A summary containing flagged content is rejected, not persisted, audited; a clean summary flows unchanged.
- Hammering `submitAnswer` beyond the limit returns a friendly throttle response.
- `npm test` includes moderation-routing unit tests (mock provider).

---

## 2. Epoch B — Real AI + one unified engine (Sprints 6–10)

These sprints complete the pivot and fuse it with the PRD's reading loop: one graph, one diagnostic, one generation stack, real models everywhere.

---

### Sprint 6 — Real LLM provider for the text pipeline (§H goes live)

**Goal**: `AI_PROVIDER=openai` (or `glm`) produces real French text candidates through the existing generate → validate → score → moderate → review pipeline.
**Why**: the PRD's core promise; `getAIProvider()` currently throws. The Phase-9 item pipeline already proved the OpenAI-compatible client (`src/lib/ai/item-generation/openai-compatible.ts`) — reuse it.

**Tasks**
1. Implement `OpenAICompatibleAIProvider` satisfying `AIProvider` (`generateText`, `generateQuestions`, `scoreSummary`, `tagText`, `moderate`, `embed`) on the shared client; structured outputs enforced by the existing Zod schemas (`src/lib/ai/schemas.ts`), with one retry-on-invalid-JSON.
2. Extend `getAIProvider()` factory: `mock | openai | glm` (env-driven base URL/model/key, mirroring the item-generation config). Fail loud on missing keys.
3. **Prompt versioning for real**: store the production prompts in `prompt_versions` (seed migration), load the active version at generation time, stamp `prompt_key/version` + model id into `ai_generation_jobs.input_payload`. Build minimal `/admin/prompts` (list versions, view text, activate one — replaces the stub).
4. Replace the mock-only factuality step: generated `factualClaims` with `needsHumanReview` or low confidence force `needs_human_review` (already routed) — plus a hard rule: any numeric statistic in the body without a `factualClaims` entry ⇒ human review.
5. `scoreSummary` upgrade: LLM rubric scoring (content/structure/language, 0–100 + feedback phrase) blended with the existing heuristic (`src/lib/scoring/summary.ts`) — heuristic acts as sanity clamp (±25 points max deviation, else flag).
6. Wire `/admin/ai-jobs` (replaces stub): job list with status, prompt/model version, duration, gate outcomes.
7. Generate and human-review an initial batch: ≥20 approved texts across ≥5 interests × 3 bands, using Sprint 3's persistent review flow.

**Acceptance criteria**
- With real keys on staging: admin clicks "generate" → candidate persisted with difficulty dimensions, moderation, factual flags → approve → text is servable to a student.
- Every stored candidate row records prompt version + model id (reproducibility).
- Mock provider still works keyless (dev/test unchanged); pipeline tests still green.

---

### Sprint 7 — Item generation at scale (Phase 9 close-out: D5, D8)

**Goal**: the past-narration slice has a full machine-verified item bank in production, and admins can work the exception queue.
**Why**: the mastery engine is only as good as its item coverage; D8 has been blocked on credentials, and Gate-4 routing has no UI.

**Tasks**
1. Run the real bulk generation on the past-narration slice (`scripts/generate-slice-items.mts`) with production creds; target ≥8 items per node across the 31 nodes; seed via `scripts/seed-generated-items.mts`.
2. Persist the `yieldReport` per run into a `generation_runs` table (pass/fail counts per gate, model, prompt version, cost estimate) — this is the K4 observability seed.
3. Build the **Gate-4 exception queue** UI at `/admin/items/review`: items with `needs_review` verdict, showing gate outcomes, judge disagreement, validator rule hits; approve/edit/reject; audit-logged. (Completes D5.)
4. Item bank browser at `/admin/items`: filter by node, gate status, psychometric flags (flags arrive in Sprint 16).
5. RLS: reviewer/admin only for drafts; students read only `approved` items.

**Acceptance criteria**
- ≥200 approved items live for the slice; per-gate yield metrics queryable (`select * from generation_runs`).
- An item failing Gate 2 (answer-key inconsistency) is visibly rejected with its rule hits in the admin UI.
- Diagnostic engine (Sprint 8) can draw ≥3 distinct items per probed node.

---

### Sprint 8 — Unified adaptive diagnostic with UI (Phase 10 E1 + E5, replaces PRD §C fixed form)

**Goal**: the student-facing diagnostic **is** the goal-conditioned KST/BKT engine, with learner-profile intake and a frontier report the student/parent can see.
**Why**: the superior diagnostic exists (`src/lib/diagnostic/engine.ts`) but has no UI; the shipped fixed-form diagnostic is the weaker of the two. One diagnostic, the better one.

**Tasks**
1. **Learner-profile intake** (extends `/student/onboarding`): student_type (native / heritage / immersion / allophone / FSL), home language, exposure, grade, and a **goal** (e.g. "être à niveau en 5e", "réussir le récit au passé") persisted to `learner_profiles` + `learning_goals`.
2. **Adaptive diagnostic UI** (`/student/diagnostic` rebuilt): drives `engine.ts` — goal-conditioned probe-high → descend on failure → stop on uncertainty; serves real `competency_items` (Sprint 7); answers validated by `src/lib/linguistic/validator.ts` where `validator_type` is deterministic; BKT update per probe into `student_competency_estimates`; writes `competency_attempts`.
3. **Frontier report UI** (`/student/progress` section + own screen): mastered / fragile / missing / ready-to-learn with blockers, from `src/lib/diagnostic/report.ts`. Parent view mirrors it in evidence language ("peut faire / en cours / bloqué par…").
4. **Bridge to the reading profile**: derive the PRD-style reading band + skill summary from competency estimates where mapped, so existing dashboards keep working; keep the legacy fixed-form behind a flag for one release, then delete.
5. Wire the retained analytics event `diagnostic_completed` with goal + duration + probes-count properties.

**Acceptance criteria**
- New student completes intake + adaptive diagnostic in ≤15 min; the report localizes a planted gap to its true root node (reproduce the `engine.test.ts` COD-gap scenario through the UI on staging).
- A native and an FSL profile get different goal scopes over the same graph (Phase 11 F4 demo).
- All probes are stored as `competency_attempts` referencing item ids.

---

### Sprint 9 — Catch-up path + graph-driven daily loop (fuse the two graphs)

**Goal**: the student home shows a sequenced catch-up plan ("Aujourd'hui: 3 étapes") over unmastered prerequisites, and reading texts become **items attached to graph nodes** — one engine, two practice modes (item drill + reading).
**Why**: the pivot is invisible until diagnosis feeds daily practice; and the app must not maintain two disconnected graphs (knowledge concepts vs competency nodes).

**Tasks**
1. **Catch-up path UI**: from `catchUpToTarget` / `student_catch_up_path`, render layered steps toward the active goal; each step launches either an item micro-session (5–8 items on the node, validator-graded, BKT-updated) or a reading session whose text targets the node.
2. **Text↔node mapping**: `text_version_nodes` join table; tag the approved library (LLM proposes tags via `tagText`, admin confirms in review UI — Gate-4 style). New generations (Sprint 6) request target nodes in the prompt.
3. **Micro-session player** (`/student/practice/[nodeId]`): item drill with immediate validator feedback, misconception-aware distractor explanations, mastery bar; on mastery-probability threshold, node flips state and the path advances.
4. **Adaptive integration**: `recommendedNextAction` from reading sessions can now route to `foundation_repair` on a *graph node* (micro-session) instead of only the legacy micro-lessons; keep `content/micro-lessons.ts` as the explanation layer shown before drills.
5. Retrieval unification: completing a node seeds retrieval cards bound to the node (reuse `scoring/retrieval.ts` ladder); memory review pulls both concept cards and node cards.
6. Success-zone guardrail stays king: item difficulty selection respects the 80–85% zone using item psychometrics defaults until Sprint 16 supplies real ones.

**Acceptance criteria**
- A diagnosed student sees a concrete ordered plan; completing today's steps visibly advances the path and updates the frontier report.
- A reading session and an item session both update the **same** `student_competency_estimates` rows.
- Every approved text has ≥1 node mapping; the recommender can answer "give me a text for node X at band Y".

---

### Sprint 10 — Writing evaluation engine (Phase 12)

**Goal**: student summaries and short written responses get segmented, error-detected, mapped to graph nodes, and fed into estimates with a revision plan.
**Why**: writing is where agreement/conjugation mastery actually shows; the deterministic validators (LanguageTool + conjugator) make this uniquely strong vs competitors.

**Tasks**
1. Pipeline `src/lib/writing/evaluate.ts`: segment → LanguageTool detect (`linguistic/languagetool.ts`) → rule-hit → node mapping table (`error_node_mappings`, seeded for the past-narration slice rules: QUE_AVOIR, ETRE_VPPA, etc.) → per-node error evidence.
2. Rubric scoring (content/structure/language) via the Sprint 6 `scoreSummary`, merged with detected-error counts; produce a **revision plan**: top 2 errors, each linked to its node micro-session.
3. Feed errors as *noisier* evidence into BKT (lower evidence weight than item attempts — add a weight parameter to the estimator).
4. UI: results screen shows annotated summary (error underlines with French explanations), rubric, and "Corrige et renvoie" one-revision loop.
5. Deploy self-hosted LanguageTool (Phase 8 C6): document `docker-compose.languagetool.yml` for staging/prod, set `LANGUAGETOOL_URL`, health-check on boot, graceful degrade (skip grammar layer, flag session) when down.

**Acceptance criteria**
- A summary with a planted être-agreement error yields: underline + explanation + link to the agreement node drill; the node's estimate reflects the (down-weighted) evidence.
- Revision resubmission improves the rubric score and clears the underline.
- LanguageTool outage does not break session completion (degraded mode logged).

---

## 3. Epoch C — Adaptive quality & operational muscle (Sprints 11–14)

---

### Sprint 11 — Revealed interests + smarter recommendation (+ pgvector)

**Goal**: Layer 2 of the PRD works both ways (declared *and* inferred), and text similarity runs on embeddings.
**Why**: half the interest layer is missing (no inferred strength anywhere); pgvector column+index exist but are dead weight.

**Tasks**
1. `student_interest_stats` table (interest_key, sessions_completed, completion_rate, avg_success, avg_time_on_task, last_used_at) maintained on session completion; compute `inferredStrength` per the PRD §D rules.
2. Recommender (`content/recommend.ts`) consumes both strengths with the four PRD behavior rules (high perf + low engagement ⇒ change topic; high engagement + low perf ⇒ same topic, lower complexity, etc.). Unit-test each rule.
3. Embeddings: on text approval, `embed()` (Sprint 6 provider) fills `text_versions.embedding`; nightly backfill script for existing library.
4. Use vectors for: similar-text recommendation ("more like the one you finished"), duplicate-candidate detection in the review pipeline (cosine > threshold ⇒ warn admin), interest-to-text matching for cold-start.
5. Surface topic choice: student home offers 2–3 recommended texts (not one), logging picks as interest signal.

**Acceptance criteria**
- Abandoning a topic twice measurably lowers its ranking; completing raises it (assert via unit tests on the ranker + one staging walkthrough).
- Review UI warns on a near-duplicate candidate.
- `select count(*) from text_versions where embedding is not null` equals the approved library.

---

### Sprint 12 — Background jobs + weekly parent report + email

**Goal**: first job infrastructure, and the flagship trust artifact — a weekly parent report generated automatically and delivered by email.
**Why**: `parent_reports`/`teacher_reports` are unused; no jobs of any kind exist; a dashboard nobody opens builds no parent trust (PRD §12 "parent report open rate").

**Tasks**
1. Job infra (pick one, document in `docs/jobs.md`): Supabase Cron + Edge Function invoking a secured route handler, **or** Vercel Cron hitting `/api/jobs/*` route handlers with a shared secret. Route handlers pattern per PRD §15.
2. `generate_weekly_parent_reports` job: for each active student, compute the weekly payload with the existing pure `lib/reports.ts`, store in `parent_reports`, then email.
3. Email: transactional provider (e.g. Resend) behind `src/lib/email.ts` (env-gated no-op like analytics); French template with band, minutes, success, strengths/needs-work, proof-layer buckets, and a link to `/parent/reports/[reportId]`.
4. Build the real `/parent/reports/[reportId]` page (replaces stub) rendering a stored report snapshot (immutable evidence — matches the versioning principle).
5. Second job: `recalculate_retrieval_due` (daily digest email/banner: "5 cartes à réviser") and `refresh_interest_stats` if Sprint 11 chose lazy aggregation.
6. Job runs logged to a `job_runs` table (name, started, finished, ok, error) surfaced on `/admin` home.

**Acceptance criteria**
- Cron fires on staging: report row created, email received, report page renders the stored snapshot, open tracked as an analytics event.
- Failed job visible in `/admin` with the error.
- Reports are immutable (regeneration creates a new row, never mutates).

---

### Sprint 13 — Teacher self-serve + exports

**Goal**: a teacher can go from empty account to running class without any admin/manual seeding.
**Why**: `createClass()` and `inviteStudents()` still throw; export is print-only. Teacher adoption is a top-5 PRD risk.

**Tasks**
1. Implement `createClass()` (name, grade, year → `classes` + `teacher_classes`) with UI on `/teacher/classes`; school linkage optional (independent-teacher mode creates a lightweight org/school per PRD `type` values).
2. Class management: roster view, remove/re-enroll student, regenerate join code (builds on Sprint 4).
3. Assignment upgrade: assign an **item micro-session or catch-up step** (not just a text) — assignment rows gain a target type; student "À faire" handles both.
4. CSV export: class summary + per-student skill/node gaps as CSV download (route handler); persist generated class reports to `teacher_reports`.
5. Teacher onboarding checklist UI (create class → invite → first assignment → first report) to drive activation.

**Acceptance criteria**
- Fresh teacher account on staging: creates class, invites a student via code, assigns work, sees it completed, downloads CSV — no SQL, no admin.
- RLS negative: teacher B cannot touch teacher A's class.

---

### Sprint 14 — Admin CRUD completion + content ops

**Goal**: every `ComingSoon` admin stub is a working screen; content operations don't require SQL.
**Why**: `/admin/skills`, `/admin/vocabulary`, `/admin/concepts` are stubs; graph/lexicon curation currently means writing migrations.

**Tasks**
1. `/admin/skills`: CRUD over `skills` (guard: deactivate rather than delete once evidence exists).
2. `/admin/concepts` → **graph studio v1**: list/edit `competency_nodes` + `competency_edges` with the Gate-1 invariant checker run on save (reject cycles/monotonicity violations inline); simple strand-filtered table view (visual graph rendering is Phase-15 backlog).
3. `/admin/vocabulary`: CRUD over `vocabulary_items`; C2 groundwork — importer script for Lexique3 frequency data (`scripts/import-lexique.mts`) populating difficulty by frequency band.
4. Misconceptions manager (list, link to nodes/items).
5. All mutations audit-logged; all screens RLS-scoped to `platform_admin`/`content_reviewer`.

**Acceptance criteria**
- Adding a competency edge that creates a cycle is rejected with the invariant message, in the UI.
- A vocabulary item's difficulty auto-fills from imported frequency.
- No remaining `ComingSoon` under `/admin`.

---

## 4. Epoch D — Superior product & pilot launch (Sprints 15–20)

---### Sprint 15 — Analytics + monitoring for real

**Goal**: the PRD §12 metric tree is measurable; errors page someone.
**Why**: two events and no SDKs today; every activation/engagement/trust metric is currently unmeasurable.

**Tasks**
1. Install `posthog-js` (client) + `posthog-node` (server) replacing the scaffold in `src/lib/analytics.ts` (keep the same `track()` signature); identify by role (pseudonymous ids, no student names — privacy rule).
2. Instrument the §12 funnel: onboarding steps, diagnostic start/complete, first session, 3-sessions-week-1, session complete/abandon, topic re-selection, retrieval done, repair triggered, parent report open, teacher dashboard view, assignment created, export downloaded.
3. Feature flags: wrap the riskiest surfaces (adaptive diagnostic, writing evaluation, catch-up plan) for staged pilot rollout.
4. Install `@sentry/nextjs` (client+server+edge), source maps on build; wire `src/lib/observability.ts` through it; alert rules for AI-job failure rate, moderation failures, job_runs errors.
5. Ops dashboard section on `/admin`: generation yield (Sprint 7 data), diagnostic funnel, weekly actives.

**Acceptance criteria**
- A full student journey on staging produces the expected event chain in PostHog.
- A thrown error in a server action appears in Sentry with release + user role tag.
- One feature flag verifiably gates a surface per environment.

---

### Sprint 16 — Psychometrics loop (Phase 13 / Gate 5)

**Goal**: production data audits the content: bad items, no-lift edges, and phantom misconceptions get flagged automatically.
**Why**: this is the PRD's "clean learning data for calibration" promise and the pivot's Gate 5 — the self-correcting moat.

**Tasks**
1. Item analysis job over `competency_attempts` + `student_answers`: p-value (difficulty), point-biserial (discrimination); write to `item_stats`; auto-flag (too easy/hard, negative discrimination) into the Sprint 7 exception queue.
2. Edge validation job: for each prerequisite edge, does prereq mastery predict dependent success? Flag no-lift edges to the graph studio.
3. Misconception validation: cluster wrong-answer patterns per node; confirm/kill misconception tags.
4. Difficulty recalibration: blend observed p-values into item/text difficulty (bounded adjustment; deterministic scorer remains the prior — never let data alone flip a band by more than one step).
5. Minimum-evidence guards everywhere (no stats under N=30 attempts); document thresholds in `docs/psychometrics.md`.

**Acceptance criteria**
- Seeded synthetic attempt data produces correct flags in unit tests (planted bad item → flagged; planted good edge → not flagged).
- Flags appear in admin queues; nothing auto-deletes content (human closes the loop).

---

### Sprint 17 — Student experience: motivation, resilience, accessibility

**Goal**: the daily loop feels rewarding, survives interruptions, and is usable by the struggling readers it targets. (Beyond-PRD features from the gap analysis.)

**Tasks**
1. **Streaks + daily goal**: streak counter, "objectif du jour" (one catch-up step or one reading), weekly recap card. No social comparison (PRD non-goal).
2. **Session autosave/resume**: persist in-progress session state server-side after every answer; "Reprendre ta lecture" on home. A 15–25-min session must survive a page reload or phone lock.
3. **French accent input helper**: tap-to-insert accent bar (é è ê ç à ù œ …) on every student free-text input — protects validator-based grading from keyboard limitations.
4. **Read-aloud (TTS)**: browser `speechSynthesis` French voice on text paragraphs (per-paragraph play), plus dyslexia-friendly reading options: font toggle, spacing, line-focus mode. Accommodations, not diagnosis.
5. Accessibility pass: keyboard navigation, focus states, contrast (dark theme), `lang="fr"`, reduced-motion.
6. Mobile audit: the full loop at 360 px width; fix overflow/tap-target issues.

**Acceptance criteria**
- Kill the tab mid-session → resume restores position and answers.
- Streak increments exactly once per qualifying day; recap renders after week 1.
- Lighthouse accessibility ≥ 95 on student read/results pages; full loop verified on a phone-sized viewport.

---

### Sprint 18 — Reach: parents in English, low-connectivity, easier login

**Goal**: the product works for its stated diaspora / Francophone-Africa / immersion segments.

**Tasks**
1. **Parent/teacher UI language toggle (FR/EN)**: minimal i18n layer (dictionary-based, no heavy framework) for parent + teacher + marketing surfaces; student surfaces stay French (it's the learning language). Weekly report email honors the preference.
2. **PWA**: manifest + service worker; cache app shell; queue-and-sync answer submissions offline during a started session; "offline pack" = prefetch today's assigned text + items.
3. **Auth convenience**: magic-link login for parents/teachers; Google OAuth for adults (Supabase providers). Students keep code/password (child-safety simplicity).
4. Performance: audit CTE traversal latency with the seeded graph (K2) — add indexes on `competency_edges(source/target)`, `competency_attempts(student, node)` as needed; budget: diagnostic probe round-trip < 400 ms server-side.

**Acceptance criteria**
- Parent switches to EN and the dashboard + next weekly email render in English.
- Airplane-mode mid-session: answers queue and sync on reconnect (verified on staging).
- Magic-link and Google login work for a parent account; students unaffected.

---

### Sprint 19 — Production hardening & compliance close-out

**Goal**: the system is deployable, recoverable, and compliant enough to sign a school pilot.

**Tasks**
1. Vercel production + staging projects wired to the two Supabase envs; migrations applied via CI step (never by hand); env matrix documented (extend `docs/` with a deployment map).
2. Security review: run `/security-review` on the branch; verify no service-role key reaches the client bundle; secrets audit; dependency audit; fix findings.
3. **Data-retention automation**: job fulfilling deletion requests (hard-delete student rows + auth user after the documented grace window), event-table retention windows, export format documented. Extend privacy (K3) to `learner_profiles`, `competency_attempts`, telemetry.
4. Child-adapted privacy page (CNIL: age-appropriate explanation) + `/parents`, `/schools` marketing pages reviewed against PRD positioning ("what not to say" list).
5. Delete deprecated code: `app_state` column, legacy fixed-form diagnostic, `content-store.ts` localStorage remnants, dead stubs.
6. Runbooks in `docs/runbooks.md`: LanguageTool down, LLM provider outage/rate-limit, bad migration rollback, consent revocation, deletion request.
7. Load sanity: script 50 concurrent student sessions against staging; no RLS bypass, p95 action latency recorded.

**Acceptance criteria**
- `main` → CI → staging deploy → smoke test → manual promote to prod, all documented and exercised once.
- A deletion request completes end-to-end automatically after the grace window (verified on staging with a throwaway account).
- Security review findings at zero criticals; runbooks exist and reference real commands.

---

### Sprint 20 — Content scale + pilot launch package

**Goal**: enough content breadth for a 4-week pilot, and the artifacts to run it.

**Tasks**
1. **Second competency slice** (e.g. *accord dans le GN* or *présent de l'indicatif + homophones*): author ~30 nodes + edges (human-anchored skeleton per F2), Gate-1 clean, seeded; generate + verify its item bank via the Sprint 7 machinery. This proves slice authoring is now a repeatable pipeline, not an artisanal event.
2. Text library to ≥60 approved texts (≥10 interests × 3 bands), each node-mapped and embedded; benchmark set: 6 human-reviewed, benchmark-locked passages across bands for calibration (PRD benchmark rule).
3. Pilot kit: teacher one-pager (FR), parent one-pager (FR/EN), 4-week pilot protocol with the §12 success-metric targets, weekly review checklist against the PostHog funnel.
4. Full-dress rehearsal on production: run the entire journey — teacher creates class → students join with consent → diagnostic → 3 days of catch-up plan + reading + retrieval → weekly parent email — with a friendly-user family before the first school.
5. Triage backlog from rehearsal; fix P0/P1s.

**Acceptance criteria**
- Two slices + 60 texts + 6 benchmarks live; item/text coverage queryable per node/band.
- Rehearsal completed with zero manual SQL interventions.
- Pilot kit reviewed and stored in `docs/pilot/`.

---

## 5. Dependency map

```
S1 (CI/staging) ──────────────► everything after
S2 (evidence tables) ─────────► S8, S9, S11, S12, S16
S3 (content persistence) ─────► S6, S9, S11
S4 (accounts+consent) ────────► S5, S13, S19, S20
S5 (safety) ──────────────────► S6, S10
S6 (real text LLM) ───────────► S9(tagging), S10(scoreSummary), S11(embed), S20(library)
S7 (item bank) ───────────────► S8, S9, S16, S20
S8 (diagnostic UI) ───────────► S9
S9 (catch-up loop) ───────────► S13(assign steps), S16, S17(streaks), S20
S10 (writing engine) ─────────► S16(evidence)
S12 (jobs) ───────────────────► S16(analysis jobs), S19(retention job)
S15 (analytics/monitoring) ───► S20(pilot metrics)
```

Parallelization hints (if two workstreams run): {S6, S7} after S3; {S11, S12, S13, S14} are mutually independent; S17/S18 can interleave with S15/S16.

---

## 6. Deliberately out of scope (post-pilot backlog)

Per PRD non-goals and pivot phasing — do **not** build during these sprints:

- Speech layer: read-aloud fluency scoring, oral items (Phase 14) — revisit after the core loop shows pilot retention.
- Native iOS/Android apps (PWA covers the pilot).
- Payments/subscriptions (first pilot is free by design).
- Full LMS integrations (CSV + email suffice; Google Classroom share links are a cheap later add).
- IRT/Elo beyond BKT + Gate-5 recalibration (data volume doesn't justify it yet).
- Visual graph-rendering studio, all-10-strand graph expansion, ACTFL/DELF mappings (Phase 15).
- Morphalou full lexicon ingestion beyond the Lexique3 frequency import (extend when slices demand it).
- Open AI chat of any kind (permanent non-goal for minors).

---

## 7. Sprint tracker

| Sprint | Title | Epoch | Status |
|---|---|---|---|
| 1 | CI, staging, reproducible seed | A | ☑ Complete — 2026-07-10 |
| 2 | Learning evidence → relational tables | A | ☑ Complete — 2026-07-10 |
| 3 | Content persistence off localStorage | A | ☑ Complete — 2026-07-10 |
| 4 | Student accounts + consent gating | A | ☑ Complete — 2026-07-10 |
| 5 | Minor-safety layer | A | ☑ Complete — 2026-07-10 |
| 6 | Real LLM text pipeline (§H live) | B | ◐ Implemented — three-reviewer portal live; human batch approval pending |
| 7 | Item bank at scale + exception queue | B | ☑ Complete — 2026-07-10 |
| 8 | Unified adaptive diagnostic UI | B | ☑ Complete — 2026-07-10 |
| 9 | Catch-up path + graph-driven loop | B | ☑ Complete — 2026-07-10 |
| 10 | Writing evaluation engine | B | ☑ Complete — 2026-07-10 |
| 11 | Revealed interests + pgvector | C | ☑ Complete — 2026-07-10 |
| 12 | Jobs + weekly parent report + email | C | ◐ Implemented — production email credential pending |
| 13 | Teacher self-serve + exports | C | ☑ Complete — 2026-07-10 |
| 14 | Admin CRUD + graph studio v1 | C | ☑ Complete — 2026-07-10 |
| 15 | Analytics + monitoring | D | ◐ Implemented — hosted telemetry credentials pending |
| 16 | Psychometrics loop (Gate 5) | D | ☑ Complete — 2026-07-10 |
| 17 | Student UX: motivation/resilience/a11y | D | ☑ Complete — 2026-07-10 |
| 18 | Reach: i18n, PWA, adult auth | D | ◐ Implemented — hosted adult providers pending |
| 19 | Production hardening + compliance | D | ◐ Implemented — protected deployment rehearsal pending |
| 20 | Content scale + pilot launch | D | ◐ Implemented — review portal complete; educator submissions and family rehearsal pending |

On completing a sprint: tick it here, note the date, and record any scope deviations in a one-line changelog entry below.

## Changelog

- 2026-07-10: Roadmap created from PRD v1.0 + `gap-analysis.md` + pivot roadmap (`.claude/roadmap.md`).
- 2026-07-10: Sprint 1 repository work implemented: application + fresh-DB CI, local Supabase config, guarded idempotent demo seed, staging template/docs; hosted staging provisioning remains pending. Migration CI uses the current Supabase `db start` path (database-only) rather than booting unrelated local services.
- 2026-07-10: Sprint 1 completed. Because the requested organization blocked a second project due to overdue invoices, staging uses the roadmap-approved persistent Supabase branch `pfuqmieowknqpuhqxuyo` with no production data. Reference/demo seeds, four-role login, idempotency, and parent/teacher RLS dashboard reads verified.
- 2026-07-10: After billing was resolved, canonical staging moved to the dedicated project `pwztnrirtrnicywvdbpz`; migrations `0001–0012`, reference/demo seeds, four-role login, idempotency, and RLS dashboard reads were re-verified. The persistent fallback branch remains pending explicit deletion approval.
- 2026-07-10: Sprint 2 completed. Migration `0013` moved diagnostic, session, answer, summary, estimate, retrieval, and vocabulary evidence into immutable relational rows; student flows and dashboards now use server actions/SQL, `app_state` is read-only and empty, and positive/negative RLS paths were verified locally and on dedicated staging. The obsolete fallback branch was deleted.
- 2026-07-10: Sprint 3 completed. Migration `0014` moved generation/review/moderation/scoring into a shared reviewer-only workflow; approval creates immutable servable text/question/vocabulary rows, all decisions are audited, and separate-reviewer, student-serving, and negative teacher RLS paths were verified locally and on dedicated staging.
- 2026-07-10: Sprint 4 completed. Migration `0015` added rotating class codes and atomic Auth-trigger enrollment, school/guardian/15+ consent, parent-created child credentials, and a server-layout consent gate; join/revoke/self-consent browser flows and negative student/unlinked-parent RLS cases were verified locally, with Auth-trigger/RLS integration repeated on staging.
- 2026-07-10: Sprint 5 completed. Migrations `0016–0017` added atomic auth/action/daily-budget limits and made moderated server actions the only free-text write path; unsafe/no-verbatim-audit/clean-retry browser behavior, throttle boundaries, and direct REST bypass denial were verified locally and on staging.
- 2026-07-10: Sprints 6–7 implementation landed. GLM 5.2 generated and persisted real text/item work with versioned prompts and gate reports; the reviewer queues are live and the past-narration bank reached the ≥8-items-per-node requirement.
- 2026-07-10: Sprints 8–11 completed. Goal-scoped adaptive diagnosis, frontier/catch-up practice, shared text-node evidence, writing annotation/revision, revealed-interest ranking and live embedding backfill were exercised on staging. Migration `0031` reduced next-probe selection to one database call; `0032–0033` made clean-CLI API privileges explicit while retaining authenticated-content RLS.
- 2026-07-10: Sprints 12–14 implementation completed. Durable jobs/reports, teacher self-service/CSV, and all admin catalog screens are live; fresh-teacher class/code/CSV and cross-teacher denial were verified on hosted staging. The weekly email adapter remains a deliberate no-op until the protected Resend credential is installed.
- 2026-07-10: Sprints 15–19 engineering completed. Telemetry adapters, feature gates, psychometrics, student resilience/accessibility, PWA/offline sync, adult i18n/auth callbacks, retention, deletion verification, deployment workflow, security checks and runbooks are present. Hosted service credentials and protected production promotion remain release-owner gates.
- 2026-07-10: Sprint 20 pipeline and pilot kit completed. The second 30-node slice is Gate-1 clean with 240 approved items (8 per node), and the resumable real-GLM batch produced all 60 planned passage combinations across 10 interests × 3 bands into human review, alongside four-week FR/EN pilot materials. Passage human approval, six benchmark locks and the friendly-family rehearsal cannot be represented as automated completion.
- 2026-07-10: Migration `0035` and the Human Content Review Portal added active reviewer access, French instructions, three independent assignment queues, autosaved immutable rubric submissions, admin disagreement resolution/versioned revision, CSV reporting, notifications, and audited atomic selection of exactly six gold benchmarks. No fake human ratings were seeded; educator submission remains the launch gate.
- 2026-07-10: Hosted staging verification completed with three Keychain-backed QA reviewer identities. A temporary 180-assignment run proved that every reviewer independently receives all 60 pilot passages, then was cleaned before submission. A separate retired smoke passage proved instruction acknowledgement, draft reload, hidden cross-review feedback, three immutable submissions, deterministic high disagreement, admin comparison, audited resolution, and linked revision. The live pilot remains exactly 60 unreviewed candidates; 34 database assertions and 204 application tests pass.
