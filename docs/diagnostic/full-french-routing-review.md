# Full French diagnostic routing audit

2026-09-11. The approved French graph is unchanged. No content approvals or release.

Current local rerun: 10/10 depth checks and 4/8 mixed-profile discrimination checks pass after form-category revisits and challenge-based branch entry; the strict benchmark still exits 1. Before those changes, including after the skip correction, the counts were 8/10 and 2/8. The report below records earlier changes; use the current JSON report for unresolved contrasts. See `form-revisit-depth-2026-09-11.md` and `branch-entry-order-2026-09-11.md`. These new scheduling changes are not deployed or calibrated against students.

The previous benchmark exercises six conjugation targets. The additional
`scripts/benchmark-full-french-diagnostic.mts` exercises all 542 proposed targets
compiled from the approved graph, using real pool allocation and session
transitions. It runs 13 profiles in 16 deterministic/seeded sessions, including
verb-specific tense boundaries, regular/irregular contrasts, reading inference
and reference gaps, COD/COI, lexical/grammatical spelling contrasts, recognition
versus production, guessing, skipping and incomplete material history.

## Original finding

Before the branch-visit correction, the selector gave too little depth before moving between branches. With every
answer correct, the 35-minute simulation answers 61 questions over 42 targets.
Only five targets reach even their minimum item count:

| Strand | Questions answered | Targets sampled | Targets reaching minimum item count |
| --- | ---: | ---: | ---: |
| Conjugation | 18 | 18 | 0 |
| Short-passage reading | 9 | 9 | 0 |
| Grammar | 17 | 7 | 3 |
| Grammatical spelling | 9 | 5 | 0 |
| Lexical spelling | 8 | 3 | 2 |

With every answer incorrect, 48 targets are sampled and none reaches its minimum
item count. These are insufficient results for the requested depth. They must
not be represented as passing pedagogical validation because runtime assertions
pass. Multiple-occasion requirements separately explain why no final mastery is
confirmed during one sitting; lowering those requirements would not repair the
sampling problem.

Another issue to review: prerequisite depth is used as challenge order, and equal
depth ties use item identity. The simulated first form-production question for
many verbs is the conditional. Graph depth alone does not establish an appropriate
starting tense or pedagogical progression.

## Implemented correction and remaining work

The selector now allows six questions per branch visit before rotating to another
branch, while balancing domain and strand time on every question. A resolved or
exhausted branch gives way earlier. Skips consume the visit allowance, so skipping
cannot trap a student. Six is an initial routing parameter to calibrate, not an
approved pedagogical threshold or a reduction in evidence requirements.

At the easiest available difficulty, an incorrect answer now prompts a fresh
question about the same target when no easier target remains. Previously, this
case could drift to another target at the same level before confirming a gap.
Easier prerequisites and harder follow-up remain available through normal routing.

The same 35-minute sessions now produce:

| Profile | Targets sampled before → after | Minimum item count reached before → after | Sufficient evidence within this occasion after |
| --- | ---: | ---: | ---: |
| All correct | 42 → 21 | 5 → 14 | 12 |
| All incorrect | 48 → 25 | 0 → 15 | 15 |

All five strands now have at least one target with sufficient within-occasion
evidence in both extremes. The ten depth checks pass. The report distinguishes
minimum item counts from actual within-occasion sufficiency, including context,
guessing, features and other evidence requirements. Official results still require
the approved number of occasions and remain provisional after the initial sitting.

This trades breadth for usable evidence and does not yet satisfy comprehensive
profile discrimination. Passing one target per strand is insufficient for the
full release.

## Conjugation family coverage correction

Conjugation time is now balanced between general concepts/constructions, regular
and spelling patterns, and individual verbs. The selector uses existing compiled,
release-pinned branch identities; there are no new graph nodes or shared mastery
records. Other domains and strands retain their time allocation. Branch visits
continue within each family, and unavailable families do not prevent progress.

The full-graph benchmark independently checks family coverage against the facet
catalogue. All sixteen sessions answer questions in each conjugation family.
The regular-versus-irregular profile now establishes sufficient within-occasion
evidence for known regular-er forms and weak aller forms, as separate target
records. It previously reached no
weak verb target. The ten strand depth checks still pass, with 12/15 sufficient
targets in the deterministic extremes and unchanged 35-minute timing.

