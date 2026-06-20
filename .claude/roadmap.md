# Reading to Learn → French Mastery Platform - Roadmap

> **Created**: 2026-06-20
> **Last Updated**: 2026-06-20
> **Status**: Strategic pivot from reading-comprehension app to a graph-based French mastery platform. Phases 0–6 + assignments shipped. Starting Phase 7 (knowledge-graph foundation).
> **Current Phase**: Phase 7 — Knowledge-graph foundation

## Context

The app began as "Reading to Learn", an adaptive French academic-reading platform for secondary students (Next.js 16, React 19, Supabase, Tailwind v4, TypeScript, Zod, Vitest). It is now evolving into **one French mastery engine with two overlays**:

1. **School-literacy overlay** — native, heritage, bilingual, allophone, immersion students mastering academic French.
2. **Communicative-proficiency overlay** — French-as-second-language (FSL/FLE) learners (CEFR-aligned).

The core is a **shared atomic-competency knowledge graph**. Each competency is a universal node; overlays are tags/mappings (grade band + CEFR), not duplicated nodes. A **goal** is a scoping function over the graph; diagnosis is **goal-conditioned KST frontier descent + Bayesian Knowledge Tracing**; the catch-up plan is a **topological path over unmastered prerequisites**.

**Beachhead**: heritage/immersion/allophone *catch-up*, sold D2C to parents. Differentiators: Projet Voltaire (narrow orthographe + credential), Math Academy (math-only — proves the KG model), Duolingo (consumer, non-academic), ALEKS (math/science, KST incumbent).

**Authoring model**: LLM-authored, machine-verified. Split content into **computable** (conjugation/spelling/agreement/frequency — deterministic engines; LLM never the source of truth) vs **judgmental** (prereq edges, difficulty, misconceptions, phrasing — LLM proposes). Six QC gates: (0) don't generate what you can compute; (1) schema + graph invariants; (2) answer-key self-consistency via validator (safety-critical); (3) cross-model ensemble agreement; (4) human audits margins only; (5) production psychometrics as ground-truth self-correction.

### Already shipped (pre-pivot)
- Phase 0–6 + assignments: student diagnostic→reading→results→progress, AI content pipeline + admin review, adaptive engine v1, spaced-retrieval memory, parent/teacher dashboards, privacy/audit/admin tools, teacher→class→student assignments. Live Supabase project, RLS, consent, audit.

## Phase 7: Knowledge-graph foundation (P0, multi-day) — CURRENT

### Stream A: Graph schema (migration)
- [x] A1: `competency_nodes` table — strand, label_fr, description_fr, atomicity_level, native_grade_min/max, cefr_min/max, requires_{reading,writing,listening,speaking,oral}, learner-mode relevance flags, version, review fields (P0, M) -- Done 2026-06-20 (0008)
- [x] A2: `competency_edges` table — source/target, edge_type (prerequisite | encompasses | misconception_related | contrastive_transfer | same_family | remediates), strength, notes (P0, S) -- Done 2026-06-20 (0008)
- [x] A3: `framework_mappings` table — node → {grade band, CEFR, ACTFL, exam relevance} as rows not columns (P0, S) -- Done 2026-06-20 (0008)
- [x] A4: `misconceptions` table — label, description, linked node(s), diagnostic signature (P0, S) -- Done 2026-06-20 (0008)
- [x] A5: `competency_items` (+ `competency_item_choices`, `competency_attempts`) — prompt, response_type, node ids, misconception ids, modality, learner_mode, validator_type, answer key/rubric, qc_gates, psychometrics (P0, M) -- Done 2026-06-20 (0008)
- [x] A6: `student_competency_estimates` — multi-dim mastery (mastery_probability, uncertainty, receptive/productive, written/oral, fluency, accuracy, decay_rate, evidence_count) (P0, M) -- Done 2026-06-20 (0008)
- [x] A7: `learner_profiles` + `learning_goals` — student_type, home_language, exposure, target; goal scope jsonb over the graph (P0, M) -- Done 2026-06-20 (0008)
- [x] A8: RLS policies for all new tables, consistent with existing model (P0, M) -- Done 2026-06-20 (0009)

### Stream B: Graph traversal layer
- [x] B1: Recursive-CTE SQL functions — prerequisites, dependents (P0, M) -- Done 2026-06-20 (0010)
- [x] B2: Frontier detection — `student_ready_to_learn` (SQL) + `PrereqGraph.readyToLearn` (TS) (P0, L) -- Done 2026-06-20
- [x] B3: Catch-up path — `student_catch_up_path` (SQL) + `PrereqGraph.catchUpPath` (TS), topo order, depth (P0, L) -- Done 2026-06-20
- [x] B4: TypeScript graph service (`src/lib/graph/`) — traversal, invariants (Gate 1), pure-function unit tested (24 tests) (P0, M) -- Done 2026-06-20

