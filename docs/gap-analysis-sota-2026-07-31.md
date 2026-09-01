# SigmaWrite vs. State of the Art — Gap Analysis (2026-07-31)

Scope: comparison of the current codebase (develop @ 2d2e485) against 2025–2026 SOTA for
(a) one-to-one tutoring and French L2 pedagogy (grammar, verb tenses, vocabulary, reading
comprehension), (b) knowledge-graph mastery systems (Math Academy, ALEKS), (c) spaced
repetition / learner modeling / adaptive assessment. Research sources are cited at the end.

---

## 1. Executive summary

**The architecture is genuinely close to SOTA; the product is starved of content and missing
the "tutor" and the "scheduler."** SigmaWrite has already built things most language apps never
do: a versioned 161-node competency DAG with six edge types (including `encompasses` and
misconception edges), per-evidence-channel mastery (receptive / controlled / independent
production), a KST + BKT adaptive diagnostic with max-information-gain probe selection and
bidirectional graph inference, LLM item generation behind deterministic verification, and a
serious psychometric monitoring layer. Nobody has shipped "Math Academy for languages" — the
research agents confirmed the field is open — and this codebase is a credible skeleton for it.

But the skeleton has three systemic problems:

1. **Content famine.** Only 15 of 696 diagnostic-bank items are eligible; all four diagnostic
   sections report `ready: false`; taxonomy v2 and the bank are unpublished, so the flagship
   diagnostic fails closed. 60 reading passages sit in `needs_human_review`. Five of ten
   strands (including **lexique** — vocabulary!) have zero nodes. The best adaptive engine in
   the world cannot run on 15 items.
2. **No memory model.** `decay_rate` exists in the schema but has zero readers/writers. Mastery
   is effectively permanent; the live SRS is a simplified SM-2 with keyword auto-grading, while
   a richer graph-aware scheduler (0042) sits dead. Nothing exploits the `encompasses` edges at
   runtime — the single most valuable Math Academy idea (FIRe / repetition compression) is
   schema-only.
3. **No tutor, no session scheduler.** Practice feedback is binary + a static string: no hint
   ladder, no scaffolding-fading, no prompt-first metalinguistic feedback, no worked examples,
   no corrective loop on failure. And there is no unified "what should this student do for the
   next 20 minutes" engine — no review/new mixing, no interleaving, no repetition compression.

The evidence says these are exactly the levers that matter: step-level interaction is where
tutoring's d ≈ 0.76 comes from (VanLehn 2011); prompts/metalinguistic feedback beat recasts for
retention (Lyster & Saito 2010, Li 2010); the mastery + corrective loop is the replicated core
of Bloom's result (+0.4–0.76 SD, Kulik 1990); and spaced retrieval is the engine of durable
learning (Cepeda 2006).

---

## 2. What we already have that matches or exceeds SOTA

