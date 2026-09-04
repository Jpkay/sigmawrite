# Roadmap — engagement, rigor and efficiency for collège students (2026-09-04)

> Scope: written French only (no oral strands). Companion to
> [`docs/implementation-status.md`](./implementation-status.md) (what is true today) and
> [`docs/gap-analysis-sota-2026-07-31.md`](./gap-analysis-sota-2026-07-31.md) (engine design
> and research references). This document lists the product gaps found on 2026-09-04 against
> competitor apps (Projet Voltaire, Lalilo, Kartable, Orthodidacte, Plume-app, Orthophore,
> TACIT, Duolingo, Math Academy, Quill, NoRedInk) and the 2023–2026 learning-science evidence,
> then breaks the response into atomic goals.

## Why this roadmap exists

The engine (competency graph, adaptive diagnostic, FSRS memory with prerequisite credit,
daily scheduler, hint ladder, deterministic conjugation, Elo-targeted practice) is ahead of
every French app surveyed. The student-visible product is not:

| Axis | Today | Competitor bar |
| --- | --- | --- |
| Dictée | none; `item-authoring.ts` notes the audio pipeline is missing | Orthophore, Voltaire, Orthodidacte, Bescherelle; 2025/2026 programmes require several short dictées per week; dictée = 10/100 Brevet points |
| Exercise formats rendered | 2 widgets (MCQ, textarea) in `practice-player.tsx` | click-the-error (Voltaire), sentence combining (Quill), réécriture and justified answer (Brevet, Kartable) |
| Free writing | 1 task type, 50–100 words, 1 revision | Plume-app: genre by grade, process coaching, revision loops |
| Curriculum tags | self-authored grade 4–9 + CEFR, status `provisional` | cycle 3/4 attendus, 6e national evaluation domains, Brevet skills |
| Motivation | one streak counter, XP only from practice | streak freeze, settable daily goal, quests, story arcs, class goals, weekly recap |
| Notifications | cron writes `student_notifications`, no reader | in-app inbox, parent-controlled reminders |
| Reference material | none | Bescherelle tables, rule cards with exceptions |
| Diagnostic length | 4 sections × 8–20 probes = 32–80 | 20–35 (Math Academy); Voltaire's 40-minute test is its top complaint |
| Offline | PWA installs, service worker never serves navigations | usable offline session |

Evidence anchors (see the July report for the full list): prompts beat recasts (Lyster &
Saito, d≈0.7); scaffolding with fading g≈0.78; sentence combining ES 0.35–0.50 for
adolescents; interleaving confusable tenses improves both; autonomy support g≈1.14 (SDT
meta-analysis); streak forgiveness raises retention while leaderboards demotivate low-ranked
adolescents; Cnesco/Repères: dictée teaches only when the learner verbalises the
justification; Catach's error grille is the Éduscol reference.

Rules for every goal below: student free text always passes `moderateOrReject`; no open AI
chat; AI never owns morphology or rule facts (rules come from the vetted node/lesson base);
mastery evidence stays relational; no public leaderboards for minors; nothing below
fabricates content review or launch acceptance.

Legend: **S** ≤ 1 day · **M** 2–4 days · **L** ≥ 1 week. Each goal is atomic: one PR, one
acceptance test.

---

## Phase 0 — Content unblock (blocks everything; not code)

- [ ] **0.1** Allocate the 8 replacement diagnostic candidates and finish the 465 pending reviews; publish the exact v2 bank checksum. *Accept:* `npm run diagnostic:verify:v2` passes.
- [ ] **0.2** Reach 60 human-approved passages with 3 independent reviews each; lock 6 benchmarks. *Accept:* `npm run launch:audit-content` reports 0 blocking gaps.
- [ ] **0.3** Author repair micro-lessons per strand family (target 12, up from 3 in `src/lib/content/micro-lessons.ts`). *Accept:* every `repair/[skillKey]` reachable from a failure remediation link resolves.

## Phase 1 — Dictée (rigor)

- [x] **1.1** Add `dictee` response type to the item schema and validator (`supabase/migrations`, `src/lib/linguistic/validator.ts`): target text, segment boundaries, allowed variants. **M**. *Accept:* pgTAP contract + Vitest for segment scoring.
- [x] **1.2** Server-side TTS rendering job for dictée audio (provider behind `src/lib/ai`, cached per text version, fails closed without key). **M**. *Accept:* audio asset stored and referenced by `text_version_id`; no browser-only synthesis in the graded path.
- [x] **1.3** Catach-based error classifier for dictée diffs: phonogrammique, morphogrammique grammatical/lexical, logogrammique (homophones), idéogrammique, extragraphique. Map each class to existing orthographe nodes via `error_node_mappings`. **M**. *Accept:* golden test file of 40 learner errors classified correctly.
- [x] **1.4** Dictée flash player (5–10 min): segment replay, accent textarea, per-segment reveal, error profile screen with rule and manipulation. **M**. Done 2026-09-04 (`/student/dictee`); evidence written as `controlled_production`. Playwright journey still to add (see 8.9).
- [x] **1.5** Dictée à choix and dictée à trous variants reusing 1.3 and the existing MCQ/cloze widgets. **S**.
- [x] **1.6** Dictée négociée: after scoring, the student must justify each flagged segment (pick rule + manipulation) before the correction is shown. **M**. *Accept:* justification recorded as evidence; hinted justifications down-weighted in BKT as in `src/lib/practice/scaffolding.ts`.
- [x] **1.7** Brevet-length dictée once per trimester in the scheduler (`src/lib/learning/session-plan.ts`), scored /10. **S**.

