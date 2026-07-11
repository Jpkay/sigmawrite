# Reading to Learn

> Learn to love reading while reading to learn.

A personalized French academic reading and competency-mastery platform for
secondary students. The production roadmap is implemented through its full
application stack: relational evidence, consent and safety, real AI generation,
adaptive diagnosis, graph-driven practice, writing feedback, background jobs,
teacher/admin operations, psychometrics, PWA resilience, accessibility, and
pilot operations. New work is exercised on the dedicated staging project before
protected production promotion.

## Human content review

The production review workflow is available at `/review` for French-language
educators and `/admin/reviews` for platform administrators. It supports three
independent reviewers per passage, autosaved drafts, immutable submissions,
normalized question feedback, audited editorial resolution and versioned
revision, CSV export, in-app notifications, and an exact six-passage gold set.
See [`docs/content-review-portal.md`](./docs/content-review-portal.md),
[`docs/reviewer-instructions-fr.md`](./docs/reviewer-instructions-fr.md), and
[`docs/benchmark-governance.md`](./docs/benchmark-governance.md).

Hosted staging has been technically verified with three isolated QA reviewer
accounts. The 60 real pilot passages remain unsubmitted and ready for the actual
educators; QA ratings are confined to a separately retired smoke passage.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth +
RLS + pgvector) · Zod · GLM/OpenAI-compatible AI · PostHog · Sentry · Resend.
See [`roadmap-to-production.md`](./roadmap-to-production.md).

## What's in Phase 0

- **App shell** — dark, French UI. Landing + marketing pages, auth pages
  (login/signup wired to Supabase Auth; join/consent/reset shells), and
  role dashboards for student / parent / teacher / admin with the full route
  map from `roadmap.md` §22 stubbed as "coming soon" by phase.
- **Auth & routing** — `src/proxy.ts` refreshes sessions and enforces coarse
  role-based routing; `src/lib/auth.ts` provides `getSessionProfile` /
  `requireRole` for Server Components and actions.
- **Database** — full schema (`roadmap.md` §21) + RLS as SQL migrations in
  `supabase/`. No live project required to develop the app.
- **AI layer** — provider-agnostic `AIProvider` interface, Zod schemas for
  every input/output, and a key-free `MockAIProvider`. OpenAI lands in Phase 2.
- **Server actions** — the §23 action surface stubbed in `src/lib/actions/`,
  each guarded with `requireRole` before doing anything.

## What's in Phase 1 (student slice)

A complete, runnable student journey — onboarding → diagnostic → reading
session → results → progress — running on a client-side store (`localStorage`)
so it works with **no backend**. The store shape mirrors the DB tables, so
Phase 3 swaps it for Supabase mechanically.

- **Onboarding** (`/student/onboarding`) — grade, French background, interest
  picker (the §7 catalogue with interest→knowledge transfer).
- **Diagnostic** (`/student/diagnostic`) — leveled item bank + a written
  summary, scored into a reading band, skill estimates, and foundation gaps.
- **Reading session** (`/student/read/[id]`) — read → comprehension questions →
  written summary → a spaced-retrieval question, on two manually-authored,
  human-reviewed seed texts.
- **Results** (`/student/results/[id]`) — success rate against the 80–85% zone,
  per-category scores, the adaptive **next-action** recommendation (§J rules),
  the retrieval schedule, and a full answer-key correction.
- **Scoring** (`src/lib/scoring/`) — pure, unit-tested functions: difficulty
  band mapping, summary heuristic, diagnostic profile, and the adaptive
  next-action engine. Run with `npm test` (Vitest).

## What's in Phase 2 (AI content pipeline)

The §H pipeline, runnable client-side with the mock provider:

- **Text difficulty engine** (`src/lib/scoring/text-difficulty.ts`) — the §G
  deterministic scorer: extracts features (sentence length, rare-word ratio,
  connector/subordinate counts, abstract density…) and produces six difficulty
  dimensions + an overall band. GenAI writes; this engine judges.
- **Generation pipeline** (`src/lib/ai/pipeline.ts`) — generate → Zod-validate
  → score difficulty → moderate → score questions → decide review status.
  Sensitive domains, factual flags, off-target difficulty, or failed moderation
  all force human review; nothing else auto-approves (§10, §17).
- **Admin review** (`/admin/content/review`) — generate a candidate, inspect
  its difficulty dimensions / moderation / flags / question difficulties, edit
  the body (re-scores live), then approve or reject.
- **Content library** (`/admin/content`) — approved texts, with lock-as-benchmark
  and retire actions. The admin home shows live queue counts.
- **Tests** — 25 Vitest cases total; the new ones cover the difficulty engine's
  ordering, the question scorer, and the review-status decision logic.

## What's in Phase 3 (adaptive engine v1)