| Area | What we have | SOTA reference | Verdict |
|---|---|---|---|
| Knowledge graph design | 161-node DAG, atomicity levels 1–5, 6 edge types incl. `prerequisite` + `encompasses` + `misconception_related` + `contrastive_transfer`, versioned immutable releases with checksums (`0008`, `0036`, `src/lib/graph/types.ts`) | Math Academy's two-graph model (prerequisite + weighted encompassing); ALEKS knowledge states | **At SOTA in schema** — ahead of every shipped language app. `contrastive_transfer` (L1 interference) has no equivalent even in Math Academy. |
| Evidence-channel mastery | Per-node evidence defs: receptive / controlled_production / independent_production × modality × min items/occasions/accuracy; conjunctive node classification; compat score capped at 0.84 until coverage confirmed (`0064`) | No production system does this; closest is ALEKS "conditionally known" | **Beyond SOTA** — this is the repo's most distinctive construct and it directly encodes the SLA receptive-vs-productive distinction. |
| Adaptive diagnostic | 4 sections, 32–80 probes; selection = uncertainty × (1+ln(1+|prereqs|)), descend-on-failure, anchor nodes, evidence-coverage targeting; KST inference down prerequisites on success / re-open on failure; stopping on coverage + uncertainty + info-gain; idempotent, atomic, release-pinned (`engine.ts`, `protocol.ts`, `0064`) | Math Academy: minimal covering set + max expected info gain, ~20–35 questions; ALEKS 20–25 | **Near SOTA design.** Longer than MA (32–80 vs 20–35); latency is stored but unused as evidence-strength modulation (MA uses timing). |
| Mastery model | BKT (T=.15, S=.10, G=.20, guess=1/n), weighted updates for noisy evidence, 0.85 threshold, anti-inflation guards (inferred priors reset, unconfirmed capped at threshold−0.01) | BKT with G<0.3/S<0.1 constraints, mastery ≥ 0.85–0.95 — the recommended small-team model | **At SOTA** for the update rule; missing forgetting (see gaps). |
| Comfort zone / ZPD | Reading loop targets 80–85% success (`SUCCESS_ZONE`), one-step band moves, foundation-repair branch <70%; graph loop gates new nodes on mastered prerequisites (`readyToLearn` = ALEKS outer fringe) | 85% rule (Wilson et al. 2019); ALEKS outer fringe as computational ZPD; practice at 80–85%, assessment at ~50% | **Concept present** in both loops; not yet enforced in graph *practice* item selection (fixed easy→hard ramp). |
| LLM discipline | Gate 0 deterministic conjugation recompute overrides the LLM; answer-key self-consistency; independent judge model ≥0.7; misconception keys whitelist; prompt-injection and safety filters before persistence; versioned prompts in DB | "Ground truth via deterministic engine + curated rules; LLM never owns morphology facts" — the #1 documented LLM-tutor pitfall mitigation | **At SOTA.** The item-generation prompts are genuinely rigorous. |
| Assessment-first + mastery gating | Hard server-side gate until diagnostic complete (`0069`); path steps unlock only at prerequisite mastery ≥ 0.85 (`0062`) | Bloom LFM: mastery criterion before advancement | **At SOTA** for gating; missing the corrective half of the loop (see gaps). |
| Psychometrics | p-value, point-biserial, distractor analysis, edge predictive-lift, diagnostic calibration vs later performance, success-zone drift monitors — all propose-with-review, never auto-apply | "Instrument to measure actual retention, not engagement" | **Beyond typical** — most startups never build this. |
| Item QC + human review portal | 6-gate pipeline, review portal, provisional-serving caps + kill switch (built) | Hybrid authoring: machine proposes, expert disposes | At SOTA in design; bottlenecked in operation (§3.1). |

Also solid and worth keeping as-is: safety/moderation layer, LLM budgets and rate limits,
parent proof layer, teacher intervention groups, offline queue, accessibility toggles.

---

## 3. Gap analysis

Legend: 🔴 missing · 🟡 partial · severity P0 (blocks the product thesis) / P1 (large learning-outcome lever) / P2 (polish / later).

### 3.1 🔴 P0 — Content famine: the engine has nothing to run on

**Have:** 696 generated items but only **15 eligible (5 nodes, all conjugation)**; sections
ready 0/4. Taxonomy v2 (161 nodes) and diagnostic bank both `pending` publication. 60 pilot
passages all `needs_human_review`. 2 seed texts live. 3 micro-lessons. 6 LanguageTool→node
error mappings. 488 legacy items across 61 nodes actually live.

**SOTA:** Math Academy's moat is ~10× textbook granularity of *authored content* (thousands of
topics × 3 knowledge points × worked examples + item variants). ALEKS = 400–500 problem types
per course. The research is unanimous that graph + content authoring is where a small team's
leverage is — not model sophistication.