This does not resolve tense challenge order or establish boundaries for every
verb. The separate verb-specific-frontiers profile still reaches only aller,
whose sampled forms it knows; its other verb gaps remain untested and unknown.
Form probing now has a separately versioned draft challenge order; the current
simulation starts with present forms and then near future. See
`conjugation-probing-order-review.md`. The v2 draft extends those ranks to tense
recognition and interpretation, with separate evidence targets; the all-correct
general follow-up now reaches near-future interpretation. The proposed ranks still
need review; hard-prerequisite depth alone is not a
complete difficulty scale. The approved graph already includes a soft
future-to-conditional relationship, explicitly not an obligatory mastery rule.
Such relationships may guide probing without becoming hard learning gates.

## What passed, and what this does not prove

All 16 runs stop at 2,100 active seconds, exclude a three-hour pause, sample all
five strands, preserve reserved follow-up questions, avoid duplicate question
evidence and leave untested targets unknown. Deterministic answers move counted
evidence in the expected direction. Missing material-history proof cannot count
as verified novelty. These checks use trusted simulated timestamps and grades,
not authenticated HTTP or real student responses.

The bank is symbolic and nonpublishable. Unique artificial words, support spans,
features and contexts are assumed valid solely to isolate routing from content
shortages. This explicitly does not solve the real homophone novelty conflict,
approve draft refinements, validate a writing evaluator, or establish calibration.
Fixed question times and guessing rates remain simulation assumptions.

## Reproduce

Generate: `npx tsx scripts/benchmark-full-french-diagnostic.mts`

Verify stored report: `npx tsx scripts/benchmark-full-french-diagnostic.mts --check`

Enforce the minimum depth gate:
`npx tsx scripts/benchmark-full-french-diagnostic.mts --check --require-depth`

The depth gate now **passes ten of ten checks**. It requires at least one
target per strand to have sufficient within-occasion evidence in each deterministic extreme.
That is a necessary lower bound, not a sufficient release or mastery criterion.
The structured report is `full-french-routing-report.json` and retains each sampled
target, expected profile truth, response count, counted evidence and probability.

## Mixed-profile discrimination gate

The benchmark now records eight explicit within-domain contrast checks. Passing
requires sufficient within-occasion evidence on both a known and a weak target
inside the declared contrast. Merely visiting a target, or establishing a strong
skill in another domain, cannot pass. The verb-specific frontier profile further
requires a known and a weak tense within the same verb branch. Each report row
retains unresolved expected targets, even when this minimum contrast passes.

| Profile | Result | Known / weak targets with sufficient evidence |
| --- | --- | --- |
| Regular versus irregular verbs | Pass | 2 / 2 |
| Verb-specific tense frontiers | Fail | 2 / 0 |
| Literal reading versus inference | Fail | 1 / 0 |
| Reading reference gaps | Fail | 1 / 0 |
| COD versus COI | Fail | 0 / 1 |
| Lexical spelling strong, agreement weak | Pass | 1 / 2 |
| Agreement strong, lexical spelling weak | Pass | 1 / 1 |
| Conjugation recognition versus production | Pass | 1 / 4 |

Run `npx tsx scripts/benchmark-full-french-diagnostic.mts --check --require-depth --require-discrimination`.
It currently exits nonzero because four contrast checks fail. The ten depth
checks and all runtime invariants still pass, but cannot establish the requested
granularity. Even eight passing contrasts would be a necessary lower bound,
not proof of complete profile discrimination, real item validity or calibration.
The next routing work should address the four missed contrasts without granting
mastery to unsampled targets or weakening the evidence rules to make the test pass.

## Cross-branch prerequisite step-down

The selector now follows an available direct prerequisite in another branch of
the selected family after an incorrect / Je ne sais pas response. Previously,
branch confinement could keep repeating an advanced skill while its actual
prerequisite was available elsewhere. Domain, strand and family time balance
remain prior constraints, reserved learning questions remain excluded, and the
prerequisite stays unknown until it receives evidence.

The sixteen runtime simulations and ten depth checks still pass. Current
all-correct/all-incorrect sufficient-target counts are 12/11; the earlier 12/15
figures above describe the previous routing version. Four of eight contrast checks
still fail. This is an initial improvement in using graph edges, not a claim that
all profile boundaries are now located within the first sitting.
