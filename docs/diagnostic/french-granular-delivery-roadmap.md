# French granular diagnostic delivery roadmap

Updated 2026-09-11. Scope: French only. Allotey is excluded.

Current deployment checkpoint: the public v10 release supports 167 of 542 proposed evidence targets, each with instruction and fresh-check capacity. The versioned bank contains 5,460 items; this does not mean every graph target has adequate questions. The answer-review screen, response retention and timer correction are live. See `revision-nine-preparation-2026-09-11.md` for publication and public verification evidence, and `revision-eight-publication-2026-09-11.json` for the preceding full live journey. The numerical starting-point sections below are historical planning baselines, not current deployment counts. The six full-scope milestones remain the completion contract.

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

## Verified local starting point

Latest parallel-review preparation: 4,070 consolidated questions, 3,588 mapped
questions, 247 targets with separate initial/follow-up pools, and 295 incomplete
targets. The 52-target prerequisite closure of the 29 currently supported teaching
paths now has no question-pool gaps. This closure does not establish full-graph
coverage, exposure-safe paths for every student, or production readiness. All question and lesson human review states remain unchanged.
See `implementation-progress.md` and `v3-parallel-review-candidate.json` for current
counts; the reviewed-only baseline below excludes the parallel-review permission.


The repository contains a draft adaptive engine, persistent-session migrations,
results interface and independent-check flow. These are not a completed live
release. Current local reports identify 340 proposed refinements under 67 parent
competencies, producing 542 evidence targets. These are proposals, not a claim
that curriculum granularity has been fully validated.

The consolidated v3 review candidate contains 4,070 questions: 730 base items
and 3,340 additional drafts (2,720 conjugation form questions, 16 tense-recognition, 24 person-number recognition,
20 conjugation foundations, 32 canonical-sentence questions, 32 agreement analyses, 56 agreement corrections, 28 on/om spelling questions, 16 explicit-reading questions,
64 reading, 56 agreement, 16 subject-identification, 16 determiner-agreement recognition, 24 determiner corrections, 56 other pronoun, 90 y/en, 16 direct-object identification and 58 spelling items covering regular forms and nasal spelling). Thirty-seven exact-target teaching drafts now exist,
including determiner–noun agreement analysis and correction, grammatical person and number, two vocabulary-reading strategies, five y/en uses, direct-object identification, futur proche/passé récent recognition, subject identification, four subject–verb agreement constructions, regular noun plurals, regular feminine adjective forms, m before m/b/p,
and six present-tense conjugation lessons (regular -er/-ir, -ger/-cer, aller and faire).
Only 238 questions meet canonical eligibility; 233 can currently be used by the
granular adapter. Five lack the required reading-support evidence. The pool audit cannot yet
allocate adequate separate initial and follow-up pools; it produces zero usable
independent-check bindings. The additional drafts contribute zero eligible
additions until reviewed. Counts are local artifact evidence,
not a fresh production audit.

## Existing teaching reuse, verified against live content

A read-only snapshot of all 181 approved French nodes found 181 stored lessons,
all auto_approved. The actual practice renderer uses 113 generic instruction
cards and 68 specific-content candidates (60 conjugation, 8 pronoun nodes).
Seventeen groups of nodes share identical substantive content. Stored approval
labels therefore do not establish exact granular teaching coverage.

Use `v3-teaching-reuse-audit.{md,json}` to review the 68 candidates and their
related diagnostic targets before authoring replacements. Replace generic cards
where an exact-target draft does not already exist. Keep separate evidence modes
and finer skill scope when adapting shared tense or pronoun templates. The audit
creates no reuse approvals or activity bindings.

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

## Immediate next implementation package

The parallel-review candidate now includes 37 pending-review lessons with 183
guided exercises. Twenty-nine lesson targets retain sufficient check capacity
after exact teaching exclusions and have proposed teaching bindings. Their
52-target prerequisite closure has 16 incomplete targets, listed in
`v3-parallel-review-candidate.json` under `teachingPrerequisiteGaps`. Resolve that
first-release dependency scope and student status before deployment; human review
continues in parallel and is no longer a first-release blocker.

The full-graph benchmark now has an explicit `--require-discrimination` gate:
four of eight mixed-profile contrasts fail. Prioritize verb-specific tense
boundaries, literal/inferential reading, reading reference resolution and COD/COI
sampling. Keep the 35-minute budget and approved evidence thresholds; missing
observations must remain unresolved. See `full-french-routing-review.md` for the
measured known/weak evidence counts and reproducible failing command.

Use `v3-question-repair-review.md` and its JSON companion to review the 25 current
question corrections across 17 approved evidence targets. Each record includes
before/after content, the rationale and source/revised checksums. Ten older
repairs still lack assessed-material identities. The product owner will review; serving permission does not imply completed human review.

The delivery matrix now lists exact question IDs missing required assessed
material annotations, separately for eligible questions, exact-target drafts and
shared parent candidates. Current gaps affect 68 targets in the eligible group
and 125 in shared parent candidates; expansion drafts have no missing required
identity kinds. These are overlapping target counts, not unique question counts.
Repair annotations through content review without carrying old approvals across
changed content. Existing pool guards already reject missing identities where
novelty is required; annotation presence alone does not prove independence.