**Gap:** the binding constraint is a human-review sprint, not code. Every downstream feature
(diagnostic v2, learning path, practice) fails closed without it. Secondary cause: only
`exact|regex|conjugator` validators are live, so only conjugation auto-approves —
reading/grammar/spelling items all queue for humans. Extending the deterministic conjugation
engine beyond 3 tenses (présent, imparfait, passé composé) and wiring the
`agreement`/`grammalecte` validators would raise the auto-approve rate directly.

### 3.2 🔴 P0 — No forgetting model; mastery is permanent

**Have:** `decay_rate` column with zero readers/writers; `forgettingRateProposal()` computed
but never applied; only time mechanism is the 60-day re-entry staleness trigger.

**SOTA:** FSRS-6 (difficulty/stability/retrievability, power-law forgetting) is the open
standard — beats SM-2 for ~99.6% of users at 20–30% fewer reviews; Math Academy decays
`memory` exponentially with half-life = interval; Duolingo HLR models per-word half-life.
Recommended stitch: P(known) decays over time driven by the FSRS stability estimate.

**Gap:** a student who mastered `passe_compose_avoir` in March still shows 0.9+ in July.
This silently corrupts the frontier, the learning path, and every parent/teacher report.

### 3.3 🔴 P0 — Spaced repetition split-brain; `encompasses` edges unused at runtime

**Have:** live SRS = simplified SM-2 ladder [1,3,7,21,45] with keyword-coverage auto-grading
(`retrieval.ts`); a strictly better graph-aware scheduler (recognition/production modes,
overdue boost, indirect retrieval requests) fully built and tested in
`src/lib/retrieval/graph-scheduler.ts` + `0042` with **zero production callers**. `encompasses`
edges exist in schema but nothing propagates credit through them.

**SOTA:** FSRS-6 as scheduler core (MIT-licensed ts-fsrs), desired retention ≈ 0.90; schedule
*skills*, not flashcards, grading reviews from evidence inside exercises (HLR pattern); FIRe
fractional implicit repetition — practicing passé composé in a sentence implicitly refreshes
avoir conjugation, participle formation, word order — with repetition compression choosing the
task that knocks out the most due reviews. Language is *more* encompassing-dense than math, so
compression is worth more here.

**Gap:** three-way: (a) SM-2 instead of FSRS; (b) two competing schedulers, the better one
dead; (c) no implicit credit flow, so every node will eventually demand explicit review — the
exact review-avalanche FIRe exists to prevent. Keyword-coverage grading of free recall is also
a weak signal (false "forgot" on paraphrase).

### 3.4 🔴 P0 — No unified session scheduler ("what do I do for the next 20 minutes?")

**Have:** path generated **once** at diagnostic finalization (topological sort + stage tags —
good), then: home shows first 3 available steps + 1 recommended text + due memory cards;
student chooses. No daily plan, no review/new mixing, no interleaving policy, no session
budget, no repetition compression, no new-learning floor.

**SOTA:** the Math Academy loop — decay memories → collect due reviews → pick tasks whose
encompassing closure clears the most reviews → explicit reviews for the rest → frontier new
lessons (≥~25% of time) with similar topics spaced apart (interference management) and
difficulty targeted at ~80% success. Interleaving confusable grammar contrasts (PC vs
imparfait!) is one of the strongest effects in the literature and needs a scheduler to exist.

**Gap:** SigmaWrite currently has a *map* (the path) but no *itinerary*. This is the single
biggest product-experience difference vs Math Academy.

### 3.5 🔴 P0 — Vocabulary tier absent (lexique = 0 nodes, page = ComingSoon stub)

**Have:** 268-lemma baseline lexicon (coverage artifact), `student_word_mastery` table,
`/student/vocabulary` stub. No vocab curriculum, no per-word SRS, no frequency sequencing.

**SOTA:** two-tier architecture — small grammar DAG + **large flat vocab store under item-level
FSRS/HLR**, frequency-sequenced (top 2,000 word families ≈ 80–90% coverage; 95%/98% lexical
coverage thresholds for comprehension; Lexique.org frequencies for French). Learner
vocabulary-size model drives text matching; tap-to-gloss feeds the SRS queue; incidental
encounters in reading count as reviews; track gender, collocations, faux amis.

