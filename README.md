# Reading to Learn

> Learn to love reading while reading to learn.

A personalized French academic reading platform for secondary students. This
repo currently contains the **Phase 0 skeleton** from [`roadmap.md`](./roadmap.md):
a running foundation that everything else builds on.

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

Phase 1 (per `roadmap.md` §25): student onboarding, interest picker, diagnostic
flow, seed texts, question answering, and the reading-session result page.