### Landed early (from later phases)
- [x] D2 (Gate 1): graph invariant checker — cycle detection, framework monotonicity, dangling edges (`src/lib/graph/invariants.ts`) -- Done 2026-06-20
- [x] E3 (partial): Bayesian Knowledge Tracing estimator (`src/lib/scoring/bkt.ts`) -- Done 2026-06-20
- [x] DB-APPLY: migrations 0008–0011 applied to live Supabase (reading-to-learn / tkasvcccucpsbjywgdyl); 10 tables live w/ RLS; traversal smoke-tested on real Postgres; search_path advisor resolved -- Done 2026-06-20

## Phase 8: Deterministic French linguistic engine (P0, multi-day) — IN PROGRESS
- [x] C1: Conjugation engine — présent/imparfait/passé composé (auxiliary, être-agreement, COD-before, -ger/-cer euphony), wired into validator; slice-scoped, extend via Morphalou later (`src/lib/linguistic/conjugation.ts`, 17 tests) (P0, L) -- Done 2026-06-20
- [ ] C2: Lexicon ingestion — Lexique3 frequency + Morphalou inflected forms (P0, L)
- [-] C3: Agreement validators — broadly covered by the grammar service (QUE_AVOIR, ETRE_VPPA live-verified); deterministic in-code validators still TODO for offline/targeted checks (P0, L)
- [x] C4: Grammar/spell validation — LanguageTool integration as grader; self-host via docker-compose; live-verified on real French (P0, M) -- Done 2026-06-20
- [x] C5: Validator interface — unified `validateAnswer(answer, spec) → {pass, ruleHits}` routing on validator_type (`src/lib/linguistic/validator.ts`) (P0, M) -- Done 2026-06-20
- [ ] C6: Deploy self-hosted LanguageTool + set LANGUAGETOOL_URL (ops; user-run `docker compose -f docker-compose.languagetool.yml up`) (P0, S)

## Phase 9: LLM content-generation pipeline + 6 QC gates (P0, multi-day) — IN PROGRESS
- [x] D1: Gate 0 — recompute conjugations deterministically, override the LLM (`pipeline.ts`) (P0, M) -- Done 2026-06-20
- [x] D2: Gate 1 — schema (Zod) + graph invariants (node/misconception refs, MCQ shape) (P0, M) -- Done 2026-06-20
- [x] D3: Gate 2 — answer-key self-consistency (conjugator + grammar service), hard reject (P0, L) -- Done 2026-06-20
- [x] D4: Gate 3 — cross-model ensemble (ItemJudge interface + threshold); real 2nd model wires with key (P0, L) -- Done 2026-06-20
- [-] D5: Gate 4 — verdict routing done (auto/needs_review/rejected); admin exception-queue UI pending (UI track) (P0, M)
- [x] D6: Generation orchestration (`runItemGenerationPipeline`) + `yieldReport` QC metrics; mock-tested, key-ready (P0, L) -- Done 2026-06-20
- [ ] D7: Wire real Claude generator + judge (blocked on ANTHROPIC_API_KEY = roadmap K5) (P0, M)

## Phase 10: Goal-conditioned adaptive diagnostic + frontier UI (P0, multi-day) — IN PROGRESS
- [ ] E1: Learner-profile intake UI (student_type, grade, target, exposure, home language) (P0, M)
- [x] E2: Adaptive diagnostic engine — goal-conditioned probe high→descend on failure (KST presumption), stop on uncertainty (`src/lib/diagnostic/engine.ts`) (P0, L) -- Done 2026-06-20
- [x] E3: BKT estimate update per probe (`src/lib/scoring/bkt.ts`, wired into engine) (P0, L) -- Done 2026-06-20
- [x] E4: Frontier report — mastered/fragile/missing/ready-to-learn + blockers (`src/lib/diagnostic/report.ts`) (P0, M) -- Done 2026-06-20
- [ ] E5: Catch-up path UI — sequenced layers, today's plan (logic done via catchUpToTarget; UI pending) (P0, M)
- [x] E6: End-to-end verified on real seeded slice — COD-gap localized to true root, not surface error (engine.test.ts) -- Done 2026-06-20

## Phase 11: First production vertical slice — past narration & agreement (P0, multi-day) — IN PROGRESS
- [x] F1: Author/verify 31-node slice across grammaire/conjugaison/orthographe/expression + 52 edges + 6 misconceptions (`src/lib/content/slices/past-narration.ts`); Gate-1 clean DAG, fully monotone (P0, L) -- Done 2026-06-20
- [x] F2: Human-anchored skeleton edges; seeded to live Supabase (migration 0012 + generator script); DB traversal verified to reproduce cross-strand diagnosis (P0, S) -- Done 2026-06-20
- [ ] F3: LLM-generate + machine-verify full item bank for the slice (depends on Phase 9 + real LLM provider K5) (P0, L)
- [ ] F4: End-to-end demo — native + FSL learner both diagnosed precisely on the same slice (P0, M)