**Gap:** for a *reading-comprehension* product this is the most consequential absence: without
a learner vocab model you cannot compute known-word coverage, so "i+1" text calibration is
vibes (band heuristics) instead of the measurable 95–98% rule. The graph strand should stay
empty — vocab doesn't belong in the DAG — but the flat tier needs to exist.

### 3.6 🟡 P1 — No tutoring layer: feedback is binary, no hints, no scaffolding-fading

**Have:** correct/incorrect + static `feedback_fr` (per-choice misconception feedback for MCQ —
good start); validator `reason` for free text; no hints (`hints_used` column is always unused),
no worked examples, no retry-with-scaffold, no dialogue. `rubric`/`llm_assisted` validators
unimplemented.

**SOTA:** step-granularity interaction is *the* active ingredient (VanLehn d=0.76 ≈ human).
Feedback hierarchy: prompt → metalinguistic clue → explicit correction → answer last; prompts
beat recasts (Lyster & Saito d≈0.74); the Harvard GPT-tutor RCT (2× learning) got its gains
from pedagogy-constrained prompting (incremental hints, never reveal answers). Scaffold levels
attached to exercise templates (worked example → cloze-with-hints → free production), faded as
mastery/stability crosses thresholds, re-added on repeated failure.

**Gap:** SigmaWrite has all the raw materials (misconception tags, error-node mappings, rule
descriptions, an LLM provider layer, safety rails) but no hint ladder and no scaffold state.
This is the highest-effect-size pedagogy gap and it's well-scoped: a constrained
metalinguistic-hint generator + 2-level scaffold per item family.

### 3.7 🟡 P1 — Corrective loop incomplete

**Have:** mastery gate exists; on failure the student just sees item feedback and continues the
ramp. 3 micro-lessons for 4 declared repair skills. Continuous embedded quizzes
(`quiz/continuous.ts` + `0043`, with persistent-gap → smallest-remediation insertion) fully
built, **dead**.

**SOTA:** Bloom's replicated core = formative check → mandatory corrective instruction →
re-test. Math Academy: halt lesson → interleave unrelated work → retry → graph-guided
prerequisite remediation; missed quiz item → immediate targeted review; four remediation
flavors; topic-splitting when failures persist despite mastered prerequisites.

**Gap:** wire the continuous quizzes, add a practice-failure protocol (2nd failure on a node →
serve its weakest direct prerequisite via `catchUpPath`), and author micro-lessons per strand
family rather than per skill.

### 3.8 🟡 P1 — Graph practice difficulty is not adaptive; no live item/learner calibration

**Have:** practice serves ≤8 approved items ordered by static `difficulty` ascending; session
ends at mastery ≥0.85 or 8 items. Post-hoc psychometrics exist but no live ratings. Reading
loop has the band rule, graph loop has nothing.

**SOTA:** Elo/1PL online ratings for learners + items (~50 LOC, cold-start friendly) selecting
items at ~80–85% predicted success for practice, ~50% for checks; randomesque selection; Math
Academy quizzes re-target around the 80% line. Diagnostic already ranks by
|difficulty − mastery×100| — the same idea just needs to reach practice.

### 3.9 🟡 P1 — Verb-tense pedagogy gaps despite conjugaison being the biggest strand

**Have:** 48 conjugaison nodes; deterministic engine for **3 tenses only** (présent, imparfait,
passé composé); PC-vs-imparfait contrast nodes and `contrast-analysis`/`tense-recognition`
item families exist. No audio anywhere (except read-aloud); no timed retrieval.