The shared teaching review catalogue is now available in
`v3-teaching-review-catalogue.{md,json}`: 37 draft lessons, 183 guided exercises,
full content, exact targets and checksums. Use it with the delivery matrix when
reviewing lesson scope, prerequisites and assessment overlap. Anchored exposure
annotations are present for every draft but do not establish completeness or
approval.

The full-graph routing audit exposed insufficient depth. Bounded branch visits and
confirmation at the difficulty floor now give 12 all-correct and 15 all-incorrect
targets sufficient within-occasion evidence in 35 minutes, covering every strand.
The `--require-depth` lower-bound gate passes. Broader profile discrimination is
still incomplete. Conjugation now samples general concepts, regular patterns and
individual verbs, and the regular-versus-irregular simulation establishes both
sides of that contrast. Refined form-production targets now use a versioned draft
probing order starting at present forms, with upward/downward and boundary probes.
The v2 draft extends those ranks to tense recognition and interpretation, preserving
their separate evidence. Review and calibrate ranks, branch allowances and entry
points; general concepts outside the explicit tense mapping still use graph depth.
See `full-french-routing-review.md`. This work can proceed alongside content review
without weakening approved graph evidence criteria.

1. Reconcile the existing delivery matrix with the consolidated question review
   packet, including the 90 y/en, 16 tense-recognition, 16 direct-object identification, 20 conjugation foundations, 32 canonical-sentence questions, 32 agreement analyses, 56 agreement corrections, 28 on/om spelling questions, 16 explicit-reading questions,
64 reading, 56 agreement, 16 subject-identification, 56 pronoun and 58 spelling drafts. For each of the 542 proposed
   targets, record approved parent, evidence rule, usable questions, initial and
   later pool requirements, lesson, practice, review state and remaining action.
2. Audit evidence rules against the approved graph, including text variety,
   justification, unfamiliar words and unaided writing. Resolve unsupported
   refinements and prerequisite overconstraints before approving new mappings.
3. Use the resulting queue to review reusable items and fill gaps across every
   domain. Prioritize currently uncovered reading, grammar and spelling targets;
   more conjugation forms alone cannot deliver comprehensive assessment.
4. Extend the passing authenticated Next browser journey across the skill matrix.
   It now covers concurrent duplicate submissions, lost-response retries and a
   cross-student action request, alongside results, a lesson, guided practice and
   a fresh independent check. Persisted time and learning evidence are verified.
   Source-copy instrumentation parity is now verified. Add coverage for additional skill modes; this
   synthetic integration scenario does not establish content completeness.

Existing broad fallback lessons must not be counted as teaching a narrower skill.
The six conjugation teaching targets now have a checksum-bound draft pool review
in `v3-conjugation-pathway-review.md`. Twelve supplied-tense sentence questions
repair the ger/cer distinctive-form capacity gap, making all six candidate pool
splits feasible. Forty-eight more sentence questions cover regular-er, regular-ir,
aller and faire, so all six have feasible sentence-only initial/follow-up pools.
This does not approve the questions or establish contextual transfer; pedagogical
and teaching-overlap review remain necessary.
The four agreement teaching targets now also have a draft capacity review in
`v3-agreement-pathway-review.md`: fourteen distinct candidate verbs per construction,
with separate seven-question initial/follow-up pools under a conservative binary
number-choice guessing model. This model is conditional on knowing the verb forms
and still requires calibration. This
preview does not approve the questions or resolve conjugation-versus-agreement
confounding, semantic overlap or cross-activity exposure history.
The two periphrastic recognition teaching targets have sixteen assessment drafts
in `v3-tense-recognition-review.md`, with four initial and four later candidate
questions per target. This is a recognition-only capacity preview; it does not
establish production, transfer, teaching independence or pedagogical approval.
The direct-object lesson has a draft lesson-to-check review in
`v3-direct-object-pathway-review.md`. It binds the exact approved target, excludes
annotated taught sentences and repeated sentence copies, and proposes an 8/8
initial/later split. Semantic independence, construction balance and pedagogical
review remain unresolved.
The five y/en lessons have a cross-lesson exposure and pool review in
`v3-y-en-pathway-review.md`. All currently retain nine initial and nine later
candidates after exact sentence checks against the five-lesson set, above the
seven-per-pool guessing minimum. This adds limited reserve capacity; broader
history and semantic independence are not established by this preview.
Prepare activation under the parallel-review policy once the supported pathway and complete journey work. Do not wait for all human review to finish. Engineering owns mapping, adaptive logic, persistence and verification;
French pedagogical review owns answer validity, target fit and evidence adequacy.
Record actual review decisions rather than creating approvals from draft counts.

## Source records

- `docs/french-taxonomy-v3-release.md`
- `docs/diagnostic/sovgraph-reuse-investigation-2026-09-10.md`
- `docs/diagnostic/v3-facet-coverage.json`
- `docs/diagnostic/v3-learning-check-coverage.json`
- `docs/diagnostic/v3-conjugation-expansion.json`
- `docs/diagnostic/implementation-progress.md`