- **Skill estimates** (`src/lib/scoring/skill-estimate.ts`) — an evidence-weighted
  update: ability moves toward each observation, the learning rate decays as
  evidence accrues, uncertainty shrinks. Folded in after every session.
- **Adaptive engine** (`src/lib/scoring/adaptive.ts`) — turns a next-action into
  a concrete next step: the one-step difficulty adjustment (§G), interest-aware
  next-text selection, change-topic, and foundation-repair detection (weakest
  repairable skill below threshold, with enough evidence).
- **Foundation repair** (`/student/repair/[skillKey]`, `src/lib/content/micro-lessons.ts`)
  — §K micro-lessons (2-min explanation → 5 micro-questions → return-to-text),
  mature in tone, that update the skill estimate.
- **Integration** — the reading result now drives the next step (read at an
  adjusted band, change topic, or repair); progress shows live skill estimates
  updating against the diagnostic baseline.
- **Tests** — 37 Vitest cases total; the new 12 cover skill convergence, the
  one-step band rule, repair detection, and next-step routing.

## What's in Phase 4 (memory system)

- **Spaced retrieval** (`src/lib/scoring/retrieval.ts`) — the §L ladder
  (1 → 3 → 7 → 21 → 45 days) with an SM-2-style ease factor that stretches or
  compresses intervals by recall quality, plus auto-grading of free-text recall.
