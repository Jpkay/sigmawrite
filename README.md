# Reading to Learn

> Learn to love reading while reading to learn.

A personalized French academic reading platform for secondary students. This
repo contains **Phases 0–5** from [`roadmap.md`](./roadmap.md): a running
foundation, an end-to-end student reading experience, the AI content pipeline
with admin review, the adaptive engine, the spaced-retrieval memory system, and
parent/teacher dashboards — all on a live Supabase project with the student's
learning data persisted server-side.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth +
RLS + pgvector) · Zod · OpenAI (interface + mock for now). See `roadmap.md` §11–20.

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
```

> **Note:** learning data (diagnostic, sessions, skill estimates, retrieval
> cards) still lives in a `localStorage` store behind the login wall. The
> authenticated student-owned write/read path is verified end-to-end against the
> live DB under RLS (login → read own `students` row → insert/read own data), so
> swapping the store onto the browser Supabase client is the next, de-risked step.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs **without Supabase configured**: the landing, marketing, and
dashboard shells all render. To enable auth and data, apply the migrations and
fill in `.env.local` (copy from `.env.example`). See `supabase/README.md`.

```bash
cp .env.example .env.local   # then add your Supabase + (optional) OpenAI keys
```

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

## Next

Phase 6 (per `roadmap.md` §25): pilot readiness — benchmark passages, school
admin tools, the privacy workflows (guardian consent, data export/deletion),
audit logs, usage analytics, and error monitoring. One Phase 5 piece is
intentionally still light: **assignment creation** (`/teacher/assignments`)
needs an `assignments` table and student-side display, noted in the UI.