## Phase 12: Writing-evaluation engine (P0, multi-day)
- [ ] G1: Pipeline — segment → spell/grammar detect → syntactic analysis → error→node mapping (P0, L)
- [ ] G2: Rubric scoring + revision plan generation (P0, M)
- [ ] G3: Feed detected errors as (noisier) evidence into estimates; route to micro-lessons (P0, M)

## Phase 13: Production psychometrics loop — Gate 5 (P0, multi-day)
- [ ] H1: Item analysis — p-value (difficulty), point-biserial (discrimination); auto-flag bad items (P0, M)
- [ ] H2: Prerequisite-edge validation — does mastering prereq predict dependent success? flag no-lift edges (P0, L)
- [ ] H3: Misconception validation — cluster error patterns to confirm/kill tags (P0, M)
- [ ] H4: Content self-correction telemetry → regeneration/human-review queue (P0, M)

## Phase 14: Speech layer — deferred until core loop proven (P1, multi-day)
- [ ] I1: Read-aloud fluency + pronunciation scoring (P1, L)
- [ ] I2: Oral production/comprehension items + scoring (P1, L)

## Phase 15: Scale + authoring studio (P1, multi-week)
- [ ] J1: Expand graph across all 10 strands (orthographe lexicale/grammaticale, grammaire/syntaxe, conjugaison, lexique, listening, oral, reading, writing, literary/analytical) (P1, L)
- [ ] J2: ACTFL/AP/DELF/exam framework mappings (P1, M)
- [ ] J3: Graph authoring/visualization studio UI on Postgres (P1, L)
- [ ] J4: Contrastive-transfer (L1 interference) modeling for FSL (P1, M)

## Production-readiness (cross-cutting, runs through all phases)
- [ ] K1: Test coverage for all new scoring/graph/validator logic (pure functions) (P0, ongoing)
- [ ] K2: Performance — CTE traversal latency budgets; indexes on edges/estimates (P1, M)
- [ ] K3: Privacy/consent extension to new learner-profile + telemetry data (P0, M)
- [ ] K4: Observability — generation QC pass/fail metrics, diagnostic funnels (P1, M)
- [ ] K5: Real LLM provider wiring (replace mock) with structured outputs + caching (P0, M)

## Dependencies

| Task | Depends On | Blocks |
|------|-----------|--------|
| B1–B4 | A1–A3 | E2, E4, E5 |
| C1–C5 | — | D1, D3, F3 |
| D3 (Gate 2) | C5 | F3 |
| E2–E3 | B2, B4 | F4 |
| F1–F4 | Phase 7–10 | Phase 12, 13 |
| H1–H4 | F4 (live data) | content self-correction |

## Progress Tracking

| Phase | Status | Completed | Total | Last Updated |
|-------|--------|-----------|-------|--------------|
| Phase 7 | IN PROGRESS | 12 | 12 (code done; DB-apply pending) | 2026-06-20 |
| Phase 8 | IN PROGRESS | 3 | 6 | 2026-06-20 |
| Phase 11 | IN PROGRESS | 2 | 4 | 2026-06-20 |
| Phase 9 | IN PROGRESS | 5 | 7 | 2026-06-20 |
| Phase 10 | IN PROGRESS | 4 | 6 | 2026-06-20 |
| Phase 11 | NOT STARTED | 0 | 4 | — |
| Phase 12 | NOT STARTED | 0 | 3 | — |
| Phase 13 | NOT STARTED | 0 | 4 | — |
| Phase 14 | NOT STARTED | 0 | 2 | — |
| Phase 15 | NOT STARTED | 0 | 4 | — |
| Cross-cutting | NOT STARTED | 0 | 5 | — |

## Key Files

| File / Path | Role |
|-------------|------|
| `supabase/migrations/` | Schema; new graph tables land here (0008+) |
| `src/lib/types.ts` | Domain types |
| `src/lib/scoring/` | Pure scoring fns (skill-estimate, adaptive, retrieval, …) |
| `src/lib/ai/` | AI provider + generation pipeline + Zod schemas |
| `src/lib/content/` | Content reference data + micro-lessons |
| `src/lib/graph/` | (new) graph traversal service |
| `src/lib/linguistic/` | (new) deterministic French engine |

## Changelog

- 2026-06-20: Roadmap created. Strategic pivot to graph-based French mastery platform; Phases 7–15 + cross-cutting defined. Starting Phase 7.