## Phase 2 — Exercise formats (rigor + efficiency)

- [x] **2.1** Click-the-error widget (`error_hunt` response type): tap the wrong word in a sentence; feedback names the rule. **M**. *Accept:* renders in `practice-player.tsx`; diagnostic and practice both serve it.
- [x] **2.2** Réécriture widget (`transform` already in schema): rewrite a sentence changing subject, tense or number. **M**. Done 2026-09-04 as the source-plus-textarea widget graded by exact/acceptable answers; conjugation-engine grading of free rewrites and the 20-transform golden set remain open (tracked as 2.8).
- [x] **2.3** Justified-answer widget: answer + choose the rule + perform the manipulation (substitution, encadrement, "qui est-ce qui ?"). **M**. *Accept:* both parts required for unaided credit.
- [x] **2.4** Sentence-combining widget with multiple accepted answers (Quill model), graded by a whitelist of accepted forms + LanguageTool. **M**.
- [x] **2.5** Ordering widget (schema type exists, no UI): reorder words/clauses; keyboard and touch accessible. **S**.
- [ ] **2.6** Bank generation prompts and QA gates for each new type in `src/lib/generation`, with the deterministic validators as Gate 0. **M**. *Accept:* ≥40 approved items per new type before it enters the scheduler mix. 2026-09-04: 23 hand-authored items in `generated/exercise-format-items-v1.json` (needs_human_review) seed the formats; prompts not written.
- [ ] **2.8** Conjugation-engine grading of free réécriture answers (recompute expected forms from the source sentence) with a 20-transform golden set. **M**.
- [ ] **2.7** Response-type interleaving in `session-plan.ts` includes the new types and deliberately pairs confusable contrasts (PC/imparfait, futur/conditionnel, a/à, ses/ces) via `same_family` edges. **S**. *Accept:* benchmark scenario in `scripts/run-french-learning-benchmarks.mts`.

## Phase 3 — Reference material (rigor, cheap)

- [x] **3.1** Conjugation table page generated from `src/lib/linguistic/conjugation.ts` for any supported verb, all 11 tenses, with exceptions. **S**. *Accept:* route `/student/reference/verbe/[verb]`, fails closed on `UnsupportedVerbError`.
- [x] **3.2** Rule card per node (rule, exceptions, 2 examples, manipulation) reusing `src/lib/practice/lessons.ts`; reachable from every feedback screen. **S**.
- [x] **3.3** "Voir la règle" affordance inside hints, dictée corrections and writing feedback. **S**.

## Phase 4 — Curriculum alignment (rigor, trust)

- [ ] **4.1** Add `curriculum_mappings` release table: node → cycle 3/4 attendu (BO 17 avril 2025, BO 5 mars 2026), 6e national-evaluation domain, Brevet skill. Versioned and checksummed like the taxonomy. **M**. *Accept:* `taxonomy:verify:v3` includes the mapping; every node has ≥1 attendu.
- [ ] **4.2** Show programme tags to teachers and parents on reports, assignments and the frontier view. **S**.
- [ ] **4.3** Onboarding grade selector uses French labels (CM1…3e) with a Belgian/Quebec equivalence table; keep the numeric level internally. **S**.
- [ ] **4.4** Record the source register entry for the programme documents in `docs/french-source-register.md`. **S**.

## Phase 5 — Writing v2 (rigor + engagement)

- [ ] **5.1** Genre-by-grade production tasks: narration (6e/5e), argumentation (4e/3e), lettre, résumé; length bands per grade replace the fixed 50–100 words in `loadIndependentProductionTask`. **M**.
- [x] **5.2** Multi-revision loop: up to 3 revisions, one priority per pass ("one thing to fix"), diff shown between drafts; remove the single-revision throw in `reviseSummary`. **M**. Done 2026-09-04; each revision records its own writing evidence occasion.
- [ ] **5.3** Rubric LLM feedback for production tasks (extend `src/lib/scoring/summary-ai.ts`): rubric-grounded, specific praise only, rule citations restricted to node IDs from the vetted base, answer-leakage test, clamped to the deterministic score as today. **M**. *Accept:* golden set of 30 essays; no rule text outside the base; kill switch `WRITING_EVALUATION_ENABLED` honoured.
- [x] **5.4** Teacher comment on a student text, visible to the student, moderated and audited. **S**.
- [ ] **5.5** Reading questions with cited justification (select the supporting sentence) and per-question feedback during the session. **M**.
- [ ] **5.6** Printable "mon recueil" of a student's final drafts per trimester (Plume-app book model, via existing print button). **S**.

## Phase 6 — Motivation v1 (engagement, minors-safe)

