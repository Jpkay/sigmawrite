# Gap Analysis — Codebase vs PRD & Intent

> **Date**: 2026-07-09
> **Sources of truth compared**:
> 1. `roadmap.md` — the original PRD ("Reading to Learn", modules A–O, phases 0–6)
> 2. `.claude/roadmap.md` — the post-pivot intent (graph-based **French mastery engine**, phases 7–15)
> 3. The codebase on `feature/competency-graph` (commit `3186d2e`)

---

## 1. Executive summary

The codebase faithfully implements the **shape** of the PRD: every module A–O has real code behind it, the full §21 schema + RLS is live on Supabase, the student loop (onboarding → diagnostic → reading → results → memory → repair) runs end-to-end, and parent/teacher dashboards read real RLS-scoped data. Test coverage of the pure scoring/graph/linguistic logic is genuinely good (50+ Vitest cases pre-pivot, plus graph/diagnostic/generation tests since).

The three biggest gaps against the PRD are **structural, not cosmetic**:

1. **The §H AI text-generation pipeline still runs on a mock provider.** `getAIProvider()` throws for `AI_PROVIDER=openai`. The PRD's core promise — generate controlled French texts per student — cannot happen in production. (The *new* Phase-9 item-generation pipeline did wire a real LLM — GLM 5.2 via Cloudflare/OpenRouter — but that serves the pivot's item bank, not §H.)
2. **Learning evidence is not in the relational tables.** Student data persists as a single `students.app_state` JSONB blob (migration 0004), not into `reading_sessions` / `student_answers` / `student_skill_estimates` / `retrieval_cards`. The PRD's stated moat is "clean learning data" (§28); a JSONB blob forfeits SQL aggregation, psychometrics (Phase 13/Gate 5), and the §F non-negotiable (`answers reference text_version_id`) in practice. Worse, **admin-approved content lives in `localStorage`** (`content-store.ts`) — approved texts exist only in the reviewing admin's browser.
3. **The PRD and the actual product intent have diverged.** The repo has *two* roadmaps: the PRD describes a reading-comprehension platform; `.claude/roadmap.md` describes a pivot to an atomic-competency knowledge graph with deterministic French validators and KST/BKT diagnosis. Phases 7–11 (competency graph, conjugation engine, LanguageTool, 6-gate item generation, goal-conditioned diagnostic, past-narration slice) are **entirely outside the PRD**. The PRD needs a v2 that absorbs the pivot, or it will keep drifting into fiction.

---

## 2. Module-by-module status vs PRD

Legend: ✅ built · 🟡 partial · ❌ missing · 🔵 superseded by pivot

### Module A — Authentication & roles
| Requirement | Status | Notes |
|---|---|---|
| Email/password auth | ✅ | Supabase Auth, login/signup wired |
| Role-based routing & guards | ✅ | `src/proxy.ts`, `requireRole` in every action |
| 6 roles in schema | ✅ | Migration 0001 |
| Magic link | ❌ | Not offered |
| Google login for adults | ❌ | Not offered |
| **Student join code** | ❌ | `/join` is a disabled stub ("arrive en Phase 1"). **There is no student signup path at all** — signup only offers parent/teacher roles; the demo student was seeded manually |
| Guardian consent flow | 🟡 | Consent can be *recorded* post-hoc (`/parent/privacy`, `giveConsent`), but `/consent` page button is disabled and consent is **not gated** into account creation |

### Module B — Student onboarding
✅ Grade, French background, interest picker with interest→knowledge transfer preview. Matches PRD flow.

### Module C — Diagnostic assessment
🟡 Implemented (`/student/diagnostic`, `src/lib/content/diagnostic.ts`, `scoring/diagnostic.ts`) with vocabulary/sentence/paragraph sections + written summary, producing band, skill estimates, and foundation gaps.
**Gaps**: no expository-text or argumentative-text sections, no confidence/self-perception questions, and the item bank is far short of a 20–30-minute instrument. 🔵 Partly superseded: the pivot's goal-conditioned adaptive diagnostic (`src/lib/diagnostic/engine.ts`, KST descent + BKT) is a *better* design than the PRD's fixed form, but it has **no UI** (Phase 10 E1/E5 open) — two diagnostic engines now coexist.

