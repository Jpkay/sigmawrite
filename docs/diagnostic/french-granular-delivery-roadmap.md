# French granular diagnostic delivery roadmap

Updated 2026-09-12. French only; Allotey is excluded. This document distinguishes the public release, the frozen release candidate and the unpublished working draft. Full completion still requires all six milestones below.

## Current delivery state

- Public deployment: v13, 215 supported targets, frozen source `3446b9f`. The complete candidate browser assessment, lesson practice, independent check and answer review pass; post-promotion new-account, demo and pinned-session checks pass and are tracked in `revision-twelve-publication-2026-09-12.json`.
- Previous public release: v12, 197 supported targets, frozen source `0657d2a6`; retained as the rollback reference. See `revision-eleven-publication-2026-09-11.json`.
- Frozen next candidate: bank revision 13, 231 supported targets and 4,752 scoped probes, source `ff8b84f`. It adds four family pathways each for passé composé, futur simple, conditionnel and plus-que-parfait to public v13. Bank import and a separate deployment are in progress; publication and activation are pending. See `revision-thirteen-publication-2026-09-12.json`.
- Working-draft symbolic routing benchmark: 10/10 depth checks and 8/8 uneven-profile contrasts, with no invariant violations. See `confirmed-verb-visits-2026-09-12.md`. This later runtime change is not included in the frozen 215-target candidate and is not educational calibration.

## Complete target accounting

`granular-pathway-backlog.json` accounts for every one of the 542 targets and records exact pool status, existing lesson IDs and prerequisites outside the prepared scope. Regenerate it with `node --import tsx scripts/build-granular-pathway-backlog.mts`; use `--check` to reject stale output.

| Required work | Targets |
| --- | ---: |
| Prepared assessment, teaching and fresh-check pathway | 231 |
| Question pools allocated; exact-target lesson still missing | 57 |
| Complete initial and follow-up question pools | 236 |
| Connected-writing evidence during learning | 18 |
| Total | 542 |

These categories partition the graph; they are not publication or approval labels. Pool allocation does not prove instructional suitability or novelty after teaching. Draft refinements remain separate from approval of their parent nodes.

## Next implementation packages

1. Complete preparation and independent verification of the frozen 231-target candidate with its later verb-visit routing; the 215-target v13 release is publicly verified. Keep published bundles immutable and repeat full candidate and public verification before activating another version.
2. Validate the new verb-visit routing on real content and live mixed-profile journeys. The eight constructed contrasts now pass; educator/student calibration and broader granular profile validation remain required. Keep untested targets unresolved and refine them during learning.
3. Add the missing exact-target lessons for the remaining tenses and moods. The regular -er/-ir and -ger/-cer pathways for imparfait, passé composé, futur simple, conditionnel and plus-que-parfait are now prepared. Each needs suitable guided examples and fresh independent applications; existing form questions alone are insufficient.
4. Review the four remaining passé récent verb targets (pouvoir, vouloir, savoir, devoir) for natural contexts before authoring. Do not mechanically create awkward forms merely to reach a coverage count. Continue subjonctif, impératif and passé simple coverage with their own usage constraints.
5. Fill the 236 question-pool gaps across all domains from the exact-target inventory, preserving distinct recognition, controlled production and contextual-use evidence. Complete the separate connected-writing pathway for the remaining 18 targets.
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