- [x] **6.1** XP for reading, retrieval, dictée and writing, effort-calibrated (≈1 XP per focused minute, bonus only on unaided mastery), extending the trigger in migration `0088`. **S**.
- [x] **6.2** Settable daily XP goal (10/15/20 min presets) replacing the binary `goal_completed`; render the fetched 7-day `motivation.week` array on the home page. **S**.
- [x] **6.3** Streak freeze: one earned per 7-day streak, auto-applied; no purchase, no wager. **S**. *Accept:* `calculateStreak` unit tests for freeze consumption.
- [x] **6.4** Weekly recap card for the student (Sunday): nodes secured, errors retired, dictée score trend; same data as the parent email. **S**.
- [ ] **6.5** Class cooperative goal (teacher-set, e.g. "500 XP cette semaine"), no individual ranking. **M**. *Accept:* only class aggregate exposed to students; RLS test.
- [ ] **6.6** Ability-banded, opt-in, pseudonymous weekly league within a class (teacher enables; off by default; rank hidden below top 3). **M**. Ship only after 6.5 data shows no drop in low-mastery engagement.
- [ ] **6.7** Story-arc framing for the daily plan: 7-day "chapitre" with a light narrative per interest chosen at onboarding; completion unlocks the next chapter. **L**. Content from the passage pipeline, human-reviewed.
- [x] **6.8** Celebrations: end-of-session confetti (respects reduce-motion), sound off by default, first-mastery badge set (≤12 badges tied to nodes, none to time spent). **S**.

## Phase 7 — Notifications and loops (engagement)

- [x] **7.1** Student in-app inbox reading `student_notifications` (due reviews, teacher comments, weekly recap). **S**.
- [ ] **7.2** Web push (PWA) opt-in, parent-controllable for under-15, capped at 1/day, copy A/B-tested via PostHog. **M**.
- [ ] **7.3** Teacher class dictée challenge: assign a dictée to the class with a due date; class-level results view. **M**.
- [x] **7.4** Parent weekly email includes error types and time on task (Kartable parents' top request). **S**.

## Phase 8 — Efficiency and platform

- [x] **8.1** Shorten the diagnostic: protocol v3 runs 6–12 probes per section (24–48 total) and the server unlock guard accepts v2 and v3 runs. **M**. Done 2026-09-04; benchmark 19/19 unchanged. Latency-weighted evidence and a minimal covering set remain open (tracked as 8.10).
- [ ] **8.10** Use stored probe latency as evidence weight (slow-correct is weaker) and a minimal covering set to cut probes further. **M**.
- [ ] **8.2** Wire `src/lib/quiz/continuous.ts` as the formative layer (quiz after ~7 days on a node; miss → immediate targeted review). **M**. 2026-09-04 note: the module depends on learning packages and the quiz session tables; needs a quiz player and a default policy row before it can be wired.
- [ ] **8.3** Delete or wire each dead module: `graph-scheduler.ts`, `serving/provisional.ts`, `learning/package-progress.ts`, `generation/on-demand-workflow.ts`, `ComingSoon`. One decision per PR. **S** each.
- [x] **8.4** Home page: replace the 5 sequential server actions with one loader. **S**. Done 2026-09-04 as a single `loadStudentHome` action with per-part degradation; the page stays a client component.
- [ ] **8.5** Service worker serves cached navigations for the prefetched plan URLs and replays the offline queue; remove the dead `plume-offline-pack-v1` prefetch if 8.5 is not taken. **M**. *Accept:* offline Playwright run completes one practice session.
- [x] **8.6** Accent helper on single-line inputs (vocabulary recall uses a plain input). **S**.
- [x] **8.7** Mobile bottom tab bar for the five student surfaces; maskable 192/512 PNG icons in `manifest.ts`. **S**.
- [ ] **8.9** Playwright journey for the dictée flow (start → transcribe → justify → result) against the seeded local stack. **S**.
- [ ] **8.8** Dyslexia options: OpenDyslexic or Luciole font, syllable colouring in the reader, TTS word highlighting. **M**.

## Phase 9 — Compliance for AI feedback (must land before 5.3 reaches general availability)

- [ ] **9.1** DPIA covering LLM writing feedback for minors; EU hosting or documented transfer basis; no demographic cues in prompts. **M** (legal + engineering).
- [ ] **9.2** Human-oversight path: teacher can see and override any AI rubric score; logs retained per `docs/observability.md`. **S**.

---

## Sequencing

Phase 0 gates everything. Then run in parallel: Phase 1 + 3 (rigor, mostly deterministic),
Phase 6 + 7 (engagement, small items), Phase 8.3/8.4 (hygiene). Phase 2 follows Phase 1 because
the dictée classifier feeds error-hunt feedback. Phase 5 follows Phase 9.1. Phase 4 can start
any time; it is authoring work.

## Success measures (report from PostHog/DB, not prose)

- D7 and D30 student return rate; sessions per week; median session length 10–15 min.
- Unaided mastery gains per node per hour of practice.
- Dictée error rate by Catach class over 8 weeks.
- Share of practice time in production formats (dictée, réécriture, writing) ≥ 40%.
- Teacher dashboard weekly active rate after week 10 of the school year.