### Module D — Interest graph
🟡 **Half the layer is missing.** Declared interests are captured at onboarding and used in next-text selection (`scoring/adaptive.ts`). But there is **no inferred/revealed interest tracking** — no `inferredStrength`, no per-interest completion/abandonment stats, so the PRD's four behavior rules (§D) can't fire on real signals.

### Module E — Knowledge graph
✅/🔵 Domains + concepts seeded (`supabase/seed.sql`); concepts drive retrieval cards. The pivot's `competency_nodes`/`competency_edges` graph (migrations 0008–0012, `src/lib/graph/`) is a strictly stronger version — but it models French *linguistic* competencies, not the PRD's subject-knowledge concepts (migration, colonialism, ecosystems…). These are two different graphs; the PRD's knowledge-transfer thesis (Layer 3) currently rests only on the older, thinner one.

### Module F — Text library
🟡 Schema is complete and versioned. But the live library is **12 hand-authored seed texts** (`src/lib/content/texts.ts`) plus whatever the mock generator produces into localStorage. No licensed/public-domain ingestion path.

### Module G — Text difficulty engine
✅ `scoring/text-difficulty.ts`: deterministic features → six dimensions → band; one-step-harder rule enforced in `scoring/adaptive.ts`. Unit-tested. This matches the PRD's "GenAI writes, scoring engine judges" architecture.

### Module H — AI content generation pipeline
🟡 The pipeline structure exists and is tested (`ai/pipeline.ts`: generate → Zod → difficulty → moderation → question scoring → review-status routing; sensitive domains force human review). **But**:
- ❌ Real OpenAI provider never wired (`ai/index.ts` throws)
- ❌ No factuality-check step beyond flags the (mock) model self-reports
- ❌ No `ai_generation_jobs` persistence — candidates never touch the DB (`content-store.ts` is localStorage)
- ❌ No embeddings / duplicate-content detection
- 🔵 The Phase-9 *item*-generation pipeline (`ai/item-generation/`) is real and stronger (6 QC gates, deterministic answer-key verification via the conjugation engine + LanguageTool, cross-model judge) — but only for competency items, and the real bulk run (D8) is still blocked on credentials.

### Module I — Reading session
✅ Full flow: read → questions → summary → same-session retrieval → feedback → next-action. Session length and structure match the PRD.

### Module J — Adaptive engine
✅ Success-zone rules (§J table) implemented in `scoring/session.ts` / `adaptive.ts`; evidence-weighted skill estimates (`skill-estimate.ts`); BKT (`bkt.ts`) landed early for the pivot. Matches "start with rules, don't overbuild IRT."

### Module K — Foundation repair
✅ `/student/repair/[skillKey]` + `content/micro-lessons.ts` in the PRD's exact format (2-min explanation → 5 micro-questions → return-to-text), age-respectful tone.

### Module L — Memory & retrieval
✅ SM-2-style ladder `[1, 3, 7, 21, 45]` days with ease factor (`scoring/retrieval.ts`), same-session retrieval in the reading flow, card seeding per concept, review UI at `/student/memory`, vocabulary exposure recorded.
🟡 Minor: retrieval attempts/schedules live in `app_state`, not the `retrieval_*` tables.

### Module M — Parent dashboard
✅ Weekly report (texts, minutes, success, vocabulary, strengths/needs-work) + the three-bucket proof layer, computed from real sessions (`lib/reports.ts`, RLS-verified).
❌ `parent_reports` table unused — nothing is *generated weekly*; `/parent/reports/[reportId]` is a stub; no email/notification delivery. "Parent report open rate" (§8) is unmeasurable.

### Module N — Teacher dashboard
🟡 Class overview, per-student bands/engagement, intervention groups from shared skill gaps, per-student detail, assignments (migration 0007, RLS-verified 201/403) — all ✅.
❌ `createClass()` and `inviteStudents()` throw `notImplemented` — **teachers cannot self-serve onboard a class**; classes must be seeded by hand. Report export is print-to-PDF only (no CSV/file export). `teacher_reports` table unused.

### Module O — Admin & content review
🟡 Review queue, edit-with-live-rescoring, approve/reject, library, retire, benchmark-lock, audit log, school tree — ✅ (but on localStorage content).
❌ Stub pages: `/admin/skills`, `/admin/vocabulary`, `/admin/concepts`, `/admin/prompts`, `/admin/ai-jobs`. The `prompt_versions` table exists but no prompt versioning is practiced — pivotal for reproducibility once real generation starts.

