# SigmaWrite — French Mastery Platform - Roadmap

> **Created**: 2026-07-12 (supersedes 2026-06-20 roadmap, archived at `.claude/roadmap-archive-2026-07-12.md`)
> **Last Updated**: 2026-07-12
> **Status**: Engineering complete. All 20 production sprints (`roadmap-to-production.md`) and the full G-series graph/automated-content roadmap (`docs/french-learning-graph-and-automated-content-roadmap.md`) implemented and verified. 365 tests / 60 files pass; tsc clean; CI + deploy workflows live. Remaining work is launch execution (human + credential gates), doc consolidation, and content scale.
> **Current Phase**: Phase L — Launch gates

## Context

Graph-based French mastery platform (Next.js 16, React 19, Supabase, Tailwind v4, Zod, Vitest). Core: atomic-competency knowledge graph + deterministic French validators + KST/BKT diagnosis + contract-bounded LLM generation behind QA gates, provisional serving, empirical psychometrics, and a measured staged rollout. Two overlays (school-literacy L1, FSL/CEFR). Beachhead: heritage/immersion/allophone catch-up, D2C to parents.

**Sources of truth for what shipped**: `roadmap-to-production.md` (Sprints 1–20 tracker + changelog) and `docs/french-learning-graph-and-automated-content-roadmap.md` (G-tasks, each with a verified implementation-status block). Launch prerequisites: `docs/launch-gates.md`.

**Branch workflow** (README): feature → `develop` (Vercel Preview/staging) → PR → `main` (Production at sigmawrite.vercel.app). Never push feature work to `main`.

## Phase L: Launch gates — human decisions & protected credentials (P0)

These cannot be automated; automation must not pretend to satisfy them (`docs/launch-gates.md`).

### Stream A: Protected service configuration (staging + production, verify per linked docs)
- [ ] LA1: PostHog client/server keys + host; verify funnel per `docs/observability.md` (P0, S)
- [ ] LA2: Sentry DSN/auth token/release; trigger one controlled client + server error (P0, S)
- [ ] LA3: Resend API key + verified sender; send weekly report to friendly family, confirm immutable link (P0, S) — unblocks Sprint 12 ☑
- [ ] LA4: Supabase Google provider + redirect allow-list; verify adult OAuth/magic-link; confirm student cannot use adult callback (P0, S) — unblocks Sprint 18 ☑
- [ ] LA5: Vercel tokens/project ids for both GitHub environments; exercise staging deploy, smoke test, protected production promote (P0, M) — unblocks Sprint 19 ☑

### Stream B: Human content sign-off
- [ ] LB1: Invite the two real educators in `/admin/reviews/reviewers` (principal admin is reviewer 1) (P0, S)
- [ ] LB2: Assign the 60 pilot passages to all three reviewers in `/admin/reviews/assign` (P0, S)
- [ ] LB3: Each reviewer acknowledges `/review/instructions` and submits independent rubrics (P0, M) — unblocks Sprints 6 & 20 ☑
- [ ] LB4: Resolve, publish ≥60 passages; select and lock exactly 6 benchmarks in `/admin/benchmarks` (P0, S)

### Stream C: Pilot rehearsal
- [ ] LC1: Friendly-family four-week rehearsal per `docs/pilot/four-week-protocol.md` (class creation → join/consent → diagnostic → sessions → weekly report) (P0, L)
- [ ] LC2: Promote `develop` → `main` after CI + staging validation (currently 1 commit ahead) (P0, S)

## Phase M: Documentation consolidation (P1)

- [ ] M1: Refresh `README.md` — remove stale claims (localStorage learning data, mock-only provider "Next" section) that Sprints 2–6 already fixed (P1, S)
- [ ] M2: Fix stale header in `docs/french-learning-graph-and-automated-content-roadmap.md` ("Implementation in progress (G01 verified)" → complete) (P1, S)
- [ ] M3: PRD v2 — absorb the pivot so the PRD stops drifting into fiction (flagged in `gap-analysis.md` §1.3) (P1, M)

## Phase N: Content scale & curricular depth (P0 after launch gates)

The identified main gap (French roadmap §"main gap"): curricular depth, not machinery.

- [ ] N1: Expand taxonomy beyond v1 (121 nodes / 103 edges) across remaining strands, via the versioned-release pipeline (P0, L)
- [ ] N2: Grow the lexicon beyond the 268-lemma baseline — within the fail-closed licensing register (`docs/french-source-register.md`); no external dataset imports without recorded commercial terms (P0, L)
- [ ] N3: Generate + human-review item/passage banks for new slices through the contract→QA→provisional→measured-rollout machinery (P0, L)
- [ ] N4: Advance measured rollout stages (internal → staff → pilot → broader) on evidence thresholds, not elapsed time (P0, M)

## Phase O: Post-pilot loops (P1, needs live data)

- [ ] O1: Act on empirical psychometric signal — flagged items, no-lift edges, difficulty proposals (machinery live in `src/lib/monitoring/psychometrics.ts`; needs real exposure volume) (P1, M)
- [ ] O2: Sparse human calibration campaigns on real anomalies (P1, M)
- [ ] O3: Speech layer (read-aloud fluency, oral items) — still deferred until core loop proven with pilot users (P2, L)

## Dependencies

| Task | Depends On | Blocks |
|------|-----------|--------|
| LB1–LB4 | real educators available | LC1, pilot launch |
| LA1–LA5 | account/billing owner | LC1, LC2 (production confidence) |
| LC1 | LA*, LB* | public pilot |
| N3, N4 | LB4 (locked benchmarks), LA* | broader rollout |
| O1–O2 | LC1 + live usage | content self-correction |

## Progress Tracking

| Phase | Status | Completed | Total | Last Updated |
|-------|--------|-----------|-------|--------------|
| Sprints 1–20 (engineering) | COMPLETE (5 sprints ◐ on external gates only) | 20 | 20 | 2026-07-11 |
| G-series graph/content roadmap | COMPLETE | all | all | 2026-07-11 |
| Phase L (launch gates) | NOT STARTED | 0 | 11 | — |
| Phase M (docs) | NOT STARTED | 0 | 3 | — |
| Phase N (content scale) | NOT STARTED | 0 | 4 | — |
| Phase O (post-pilot) | NOT STARTED | 0 | 3 | — |

## Key Files

| File / Path | Role |
|-------------|------|
| `roadmap-to-production.md` | Sprint 1–20 tracker + changelog (source of truth for what shipped) |
| `docs/french-learning-graph-and-automated-content-roadmap.md` | G-series tasks with verification records |
| `docs/launch-gates.md` | Human/credential launch prerequisites |
| `docs/pilot/` | Four-week pilot protocol + materials |
| `supabase/migrations/` | Schema 0001–0056, RLS throughout |
| `src/lib/` | graph, linguistic, diagnostic, generation, qa, safety, serving, monitoring, rollout, benchmarks |
| `generated/french-taxonomy-v1.json` | Immutable published taxonomy release |
| `benchmarks/french-automation-v1.json` | Locked release-gate benchmark suite |

## Changelog

- 2026-07-12: Roadmap reset. Old phases 7–15 archived (all engineering shipped via Sprints 1–20 + G-series by 2026-07-11; verified: 365 tests pass, tsc clean). New phases L–O defined: launch-gate execution, doc consolidation, content scale, post-pilot loops.
