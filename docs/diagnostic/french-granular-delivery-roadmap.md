# French granular diagnostic delivery roadmap

Updated 2026-09-12. French only; Allotey is excluded. This document distinguishes the public release, the frozen release candidate and the unpublished working draft. Full completion still requires all six milestones below.

## Current delivery state

- Public release: **french-granular-diagnostic-v35-writing**, with 344 of 542 detailed targets and 6,386 in-scope questions. The public application combines base `74301ec` with route correction `192fc93`, deployment `dpl_9eZpZizYXsv4Y68T92YHthTJdMLV`. Public progress search, filters, prerequisites, mobile layout, reload and unchanged session checks passed, as did the preserved demo. See revision-35-public-rollout-2026-09-12.json.
- Published candidate: **french-granular-diagnostic-v35-writing**, with 344 of 542 targets, 6,386 in-scope questions and 7,820 canonical items. Its frozen application is source `74301ec`, deployment `dpl_6eBAW9LdmFCgfsANiTVBxU6SgocF`. The live journey completed 60 diagnostic answers (47 correct, 13 incorrect) in 2,079.101 active seconds, then six guided exercises, a fresh independent check and all-answer review. This candidate has been promoted. See revision-35-publication-2026-09-12.json.
- Next preparation: revision 36 with the explicit verb-family-recognition option contains 347 of 544 targets, 6,422 in-scope questions and 7,856 canonical items. The approved family-recognition parent has three draft refinements instead of one broad target, increasing the map by two. It has not been imported, published or activated. See revision-36-preparation-2026-09-12.json.
- Revision 36 adds separate recognition questions and lessons for regular -er patterns, finir patterns and other patterns. It does not claim that recognition establishes independent conjugation. Ten uneven-profile simulations, two server-command journeys and all three new lesson journeys passed; these use constructed profiles and are not classroom calibration.
- Complete material-history certification remains disabled. Recent code prepares atomic recording and adds inbox recording. Static sources, audio, historical baselines and remaining routes still need verification. Recording delivery does not prove attention, mastery or a complete history.
- Human review and educational calibration continue in parallel under the owner's release authorization. Preserve pending review labels and the existing demo account.

## Complete target accounting

The revision 35 root inventory and isolated revision 36 inventory each account for every target in their own map. The inventory validates exact target identities against the selected scoped candidate; it does not assume a fixed graph size. A category identifies the next obstacle, not proof that all subsequent obstacles are solved.

| Required work | Revision 35 candidate | Revision 36 preparation |
| --- | ---: | ---: |
| Prepared assessment, teaching and fresh-check pathway | 344 | 347 |
| Question pools allocated; exact-target lesson still missing | 4 | 4 |
| Complete initial and follow-up question pools | 187 | 186 |
| Resolve prerequisite scope | 2 | 2 |
| Connected-writing evidence outside prepared scope | 5 | 5 |
| Total | 542 | 544 |

Root evidence: granular-pathway-backlog.json. Revision 36 evidence: revision-36-pathway-backlog-2026-09-12.json. Reproduce with `node --import tsx scripts/build-granular-pathway-backlog.mts` in the corresponding prepared artifact directory; add `--check` for exact reproduction. These inventories are neither publication nor approval records.

## Next implementation packages

1. Revision 35 and its completed-account progress correction are public and verified. Revision 36 is public with its complete journey verified; revision 37 is a published candidate with 350 of 544 targets prepared. Preserve completed diagnostics and the demonstration account while extending coverage.
2. Complete revision 36 release preparation and deployment using its explicit question, lesson and refinement selection; preserve older sessions and immutable release identities.
3. Resolve the four remaining exact-target lesson gaps and two prerequisite-scope gaps, respecting natural French usage rather than manufacturing awkward examples to increase coverage.
4. Fill the 186 remaining revision 36 question-pool gaps across all domains, keeping recognition, controlled production and contextual-use evidence distinct. Complete the five connected-writing targets during learning.
5. Finish the material-capture route and audio audit, integrate verified recording where appropriate, and validate with deployed fresh-account journeys before enabling a complete-history contract. Do not relabel older observations.
6. Continue the owner's content review and educator/student calibration of difficulty, timing, depth and recommendations. Keep unsampled or insufficiently supported skills unresolved; use learning to refine them.

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

Revision 35 is public with 344 of 542 targets and 6,386 in-scope questions. Revision 36 adds verb-family distinctions (347 of 544 targets); revision 37 adds separate feminine, plural and combined participle agreement (350 of 544 targets, 6,458 in-scope questions). Revision 37 accounting: 350 prepared pathways, 183 question-pool gaps, four exact-lesson gaps, two prerequisite-scope gaps and five connected-writing targets. Candidate publication does not establish public activation, educator review or complete material-history capture. See the revision-specific preparation and backlog reports.