### §10 — Privacy, safety, compliance
| Requirement | Status |
|---|---|
| Consent recording, data export (JSON), deletion request | ✅ (`/parent/privacy`, auth-guarded actions) |
| Audit logs | ✅ (`audit_logs`, admin viewer, RLS-verified) |
| No public profiles / ads / social | ✅ (by absence) |
| Generated-content moderation | 🟡 mock only |
| **Student free-text input moderation** | ❌ Summaries and free-text retrieval answers go straight to heuristic scoring with no moderation pass — an explicit §10 requirement |
| Student-friendly privacy explanation | 🟡 `/privacy` exists; not child-adapted per CNIL guidance |
| Consent gating before student use | ❌ (see Module A) |

---

## 3. Stack gaps (PRD §11–20)

| PRD stack item | Status |
|---|---|
| Next.js / TS / Tailwind / Supabase / RLS / Zod / Vitest | ✅ |
| shadcn/ui | 🟡 hand-rolled equivalents (`components/ui/`) — fine in practice |
| **OpenAI Responses API + Structured Outputs** | ❌ (GLM via OpenAI-compatible endpoint wired for the *item* pipeline only) |
| **pgvector** | ❌ effectively unused — `embedding vector(1536)` column + ivfflat index exist, but no code ever writes or queries embeddings. No similar-text search, no interest matching, no duplicate detection (§15 use cases) |
| **Supabase Queues / Cron / Edge Functions** | ❌ none. No background jobs at all — no weekly parent report, no scheduled recalculation, no async generation jobs (§16 lists 10 job types) |
| Supabase Storage | ❌ unused (nothing needs it yet — acceptable) |
| **PostHog** | 🟡 dependency-free `track()` scaffold, env-gated, exactly **2 events** wired (`diagnostic_completed`, `reading_session_completed`). None of the §8 activation/engagement/trust metrics are measurable |
| **Sentry** | 🟡 `observability.ts` error-hook scaffold; the real SDK is not installed |
| Vercel deployment | ❓ not evidenced in repo (no CI/CD config of any kind — see §6) |

---

## 4. PRD vs intent: the pivot divergence

The pivot (phases 7–15) is a genuine strategic upgrade — deterministic validators as answer-key ground truth, a DAG of atomic competencies, goal-conditioned KST diagnosis, and machine-verified LLM authoring are all stronger than the PRD's §C/§G designs. But the divergence creates concrete debts:

1. **Two diagnostics** (fixed-form §C vs adaptive KST engine) — the better one has no UI, the shipped one is the weaker.
2. **Two graphs** (knowledge concepts vs competency nodes) — retrieval cards hang off the old one; the new one has no student-facing surface yet.
3. **Two generation pipelines** (§H text pipeline on mock vs Phase-9 item pipeline on GLM) with separate schemas, gates, and review flows.
4. **Two roadmaps** — `roadmap.md` (PRD) never mentions the mastery engine, CEFR overlays, FSL learners, or the D2C-to-parents beachhead. Anyone onboarding from the PRD builds the wrong product.

**Recommendation**: write PRD v2 that (a) keeps the reading loop as the *application layer*, (b) makes the competency graph the *engine layer* underneath it, and (c) explicitly retires the PRD sections the pivot supersedes (§C fixed diagnostic, parts of §E/§G). Decide whether reading-comprehension texts become items on graph nodes (they should).

---

## 5. Prioritized gap list

P0 = blocks pilot / core promise · P1 = needed for pilot credibility · P2 = later