**SOTA for French:** frequency-first verb sequencing (être/avoir ≈ 25% of forms; top-10
irregulars as whole-form retrieval, -er regulars as generative patterns by stem family);
**spoken vs written paradigm split** (4–5 of 6 -er present forms are homophones — needs audio
production/dictation); PC/imparfait taught as discourse function via structured-input minimal
pairs, deliberately practicing aspect-atypical pairings ("j'ai été", "je courais quand…");
timed micro-retrieval for procedural fluency; error diagnosis distinguishing wrong-auxiliary /
wrong-participle / agreement / wrong-stem / wrong-aspect, each with its own remediation.

**Gap:** extend the conjugation engine (futur, conditionnel, subjonctif présent, impératif,
plus-que-parfait — mostly mechanical given the existing engine) to unlock auto-validation of
most of the strand; add dictée/audio item modality (schema already has it); split conjugation
errors into the five diagnostic categories (currently just incorrect).

### 3.10 🟡 P1 — Reading loop not coverage-calibrated; strategy instruction thin

**Have:** interest-driven text recommendation by band; deterministic 6-dimension text
difficulty scorer; 80–85% zone on comprehension questions; summary + one revision;
9 embedded diagnostic passages. No learner-vocab coverage matching, no tap-to-gloss, no
reading-while-listening, no extensive-reading volume tracking; strategy micro-lessons: 3.

**SOTA:** text–learner matching by known-word coverage ≥95% (target 98%); glosses feed SRS;
reading-while-listening; explicit multi-strategy instruction (predict/question/monitor/
summarize, g ≈ 0.8–0.9 — the biggest effect size in the whole review); ER mode with light
checks, separate from intensive mode. Depends on 3.5 (vocab model) for the coverage half.

### 3.11 🟡 P2 — Motivation layer minimal

**Have:** private daily streak only. Deliberate design choice per `0028` comments.

**SOTA:** Math Academy's effort-normalized XP (1 XP ≈ 1 min, performance-scaled, decoupled from
mastery) drives pacing + completion-date forecasts; fringe-based reporting ("ready to learn" /
"least secure"); effort attributions and error normalization in feedback copy. Not urgent, but
completion forecasts ("at 20 min/day you finish the 6e catch-up by November") are a cheap,
honest motivator the graph already supports.

### 3.12 🟡 P2 — Diagnostic refinements

32–80 probes vs SOTA 20–35 (per-section minimums are conservative; graph compression to a
minimal covering set would shorten runs); `latency_ms` captured but unused as evidence-strength
modulation (slow-correct ≈ weaker mastery evidence — Math Academy uses this); no
timing-based flag for guessing.

### 3.13 🟡 P2 — Oral strands (compréhension/production orale) empty

Empty strands are honest (no fake nodes), but for FSL learners the spoken-paradigm issue (3.9)
means some audio support arrives before "listening" as a strand does. SpeechSynthesis is
already integrated; STT/speaking is a genuinely later phase.

### 3.14 ⚠️ Structural — ~17 migrations (0041–0057) of dead infrastructure

Learning packages, graph scheduler, continuous quizzes, provisional serving, the entire
on-demand generation workflow: built, tested, unwired. Each is *good* design aligned with this
report's recommendations — the risk is drift (two SRS systems already disagree). Decision
needed per module: wire it (scheduler, quizzes, provisional serving are all needed above) or
delete it. Also: README "Deferred by design" section is stale; `gap-analysis.md` (2026-07-09)
predates this report.

---

## 4. Priority roadmap

**Phase 1 — Unblock (content, not code)**
1. Human-review sprint: approve diagnostic bank v2 + taxonomy v2 + the 60 pilot passages
   (publish releases; all four sections must reach `ready`).
2. Extend `conjugation.ts` to futur / conditionnel / subjonctif présent / impératif /
   plus-que-parfait → re-run Gate 0 over the bank to raise the 15-item eligible count.
3. Wire `agreement` validation (LanguageTool is already integrated for writing).

