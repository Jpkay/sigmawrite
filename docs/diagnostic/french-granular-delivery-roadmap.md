# French granular diagnostic delivery roadmap

Updated 2026-09-12. French only; Allotey is excluded. This document distinguishes the public release, the frozen release candidate and the unpublished working draft. Full completion still requires all six milestones below.

## Current delivery state

- Public deployment: v17, 260 supported targets, frozen source `9435669`. A complete timed diagnostic (60 answers, 47 correct and 13 incorrect), results, guided lesson, fresh independent check, answer review and reload passed. After promotion, public new-account, demo and pinned-session checks passed. The demo retains 11 lessons and 48 reviewed answers. See `revision-sixteen-publication-2026-09-12.json`.
- Previous public release: v16, 253 supported targets, frozen source `37de48a`; retained as the rollback reference. See `revision-fifteen-publication-2026-09-12.json`.
- Published candidate v18: 261 targets and 6,626 bank items, frozen source `cddc4ae`. Adds complex-negation meaning checks and finer feature evidence in results. All stored bank items passed the consistency check. Fresh-default and real learning-upgrade checks passed; full timed validation and public activation remain outstanding. See `revision-seventeen-publication-2026-09-12.json`.
- Separate working draft: 266 prepared pathways, adding imperative recognition and four imperative verb families. Its five service journeys, 648 granular tests and eight constructed profile checks pass. It is not published. See `imperative-family-preparation-2026-09-12.json`.
- All 72 v18 candidate audio assets passed byte-integrity and actual Chrome playback checks. This is technical verification; pronunciation review remains pending. Feature display was verified at a 390-pixel viewport without horizontal overflow, but that live account only supplied untested feature rows; deployed answered-count coverage remains outstanding.
- Working-draft symbolic routing benchmark: 10/10 depth checks and 8/8 uneven-profile contrasts, with no invariant violations. See `confirmed-verb-visits-2026-09-12.md`. Eight prepared-profile checks cover the 261-target candidate. These are constructed tests, not educational calibration.

## Complete target accounting

`granular-pathway-backlog.json` accounts for every one of the 542 targets and records exact pool status, existing lesson IDs and prerequisites outside the prepared scope. Regenerate it with `node --import tsx scripts/build-granular-pathway-backlog.mts`; use `--check` to reject stale output.

| Required work | Targets |
| --- | ---: |
| Prepared assessment, teaching and fresh-check pathway | 266 |
| Question pools allocated; exact-target lesson still missing | 35 |
| Complete initial and follow-up question pools | 223 |
| Connected-writing evidence during learning | 18 |
| Total | 542 |

These categories partition the graph; they are not publication or approval labels. Pool allocation does not prove instructional suitability or novelty after teaching. Draft refinements remain separate from approval of their parent nodes.

## Next implementation packages

1. Finish the full timed candidate journeys through learning and answer review, then activate only an exactly tested deployment and repeat public verification. The public v17 release supports 260 targets; the published v18 candidate supports 261 and the separate working draft prepares 266. Preserve immutable bundles and historical sessions.
2. Validate the new verb-visit routing on real content and live mixed-profile journeys. The eight constructed contrasts now pass; educator/student calibration and broader granular profile validation remain required. Keep untested targets unresolved and refine them during learning.
3. Subjunctive recognition, fourteen exact-verb lessons and four verb-family pathways have passed their service journeys. Three short-reading main-idea pathways and complex-negation meanings also have guided practice and fresh checks. Complete the remaining imperative and passé-simple exact-target lessons, using the 35 exact-target lesson gaps in the current inventory.
4. Review the four remaining passé récent verb targets (pouvoir, vouloir, savoir, devoir) for natural contexts before authoring. Do not mechanically create awkward forms merely to reach a coverage count. Continue subjonctif, impératif and passé simple coverage with their own usage constraints.
5. Fill the 223 question-pool gaps across all domains from the exact-target inventory, preserving distinct recognition, controlled production and contextual-use evidence. The written-syllable and sound-to-spelling prerequisites for cédille are now included in the prepared candidate. Complete the separate connected-writing pathway for the remaining 18 targets.
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