| # | Gap | Priority | Effort |
|---|-----|----------|--------|
| 1 | Content store in localStorage — approved content is per-browser; persist candidates/approvals to `ai_generated_candidates` / `text_versions` | **P0** | M |
| 2 | Learning evidence in `app_state` JSONB — project into `reading_sessions`, `student_answers`, `student_skill_estimates`, `retrieval_*` (already the README's stated next step) | **P0** | L |
| 3 | No student account-creation path (join code / parent-created child accounts) | **P0** | M |
| 4 | Real LLM provider for the §H text pipeline (reuse the Phase-9 OpenAI-compatible client; run behind admin review) | **P0** | M |
| 5 | Consent not gated before student use (CNIL: parental involvement under 15) | **P0** | S–M |
| 6 | Student free-text moderation (summaries, retrieval answers) | **P0** | S |
| 7 | Phase-9 D8: run real item generation on the past-narration slice; unblock creds | **P0** | S |
| 8 | Diagnostic/frontier UI for the new engine (Phase 10 E1/E5) — the pivot is invisible to users until this lands | **P0** | M |
| 9 | Teacher `createClass` / `inviteStudents` (self-serve class setup) | **P1** | M |
| 10 | Inferred-interest tracking (per-interest completion/abandonment stats feeding §D rules) | **P1** | M |
| 11 | Weekly parent report generation job (+ `parent_reports`) — needs first background-job infrastructure (Supabase Cron/Edge Function or Vercel cron) | **P1** | M |
| 12 | Real PostHog + Sentry SDKs; instrument the §8 metric events | **P1** | S–M |
| 13 | Admin stub pages: prompts (versioning matters once real gen runs), ai-jobs, skills/vocab/concepts CRUD | **P1** | M |
| 14 | Diagnostic breadth: expository/argumentative sections + confidence questions (or fully replace with the adaptive engine) | **P1** | M |
| 15 | pgvector wiring: embed approved texts, similar-text & duplicate detection | **P2** | M |
| 16 | Teacher CSV export; `teacher_reports` persistence | **P2** | S |
| 17 | Magic link + Google login for adults | **P2** | S |
| 18 | Content-library depth beyond 12 seed texts (needs #4) | **P2** | ongoing |

---

## 6. Features not in the PRD that should be added

**Product**
- **Streaks / lightweight progress rituals** — the PRD bans social features, not motivation mechanics. A daily-goal + streak + "concepts secured" counter is the cheapest engagement lever for the 13–15 audience and directly serves the "3 sessions in first week" activation metric.
- **Read-aloud (TTS) and dyslexia-friendly reading options** (font, spacing, line focus). The PRD excludes dyslexia *diagnosis*, but reading *accommodations* are table stakes for a literacy product serving struggling readers.
- **French accent input helpers** on all free-text fields (é è ç à … tap-to-insert). Students on QWERTY/phone keyboards will otherwise be penalized by the grammar validators for keyboard limitations, corrupting the learning signal.
- **Session resume / autosave** — a 15–25-minute session on a teen's device *will* be interrupted; losing a half-finished session is a churn event.
- **Email delivery of the weekly parent report** — a dashboard nobody opens builds no trust; push the evidence to the parent (pairs with gap #11).
- **Parent-facing UI language toggle (FR/EN)** — diaspora and immersion-school parents (an explicit target segment) often read English more comfortably than academic French.
- **PWA / offline reading pack** — low-connectivity resilience matters for the Francophone-Africa segment and for phones on school Wi-Fi.

**Engineering / operational (absent from both PRD and repo)**
- **CI/CD**: no GitHub Actions (or any CI) — tests, typecheck, and lint should gate merges; migrations should be applied by pipeline, not by hand.
- **Rate limiting + abuse controls** on auth and (once real) generation endpoints; per-student daily LLM budget.
- **LLM cost & latency telemetry** per generation job (the Phase-9 `yieldReport` is the natural place).
- **Staging environment / Supabase branch** — everything currently verifies against the single production project.
- **Seed/demo data script** as a first-class artifact (demo accounts are documented but their setup is not reproducible from the repo).
- **Data-retention automation** (auto-purge per the deletion-request workflow, retention windows for events).

---

## 7. What is verifiably solid (keep, don't rebuild)

- Schema + RLS discipline (verified end-to-end against live DB, per README and migration history)
- The pure-function scoring core: text difficulty, adaptive next-action, SM-2 retrieval, skill estimates, BKT — all unit-tested
- The pivot's engine layer: competency DAG + invariant checker (Gate 1), deterministic conjugation engine (Gate 0), LanguageTool validation (Gate 2), 6-gate item pipeline, goal-conditioned diagnostic — this is the moat the PRD §28 asked for, delivered in a stronger form than the PRD imagined
- Auth-guarded server actions pattern (`requireRole` before any body)
- Privacy/audit foundations (consent records, export, deletion requests, audit log)
