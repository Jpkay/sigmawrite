# Reading to Learn

> Learn to love reading while reading to learn.

A personalized French academic reading platform for secondary students. This
repo contains **Phases 0–2** from [`roadmap.md`](./roadmap.md): a running
foundation, a working end-to-end student reading experience, and the AI content
pipeline with admin review.

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

## Deferred by design (the standing Phase 0 decisions)

Two things are intentionally not wired yet, consistent with "local migrations
only" + "AI interface + mock":

- **Real OpenAI provider** — the pipeline is provider-agnostic; `getAIProvider()`
  returns the mock and throws a clear error for `AI_PROVIDER=openai`. Wiring the
  Responses API + Structured Outputs behind that flag is a small, isolated step.
- **Supabase-backed persistence + jobs** — the student and admin flows run on
  `localStorage` stores whose shapes mirror the DB tables. Production routes
  generation through the §23 server actions, Supabase Queues/Cron, and the
  migrations already in `supabase/`.

## Next

Phase 3 (per `roadmap.md` §25): the adaptive engine v1 — persisted student
skill estimates, success-zone-driven next-text selection, difficulty
adjustment, foundation-repair triggers, and the first micro-lessons. This is
the natural point to wire Supabase and replace both `localStorage` stores.