**Phase 2 — Memory + scheduler (the Math Academy core)**
4. Replace SM-2 with FSRS-6 (`ts-fsrs`), desired retention 0.90; one scheduler, scheduling
   competency nodes; delete or absorb the dead 0042 scheduler (keep its
   recognition/production split and indirect-retrieval concept).
5. Drive `decay` of P(known) from FSRS stability; frontier and reports read the decayed value.
6. Author sparse weights on existing `encompasses` edges (conjugaison + orthographe first);
   implement FIRe credit propagation + repetition-compression task selection.
7. Ship the session loop: due reviews → compression tasks → explicit reviews → frontier new
   learning (≥25% floor), with `same_family` edges used to space confusable topics apart.
   Wire continuous quizzes (0043) as the formative layer.

**Phase 3 — Tutor + adaptivity**
8. Hint ladder in the practice player: attempt → metalinguistic prompt (LLM-generated,
   constrained to the node's rule description + misconception list, answer-leakage-tested) →
   explicit correction with rule → worked example. Log `hints_used` into BKT weighting.
9. Scaffold levels per item family with fading on mastery/stability thresholds.
10. Elo item/learner ratings; practice targets 80–85% predicted success.
11. Failure protocol: 2nd miss → prerequisite remediation via `catchUpPath` + micro-lesson.

**Phase 4 — Vocabulary + reading calibration**
12. Flat vocab tier: Lexique.org frequency-ranked lemma list, per-item FSRS, tap-to-gloss in
    reading feeding the queue, incidental encounters logged as fractional reviews.
13. Learner vocab-size model → known-word coverage computation → recommend texts at 95–98%
    coverage (replaces band-only matching).
14. Reading-while-listening; strategy micro-lesson set (predict/question/monitor/summarize).

**Phase 5 — Polish**
15. Diagnostic: latency-weighted evidence, minimal covering set to shorten runs.
16. Completion forecasts + fringe-based progress reporting; audio/dictée items for the
    spoken-paradigm problem; then oral strands.

---

## 5. Key research references

- VanLehn (2011), step-based ITS ≈ human tutoring (d=0.76) — tandfonline.com/doi/abs/10.1080/00461520.2011.611369
- Nickow, Oreopoulos & Quan (2020), tutoring RCT meta-analysis (~0.37 SD)
- Norris & Ortega (2000); Spada & Tomita (2010) — explicit > implicit grammar instruction
- Li (2010); Lyster & Saito (2010); Russell & Spada (2006) — corrective feedback; prompts > recasts
- VanPatten — Input Processing / Processing Instruction (structured input for tense-aspect)
- Hu & Nation (2000); Nation (2006); Kremmel et al. (2023) — 95/98% lexical coverage thresholds
- Webb, Yanagisawa & Uchihara (2020) — intentional vocabulary learning meta-analysis
- Nakanishi (2015); Yapp et al. (2021) — extensive reading; strategy instruction (g≈0.8–0.9)
- Wilson, Shenhav, Straccia & Cohen (2019) — the 85% rule — nature.com/articles/s41467-019-12552-4
- Math Academy — "How Our AI Works" (mathacademy.com/how-our-ai-works); Skycak, "The Math
  Academy Way" + "Individualized Spaced Repetition in Hierarchical Knowledge Structures" (FIRe)
- Doignon & Falmagne — Knowledge Space Theory; ALEKS (aleks.com/about_aleks/knowledge_space_theory)
- FSRS-6 — expertium.github.io/Algorithm.html; benchmark: expertium.github.io/Benchmark.html
- Settles & Meeder (ACL 2016) — Duolingo Half-Life Regression; Birdbrain (IEEE Spectrum)
- Pelánek — Elo in adaptive educational systems (fi.muni.cz/~xpelanek/publications/CAE-elo.pdf)
- Pienemann — Teachability Hypothesis (developmental sequences support prerequisite-gated grammar)
- Kestin et al. (2025, Sci. Reports) — pedagogy-constrained GPT tutor, 2× learning gains
