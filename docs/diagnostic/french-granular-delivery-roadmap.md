# French granular diagnostic delivery roadmap

Updated 2026-09-12. French only; Allotey is excluded. This document distinguishes the public release, the frozen release candidate and the unpublished working draft. Full completion still requires all six milestones below.

## Current delivery state

- Public bank release: **french-granular-diagnostic-v34-writing**, revision 34, serving 334 of 542 targets with 6,266 in-scope questions. Human review remains in progress.
- Public application source: `f3f9669`, deployment `dpl_GNbTNX9GB5uMno4KhhPSvbNA7HJK`. Activity lookup now uses indexed question IDs; candidate/public rendered output matched and the public lesson smoke passed. See `activity-index-public-rollout-2026-09-12.json`. Promoted, canonical alias inspected Ready, public lesson-list recording and demo smoke checks passed. See `revision-34-public-rollout-2026-09-12.json`. The complete technical journey covered 59 diagnostic answers in 34m54s, then six guided exercises, one independent check and answer review. This is not classroom calibration.
- Candidate verification included one real reading reformulation and its optional grammar tip, matched exactly to saved delivery records. On the public site, the demo retains 11 accessible lessons and 48 reviewed answers, including 17 incorrect answers. This smoke check is not a new full diagnostic or full lesson test.
- Reading, results, writing feedback and practice correction delivery recording have been expanded. Complete exposure-history certification remains disabled: alternate content sources, audio, historical baselines and concurrent presentation still require work. Recording delivered material does not prove attention or mastery.
- The current generated backlog accounts for all 542 targets: 336 prepared scoped pathways in the unpublished revision 35 draft, 187 requiring question-pool completion, 12 requiring exact-target lessons, two requiring prerequisite-scope resolution, and five independent-writing targets outside scope. A backlog category identifies the next obstacle; it does not establish that every later obstacle is solved.
- Human content review and educational calibration remain pending and run in parallel under the owner's release authorization. Existing synthetic benchmarks must not be presented as classroom evidence.

The published revision 34 candidate adds pouvoir passé récent and savoir imperative production, each with six guided exercises and twelve checks. It also prepares 24 imperative-meaning situations and eight guided exercises, but that meaning target and contextual imperative writing remain excluded because the devoir production prerequisite is unsupported. The candidate also adds a vouloir lesson with eight guided exercises and eighteen context-specific checks. It also adds separate passé simple lessons for être, avoir, aller and faire, with 24 guided exercises and 48 checks. Current candidate totals are 334 scoped targets, 6,266 in-scope questions and 7,668 bank items. See `passe-recent-pouvoir-draft-2026-09-12.md`, `imperative-meaning-draft-2026-09-12.md` and `imperative-savoir-draft-2026-09-12.md` and `vouloir-imperative-content-2026-09-12.md` and `passe-simple-verbs-draft-2026-09-12.md` for the successive changes and their verification limits. Production is revision 34.

### Next content expansion

The 12 targets with question pools but no exact-target lesson are three passé récent verb targets (vouloir, savoir, devoir), one imperative verb target (devoir), and eight passé simple verb targets. Review appropriateness and usage before authoring rare imperative forms; do not manufacture everyday examples for unusual forms simply to fill a target.

Five independent-writing targets remain outside the prepared scope: lexical paragraph revision, grammatical paragraph revision, and contextual use of passé récent, imperative and passé simple. Their outstanding prerequisite targets are listed individually in `granular-pathway-backlog.json`. The next release must retain recognition, controlled production and contextual writing as separate evidence, and provide the missing prerequisite teaching/checks before expanding their pathways.

Before publishing any expansion: regenerate the draft and scoped candidate, verify source mappings and answer keys, exercise uneven-profile routing through the added targets, run authenticated assessment-to-learning checks, and publish a new immutable bank revision. Revisions 33 and 34 are published and immutable; further authoring must use revision 35 or later.

## Complete target accounting

`granular-pathway-backlog.json` accounts for every one of the 542 targets and records exact pool status, existing lesson IDs and prerequisites outside the prepared scope. Regenerate it with `node --import tsx scripts/build-granular-pathway-backlog.mts`; use `--check` to reject stale output.

| Required work | Targets |
| --- | ---: |
| Prepared assessment, teaching and fresh-check pathway (unpublished draft) | 334 |
| Question pools allocated; exact-target lesson still missing | 14 |
| Complete initial and follow-up question pools | 187 |
| Resolve prerequisite scope | 2 |
| Connected-writing evidence outside prepared scope | 5 |
| Total | 542 |

These categories partition the graph; they are not publication or approval labels. Pool allocation does not prove instructional suitability or novelty after teaching. Draft refinements remain separate from approval of their parent nodes.

## Next implementation packages

