# Reading to Learn

> Learn to love reading while reading to learn.

A personalized French academic reading platform for secondary students. This
repo contains the **Phase 0 skeleton + Phase 1 student slice** from
[`roadmap.md`](./roadmap.md): a running foundation plus a working end-to-end
reading experience.

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

## Next

Phase 2 (per `roadmap.md` §25): the AI content pipeline — generation jobs,
structured outputs + Zod validation, the deterministic text difficulty engine,
question generation, moderation, and the admin review flow that turns AI
candidates into assignable content. This also replaces the manual seed texts
and the `localStorage` store with Supabase-backed data.
