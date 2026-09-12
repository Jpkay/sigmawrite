# French granular diagnostic delivery roadmap

Updated 2026-09-12. French only; Allotey is excluded. This document distinguishes the public release, the frozen release candidate and the unpublished working draft. Full completion still requires all six milestones below.

## Current delivery state

- Public bank release: **french-granular-diagnostic-v33-writing**, bank revision 33. It serves 327 of 542 skill targets with 6,168 questions in scope, from a bank of 7,554 verified stored items. Independent-writing evaluation is enabled. These are release and technical verification facts, not educator approval or classroom calibration.
- Public application source: `3e7cc67`, deployment `dpl_79zFrizpzVYDoQotio74vSjHE2V8`, promoted and inspected Ready on 2026-09-12. See `practice-feedback-capture-rollout-2026-09-12.json` for exact verification scope. Subsequent documentation commits do not imply another application deployment.
- Candidate verification included one real reading reformulation and its optional grammar tip, matched exactly to saved delivery records. On the public site, the demo retains 11 accessible lessons and 48 reviewed answers, including 17 incorrect answers. This smoke check is not a new full diagnostic or full lesson test.
- Reading, results, writing feedback and practice correction delivery recording have been expanded. Complete exposure-history certification remains disabled: alternate content sources, audio, historical baselines and concurrent presentation still require work. Recording delivered material does not prove attention or mastery.
- The current generated backlog accounts for all 542 targets: 328 prepared scoped pathways in the unpublished revision 34 draft, 187 requiring question-pool completion, 20 requiring exact-target lessons, two requiring prerequisite-scope resolution, and five independent-writing targets outside scope. A backlog category identifies the next obstacle; it does not establish that every later obstacle is solved.
- Human content review and educational calibration remain pending and run in parallel under the owner's release authorization. Existing synthetic benchmarks must not be presented as classroom evidence.

The unpublished revision 34 draft adds a pouvoir passé récent lesson, six guided exercises and twelve distinct check sentences. It has 328 prepared targets and 6,188 in-scope questions. See `passe-recent-pouvoir-draft-2026-09-12.md`. It has not replaced the public release.

The same unpublished draft also includes 24 imperative-meaning situations and eight guided exercises. Its meaning target and contextual-writing target remain excluded because their prerequisite expansion includes unsupported savoir, vouloir and devoir production targets. This addition therefore does not increase the scoped target count. See `imperative-meaning-draft-2026-09-12.md`.

### Next content expansion

The 20 targets with question pools but no exact-target lesson are three passé récent verb targets (vouloir, savoir, devoir), three imperative verb targets (vouloir, savoir, devoir), and fourteen passé simple verb targets. Review appropriateness and usage before authoring rare imperative forms; do not manufacture everyday examples for unusual forms simply to fill a target.

Five independent-writing targets remain outside the prepared scope: lexical paragraph revision, grammatical paragraph revision, and contextual use of passé récent, imperative and passé simple. Their outstanding prerequisite targets are listed individually in `granular-pathway-backlog.json`. The next release must retain recognition, controlled production and contextual writing as separate evidence, and provide the missing prerequisite teaching/checks before expanding their pathways.

Before publishing any expansion: regenerate the draft and scoped candidate, verify source mappings and answer keys, exercise uneven-profile routing through the added targets, run authenticated assessment-to-learning checks, and publish a new immutable bank revision. Do not replace revision 33 in place.

## Complete target accounting

`granular-pathway-backlog.json` accounts for every one of the 542 targets and records exact pool status, existing lesson IDs and prerequisites outside the prepared scope. Regenerate it with `node --import tsx scripts/build-granular-pathway-backlog.mts`; use `--check` to reject stale output.

| Required work | Targets |
| --- | ---: |
| Prepared assessment, teaching and fresh-check pathway (unpublished draft) | 328 |
| Question pools allocated; exact-target lesson still missing | 20 |
| Complete initial and follow-up question pools | 187 |
| Resolve prerequisite scope | 2 |
| Connected-writing evidence outside prepared scope | 5 |
| Total | 542 |

These categories partition the graph; they are not publication or approval labels. Pool allocation does not prove instructional suitability or novelty after teaching. Draft refinements remain separate from approval of their parent nodes.

## Next implementation packages

1. Expand from the public revision 33 baseline using immutable bundles and preserved historical sessions. Verify each expansion through assessment, learning and answer review on its exact deployment before activation, then repeat public verification.
2. Validate the new verb-visit routing on real content and live mixed-profile journeys. The eight constructed contrasts now pass; educator/student calibration and broader granular profile validation remain required. Keep untested targets unresolved and refine them during learning.
3. Subjunctive recognition, fourteen exact-verb lessons and four verb-family pathways have passed their service journeys. Three short-reading main-idea pathways and complex-negation meanings also have guided practice and fresh checks. Complete the remaining imperative and passé-simple exact-target lessons, using the 20 exact-target lesson gaps in the current inventory.
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