1. Expand from the public revision 33 baseline using immutable bundles and preserved historical sessions. Verify each expansion through assessment, learning and answer review on its exact deployment before activation, then repeat public verification.
2. Validate the new verb-visit routing on real content and live mixed-profile journeys. The eight constructed contrasts now pass; educator/student calibration and broader granular profile validation remain required. Keep untested targets unresolved and refine them during learning.
3. Subjunctive recognition, fourteen exact-verb lessons and four verb-family pathways have passed their service journeys. Three short-reading main-idea pathways and complex-negation meanings also have guided practice and fresh checks. Complete the remaining imperative and passé-simple exact-target lessons, using the 14 exact-target lesson gaps in the current inventory.
4. Review the three remaining passé récent verb targets (vouloir, savoir, devoir) for natural contexts before authoring. Do not mechanically create awkward forms merely to reach a coverage count. Continue subjonctif, impératif and passé simple coverage with their own usage constraints.
5. Fill the 187 question-pool gaps across all domains from the exact-target inventory, preserving distinct recognition, controlled production and contextual-use evidence. The written-syllable and sound-to-spelling prerequisites for cédille are now included in the prepared candidate. Complete the separate connected-writing pathway for the remaining five targets outside the prepared scope.
6. Continue the owner's review in parallel, recording actual decisions against content checksums. Validate difficulty, question duration, sufficient depth and the meaning of recommendations with educator and student evidence. Do not substitute technical tests for those judgments.

## Fixed foundation and product decisions


The product owner authorized release while personally reviewing on 2026-09-11.
Human review now runs in parallel with the first student release; it is not a
prerequisite for first use. See `parallel-review-release-decision.md`. Preserve
pending review states, explicit provisional results and the remaining full-scope
work. Engineering must still deliver a working assessment-to-learning journey.

Use approved `french-taxonomy-v3`, checksum
`sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880`:
181 competencies, 230 prerequisite relationships and 257 evidence definitions.
Preserve existing IDs and historical releases. Do not rebuild the curriculum.
Additional distinctions must remain traceable to approved parent competencies;
draft refinements do not inherit approval automatically.

The initial assessment lasts 30–40 active minutes, targeting 35, supports pause
and resume, and leads into learning. Results distinguish demonstrated strengths,
difficulties and unresolved skills. Untested is not failed. There is no single
French level. Learning supplies further independent evidence. Consistent first-sitting gaps can now
recommend exact-target teaching while the result remains uncertain; the separate
occasion requirement still applies to confirmation. Missing novelty, context or
other required evidence continues to prevent this teaching diagnosis.

## Ordered delivery milestones


| Milestone | Concrete deliverable | Completion gate |
| --- | --- | --- |
| 1. Finalize the coverage contract | One matrix linking every approved competency and evidence definition to finer distinctions, prerequisites, question formats, contexts, initial assessment or later verification, and existing content. | Every approved target accounted for; unsupported refinements identified; recognition, form production, contextual use and independent writing remain distinct. |
| 2. Complete and review the assessment bank | Reconcile existing questions, repair defective items, fill only demonstrated gaps across conjugation, grammar, both spelling domains and short-passage reading. Allocate distinct initial and follow-up questions. | Answer keys, ambiguity, target mapping and context variety reviewed; sufficient eligible questions for the evidence contract; no draft counted as approved. Independent writing is assessed through connected writing during learning. |
| 3. Finish and calibrate adaptive assessment | Broad domain sampling followed by prerequisite-aware easier/harder probes, confirmation after inconsistent answers, active-time stopping and reliable saved sessions. | Granular uneven-profile simulations behave appropriately; skipping does not mean failure; repeated submissions do not duplicate evidence; difficulty and stopping rules are checked with educator and student evidence. |
| 4. Deliver the actual learning pathway | Exact-target lessons, guided practice and fresh independent checks, selected from the student's results and prerequisites. Track exposures before showing answers or help. | Every recommended destination contains suitable teaching and exercises; guided success cannot certify independent mastery; later checks update the skill map and next activities. |
| 5. Validate complete journeys | Authenticated tests on the full database schema: onboarding → assessment → interruption/resume → results → lesson → practice → independent check → updated pathway. | Include mixed abilities within each domain, all-correct/all-incorrect, skips, contradictory evidence, time limit, exhausted content, refresh, network retries and student isolation. Review whether actual explanations and recommendations make pedagogical sense. |
| 6. Publish and activate | Versioned graph-bound bank and activity release, migrations, reviewed implementation commit, deployment and live smoke test. | First release: selected content versions, explicit provisional/review status, working learning destinations, compatible historical sessions, rollback and authenticated production verification. Full completion still requires the remaining coverage and review milestones. |

Milestones 2–4 can progress alongside each other once their target contracts are
fixed. Full completion depends on all of them. The owner-authorized first release can proceed while content review and coverage expansion continue.

The prerequisite expansion audit now lists 73 targets requiring scope review
across 99 parent-evidence mappings. Two explicit construction mappings have been
corrected: futur proche uses present-tense aller, and passé récent uses
present-tense venir. See `docs/diagnostic/v3-prerequisite-audit.md`; the remaining
flags are review candidates, not proof that approved graph edges are wrong.

Revision 35 draft adds separate dire and prendre passé simple pathways (12 guided exercises, 24 sentence checks). Its prepared scope is 336 targets and 6,290 questions; the published r34 candidate remains 334 targets. See `passe-simple-dire-prendre-draft-2026-09-12.md`.