- **Cards** — completing a reading seeds one retrieval card per concept (plus
  the text's authored prompt), first due the next day, and records vocabulary
  exposure.
- **Review** (`/student/memory`) — answer due cards, get graded
  (forgot/hard/good/easy), reschedule; see concept mastery (ladder progress)
  and vocabulary retention.
- **Tests** — 45 Vitest cases total; the new 8 cover the ladder, ease
  clamping/adjustment, the forgot-reset, and recall grading.

## What's in Phase 5 (parent & teacher dashboards)

Real, RLS-scoped reads of persisted learning data (`src/lib/reports.ts` is the
pure reporting core; `src/lib/db/dashboard.ts` the server data layer):

- **Parent** (`/parent`, `/parent/students/[id]`) — linked children with their
  reading band; a weekly report (texts, minutes, success, vocabulary, strengths
  / needs-work) and the §M "proof layer" (reads comfortably / with support /
  too hard) from actual session success.
- **Teacher** (`/teacher`, `/teacher/classes/[id]`, `/teacher/groups`,
  `/teacher/students/[id]`) — class overview, reading band + success +
  engagement per student, and **intervention groups** computed from shared
  skill gaps (§N). Per-student detail reuses the weekly-report view.
- **Report export** (`/teacher/reports`) — print-to-PDF of the class summary.
- **Tests** — 50 Vitest cases total; the new 5 cover weekly aggregation, the
  proof layer, and group formation.

> Verified end-to-end against the live DB: a parent reads only their linked
> child, a teacher only their class's enrolled students, and a parent cannot
> read classes — all enforced by RLS, not app code.

## What's in Phase 6 (pilot readiness)

The §10 compliance core and admin tools, on real data:

- **Privacy workflows** (`/parent/privacy`) — per child: record guardian
  consent, export all data (JSON download), and request deletion. Backed by
  auth-guarded server actions; deletion is recorded as a request for the
  controller to fulfil (the compliant pattern).
- **Audit log** (`src/lib/audit.ts`, `/admin/audit`) — sensitive actions are
  appended to `audit_logs` (any signed-in user may write; only platform admins
  may read) and shown in an admin viewer.
- **School admin** (`/admin/schools`) — read-only org → school → class tree,
  staff-scoped by RLS.
- **Benchmarks** (`/admin/benchmarks`) — benchmark-locked passages for
  calibration (§O).
- **Analytics & monitoring** — dependency-free, env-gated scaffolds
  (`src/lib/analytics.ts` PostHog capture; `src/lib/observability.ts` error
  hook); no-op until `NEXT_PUBLIC_POSTHOG_KEY` / `SENTRY_DSN` are set. Two
  product events (`diagnostic_completed`, `reading_session_completed`) are wired.
- **Migration 0006** — a consent-insert policy and staff read policies for the
  org/school tree.

> Verified against the live DB: a parent records consent and writes audit
> entries, an admin reads the audit log and school tree, and a parent is denied
> audit reads — all by RLS.

## Production roadmap — Sprint 1 complete

The repository-side production foundation is now reproducible:

- GitHub Actions runs TypeScript, ESLint, all Vitest tests, and a separate
  fresh-Postgres migration job on pull requests and pushes to `main`.
- `npm run typecheck`, `npm run ci`, and `npm run seed:demo` provide the same
  checks and seed flow locally.
- `supabase/config.toml` makes local/CI migrations deterministic. The clean
  migration run also fixed older-CLI parsing of the existing
  `atomicity_level` competency column without changing its database name.
- `.env.staging.example` and `supabase/README.md` separate local, staging, and
  production setup. Hosted staging is the dedicated project
  `pwztnrirtrnicywvdbpz`.
- The idempotent demo seed creates the four role accounts, organization,
  school, class, guardian/enrollment/consent links, interests, and current
  learning evidence needed by parent and teacher dashboards.

Staging verification: all four demo roles can authenticate; parent and teacher
RLS reads return the linked student and two seeded sessions; rerunning the demo
seed produces no duplicate organization, school, class, links, or consent.

## Production roadmap — Sprint 2 complete

Learning evidence now uses the relational schema end to end:

- Student onboarding, diagnostic, reading, summary, retrieval, and repair
  actions validate input, enforce the student role, and persist server-side.
- `students.app_state` is deprecated and rejects authenticated writes. The
  migration projects existing demo state once; the UI store is now only an
  optimistic cache and local-only fallback when Supabase is not configured.
- Seed texts, immutable versions, questions, choices, vocabulary, sessions,
  answers, summaries, estimates, retrieval schedules, and mastery evidence all
  have stable relational identifiers.
- Parent and teacher dashboards aggregate the same relational rows through RLS.

Staging verification: the idempotent seed yields 2 sessions, 10 fully linked
answers, 2 summaries, 1 diagnostic with 7 skill results, 5 current skill
estimates, 2 retrieval cards/schedules, and 4 word-mastery rows. Student
cross-access is denied, linked parent/teacher reads succeed, admin reads
succeed, answer retries work, and no student retains `app_state` data.

## Production roadmap — Sprint 3 complete

Content review and publishing are now shared database workflows:

- Generation jobs, validated candidates, deterministic scoring, moderation,
  review decisions, and approved immutable versions persist in Postgres.
- Admin review, library, benchmark, dashboard, and text-detail screens read the
  same RLS-protected data. Approval creates versioned questions, choices,
  skills, and vocabulary; rejection, retirement, and benchmark locking are
  audited.
- Only platform admins can access the AI workflow and catalog tables. Content
  reviewers can access only active assignments and their own evaluations.
  Authenticated students see only active, human-approved or benchmark-locked
  versions.
- The student recommender and reading player load approved database texts while
  retaining the two seed texts as an offline/keyless fallback.

Verified in separate browser sessions locally and on dedicated staging: an
admin-approved generated text appeared in the shared library and was
recommended/opened by the demo student; a second reviewer saw the same state;
teacher workflow-table reads/writes were denied by RLS.

## Production roadmap — Sprint 4 complete

Real student account and consent lifecycles are now available:

- Teachers create or rotate expiring, usage-limited class codes and explicitly
  choose whether school consent covers the class.
- `/join` validates a code before signup. The database Auth trigger atomically
  creates the student, assigns school/grade, enrolls the class, consumes one
  code use, and records school consent when enabled.
- Parents can create child credentials without requiring a child email inbox;
  the account is linked to the guardian and guardian consent is recorded.
- Missing or revoked consent replaces every student learning route with a
  waiting screen. Linked parents can grant/revoke consent, while students aged
  15 or older can self-consent against versioned policy text.
- Consent policies reject students minting codes and parents consenting for
  unlinked children. Proxy remains an optimistic session/role boundary; the
  authoritative consent check runs in the student server layout.

Verified locally through complete browser flows and on dedicated staging
through Auth/database integration and positive/negative RLS checks.

## Production roadmap — Sprint 5 complete

Student free text now passes through a single minors-safety boundary:

- Diagnostic summaries, reading summaries, initial retrieval, and memory
  retrieval use provider-agnostic moderation with a conservative French/English
  fallback for unsafe content, contact details, and prompt injection.
- Flagged text is rejected before scoring or persistence. Audit entries contain
  only field, categories, moderation source, and character count—never the text.
- Direct student REST inserts into diagnostic summaries, reading summaries, and
  retrieval attempts are denied; only moderated, ownership-checked server
  actions use the server credential for those writes.
- Atomic Postgres counters enforce 10 auth attempts per 15 minutes, 60 answer
  submissions and 15 free-text submissions per 10 minutes, plus 100 student AI
  units per day. UI failures use neutral French messages.
- The repeatable checklist lives in `docs/safety-checks.md`.

Verified locally in the browser and by SQL/RLS assertions, then repeated on
dedicated staging for throttles, daily budget, and direct-write denial.

## Production roadmap — Sprints 6–20 implemented

The remaining roadmap epochs are now represented in the application and its
numbered migrations (`0018–0034`):

- Real OpenAI-compatible/GLM text, question, moderation, rubric, tagging and
  embedding operations use versioned prompts and persistent job/gate evidence.
- Two competency slices contain 61 human-anchored nodes and at least eight
  machine-verified items per node. Review queues, catalog tools, graph checks,
  Lexique frequency import and Gate-5 psychometric flags are available to staff.
- The student experience uses goal-scoped adaptive diagnosis, a shared
  competency frontier, sequenced catch-up practice, writing annotation and
  revision, spaced retrieval, streaks, resume, French input helpers, read-aloud,
  accessible reading controls and offline answer synchronization.
- Parent and teacher surfaces include FR/EN navigation and reports, immutable
  weekly evidence, class/join-code/roster/assignment operations, persisted CSV
  exports and an activation checklist.
- Cron endpoints have durable run logs for weekly reports, retrieval notices,
  psychometrics and retention/deletion. The privacy export covers learner
  profiles and competency evidence; an automated staging test proves that a due
  deletion removes Auth plus the full student graph while retaining completion
  evidence.
- PostHog/Sentry adapters, environment feature gates, PWA assets, CI/deployment
  workflows, load sanity, runbooks and the bilingual pilot kit are included.

Staging evidence recorded on 2026-07-10: all migrations through `0034` applied;
488 approved competency items (exactly eight across each of 61 nodes); 50-way
load sanity p95 1.132 s from the test machine with RLS intact; diagnostic hot-path
REST calls 0.25–0.52 s on warm requests; mobile width 360 px without overflow;
offline queue drains on reconnect; Lighthouse accessibility 95 on both reading
and results; dependency audit reports zero vulnerabilities.

External launch gates are intentionally not faked: generated pilot passages
remain in `needs_human_review` until a person approves them and locks six
benchmarks; production PostHog, Sentry, Resend, Google Auth and GitHub/Vercel
promotion credentials must be supplied in their protected environments;
production-data promotion and the friendly-family four-week rehearsal require the release owner. See
[`docs/launch-gates.md`](./docs/launch-gates.md).

## Supabase (live)

Project **`reading-to-learn`** (`tkasvcccucpsbjywgdyl`, eu-central-1) is
provisioned with all migrations + RLS + reference seed + the signup trigger
(`supabase/migrations/0001–0003`). `.env.local` points at it, so the app
connects and the proxy now enforces auth on every protected route.

Confirmed demo accounts (all password `Demo1234!`) — the student has seeded
learning data so the parent/teacher dashboards show real evidence:

```
student:  demo.eleve@reading-to-learn.test
parent:   parent.demo@reading-to-learn.test   (linked to the student)
teacher:  prof.demo@reading-to-learn.test      (teaches class "5e A")
admin:    admin.demo@reading-to-learn.test     (platform_admin)
```

> **Note:** production has not received the roadmap migrations. New work is
> applied and verified on the dedicated staging project first; production
> promotion is reserved for the hardening and release sprints.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run ci           # typecheck + lint + unit tests
```

The app runs **without Supabase configured**: the landing, marketing, and
dashboard shells all render. To enable auth and data, apply the migrations and
fill in `.env.local` (copy from `.env.example`). See `supabase/README.md`.

```bash
cp .env.example .env.local   # then add your Supabase + (optional) OpenAI keys
```

For a staging project and reproducible demo accounts, copy
`.env.staging.example`, fill its staging-only values, apply migrations, and run
`npm run seed:demo`. See `supabase/README.md` for the guarded workflow.

## Layout

```
src/
  app/                 routes (public, auth, student, parent, teacher, admin)
  components/          UI primitives + shared shells
  lib/
    auth.ts            session + role guards
    types.ts           core domain types (roadmap.md §C–§J)
    supabase/          browser / server / proxy clients
    ai/                AIProvider interface, Zod schemas, mock provider
    actions/           server actions (auth-guarded stubs)
supabase/
  migrations/          schema (0001) + RLS (0002)
  seed.sql             reference data: domains, skills, concepts
```

## Deferred by design

- **Real OpenAI provider** — the pipeline is provider-agnostic; `getAIProvider()`
  returns the mock and throws a clear error for `AI_PROVIDER=openai`. Wiring the
  Responses API + Structured Outputs behind that flag is a small, isolated step.
- **Supabase-backed learning data** — auth is live; the diagnostic/session/skill
  data still uses the `localStorage` stores. Swapping them for server actions
  against the (already-applied) schema + RLS is the next wiring step.

## Assignments (PRD §N)

Teachers assign a reading to a class at `/teacher/assignments` (persisted to the
`assignments` table, migration 0007); enrolled students see it in an "À faire"
section on their home and open it directly. RLS enforces that teachers manage
only their classes and students read only their enrolled classes — verified end
to end (teacher create 201, student read OK, student create 403).

## Next

- **Real OpenAI provider** behind `AI_PROVIDER=openai` (the pipeline is ready).
- **Normalised evidence projections** — decompose `students.app_state` into the
  relational `reading_sessions` / `student_skill_estimates` tables for richer
  SQL aggregation, and wire real PostHog/Sentry.
