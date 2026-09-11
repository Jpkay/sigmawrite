# Granular French diagnostic implementation

## Explicit-reading instruction closure (2026-09-11)

Added two explicit-reading lessons for narrative and argumentative passages, with
six short original guided passages and twelve exercises. Each passage first asks
for a stated detail, then for the actual sentence supporting that answer. Lessons
distinguish facts stated in the text from inferred causes, opinions and proposed
future actions. Guided source passages are annotated and distinct from assessment
passages.

Catalogue: 60 lessons and 307 guided exercises. All 52 targets in the current
prerequisite closure now have supported teaching with fresh follow-up capacity.
This closes instruction coverage for that explicit scope only. The broader graph
still has 295 incomplete question-pool targets, and eight catalogue lessons remain
outside this supported set. Human review continues in parallel.

Validation: twelve targeted teaching/review/service tests, typecheck, targeted lint
and catalogue/parallel/scoped reproducibility checks pass. All six scoped profile
simulations reach 35-minute results with next activities, no missing activities and
no reported violations. Real grading/teaching command journeys pass for wrong and
mixed profiles in an isolated in-memory store; the wrong profile completes a lesson,
four guided exercises and a fresh check, while the mixed profile starts with a check.
Both reports carry the current scoped-candidate checksum. These simulations do not
verify live browser or database persistence. Publication preflight refreshed; no
production, runtime, deployment or demonstration changes.


## Agreement construction instruction (2026-09-11)

Added eight exact-target lessons: recognition/analysis and controlled correction
for adjacent, separated, inverted and coordinated subjects. Thirty-two guided
exercises separate explaining whether agreement is correct from rewriting the
wrong verb. Recognition includes both correct and incorrect cases. Corrections
preserve all other words. Examples treat the whole subject, the nominal head,
postverbal subjects and distinct subjects joined by et; boundaries exclude other
coordination patterns and broad claims about independent writing.

Catalogue: 58 lessons, 295 exercises and 50 supported teaching targets with fresh
checks. Only the two explicit-reading targets still lack instruction in the
52-target prerequisite closure. Broader graph coverage is unchanged; 295 targets
still have incomplete question pools. None of the two agreement assessment
expansions’ assessed sentences is reused as guided material.

Validation: twelve targeted content/review/service tests pass, plus typecheck,
targeted lint and candidate/catalogue reproducibility checks. Refreshed delivery,
material, parallel/scoped candidate and publication-preflight reports. No runtime,
production, deployment or demonstration changes.


## Indirect-object pronouns and COD/COI distinction (2026-09-11)

Added lui and leur lessons plus a controlled-production COD/COI distinction lesson,
with twenty guided rewrites. They distinguish human direct objects from indirect
recipients, preserve the unselected object when a sentence has both, retain
negation and contrast pronoun leur with possessive leur/leurs. The boundary warns
that not every à-complement takes lui/leur, using penser à elle as the counterexample.
All source and completed guided sentences are annotated and distinct from assessed
pronoun expansion sentences.

Catalogue: 50 lessons, 263 exercises and 42 supported teaching targets with fresh
follow-up capacity. Ten instruction gaps remain in the 52-target prerequisite
closure: eight agreement-construction targets and two explicit-reading targets.
Question-pool coverage is unchanged, with 295 broader targets still incomplete.

Validation: twelve targeted content/review/service tests pass, plus typecheck,
targeted lint and catalogue/parallel/scoped reproducibility checks. Rebuilt delivery,
material exposure, review and both candidates; refreshed scoped publication preflight.
No runtime, production, demonstration or deployment changes.


## Direct-object pronoun lessons (2026-09-11)

Added four exact-target controlled-production lessons for le, la, les and l’, with
24 guided sentence rewrites. Examples distinguish the replaced complement from
the subject, retain whole groups and negation, and show that les stays unchanged
before a vowel while le/la become l’. The boundaries exclude compound-tense
agreement, multiple pronouns, infinitive placement and imperative order. Taught
source and completed sentences are explicitly annotated and distinct from the
assessed sentence surfaces in the pronoun expansion.

Catalogue: 47 lessons, 243 exercises and 39 supported teaching targets with fresh
follow-ups. Thirteen targets in the 52-target prerequisite closure still need
supported instruction: eight agreement-construction targets, two explicit-reading
targets, two indirect-object pronoun targets and COD/COI distinction. Broader
question-pool coverage remains 247 allocated targets and 295 incomplete targets.

Validation: twelve targeted content/review/service tests pass, plus typecheck,
targeted lint and all catalogue/parallel/scoped reproducibility checks. Teaching,
overlap and delivery reports rebuilt. No runtime, production or deployment changes.


## On/om foundation lessons (2026-09-11)

Added recognition and controlled word-reconstruction lessons with twelve guided
exercises. They contrast ordinary on and om before b/p, show both spellings in
pompon, and explicitly teach bonbon as an exception. Examples and guided words are
distinct from the 28-word assessment expansion; exposure annotations retain the
actual taught lemmas. Guided reconstruction is identified as support rather than
independent spelling production.

Catalogue: 43 lessons, 219 guided exercises and 35 supported teaching targets with
fresh checks. Seventeen targets in the 52-target prerequisite closure still lack
supported instruction. Both new lessons retain fresh follow-up capacity. Broad
question-pool coverage remains 247 allocated targets and 295 incomplete targets.

Validation: twelve targeted tests across four teaching/review/service files pass,
as do typecheck and targeted lint. Catalogue, overlap, delivery, parallel candidate
and scoped candidate artifacts rebuilt; all three candidate/catalogue reproducibility
checks pass. No runtime, demonstration, deployment or production changes.


## Canonical sentence foundation lessons (2026-09-11)

Added recognition and controlled sentence-order lessons, each with six guided
exercises. The recognition lesson explicitly distinguishes an absent verb from a
complete subject–verb sentence needing no complement. The production lesson keeps
supplied groups intact, including expanded subjects. Both explain that this model
is one French construction rather than a rule that every sentence needs three groups.
Guided production answers are included in the material exposure ledger; assessment
sentences are not reused.

Catalogue: 41 lessons, 207 guided exercises and 33 supported teaching targets with
fresh follow-up capacity. Nineteen targets in the 52-target prerequisite closure
still lack supported instruction. Both new lessons have zero direct assessment
exposure matches and retain sufficient follow-up questions. No release or deployment.

Validation: fourteen targeted tests across five content, review and teaching-service
files pass. Typecheck, targeted lint and catalogue/candidate reproducibility checks
pass. Delivery and material overlap reports regenerated.


## Conjugation foundation lessons (2026-09-11)

Added two pending-review lessons and twelve guided exercises for recognizing the
present indicative and separating radical/ending. Examples use different sentences
and segmentation forms from the foundation assessment pools. The present lesson
contrasts grammatical tense with future time reference and identifies the complete
passé composé group. The segmentation lesson keeps the i in -ions/-iez and explicitly
limits the remove-er shortcut to its regular models.

Catalogue: 39 lessons and 195 guided exercises. Both new targets retain fresh
follow-up checks without direct assessment material overlap. The candidate now has
31 supported teaching targets among the 52-target prerequisite closure; 21 targets
still lack supported instruction. Question-pool closure remains complete, while the
broader graph still has 295 incomplete question-pool targets. No full-release claim.

Validation: two new content/overlap/readiness tests pass; the shared worktree suite
currently passes 363 tests across 96 files, including concurrent release-scope work.
Typecheck, targeted lint and review/candidate reproducibility checks pass. Catalogue,
delivery and teaching exposure reports rebuilt. No production changes.


## Release-scope schema and pool guards (2026-09-11)

Added an optional strict release-scope contract with separate assessment and
teaching target IDs. Unknown/duplicate IDs, missing supported prerequisites and
teaching outside assessment scope are rejected. Full graph skills are retained;
absent evidence still produces unknown results. Scope is pinned in the session
release identity, including teaching availability changes.

Pool validation now checks sufficiency for declared assessment targets without
relaxing any evidence rule. It still checks all retained probes and global graph
integrity, and rejects probes outside the declared scope. Without scope, existing
full-coverage behavior remains. No candidate has been scoped or published yet:
runtime scheduling, command authorization, public coverage counts and parent-bank
publication integration still need wiring before this contract can be activated.

Validation: 360 tests across 95 files, typecheck and targeted lint pass. New tests
cover invalid scopes, prerequisites, teaching boundaries, release identity,
unassessed unknown results, supported shortages and outside-scope questions.
Two missing prerequisite lessons are being authored in parallel.


## Review visibility and release-scope contract (2026-09-11)

The student DTO now exposes contentReviewStatus=ongoing only for the explicit
parallel-review policy. The diagnostic, lesson and check UI shows a plain French
notice that questions/activities are still being checked and results may be
adjusted. Private policy manifests remain server-only; no mastery result or
provisional-evidence flag is changed by the content-review label. The standard
reviewed-only path is unchanged. 357 tests/94 files, typecheck and targeted lint pass.

Read-only release review produced release-scope-integration.md. The 52-target
prerequisite closure has complete question pools but only 29 lesson paths; missing
instruction for struggling prerequisite profiles remains a real release task.
Fullgraph scope remains 542 targets, 247 allocated and 295 incomplete. No granular
production activation in this step. Demo tabs were not used or changed.


## Explicit-reading prerequisite pools (2026-09-11)

Added sixteen original short passages, eight narrative and eight argumentative,
for the approved explicit-information evidence. Questions ask for a fact directly
stated in the text, rather than its inferred cause or thesis. Each item also offers
a separate supporting-excerpt selection; actual excerpt grading is tested. Both
genre targets have distinct initial and follow-up passages. The approved parent
requirement to collect evidence across two text types is preserved.

All 52 targets in the prerequisite closure of the 29 currently supported teaching
paths now have allocated question pools. This resolves this specific closure gap,
not the full release: the 542-target graph still has 295 incomplete targets and 247
allocated targets. There are 4,070 consolidated candidates and 3,588 mapped questions
under parallel-review permission. Teaching counts remain 37 lessons, 183 exercises,
33 lesson targets with pools and 29 with sufficient fresh questions after exposure
exclusions. Human review states remain pending; publication and live integration
are not implied by local allocation.

Validation: 356 tests across 94 files, typecheck and targeted lint pass. Expansion
and candidate reproducibility checks pass. All dependent delivery, pathway and
material reports are regenerated. No production writes or deployment occurred.


## On/om prerequisite pools (2026-09-11)

Added 28 pending-review spelling questions: fourteen recognition and fourteen
controlled word reconstructions for the approved on/om evidence targets. All
assessed lemmas are distinct across the new questions. Recognition contrasts
unnecessary m with incorrect n before b/p; both error families occur in each pool.
Controlled reconstruction preserves the binary m/n guessing floor of 0.5.
Separate initial and follow-up pools now allocate both previously missing targets.
These items sample ordinary on/om words, not a claim of exhaustive exception mastery.

The candidate now contains 4,054 questions, of which 3,572 are mapped under the
explicit parallel-review policy. There are 245 allocated and 297 incomplete targets.
Only two gaps remain in the 52-target teaching prerequisite closure: explicit
information in narrative and argumentative reading passages. The first release
still requires integration and live verification; review remains in parallel.

Validation: 354 tests across 93 files, typecheck and targeted lint pass. Answer
validation, novel-word disjointness and contrasting-error coverage are tested.
The expansion/candidate reproducibility checks pass and derived reports are rebuilt.


## Agreement correction prerequisite pools (2026-09-11)

Added 56 pending-review verb corrections, separately mapped to the approved
writing evidence for adjacent, separated, inverted and coordinated subjects.
Each construction supplies fourteen distinct sentences. The binary singular/plural
response space retains a 0.5 guessing floor; typed answers are not treated as
unrestricted production. Answer validation accepts the corrected form and rejects
the displayed error. Each facet now has at least seven initial questions and seven
fresh follow-up questions, with disjoint assessed sentence identities.

The consolidated bank now contains 4,026 candidates. Under the explicit parallel
review policy, 3,544 mapped questions allocate 243 targets; 299 remain incomplete.
Four prerequisite gaps remain in the 52-target teaching closure: narrative and
argumentative explicit-information reading, and on/om recognition and production.
There remain 37 teaching drafts, 183 guided exercises and 29 teaching paths with
sufficient unexposed follow-up capacity. Production activation remains outstanding.

Validation: 352 tests across 92 files, typecheck and targeted lint pass. Expansion
and parallel-candidate reproducibility checks pass. Derived delivery, pathway,
review and material exposure reports were regenerated without live data changes.


## Agreement analysis prerequisites (2026-09-11)

Added 32 pending-review agreement-analysis questions mapped separately to the
approved parent evidence and the four existing construction facets: adjacent,
separated, inverted and coordinated subjects. Learners judge agreement and choose
its explanation. Each construction has eight distinct sentences, four with real
agreement violations, and disjoint 4/4 initial and follow-up pools containing both
positive and negative cases. Coordination examples cover distinct subjects joined
by et, not all coordination patterns. These recognition results do not certify
written agreement production.

The parallel candidate now has 3,488 mapped questions, 239 allocated targets and
303 incomplete targets. The teaching prerequisite closure has eight incomplete
targets, down from twelve. Consolidated bank: 3,970 candidates. Production has not
been activated. The remaining prerequisites are four agreement-construction
production targets, two explicit-reading targets and two on/om spelling targets.

Validation: 350 tests across 91 files, typecheck and targeted lint pass. Expansion
and candidate reproducibility checks pass; delivery and exposure reports rebuilt.


## Canonical sentence prerequisite pools (2026-09-11)

Added 32 pending-review questions to the approved canonical-sentence node: 16
recognition questions and 16 controlled sentence-reordering tasks. Recognition
includes four true missing-verb examples, with negative cases in both initial and
follow-up pools. Production accepts the correct sentence with or without its final
period and rejects the supplied scrambled order. It explicitly declares the six
possible group permutations, rather than treating typed ordering as open writing.

Fixed the shared finite-response guessing floor to count all distinct accepted
answers in the declared alternatives. Punctuation variants now preserve the 1/6
floor instead of falsely making a permutation task appear harder to guess. Tests
cover accepted aliases and duplicate normalized aliases.

The candidate maps 3,456 questions with 235 allocated and 307 incomplete targets.
The 29 lesson paths' prerequisite closure still contains 52 targets; 12 remain
incomplete (down from 14). Consolidated candidates: 3,938. No production activation
or fabricated content approval. Validation: 348 tests across 90 files, typecheck,
targeted lint and reproducibility checks pass. Delivery and overlap reports rebuilt.


## Conjugation prerequisite pools (2026-09-11)

Added 20 pending-review questions under the existing approved present-recognition
and verb-segmentation evidence targets. Present recognition includes regular and
irregular verbs (including reading and writing verbs); segmentation probes regular
-er stems with present/imperfect endings. This does not claim irregular-stem
coverage. Both targets now have disjoint initial and follow-up pools, with explicit
assessed material identities that exclude generic instructions.

The parallel-review candidate now maps 3,424 questions, with 233 allocated targets
and 309 incomplete targets. The 29 teaching paths still span 52 prerequisite
targets; 14 now lack complete pools, down from 16. Neither human approval nor
production publication was added. The consolidated bank contains 3,906 candidates.

Validation: 345 tests across 89 files pass, typecheck and targeted lint pass;
expansion and parallel candidate reproduce under --check. Rebuilt delivery matrix
and teaching overlap report against the updated assembly.


## Pending-review lesson integration (2026-09-11)

Extended the owner-authorized parallel-review policy with exact teaching-content
checksums. Released teaching now distinguishes published_pending_review from
human-reviewed published lessons. Pending lessons require explicit matching
permission, the correct bank version and valid exposure mappings; they cannot
carry fabricated review provenance. Existing reviewed-only behavior is preserved.
The service, teaching view and material recording accept the typed release union.

The candidate includes all 37 lessons and 183 guided exercises. Exact assessed
material and reading-passage matches populate question exposure exclusions.
Thirty-three lesson targets have allocated pools; 29 still have sufficient
follow-up capacity after teaching exclusions. Only those 29 receive proposed
instruction/practice bindings. Semantic overlap and real exposure-history review
continue in parallel; exact matches alone do not prove independence.

Computed the prerequisite closure of those 29 paths: 52 targets, of which 16
have incomplete pools. Their exact IDs are in teachingPrerequisiteGaps in the
candidate JSON. This is actionable assembly work for a usable first release,
not a reason to await human content approval. Complete release scope, student
status, deployment and live verification remain unfinished.

A service regression completes a pending-review lesson and its guided exercises,
records exposed questions, and leaves mastery evidence unchanged without adding
a reviewer. Artifact tests reject absent/stale permission, modified answers or
exposure IDs and forged review fields. All 343 tests across 88 granular files,
typecheck, targeted lint and candidate reproducibility checks pass. No live write
or deployment occurred.

## Parallel-review release authorization and prerequisite routing (2026-09-11)

The product owner answered that students should start while review runs in
parallel, and that they will review personally. Recorded this overriding decision
in parallel-review-release-decision.md and updated the roadmap. No further
reviewer-ownership answer or pre-release human content approval is being awaited.

Implemented a separate parallel_review question permission policy pinned to the
bank checksum and selected entry checksums. It admits explicitly selected pending
content without changing canonical approval status. Adapter compilation, release
bank validation and learning-check registry share that permission; session release
identity includes its checksum. Default reviewed-only behavior remains unchanged.
Structural/answer gates, stale-source rejection and evidence criteria remain in
force. Tests verify that removing the policy excludes those pending questions.

Built a reproducible candidate from 3,181 selected expansion/repaired versions
and the existing canonically eligible questions. It has 3,404 mapped questions,
231 allocated targets and 311 incomplete targets. Teaching policy, supported
release scope, student provisional messaging, deployment and live verification
remain to implement. This candidate is not a production activation.

Also corrected graph-directed step-down: when the selected family has an available
prerequisite in another branch, the selector can follow it. Domain/strand/family
time balance and reserved pools still apply; no prerequisite result is inferred.
All 16 routing runs retain their runtime invariants and all ten minimum depth
checks pass. Mixed-profile discrimination remains four of eight; the deterministic
all-incorrect run now has 11 sufficiently evidenced targets (previously 15), while
the all-correct run retains 12. This tradeoff remains subject to calibration.

Full-graph hostile-bundle verification exceeded its old five-second test limit
under the expanded suite. Removed duplicate validation on the standard policy
path and gave that one integration-scale test a 15-second limit; assertions are
unchanged. All 341 tests across 87 granular files, typecheck, targeted lint and
parallel-review candidate reproducibility checks pass. No production write,
approval fabrication or deployment occurred.

## Explicit mixed-profile discrimination checks (2026-09-11)

Added eight contrast checks to the full-graph 35-minute benchmark, scoped to
relevant skills rather than letting success in unrelated domains stand in for
profile discrimination. They require sufficient within-occasion evidence for
both known and weak targets. Verb-specific tense boundaries additionally require
both sides within one verb branch. Reports retain all unresolved expected targets.

Only four of eight checks pass. Verb-specific frontiers, reading inference,
reading reference resolution and COD/COI contrasts remain unestablished. The
--require-discrimination gate exits 1 as intended for those failures. Ten depth
checks and all 16 runs' existing runtime invariants still pass. These are symbolic
routing experiments, not reviewed-content or real-student validation.

The initial diagnostic's Je ne sais pas behavior was also verified: its intentional
easier-prerequisite routing remains unchanged, while results stay unknown without
scored evidence. No selector behavior was changed in this package.

All 337 tests across 85 granular files, typecheck and targeted lint pass. The
reproducibility/depth benchmark passes; the stricter discrimination benchmark is
explicitly failing. The new regressions prevent unobserved/insufficient or
out-of-scope evidence from passing and enforce the same-verb boundary condition.
No content approval, live write or deployment occurred.

## Reviewable before/after question packet (2026-09-11)

Built v3-question-repair-review.{md,json} for all 25 checksum-bound question
corrections across 17 approved evidence targets. Markdown shows original and
revised prompts, instructions, answers, alternatives and choice feedback alongside
the change rationale. JSON additionally preserves complete content, approved
evidence criteria, material/error annotations and per-entry checksums.

The exporter recomputes corrections from the historical source and refuses stale
source checksums, duplicate decisions, a different integrated replacement or
inherited approval. All rows remain pending review. Ten earlier repairs lack
assessed-material identities; the packet marks them explicitly. This catalogue
is not a claim that all remaining questions have been audited or approved.

The base draft generator now validates repaired material/error annotations and
the complete canonical bank before writing, in addition to existing generation
gates. This adds structural protection, not a substitute for semantic review.
Asked the user who will provide the required human French review and made the
packet available in Codex. No reply or review decision is assumed.

All 335 tests across 84 granular files, typecheck, targeted lint, base draft and
review-packet read-only reproducibility checks pass. No question, approval or live
state was changed by the export. Full content coverage and release work remain
open.

## Regular morphology and ambiguous spelling repairs (2026-09-11)

Audited remaining inherited eligible spelling prompts and repaired six clear
scope/answer problems. Regular plural production no longer asks for animal from
animaux. Regular feminine recognition now elicits verte rather than masculine
plural sportifs, and production elicits grande rather than irregular plural
belles. Removed stale answer/feedback fields where MCQ content changed.

The ces/ses recognition prompt now explicitly requests demonstrative reference;
it does not treat either valid interpretation of a context-free sentence as an
error. The danse/dense question supplies the intended meaning rather than
claiming dense is misspelled. The petit justification question explicitly asks
for the feminine singular, since petitesse and petitement also make t audible.
These revised cues narrow the claims: demonstrative recognition and a particular
feminine justification strategy, not uncued general mastery. Difficulty,
vocabulary effects and the fixed-pair novelty contract remain review concerns.

Source-anchored material annotations accompany all six repairs. Their inherited
approvals were removed and their changed content remains pending review. The
bank still contains 3,886 candidates, with 238 canonically eligible and 233 usable
by the granular adapter. Required annotation gaps among eligible questions affect
68 targets. All dependent expansion/core reports were regenerated.

All 333 tests across 83 granular files, typecheck, targeted lint and base draft /
delivery matrix reproducibility checks pass. Regressions exercise the actual
production validator and check target wording, MCQ answers, stale-feedback
removal and anchored material identities. No live writes or deployment occurred.

## Determiner–noun target-fit repairs (2026-09-11)

Checked all six inherited accorder_determinant_nom_ecrit questions against the
approved description, which requires compatible determiner and noun forms.
The foundation production item elicited only a noun; the core mixed adjective
agreement with an article-family ambiguity. Revised all three production tasks
to request determiner plus noun, preserving the determiner family. The irregular
monsieur/messieurs form remains explicit content for difficulty and scope review.
The three recognition items now contrast determiner/noun agreement directly,
without adjective agreement or lexical spelling of plusieurs deciding the answer.

Added source-bound noun-lemma and group annotations, plus two anchored distractor
error families per recognition question. The noun-lemma novelty interpretation,
error-family classification and actual difficulty remain review questions.
Checksum-bound repairs reset all six changed entries to needs_human_review and
remove inherited reviewer provenance. Historical source banks are unchanged.

The consolidated candidate remains 3,886 questions; canonical eligibility is 244,
with 239 usable by the adapter and five unsupported reading questions. Required
annotation gaps among eligible questions affect 72 targets. The overlap audit
now lists 601 questions without explicit assessed identities, of which 36 have
configured conjugator metadata only. All dependent expansion and core review
artifacts were regenerated; base draft and matrix read-only checks pass.

Regressions use the actual answer validator to reject noun-only, mismatched
number and changed-article responses, and validate assessed identities and
contrasting-error annotations. All 332 tests across 83 granular files, typecheck
and targeted lint pass. No live write or deployment occurred. These are review
candidates, not newly approved assessment coverage.

## Relative-pronoun question repairs (2026-09-11)

Inspecting the eligible annotation queue revealed three inherited content defects
under construction_pronom_relatif. The foundation item accepted qu' before tu;
the core item accepted qu' before j'ai. Removed both invalid alternatives while
preserving the correct que answers. The stretch prompt requested rewriting and
replacing an underlined group, contained no such group, supplied que explicitly,
and expected only que. Replaced it with a clear missing-relative-pronoun task.
Difficulty and response-space calibration remain subject to review.

Added checksum-bound replacements to the existing item repair manifest, including
source sentence annotations. The transformed core answer is not annotated as a
shown sentence. Regeneration removes inherited approval from all three changed
entries, reruns structural gates and leaves them needs_human_review. Historical
source banks remain unchanged. No reviewer identity or approval was invented.

The draft bank still contains 730 base items and the consolidated bank 3,886.
Canonical eligibility is now 250, with 245 usable by the granular adapter and
five unsupported reading items. Seventy-four targets still have required
annotation gaps among eligible questions. Added a real read-only --check mode to
the base draft generator and rebuilt expansions, facet/check candidates and
relevant pathway, delivery, teaching and overlap reports.

The actual answer validator accepts each corrected answer and rejects invalid
elisions; regressions also check instructions, pending review and approval
removal. All 331 tests across 83 granular files, typecheck and targeted lint pass.
The base draft reproducibility check passes. No production write or deployment
occurred; full assessment-bank review and pathway coverage remain unfinished.

## Target-specific material annotation queue (2026-09-11)

Verified that question-pool sufficiency already refuses absent assessed word or
sentence identities when the approved evidence contract requires novelty. No
release rule needed weakening or replacement. Added the missing authoring detail
to the delivery matrix: exact question IDs without explicit assessed identities
and without each required identity kind, separated into eligible questions,
exact-target expansion drafts and shared parent drafts awaiting mapping.

The recomputed matrix identifies 75 targets with required annotation gaps among
eligible questions, zero among exact-target expansion drafts, and 125 among
shared parent drafts. These are target counts, not distinct-question totals;
shared parent candidates can occur on several rows. Configured conjugator verbs
and incidental exposure do not satisfy assessed-material requirements. Existing
identities do not establish semantic independence, complete history or approval.
The work queue now names annotation repair as an explicit action where needed.

The helper rejects duplicate questions and unanchored annotations. Regressions
cover metadata-only verbs, explicit empty assessed subsets, missing required
kinds, empty inventories and input immutability. All 330 tests across 83 granular
files, typecheck, targeted lint and the read-only matrix reproducibility check
pass. No source question, approval, release rule or live student state changed.

## Conjugation draft material identities (2026-09-11)

Added source-anchored supplied-infinitive identities to 2,660 existing form
questions, including all 90 negative-command drafts. The common generator now
validates the material annotation before emitting each item. These lemma-level
identities do not assert an unshown answer, a sentence context, or mastery of
another tense/person. Existing sentence-application annotations remain intact.
All questions remain pending review and zero additional items become eligible.

Added an actual read-only --check mode to the conjugation generator and regenerated
the consolidated bank and dependent review reports. The exposure audit now finds
1,172 exact target-material matches with draft teaching; none are eligible items.
This is conservative lemma-level reuse evidence conditional on the lesson being
shown, not proof that all same-verb tasks assess identical knowledge. There are
610 questions without explicit assessed identities, including 36 with only
configured conjugator metadata; 574 have neither. Those uncertainties remain
visible and require review rather than being interpreted as fresh material.

The regression checks every supplied infinitive, absence of asserted sentence or
answer identities, annotation checksums, and all 90 negative commands. All 328
tests across 82 granular files, typecheck and targeted lint pass. No production
write, content approval or deployment occurred. Full release work remains open.

## Pronoun draft material identities and finite response space (2026-09-11)

Inspected the 720 questions with neither assessed material annotations nor a
configured conjugator verb. Fifty-six are existing pronoun expansion drafts with
explicit source/gapped sentence fields. Annotated those two displayed sentences,
with the source sentence as the assessed target. The fully completed answer is
not shown by these cloze questions and is deliberately not asserted as exposed.
Generator validation now checks source anchoring before writing artifacts.

Declared the six possible third-person object-pronoun forms as a finite response
space, yielding a 1/6 guessing floor rather than treating the typed answer as open
production. This conditional estimate still needs calibration for grammatical
cues. Added a real read-only --check path to the pronoun expansion generator.
Existing questions, answers and pending review status are preserved; metadata
checksums and dependent reports were regenerated.

The unresolved overlap-audit group falls from 720 to 664 questions; 3,270 still
lack explicit assessed identities, of which 2,606 have configured conjugator verb
metadata only. Exact teaching overlaps remain 54. No missing identity is treated
as proof of independence. The new regression checks all 56 mappings, source/gap
anchoring, absence of unshown completed-answer exposure, guessing estimates and
zero eligibility promotion. All 327 tests across 82 granular files, typecheck,
lint and affected reproducibility checks pass. No live write or deployment occurred.

## Cross-catalogue teaching/question exposure audit (2026-09-11)

Added a reproducible audit comparing all 3,886 candidate questions with all 37
draft lessons. It records exact explicit assessed word/sentence matches and whole
reading passages across lesson targets and response modes. Fifty-four questions
have exact annotated overlap; none of those are canonically eligible. Exposure is
conditional on showing the relevant lesson, not a reason to globally remove the
question for every student.

The audit also exposes uncertainty instead of treating missing annotations as
independence. 3,326 questions lack an assessed material identity; 2,606 of these
have a conjugator verb in validator configuration. Configured-verb matches are
reported separately, with 1,109 potential matches to taught lemmas. They are not
automatically equivalent to the same tense/person task or reviewed exposure
annotations. Seven hundred twenty questions have neither assessed identity nor
configured conjugator verb. All reading passages resolved and all lessons have
anchored material annotations; semantic overlap, completeness and historical
capture remain unproven.

Regressions cover cross-target sentence matches, not conflating incidental words
with the assessed target, separate metadata-only matches, visible unknowns and
rejection of stale source content. All 326 tests across 81 granular files,
typecheck, lint and audit reproducibility checks pass. No question, approval,
student record or deployment was changed.

## Shared teaching catalogue and pronoun exposure repair (2026-09-11)

Extracted the delivery report's lesson imports into one FRENCH_TEACHING_DRAFTS
authoring inventory. Added a reproducible catalogue containing all 37 lessons and
183 guided exercises, exact target/mode mappings, prerequisites, evidence rules,
complete learner-facing content, per-lesson checksums and material identities.
Export rejects ambiguous target assignment, empty required teaching text and
unanchored material. It creates no PublishedTeachingContent, reviewer decisions
or activity bindings.

The first catalogue run found four pronoun-placement lessons without exposure
annotations. Added their worked sentence pairs, quoted practice source sentences,
answers and explicit boundary/correction examples. The current structured
inventory has no lessons lacking annotations. This establishes anchored known
material, not complete semantic/exposure coverage; completeness review remains
explicit for every lesson.

Regressions verify isolated exported content, exact mapping, no approvals,
pronoun worked/source/answer identities and rejection of ambiguous or malformed
records. All 324 granular tests across 80 files, typecheck, targeted lint and
catalogue/delivery/reuse reproducibility checks pass. No learner-facing text,
live content, approval or deployment changed.

## Uneven determiner profiles and learning refinement (2026-09-11)

Added a reproducible simulation using the actual determiner recognition and
production drafts, canonical guessing estimates, approved evidence criteria and
prerequisite closure. Two deliberately uneven profiles succeed in one response
mode and fail in the other. Each initial module simulation selects seven questions
(210 active seconds), preserves separate results and recommends the exact lesson
for the weaker mode. These durations describe only this module, not the full
diagnostic. First-sitting strengths remain unconfirmed across occasions.

The fixture explicitly supplies synthetic prerequisite evidence and complete
novelty receipts. Removing the prior evidence blocks teaching. Successful fresh
reserved checks over two later occasions confirm only the reassessed mode and
remove its teaching recommendation, leaving the other result unchanged. No stored
content is promoted: synthetic bindings exist only in memory for routing tests.

The audit JSON/Markdown record assumptions, selected question IDs, source checksums,
probabilities, evidence counts and activity recommendations. This establishes
bounded engine/pathway behavior, not question validity or real learner improvement.
All 322 tests across 79 granular files, typecheck, targeted lint and audit
reproducibility checks pass. No live writes, publication or deployment occurred.

## Determiner agreement: controlled production (2026-09-11)

Added 24 original correction tasks under the existing approved
construction_accord_determinant_nom / writing-controlled-production target.
The learner changes only the marked determiner, keeping the noun, determiner
family and possessor unchanged. Cases cover articles, demonstratives, possessives,
gender/number, elision and vowel-dependent forms. Deliberately malformed groups
are task material, not claimed grammatical examples. Per-item finite response
spaces retain conservative guessing floors from 1/4 through 1/2.

Added a separate production lesson with four worked corrections and eight typed
guided exercises. Recognition and production content are selected by their exact
mode. The candidate review reserves 12 initial and 12 later sentences, retains
the approved novelty and multiple-occasion rules and excludes taught sentences.
The correction format is not independent connected writing; noun gender and
lexical familiarity can confound an error, requiring pedagogical review.

Regressions exercise the real exact-answer validator on every expected correction,
including case and apostrophe variants, and reject each other declared form.
They also verify production mapping, disjoint pools, no automatic promotion and
taught-sentence exclusion. All 320 granular tests across 78 files pass. Typecheck
and targeted lint pass after a test-only optional-field typing fix. The browser
fixture passed all eight exercises, wrong-answer feedback, hints, unsent draft
reload and completion at 390px. Inspected the lesson screenshot. Corrected a copied
browser success-message label and removed empty optional-choice placeholders from
the review packet; these did not affect learner behavior.

Regenerated and verified affected reports. Current totals: 3,886 candidate
questions (3,156 expansion drafts), 37 teaching drafts. New content is unapproved;
no live writes, publication or deployment occurred. Stopped the owned Vite server.

## Determiner–noun agreement recognition (2026-09-11)

Added 16 original assessment drafts under the existing approved
construction_accord_determinant_nom / reading-analysis target: twelve present
the construction and four assess its absence, including la, les and leur used as
pronouns. Questions address the noun as agreement controller, separated words,
plural forms that do not distinguish gender and the difference between the
possessor and the possessed noun. The supplied analysis format does not establish
independently written explanation; pedagogical target-fit review remains required.
Production stays a separate evidence target.

Added an exact-target lesson with four worked steps, six guided MCQs and a boundary
covering noun gender, possessive forms and mon amie. The sentence pathway reviewer
now carries source-bound negative-example and contrasting-error annotations into
its capacity preview, matching the runtime adapter. This prevents valid annotated
counterexamples from being silently omitted from the review evidence calculation.
The current candidate split is 8/8, retaining required counterexample evidence in
both pools. A regression exposes all four counterexamples and verifies that the
remaining twelve positive questions and their wrong choices cannot satisfy the
approved negative-example rule.

All 318 tests across 77 granular test files, typecheck and targeted lint pass.
The 390px browser fixture passed six exercises, selected-answer reload, hints,
induced conflict/network retention, feedback reload and completion. Inspected
/tmp/granular-determiner-agreement-teaching-mobile.png; the displayed connection
warning is intentionally induced. Regenerated and verified all affected reports.
There are now 3,862 candidate questions (3,132 expansion drafts) and 36 teaching
drafts. All new content remains unapproved. No live writes or deployment occurred.
Stopped the owned Vite fixture server after verification.

## Follow-up check category variety (2026-09-11)

Inspected the independent-check service and found it still broke evidence-priority
ties by question ID. It now prefers less-exposed categories after required
negative examples, error contrasts, genres and evidence features. Both the
initial selector and follow-up service use categoryExposurePriority, which counts
unique known question IDs and derives skill/mode/category scope from the pinned
bank. Unknown IDs and uncategorized items cannot invent category exposure.

Follow-up history includes answered initial questions, refinements and known
shown/abandoned learning questions. Abandonment affects variety without adding
mastery evidence. This does not establish complete historical material capture.
The existing freshness, exact-target and activity authorization filters remain
in front of category preference.

A service regression uses explicitly synthetic categories on its existing fixture
to verify that abandoning a question leads to an available different category
while refinements remain empty. A helper regression covers duplicate IDs, unknown
IDs and isolation by skill and response mode. All 316 granular tests across 76
files, typecheck and targeted lint pass. No browser UI changed, no approvals were
created and no live write or deployment occurred.

## Runtime person-number category sampling (2026-09-11)

Connected category variety to the runtime adapter, allocator and selector.
canonicalProbeMetrics derives a category only for the approved person-number
evidence target in MCQ format with exactly the six canonical choices and one
correct answer. Labels now live in a small shared category module. Other formats
receive no inferred category. The release-bank guard compares the category with
the underlying question, rejecting invented or altered sampling metadata.

The allocator balances available categories across both new reserves only when
both resulting pools remain sufficient under the unchanged evidence contract.
The selector prefers less-exposed categories within a skill/mode after existing
challenge, evidence-feature and context priorities. Counts come from unique
observations and bank metadata; skips count as exposure but not mastery evidence.
Category counts are precomputed per selection, avoiding repeated bank scans.

Four regressions cover category derivation and tampering, actual pool balance,
six distinct category selections while a fixture target remains unresolved,
and preservation of required distinguishing evidence when a balanced split would
strip it from one reserve. All 314 tests across 75 granular test files, typecheck,
targeted lint and affected report reproducibility checks pass. No new browser or
authenticated backend run was needed for these adapter/selection changes.

The runtime derives its own assignments; it does not publish or consume the draft
review packet. Existing target-level confirmation can still stop before all six
categories are tested. Sampling variety is not category-level mastery or a new
approved evidence criterion. The question/lesson drafts remain unapproved and
the granular release remains disabled. No live writes or deployment occurred.

## Person-number candidate pool balance (2026-09-11)

Inspected the actual candidate assignments after the previous content addition.
The generic 12/12 allocation omitted first-person singular from the initial pool
and second-person singular from the later pool. Added optional category balancing
to the sentence pathway review, with expected categories declared by the
person-number reviewer. The category comes from the checksum-bound question's
correct answer, which must match one of the six recognized labels.

The reviewer repartitions only already selected, unexposed sentences. It checks
both new pools with the same sufficiency function used by the runtime pool guard,
without changing evidence requirements. The current result is two candidates per
category in each pool. Missing category coverage or an evidence-rule failure is
reported explicitly. A regression exposes all second-person singular sentences
and verifies that sufficient overall question counts cannot conceal the gap.

This is a draft review allocation, not runtime category-aware sampling or a new
mastery rule. The production compiler/selector does not yet consume these category
assignments. One or two correct answers in a category do not establish independent
mastery of that category. Further integration and review remain required.

All 310 granular tests, typecheck and targeted lint pass. Verified unchanged
delivery, direct-object and y/en reports and regenerated/verified the person-number
report. No content approval, live write, publication or deployment occurred.

## Person and number: exact-target teaching and assessment drafts (2026-09-11)

Inspected the existing teaching reuse record for distinguer_personne_nombre.
Its bundled lesson combines person/number with stems and endings, with only one
example of person/number. Added a focused draft under that existing approved node,
without extending or modifying the graph. Four worked steps and six guided MCQs
cover speaker/addressee/reference, grammatical number, coordinated subjects,
nonhuman subjects, on and polite vous. The boundary distinguishes verb agreement
from adjective/participle agreement and from identifying a subject unaided.

Added 24 original assessment drafts, four for each of the six person/number
combinations. The subject is explicitly supplied. These assess recognition of
its traits, not independent subject identification or verb production. All six
combinations are offered as choices. Every draft remains needs_human_review.
The combined review packet includes questions, answers, teaching, hints and
boundary explanations. Its candidate split is 12 initial and 12 later questions,
with checksum-bound targets and exact taught-sentence exclusion. Per-pool balance,
semantic overlap, answer cues from verb endings and calibration remain review
requirements; the allocation alone does not resolve them.

Two regressions verify the grammatical/reference distinctions, lack of promotion,
disjoint candidate pools and exclusion after a sentence is taught. All 309 tests
across 74 granular test files, typecheck and targeted lint pass. The 390px browser
fixture passed all six exercises, unsent selection reload, hints, induced conflict
and network-error retention, feedback reload and completion. Inspected the mobile
screenshot; its network warning is intentionally induced by the fixture.

Regenerated and verified the expansion, consolidated candidate, delivery matrix,
all affected pathway reports and offline teaching reuse report. Totals are now
3,846 candidate questions, including 3,116 expansion drafts, and 35 exact-target
teaching drafts. No approvals, publication, live writes or deployment occurred.
Stopped the owned local Vite server after verification.

## Teaching coverage reconciliation and authenticated journey result (2026-09-11)

Recovered the terminal result from the existing native browser process rather
than restarting it. The full application-schema test passed login, assessment,
pause/reload/resume, final results, teaching, guided practice and an independent
check updating persisted learning evidence. Concurrent submissions, lost-response
retry and another authorized student's attempt to access the owner's session
also passed. This uses an isolated local backend, synthetic release and accelerated
assessment clock; it is not a production or pedagogical validation.

The delivery matrix now displays teaching and guided-exercise draft counts by
domain and by target, with separate next actions for questions and teaching.
Generation rejects missing or multiple target assignments for any teaching draft.
Current totals are 34 targets with exact teaching drafts and 508 without them,
across 542 proposed evidence targets under the approved French graph. These are
not 508 necessarily distinct lessons to author: broader existing content must be
reviewed for exact scope and may be adapted. Drafts remain separate from approved
instruction and published activity bindings. Regenerated the dependent reuse
report offline; both report reproducibility checks, typecheck and targeted lint pass.

## Assessment and independent-check draft recovery (2026-09-11)

Added tab-local unsent answer recovery for initial questions and independent
checks, including reading support selections and edited writing revisions.
Restoration requires the server's current session, question/check and writing
stage; offered-choice IDs must still be valid. Completed/advanced answers clear
the cache, and storage errors cannot prevent answering. Client reconciliation now
also requires the same session before retaining an in-memory answer.

The reading and writing browser fixtures passed unsent-answer reload checks,
conflict/network retention and submitted payload assertions. The granular suite
previously passed 307 tests; the final session-identity adjustment was verified
again with all 12 cache/client-state tests. The authenticated journey result above
adds full server-action integration evidence, not content completeness. No live
database write, approval, publication or deployment occurred.

## Guided answer order parity and unsent draft recovery (2026-09-11)

Inspection confirmed production already shuffles guided MCQs with a stable
session/lesson/exercise seed. The browser fixture had shown raw authoring order;
it now uses the production shuffle algorithm and seed, while retaining explicitly
fixture-only choice IDs. It also rejects answer text in place of an offered MCQ
ID, matching the production service boundary. The browser test compares displayed
order directly against production teachingChoices output.

The stronger reload check then exposed a real UI gap: an unsent guided answer was
kept through request errors but lost on page reload. Added a single sessionStorage
draft scoped to the current server-owned session, lesson and exercise. It restores
only a current offered choice ID (or at most 1,000 typed characters), and clears
on feedback, leaving practice or an empty draft. It is tab-local, not assessment
evidence or cross-device persistence. Malformed/denied storage fails harmlessly;
other sessions/exercises cannot restore the saved draft. Initial diagnostic and
independent-check draft persistence are outside this bounded change.

Four unit regressions cover scope and choice changes, submitted/abandoned clearing,
typed answers and malformed/unavailable storage. All 302 granular tests across
72 files, typecheck and targeted lint pass. Eight reading lesson browser scenarios
passed 32 exercises with production choice-order parity and selected-answer reload.
Five y/en lesson scenarios passed 20 typed exercises with unsent-answer reload,
feedback and completion. Stopped the owned Vite server. These are browser fixtures,
not a new authenticated backend run or production deployment.

## Vocabulary-reading lessons and cross-lesson passage exclusion (2026-09-11)

Added two exact informational-reading lesson drafts for local-definition and
example/contrast vocabulary inference, each with three worked steps and four
guided questions. The first teaches definition markers and context-specific
meaning; the second teaches combining relevant examples and contrasts, checking a
candidate meaning and rejecting irrelevant details. Both explain when an inference
is unsupported. The total teaching catalogue now contains thirty-four drafts.

Added explicit whole-passage exposure annotations to the older narrative reading
lesson drafts as well as the new vocabulary content. Reading pathway review now
excludes a candidate whose normalized whole passage appears in any supplied lesson
and records checksums for the whole lesson set. A regression places a vocabulary
assessment passage in a different lesson and verifies exclusion and the resulting
insufficient pool. This exact-match check does not establish semantic novelty,
complete excerpt coverage or past exposure outside the supplied lesson set.

Both new 390px browser fixtures passed all eight guided exercises, selection
retention through intentional conflict/network errors, hints, feedback reload and
completion. Visually inspected /tmp/granular-reading-teaching-mobile.png; the
network warning is deliberately induced. All 298 granular tests, typecheck,
targeted lint and affected report reproducibility checks pass. The eight reading
lesson reviews have separate candidate initial/later pools; all remain unapproved.
Stopped the owned Vite server. No publication, live write or deployment occurred.

## Short-passage vocabulary evidence (2026-09-11)

Added sixteen original informational micro-passages under two existing approved
reading nodes: deduire_mot_definition_locale and deduire_mot_exemple_contraste.
Eight use an explicit local definition; eight require inference from examples or
contrasts. Every item supplies four answer choices and source-anchored supporting
excerpt choices. All passages remain within the 60-word authoring bound. These
questions do not depend on outside factual knowledge and do not claim transfer
across other text genres.

The reading expansion now contains 64 passages across eight refined targets.
Extracted a shared reading authoring inventory used by generation and the artifact
regression, eliminating their previously duplicated lists. The test checks every
prompt, support quote, mapping checksum, passage uniqueness, length and unapproved
status. Full review text includes answers, distractors, alternative excerpts and
mapping rationale. Educator review still needs to assess ambiguity, distractor
plausibility, supporting-span alternatives and word difficulty.

All 297 granular tests across 71 files, typecheck, targeted lint, source
reproducibility and dependent report checks pass. The consolidated candidate is
3,822 items including 3,092 expansion drafts; canonical eligibility 253 and granular
usability 248 are unchanged. Exact vocabulary-reading lessons and their pathway
reviews remain to be authored. No graph approval, live write or deployment.

## Retaining compatible surplus under novelty requirements (2026-09-11)

The novelty-aware allocator previously stopped at a sufficient core and discarded
all remaining questions, even if their target material was distinct and safe.
After finding the core it now retains compatible surplus, assigning it across
initial and learning pools (or only learning for deferred targets). Compatibility
is checked across the union of both pools: a new target alone is not enough if
that question's context exposes an already reserved target. No novelty rule or
other evidence threshold is weakened; excluded inventory remains reported.

Three regressions verify twelve fresh-word questions remain in a 6/6 allocation,
a spare question exposing another target is excluded, and all eight compatible
sentences are retained for a learning-only target. Existing tests cover duplicate
words, distinguishing features, missing annotations, search limits and source
immutability. All 297 granular tests across 71 files, typecheck and targeted lint
pass. Regenerated and checked the affected coverage/pathway reports and teaching
reuse audit. Existing six conjugation preview counts are unchanged; this change
does not claim new approved coverage or newly eligible content.

This affects compilation of new pools, not stored historical assignments. The
last native service journey remains the preceding passing run; this follow-up
was verified at the allocator boundary with the full granular suite. No live
write, approval or deployment occurred.

## Spare y/en capacity and balanced pool compilation (2026-09-11)

Added twenty new full-sentence y/en transformations, four per existing target,
without renumbering earlier items. Each target now has eighteen candidates.
New allocations share surplus between initial and later pools when both retain
all evidence conditions; historical stored pool assignments are not rewritten.
The direct-object preview consequently changes from 12/4 to 8/8, and y/en now
allocates 9/9 rather than leaving the follow-up pool at its seven-item minimum.

The larger pool exposed a real bounded-search failure: the allocator enumerated
small combinations unable to pass the guessing gate and reached search_limit
before trying seven-item subsets. It now derives a safe lower bound from the
most favourable guessing probabilities, skipping only impossible sizes. The
threshold itself is unchanged. Surplus transfers check both pools for sufficient
items, contexts, distinguishing features and other criteria before moving an item.

Regressions verify 18-item binary pools compile as 9/9, rare required features
remain in both pools, a taught y/en sentence can be excluded while capacity stays
sufficient, and excluding five correctly leaves insufficient coverage. All 294
granular tests across 71 files, typecheck, targeted lint and affected artifact
checks pass. Current total is 3,806 candidate questions including 3,076 expansion
drafts; canonical eligibility 253 and granular usability 248 are unchanged.

The full native authenticated --service-journey also passed on a disposable
local database with 143 application migrations: answers, pause/resume,
accelerated 35-minute provisional results, lesson, guided practice, independent
check, persisted evidence and other-student denial. Local services were cleaned
up. No browser-run, pedagogical approval or production deployment is claimed.

## Y/en pathway feasibility across the lesson set (2026-09-11)

Added a checksum-bound pathway review for all five y/en lessons and their exact
assessment facets. Extracted the direct-object sentence-review mechanics into a
shared helper. Both wrappers retain their own source scope, report version and
required reviews. The helper now checks exposure against every supplied lesson,
not only the lesson for the currently considered target, and records checksums
for that full lesson set. It retains per-target sentence deduplication and does
not return a publishable assessment or activity bindings.

Current y/en candidates have no exact annotated teaching overlap; every target
retains seven initial and seven later questions. Three new regressions verify
five distinct facet assignments and source immutability, exclusion of a place
question taught as a counterexample in the origin lesson, and refusal of an
unanchored exposure annotation. Losing one candidate correctly makes a 14-item
target insufficient under the conditional binary guessing model. This exposes
limited reserve capacity rather than weakening the requirements.

All 292 granular tests across 71 files, typecheck, targeted lint and both affected
pathway report reproducibility checks pass. Semantic paraphrases, unannotated
teaching, activity history, answer variants and calibration remain unresolved
review requirements. No question approval, graph change, live write or deployment.

## Five target-specific y/en lessons (2026-09-11)

Added five draft controlled-production lessons linked to the existing proposed
y/en distinctions under the approved French parent. Each includes three worked
steps and four guided full-sentence transformations. They distinguish place from
provenance, nonhuman à/de complements, and quantity retention. Boundary text
excludes unsupported generalizations about people, all prepositions, infinitives,
imperatives and compound-tense agreement. The quantity lesson explicitly retains
numbers and quantity expressions; the reflexive cases retain se and its elision.

Annotated individual worked-example sentences and guided source/answer sentences
as exposure, added the lessons to the delivery matrix, and generated a full
review packet. There are now thirty-two exact-target teaching drafts. These five
lessons do not grant approval to the facet definitions, bank or pathway bindings.
Assessment/teaching semantic overlap still needs a dedicated review.

All five 390px browser scenarios passed twenty guided exercises, rendered examples
and boundaries, hints, wrong-answer feedback, correct-answer feedback, reload and
completion. Visually inspected /tmp/granular-y-en-lesson-3.png. Typecheck, targeted
lint, exact-target validation and affected report reproducibility checks pass.
The UI fixture leaves assessment results unchanged after guided practice. Stopped
the owned Vite server. No live writes, publication or deployment occurred.

## Y/en controlled-production coverage (2026-09-11)

Added seventy full-sentence transformation drafts, fourteen per existing proposed
construction distinction under approved produire_pronoms_y_en: y for place,
y for à + nonhuman complement, en for provenance, en for quantity and en for
de + nonhuman complement. No new graph nodes or facet approvals were created.
The instruction explicitly asks for y or en, avoiding accidental rejection of
otherwise valid reformulations using cela. Quantity answers retain specified
numbers or quantity expressions; indefinite/partitive cases remain distinct.

Each item records its exact assessed source sentence and full expected answer.
A conditional binary-choice floor of 0.5 prevents treating the written y/en choice
as a large open answer space. It remains a conservative assumption requiring
calibration. Full-sentence errors may also reflect placement, elision or quantity
retention, so the package does not claim to isolate every cause of failure.

The complete review packet lists all source sentences, replacements, answers and
analyses. Its nonpublishing preview allocates seven initial and seven later
candidates for each distinction while preserving graph requirements. Naturalness,
answer variants, finer-target scope, difficulty, teaching overlap and pedagogy
still require review; exact teaching lessons remain to be supplied.

The new source is included in consolidated assembly and all dependent coverage
and pathway reports. Total candidate count is 3,786 (730 base + 3,056 expansion
drafts), with 253 canonically eligible and 248 granular-usable questions unchanged.
All 289 granular tests, typecheck, targeted lint and affected source/report
reproducibility checks pass. No content approval, live write or deployment.

## Release guard against copied assessed MCQs (2026-09-11)

Runtime inspection found that canonical duplicate checking already rejects the
same visible prompt/choice set, but reworded task instructions can distinguish
otherwise repeated questions. Added a granular release-bank guard keyed by exact
skill/mode, normalized assessed sentence identities and normalized sorted choice
set. A repeated combination rejects the release even when question IDs, task
instructions or choice order differ. Different skills and different answer sets
remain separate. No approval or mastery criterion was changed.

This guard depends on anchored assessed-material annotations. It does not infer
missing annotations, detect semantic paraphrases, or prove that differently
worded questions are independent. The engine was not changed to treat every
question on a shared passage as identical, since those can test different things.
A synthetic fixture verifies refusal of the copied MCQ, acceptance after removing
it, acceptance of a different choice set, and source immutability. Its review
identity is in-memory fixture data only, never an actual approval record.

All 289 granular tests across 70 files, typecheck and targeted lint pass. Also ran
the native --service-journey on a disposable local database: 143 application
migrations on real Auth schema, complete graph and synthetic release through
publication guards, authenticated answers, pause/resume, accelerated 35-minute
handoff, saved provisional results, lesson, guided practice, fresh independent
check, persisted evidence and denial of other-student access all passed. The
runner cleaned up its local services. This was a service/HTTP verification, not
a new browser/server-action run or live deployment. Production was untouched.

## Direct-object lesson-to-check independence audit (2026-09-11)

Corrected the direct-object question material annotations: the assessed identity
is now the sentence itself rather than the sentence plus task instructions.
Lesson examples containing multiple sentences now annotate those sentences
separately. This lets exact normalized sentence overlap be detected between a
question and a taught example despite different surrounding instructions.

Added a checksum-bound, nonpublishing pathway review tying the approved target,
lesson, evidence requirements, prerequisites and question sources together. It
excludes annotated taught sentences and reserves an assessed sentence at most once
across initial/later pools. A regression initially failed because renamed copies
could inflate candidate capacity; the reviewer now excludes those duplicates.
Four regressions cover source immutability and allocation, taught-sentence overlap,
renamed repeated sentences and stale mappings. These are review-tool guarantees,
not proof of complete production material history or semantic novelty.

The current sixteen drafts have sixteen distinct assessed sentences and no exact
annotated overlap with the lesson. The preview reserves twelve initial and four
later questions. It does not approve question quality, balanced construction
coverage, independent explanation writing or the guessing model. Eligibility is
unchanged. All 288 tests across 70 files, typecheck, targeted lint and all affected
source/report reproducibility checks pass. No live writes or deployment occurred.

## Direct-object teaching and mobile practice (2026-09-11)

Added one exact-target recognition lesson for the approved
identifier_complement_direct node, with four explained examples and eight guided
questions. The lesson distinguishes the subject, direct object, recipient,
attribute and place; it includes human objects, full noun groups, interrogative
word order and negation. It explicitly limits the who/what heuristic and does not
claim pronoun production or participle agreement. Teaching examples use different
sentences from the assessment package; semantic overlap still requires review.

Recorded example and practice sentence exposure, added the draft to the delivery
matrix, and generated its complete review packet with choices, hints, corrections
and boundaries. The teaching reuse audit was regenerated against the matrix.
Twenty-seven teaching drafts now exist; none becomes approved by this addition.

The 390px browser fixture passed all eight guided exercises, hint use, answer
retention through deliberate conflict/network failures, feedback after reload,
completion and width checks. Visually inspected
/tmp/granular-direct-object-teaching-mobile.png; the displayed network warning is
an intentional test condition. Typecheck, targeted lint, target validation and
all affected report reproducibility checks pass. Stopped the owned Vite server.
No live database, publication or deployment changed. This fixture verifies the
teaching interface, not a released assessment-to-pathway binding.

## Direct-object identification question package (2026-09-11)

Added sixteen review candidates mapped to the existing approved
identifier_complement_direct / reading-receptive evidence target. Twelve cover
objects with different sentence constructions (human referents, expanded or
coordinated noun groups, inversion, negation, compound tense, recipient, time and
place distractors). Four ask the student to recognize that no direct object is
present: indirect complement, place, subject attribute and provenance.

Each choice includes a grammatical analysis. This evaluates selection of a supplied
explanation, not independent explanation writing. Lexical difficulty, obvious
wrong-answer cues and representative distribution in each pool require review.
The review packet lists the proposed initial/learning allocation for every item;
current capacity is twelve initial and four later candidates. This mechanical
allocation is not approval or a claim of balanced construction coverage.

The new source is included in consolidated assembly and all dependent reports.
Source and report reproducibility checks pass. Total candidate count is 3,716,
including 2,986 expansion drafts; canonical eligibility remains 253 and granular
usability 248. All 284 granular tests, typecheck and targeted lint pass. The
approved graph, live database and deployment remain unchanged.

## Tense-recognition question coverage and reproducible assembly (2026-09-11)

Completed the authoring package for sixteen futur proche/passé récent recognition
questions, eight per existing approved recognition target. Cases include negative
forms, intervening adverbs, apostrophe elision, destination/provenance contrasts
and distinguishing a construction from a time expression. These remain recognition
questions; they do not certify conjugated-form production or contextual transfer.

The review packet shows four initial and four later candidate questions per target
under the current four-choice model and graph criteria. Answer validity, cueing,
difficulty and overlap with teaching still require pedagogical review. No draft
has become eligible through this capacity preview.

All bank assembly and associated pathway/coverage reports now use one expansion
source list including the recognition package. Added a read-only --check mode to
the recognition generator so authored-source drift is detected before assembly.
Regenerated and checked the consolidated candidate, recognition review, delivery
matrix, reading/conjugation/agreement pathway reports and teaching reuse audit.
The source regeneration check also passes. There are 3,700 total candidate
questions (730 base + 2,970 expansion drafts); canonical eligibility remains 253
and granular usability 248. The approved graph is unchanged.

Validation: all 284 granular tests across 69 files, typecheck and targeted lint
passed. No database changes, approval records, publication or deployment occurred.
The next content work should follow the uncovered-target queue across domains;
these two targets do not resolve the wider reviewed-bank and pathway gaps.

## Consistent provisional planning through the teaching service (2026-09-11)

Corrected the earlier account: the full application service already allowed
first-sitting gap teaching through learningReadiness's internal within-occasion
substitution. The preceding explicit provisionalGap change unified the direct
priority helper with that behaviour; it did not newly enable teaching in the app.
Removed the obsolete missing/resolved planning substitution. Planning now retains
the official uncertain result, actual occasion count and provisionalGap signal.
Same-day strong-skill deferral is unchanged.

Added a service-level regression for a single-occasion gap: the lesson is offered,
progress and feedback survive view/reload, guided completion leaves the assessment
result untouched, a fresh check is offered next, and a stale request to restart
the completed lesson is rejected. Readiness tests now also assert that provisional
gap planning preserves the official assessment result rather than replacing it.
This is fixture-based service verification, not new content approval.

All 284 granular tests across 69 files, typecheck and targeted lint pass. No UI,
content release, approved graph, live database or deployment changed. The previous
full native browser run remains the latest full browser evidence; this follow-up
was verified at the affected service boundary and with the full unit suite.

## Teaching from provisional first-sitting gaps (2026-09-11)

Direct priority-helper testing exposed a missing explicit provisional-gap signal.
The application service already supported first-sitting teaching by substituting
a within-occasion result for internal planning; it was not blocked from teaching.
The evidence engine now exposes a separate
provisionalGap signal when every applicable evidence condition except the number
of occasions is satisfied and the consistent recent result is a gap. The official
status remains uncertain/unresolved. No mastery or confirmed-gap criterion is
lowered. The pathway builder can recommend exact-target teaching for this signal
with reason provisional_gap, preserving prerequisite readiness and published
activity checks. After teaching completion it requests independent verification.

Four regression scenarios cover uneven agreement constructions with strong subject
identification, absence of teaching diagnosis for skips/missing novelty/context or
mixed recent responses, prerequisite blocking and post-lesson verification, and
separate later learning occasions before mastery. The tests use explicit synthetic
verified material history and fixture activity bindings; they are not content
approvals or empirical student calibration. Untested skills remain verification
work, and missing exact teaching content is still an availability gap.

All 283 granular tests across 69 files, typecheck and targeted lint pass. The full
French routing benchmark passes its depth gates. The authenticated native Next
browser journey passes through assessment, pause/reload/resume, saved results,
lesson, guided practice and independent-check update, including duplicate/lost
response recovery and student isolation. It uses the real local Auth/full schema,
synthetic content and a controlled assessment clock. No live deployment, database
write, graph approval change or pedagogical release approval occurred.

## Agreement response-space model and additional candidate capacity (2026-09-11)

Agreement drafts now declare a conservative finite response space: third-person
singular versus plural, conditional on knowing the verb's forms. This yields a
0.5 guessing floor instead of the open-response default 0.05. It is an explicit
model assumption for review/calibration, not an empirical student guessing rate.
The existing 0.01 confirmation threshold therefore requires seven all-correct
answers, alongside unchanged accuracy, novelty and occasion requirements.
Earlier 3/3 candidate allocation claims are superseded by this model.

Added 24 original agreement drafts, six per construction, yielding 14 distinct
verbs per target and feasible separate 7/7 initial/follow-up pools. The agreement
expansion now contains 56 agreement plus 16 subject-identification drafts. The
consolidated bank contains 3,684 candidates and 2,954 expansion drafts. Eligibility
remains unchanged: none of these drafts was promoted. New answer forms were
computed and inspected; subject mappings, conditional guessing assumptions and
pedagogical validity still require review.

The report includes guessing floors and minimum all-correct pool capacity.
Regressions check the actual question floors, disjoint fresh verbs, rejection of
the earlier eight-item capacity, repeated-word variants, stale mappings and
teaching overlap. The full suite passed 277 tests with two failing updated fixture
selectors; the selectors were corrected to include all 14 expansion items while
excluding unrelated base candidates, and all four pathway tests then passed.
Typecheck and targeted lint pass. Consolidated/delivery/reuse and related review
artifacts were regenerated and verified. No graph criteria, live content,
approvals, database state or deployment changed.

These are minimum candidate pools, not robust calibrated coverage for every
student: prior exposure and errors may demand additional questions or later
occasions. Recognition and independent writing remain separate unfinished scopes.

## Reuse of futur proche and passé récent recognition teaching (2026-09-11)

Adapted the existing conjugation templates into two exact recognition-target
teaching drafts, for reconnaitre_futur_proche and reconnaitre_passe_recent.
Their patterns and opening examples come from the existing lesson source;
explanations and 12 guided exercises now focus on identifying the construction.
Contrasts distinguish aller + infinitive from a destination, venir de + infinitive
from provenance, and grammatical form from time words such as demain. Negation,
an intervening adverb and d’ before a vowel are included. Production and broader
contextual interpretation remain separate evidence requirements.

The teaching catalogue now contains 26 drafts. The source-bound review packet is
v3-periphrastic-recognition-teaching-review.md. The delivery matrix and teaching
reuse audit were regenerated offline and checked; no second live snapshot or
approval was created. Exact node/mode mapping, guided choices and material
annotation anchoring pass the review builder's checks.

Both mobile browser scenarios passed all six exercises per lesson, including
choices, hints, simulated conflict/network retention, reload, feedback and
completion. The passé récent screenshot was visually inspected; the shown network
alert was deliberately injected. Typecheck, targeted lint and artifact freshness
checks pass. The owned Vite server was stopped. No graph changes, publication,
live writes or deployment occurred. Independent assessment capacity and
pedagogical review remain required for these pathways.

## Live French teaching reuse audit (2026-09-11)

Added a read-only, reproducible content audit covering all 181 approved graph
nodes. The captured live source has 181 lesson records, all auto_approved. The
actual practice renderer overrides database lessons for 60 conjugation and 8
pronoun nodes. The remaining 113 rendered cards use the exact generic fallback
instruction pattern. Seventeen groups of nodes share identical substantive
content, including distinct recognition, production and interpretation targets.

The audit follows current renderer precedence, pins source/content checksums,
includes actual explanation/example text and joins each node to its diagnostic
target IDs and existing new teaching drafts. Snapshot completeness and lesson
ownership are checked. It identifies 68 candidates for scope review, not 68
approved granular lessons. This provides a reuse queue before further authoring;
generic cards must be replaced where exact drafts are still absent.

Source: generated/french-v3-legacy-teaching-source.json. Reports:
v3-teaching-reuse-audit.{md,json}. Refresh is explicit and read-only; normal
regeneration/checking uses the captured source. No learner records or credentials
are exported. The live calls only selected competency nodes and lesson content.
Typecheck, targeted lint and offline reproducibility checks pass. No content,
review status, approved graph or database row was changed; no deployment occurred.

## Recorded passage exposure across sessions and releases (2026-09-11)

Reading delivery now records the normalized whole passage in the existing
sentence-material ledger even when optional item annotations are absent. A
separate versioned reading presentation ID preserves immutable earlier question
annotation receipts and keeps retries idempotent. Reading source extraction is
shared with the existing passage-context builder; its context checksum is
unchanged. No database schema change is required.

Known-material loading now queries reading passage keys independently of a
skill's word/sentence novelty flags, resolves matches into the current release's
passage contexts and passes them to later-check exclusion. New initial selections
also exclude known reading contexts, including passages shown but unanswered.
An already-open question remains resumable. Absence in the ledger never establishes
complete history or outside-app unfamiliarity. Older unrecorded activities and
semantic paraphrases remain incomplete, and this is not a new concurrent
first-exposure certification mechanism for reading responses.

Regressions verify recording without optional annotations, stable retry identity,
cross-release lookup despite renamed source/question IDs, exclusion of repeated
passages without novelty flags, missing-source rejection and preservation of a
pending question on resume. All 278 granular tests across 68 files, typecheck and
targeted lint pass; the additional resume assertion passed its focused rerun.
The full native Next browser journey also passes through authenticated diagnosis,
pause/reload/resume, saved results, lesson, guided practice and independent-check
update, including real duplicate/lost-response requests and student isolation.
It uses the full Auth/application schema, synthetic content and a controlled
assessment clock; it is not pedagogical calibration or live release verification.
No deployment, graph approval change or production write occurred.

## Subject-identification teaching and guided practice (2026-09-11)

Added an exact-target draft lesson for identifier_sujet_verbe in recognition
mode. Three explained examples introduce the complete subject, its position
after the verb, and the difference between grammatical subject and the person
performing an action. Six guided MCQs cover a nonhuman subject, a complete noun
group, inversion, coordinated subjects, a passive sentence and coordination in
the object. The boundary explicitly excludes pronoun-subject and complex-clause
coverage; it does not claim all subject constructions are taught or assessed.

The draft teaching catalogue now contains 24 lessons. The reproducible packet
v3-subject-teaching-review.md verifies exact node/mode mapping, answer-choice
structure, guided identity separation and source-anchored exposure. It lists all
choices and explanations for review. Guidance and corrections remain exposure,
not independent evidence or mastery credit. Independent question coverage must
be reviewed separately, especially for the passive contrast introduced here.

All six exercises passed the 390-pixel browser fixture through choice selection,
hints, simulated conflict/network draft retention, reload, feedback and completion.
The saved first-exercise screenshot was visually inspected; its connection alert
is intentional fault injection. Typecheck, targeted lint and teaching/matrix
freshness checks pass. The owned Vite server was stopped. No publication,
approval, graph edit, database write or deployment occurred.

## Separate subject-identification evidence (2026-09-11)

Added 16 original MCQ drafts to the approved identifier_sujet_verbe /
reading-receptive target, four each with adjacent, separated, inverted and
coordinated subjects. The verb is already conjugated; the student selects the
complete subject instead of supplying a verb form. This keeps subject
identification evidence separate from controlled agreement and conjugation.
Construction labels describe question variety and do not create new approved
facets or certify mastery of four additional targets.

The existing agreement expansion now contains 48 drafts: 32 controlled agreement
and 16 subject-identification items. Assembly accounts for each exact target
without changing approval states. The consolidated candidate now has 3,660
questions, including 2,930 expansion drafts; canonical eligible and granular
usable counts remain 253 and 248. The reproducible review packet is
v3-subject-identification-review.md, with full choices, subject explanations and
checksummed item identities. Exact answer uniqueness, source anchoring and target
mapping are checked structurally; linguistic validity and difficulty still require
review. Subject and agreement results cannot establish an error's cause from a
single answer.

All 276 granular tests across 68 files, typecheck and targeted lint pass.
Consolidated, delivery and reading/conjugation/agreement pathway artifacts and
the new review packet were regenerated and verified. No graph change, draft
approval, deployment or live write occurred. Subject-identification teaching and
balanced question selection across its constructions remain further work.

## Agreement lesson-to-check capacity and novelty annotations (2026-09-11)

The agreement expansion now annotates the target verb lemma, its answer form
and the displayed sentence for all 32 draft questions. Previously missing
material annotations prevented enforcing the approved novel-word rule. Teaching
annotations now identify model and guided-practice verbs as exposure as well.
No review status was promoted; all changes are newly checksum-bound drafts.

Added agreement-pathway-review.ts and its reproducible JSON/Markdown report.
It validates source bank identity and exact checksummed facet mappings, carries
approved prerequisites/evidence requirements, and excludes candidate material
already annotated in the corresponding lesson. All four constructions have eight
distinct candidate verbs and a feasible 3-initial/3-later allocation. These are
candidate pools, not published checks or evidence of student mastery. Unused
candidates remain available for future review; the preview does not certify
complete historical exposure, semantic overlap or context-vocabulary annotation.

Three regressions pass: disjoint fresh-word pools without source mutation or
approval, rejection of copied verb evidence with distinct IDs/instructions and
stale mappings, and exclusion of verbs already shown by a lesson. The initial
full run passed the other 275 tests; the one failing new test was corrected to
use distinct instructions so it exercised novelty beyond the existing duplicate
surface guard, and all three new tests then passed. Typecheck and targeted lint
pass. Consolidated bank, teaching, delivery and reading/conjugation/agreement
pathway artifacts were regenerated and checked. The approved graph checksum
verification passes unchanged. No deployment or live write occurred.

Pedagogical review must still distinguish subject identification from conjugation
errors, verify difficulty/prerequisites and validate evidence over multiple
occasions. Recognition and independent writing remain separate unfinished scopes.

## Four exact-target subject–verb agreement lessons (2026-09-11)

Added separate draft lessons for adjacent, separated, inverted and coordinated
subjects under accorder_sujet_verbe_ecrit. Each has three explained examples,
a scope boundary and four guided present-tense exercises. Practice uses regular
third-person forms to focus on the agreement decision. The coordinated target
covers distinct referents joined by et; the separated target explicitly explains
why the closest noun does not necessarily determine agreement.

The delivery matrix now includes these four lessons, bringing the exact-target
teaching draft catalogue to 23. The reproducible review packet is
v3-agreement-teaching-review.md. Its builder verifies exact graph/facet/mode
mapping, distinct guided exercise identities and source-anchored material
annotations. The examples and corrected sentences count as exposure, not
independent evidence. Subject analysis, answer validity, prerequisite scope and
semantic overlap with assessment questions still require pedagogical review.

All four lessons and 16 exercises passed the 390-pixel browser fixture, including
examples, hints, incorrect/correct feedback, saved feedback after reload and
completion without mastery credit. The inverted-subject lesson screenshot was
visually inspected. Typecheck, targeted lint and regenerated packet/matrix
freshness checks pass. No publication, content approvals, graph changes or live
writes occurred. This is instructional coverage progress, not a complete or
activated pathway for these targets.

## Global reading-passage allocation and release checks (2026-09-11)

Question-pool inspection now rejects a passage assigned to both the initial
assessment and later checks, including assignments under different skills.
After target-local allocation succeeds, a bounded search reconciles passage
assignments across connected targets while preserving selected questions and
all declared evidence rules. It updates pool counts and the assignment checksum
only after finding a valid solution. Learning-only targets cannot acquire initial
questions. Search exhaustion is distinct from unresolved retained assignments;
neither result claims that a different source-question selection is impossible.

The learning registry excludes conflicted reserved questions and records their
IDs in coverage. Delivery and learning-check artifacts now expose global passage
conflicts and allocation status. The current eligible bank has no allocated
reserves to reconcile and remains unready; no content approval is implied.

Regression tests cover a repairable cross-skill conflict, deterministic allocation,
unchanged source input, an incompatible retained-question set with a learning-only
target, and registry exclusion. All 273 granular tests across 67 files, typecheck
and targeted lint pass. The native full-schema run applied 143 migrations and
passed graph publication, persistence, access, material and concurrent exposure
checks. Learning, delivery, reading-pathway and conjugation-pathway reports were
regenerated. The approved French graph is unchanged; no deployment occurred.

This allocator reconciles the selected question set. It does not yet reconsider
questions excluded by earlier novelty allocation, optimize across every possible
bank subset, or detect semantically paraphrased passages. Historical exposure
across other activities and releases remains a separate completion requirement.

## Fresh reading checks exclude previously displayed passages (2026-09-11)

Added saved same-session reading-context exposure, including passages displayed
without an answer before the time limit. Results planning and learning-check
selection now exclude any question sharing one of those passage-content identities.
The session transition also rejects direct issuance of an already exposed reading
copy. Existing answered/abandoned item IDs are resolved against the pinned bank
for older states; ordinary verb contexts are unaffected.

Regressions verify an unanswered initial passage survives serialization/time-budget
handoff, its renamed follow-up copy is rejected, and a genuinely different passage
can be issued. All 270 granular tests across 67 files, typecheck and targeted lint
pass. Full-schema persistence/material/concurrency tests and the complete native
Next browser journey also pass. No approvals, deployment or changes to the graph.

This is same-session freshness, not proof of complete history across older
activities or releases. A further pool-audit task remains: detect passage contexts
shared across initial and learning allocations globally, including questions for
different skills, so per-target capacity cannot overstate usable fresh reserves.

## Runtime reading contexts use passage content (2026-09-11)

Replaced source-ID-based reading contexts with a normalized passage-content
checksum in the v3 adapter, refined-target adapter and release-bank validator.
Changing a source ID, question wording, whitespace or Unicode composition no
longer turns the same passage into another text. Explicit textual-support content
is used when present; older items use the same authored passage boundaries as the
student ExercisePrompt renderer. Unidentifiable passage content is rejected.

Existing annotation source keys remain provenance and are not rewritten as new
approvals. The runtime derives its context independently of those aliases, and
release validation rejects a probe that invents another context. The reading
feasibility review now uses this same implementation. Semantic paraphrases still
need human review; this change covers exact text duplication and normalization.

Validation: all 268 granular tests across 66 files, typecheck and targeted lint
pass. The full-graph routing benchmark passes its existing gates. The native Next
browser scenario passes through saved results, teaching and a fresh independent
check, including concurrent submissions, lost-response retry and cross-student
action rejection. The approved taxonomy checksum remains unchanged. Facet, pool,
delivery and pathway review artifacts were regenerated. Granular bundles must be
compiled with the new context identity; no live migration, approval or deployment.

## Reading lesson-to-check capacity review (2026-09-11)

Added a nonpublishing review builder for all six reading teaching targets. It
validates bank identity, exact lesson mapping and source-bound textual support,
preserves graph prerequisites and evidence rules, and pins question, passage and
lesson checksums. All six have eight distinct draft passages and feasible separate
initial/follow-up pools. Their eligible-question count remains zero in this review;
none of the forty-eight drafts was approved or made available to students.

The preview groups exactly repeated passage content under one context even when
question IDs, source IDs and instructions differ. A regression verifies that eight
such variants count as one passage and fail allocation. Separate checks reject
missing textual support and verify disjoint pools, unchanged inputs and preserved
prerequisites. Three tests, typecheck and targeted lint pass.

The report is docs/diagnostic/v3-reading-pathway-review.{md,json}. Semantic
paraphrases, teaching overlap, unresolved evidence enforcement and calibration
still need review. This audit exposed a runtime follow-up: readingContextId still
uses the supplied sourceTextKey. Carry content-based identity into the runtime and
its release validation before treating copied passages as safely deduplicated
outside this review preview. No graph changes, approvals or deployment.

## Informational reading and fact/opinion teaching (2026-09-11)

Added two exact-target teaching drafts: localiser_information_explicite with
informational texts and distinguer_fait_opinion with argumentative texts. Eight
guided exercises distinguish roles, revised dates, locations and quantities, then
verifiable claims, value judgments, uncertain factual claims and mixed sentences.
The lesson explicitly separates a claim's verifiability from whether it is true.
Examples are fictional and differ from the existing assessment draft passages.

Both lessons have source-anchored material annotations; the reading review builder
now validates declared annotations before emitting the packet. Semantic overlap
and complete exposure coverage still need review. There are nineteen teaching
drafts overall, including six reading lessons and twenty-four guided reading
exercises. All six reading targets represented in the forty-eight expansion
questions now have matching teaching drafts. This does not mean all reading
targets are covered or that any new content has been approved.

Validation: exact-target matrix generation, reading review freshness and annotation
checks, typecheck, targeted lint and three reading service tests pass. Both new
lessons completed the mobile browser fixture, including hints, conflict/network
selection retention, feedback reload and all exercises. Their layouts were
visually inspected. Eligibility and publication counts remain unchanged; no
deployment or approvals.

## Narrative-cause teaching and browser source parity (2026-09-11)

Added a draft lesson for inferer_cause_locale / narrative interpretation, a target
with eight existing draft assessment passages but no matching teaching. Familiar
examples introduce inference, relevant textual clues and the difference between
event order and cause. Four guided exercises include an insufficient-evidence
case, so learners are not encouraged to invent a cause whenever one is requested.
Examples use different situations from the assessment passages. Pedagogical and
semantic-overlap review are still required; no approval or mastery claim is added.

There are now seventeen exact-target teaching drafts, including four reading
lessons with sixteen guided exercises. The reading review packet and delivery
matrix were regenerated and target validation passes. The new lesson completed
the mobile UI fixture with selected-answer retention after hint/conflict/network
failure, feedback reload and all four exercises; its rendered layout was inspected.
Six targeted tests, typecheck and targeted lint pass. Question eligibility is
unchanged.

The isolated workspace now includes both root instrumentation modules. The
environment still excludes hosted telemetry credentials. The complete native
Next browser suite passes with this source-copy change, including concurrent
duplicate submissions, lost-response retry, saved results, teaching, a fresh check
and another authorized student's rejected action request. This closes the source
parity follow-up recorded below. No hosted changes or deployment.

## Browser concurrency, lost-response retry and action ownership (2026-09-11)

Extended the real Next browser scenario to forward two concurrent copies of the
first answer to the actual server, discard their responses, and retry from the
visible form. The application preserves the answer draft and reconciles the stale
revision. A direct database comparison verifies exactly one unchanged observation
before and after the retry. No fake successful response or mocked store is used.

After completing results, teaching and the independent check, a second student
logs in through a separate browser context. Both students have local consent, so
the second is otherwise authorized to use the diagnostic. Replaying the captured
first-student action with the second student's cookies returns Diagnostic
introuvable and leaves the owner's full state unchanged. The second student's own
diagnostic remains at its initial start screen.

Validation: the extended full browser scenario, final saved time/learning checks,
typecheck and targeted lint pass. This adds real action-boundary coverage beyond
raw database RLS checks. Content remains synthetic and the assessment clock remains
isolated to the disposable copy. No deployment or pedagogical approvals.

Harness follow-up: the source-copy allowlist currently omits the two root Sentry
instrumentation modules. They should be included for closer application parity,
while retaining the scrubbed environment so hosted telemetry stays disabled.

## Actual Next.js browser journey through learning (2026-09-11)

The native harness now runs the real Next application from an isolated source copy
with no hosted dotenv files. Real login establishes cookies; the application's
role/access checks and server actions handle diagnostic answers, a skip,
pause/reload/resume, saved results, a recommended lesson, guided practice and a
fresh independent check on the same skill. The final database assertions confirm
time-budget completion at 2,100 active seconds, one correct independent refinement
and retained lesson completion. The mobile browser reports no page errors or
horizontal overflow. The final screenshot was produced for visual inspection.

Only the disposable copy's action calls receive the existing service clock callback,
reading a harness-owned file. The source application's clock behavior, evidence
rules, grading, authentication and time limit remain unchanged. A three-hour pause
does not spend assessment time. Stop assertions follow elapsed active time, not
a fixed question count, because background pulses also record activity.

The first full run selected an incorrect reading-support choice and correctly
reopened teaching after the check. The final scenario uses explicit answer text
and the correct supporting passage; both the browser update and saved evidence
pass. Content remains synthetic and integration-only, with no real approval.

Validation: browser journey, typecheck, targeted lint and full-schema SQL/graph/
material/concurrency regressions pass. Next browser coverage still needs competing
sessions, cross-student action requests and network-retry scenarios. This does not
establish content completeness, pedagogical calibration or production readiness.
No hosted changes or deployment.

## HTTP-backed diagnostic, teaching and independent check (2026-09-11)

The native runner now has a service-journey mode. It seeds the complete approved
French graph and explicitly synthetic bank/activity bundle through normal database
publication guards, then uses the production SupabaseAssessmentStore and command
services over actual PostgREST. Real Auth creates the student and profile; the
test supplies local consent and an accelerated server clock.

A struggling profile submits sixty answers/skips, pauses overnight, resumes
without spending inactive time, and reaches provisional results at 35 active
minutes. Its recommended lesson opens, guided practice completes without adding
mastery evidence, and a fresh check on that same skill persists one refinement.
Material-delivery receipts are written through the production RPCs. Raw session
state is correctly denied to both student clients, including the owner, because
access is through server actions rather than direct browser table reads.

The initial twelve-answer profile recommended verification rather than teaching;
the test was expanded to establish an evidence-backed learning gap instead of
forcing a lesson recommendation. This service journey passes, as do typecheck,
targeted lint, and the existing full-schema SQL, release, persistence, material
and concurrency harness. Default SQL fixture invocation still rolls back;
only the owned native harness retains its synthetic release until cleanup.

This verifies store/service integration, not Next.js server-action authorization,
browser rendering, real question validity or assessment calibration. Those remain
separate delivery requirements. No hosted changes, approvals or deployment.

## Real authentication and full-schema HTTP integration (2026-09-11)

The native integration runner now applies all 143 application migrations after
official Supabase Auth migrations, then runs official PostgREST with JWT validation.
Two student signups provision actual application profiles and student records;
authenticated HTTP queries verify their ownership and separation. Password login,
getUser, token refresh, logout, service-role access and anonymous row exclusion
also pass. This removes Docker availability as the dependency for further local
HTTP integration. It does not yet verify the Next.js diagnostic-to-learning journey.

The runner uses disposable socket-only PostgreSQL, loopback HTTP services, random
local credentials and no application dotenv files. It cleans up services and data
after the test. Dependency versions are Auth v2.197.0 and PostgREST v14.18, using
official macOS ARM archives whose SHA256 values were checked against release
metadata. Production version parity is not asserted.

Validation: `granular-native-http-smoke.mts <verified-native-dependency-dir>
--app-schema`, typecheck and targeted lint pass. No hosted data, graph approval,
content review state or deployment was changed. Next: seed the graph-bound isolated
test release and execute the authenticated application journey through learning.

## Sentence-based checks for all six conjugation lesson targets (2026-09-11)

Added forty-eight original supplied-tense sentence gaps for regular-er, regular-ir,
aller and faire, with each grammatical person represented twice per target. The
sentences use varied situations, pronouns and explicit noun subjects; answer forms
come from the deterministic conjugator. All remain needs_human_review, with exact
present-production target mappings and source-anchored exposure annotations.

The pathway review now allocates an additional sentence-only pool proposal. All
six lesson targets have sufficient disjoint initial and follow-up sentence pools
under the current criteria, including the ger/cer feature requirements. This
avoids relying on isolated-form prompts to assert application capacity. Exact
completed sentences do not repeat the guided examples; semantic transfer and
exposure overlap still require review, and no mastery or publication is implied.

The consolidated candidate now has 3,644 questions, including 2,914 expansion
drafts and 2,720 conjugation drafts. Canonical/granular eligibility remains 253/248.
The updated pathway packet includes all sixty sentence prompts and answer keys.

Validation: 264 granular tests across 65 files, typecheck and targeted lint pass.
The new regression checks all forty-eight expected forms, six-person coverage,
nonidentical teaching sentences, exact target mapping and draft status. Pool tests
verify sentence-only disjointness and minimum capacity. Reports regenerated;
no approvals or deployment.

## Lesson-to-check feasibility and ger/cer feature capacity (2026-09-11)

Added a nonpublishing review builder for the six exact conjugation lessons. It
checks source bank identity, preserves the approved graph/prerequisites, pins each
lesson and question checksum, and proposes disjoint pools using actual evidence
rules. It never changes question status or returns published bindings. The first
run found that ger/cer had only three distinctive nous forms, insufficient for
two pools requiring three such items each, despite 24 total drafts per target.

Added twelve controlled sentence-gap drafts across manger/nager/voyager and
commencer/lancer/avancer, with deterministic nous forms, spelling-feature tags and
source-anchored exposure annotations. Verb-context grouping stays conservative:
two sentences about one verb do not manufacture another verb context. All six
lesson targets now have feasible draft pool splits. Sentence application and
teaching-overlap review are still needed; supplied-tense gaps do not assess tense
choice or independent writing. All six currently have zero eligible questions.

The consolidated candidate now contains 3,596 questions (2,866 expansion drafts,
including 2,672 conjugation drafts). Eligibility remains 253 canonical / 248
granular. The review packet is `v3-conjugation-pathway-review.md` with a companion
JSON and the twelve actual prompts/answers; nothing has been approved or deployed.

Validation: 263 granular tests across 65 files, typecheck and targeted lint pass.
New tests verify disjoint pools, actual distinctive-form counts and multiple verb
contexts, unchanged inputs/statuses, and reproduction of the capacity failure when
the sentence additions are removed. Consolidated and delivery artifacts refreshed.

## Six exact-target present-tense lessons and forty guided exercises (2026-09-11)

Added teaching drafts for regular-er, the finir-family, ger/cer spelling adjustments,
aller and faire at the present. Each maps to its exact production facet, starts with
a concrete example, explains the mechanism and its limits, presents all six forms,
and supplies guided practice with hints and sentence-level correction. Ger/cer
practice contains three distinct nous contexts plus the other five persons.

Forms and answer keys are generated through the deterministic conjugator; forty
expected forms are independently asserted in tests. Exposure annotations include
explicitly introduced verbs and displayed example/correction sentences. Review must
still assess semantic overlap and incidental vocabulary before publication. Guided
answers never become independent diagnostic evidence. The review packet is
`v3-conjugation-teaching-review.md`; the delivery matrix now includes sixteen teaching
drafts, while published bindings and review eligibility remain unchanged.

Validation: 261 granular tests across 64 files, typecheck and targeted lint pass.
The browser fixture completed all six lessons and forty exercises at mobile width,
including hints, deliberate mistakes, corrections, feedback reload, completion and
unchanged results. A rendered cer-pattern lesson was visually inspected; paradigms
retain line breaks and fit the viewport. This is fixture-backed UI verification,
not authenticated Supabase HTTP. No content approvals or deployment.

## Recognition and interpretation follow the draft tense order (2026-09-11)

Versioned the probing contract as french-conjugation-probing-v2 and added explicit
approved-node mappings for tense recognition, interpretation and the PC/imperfect
contrast. Only the compiled draft assessment receives these ranks; the approved
base adapter and graph remain unchanged. Each node/evidence keeps its identity,
and recognition/interpretation never supplies form-production credit.

The all-correct full-graph run now follows general foundation evidence with
near-future interpretation rather than conditional interpretation. All sixteen
profile runs retain runtime/family safeguards and all ten depth checks pass.
General concepts outside the explicit mapping retain graph depth; calibration,
entry-point selection and broader within-domain coverage remain outstanding.

Validation: 259 granular tests across 63 files, typecheck and targeted lint pass.
Two added tests verify the exact approved-node scope and interpretation progression
without production credit. Draft facet, assessment, check and delivery artifacts
regenerated. No graph changes, content approvals or deployment.

A bounded Docker daemon health request was retried after these checks and still
timed out after five seconds without a response. Actual local Supabase Auth/HTTP
integration remains unavailable; this does not block independent content or engine
work and is not being counted as an end-to-end pass.

## Separate draft probing order for conjugated forms (2026-09-11)

Added versioned draft challenge ranks for the eleven verb-form tense/mood families.
The refined compiler attaches them to individual-verb and pattern targets; the
selector uses them for entry, simpler/harder probes and boundary rechecks. Approved
hard-prerequisite depth, edges and evidence requirements stay unchanged. Metadata
is pinned in release identity and validated against the draft routing contract.
The generated facet catalogue exposes the contract for review.

Present production actually has greater hard-prerequisite depth than conditional
production (2 versus 1), so depth could not serve as the intended difficulty order.
The full-graph run now starts form probes at present and then near future. General
interpretation targets still use graph depth, and ranks/entry/branch limits require
pedagogical calibration. See `conjugation-probing-order-review.md`.

Validation: 257 granular tests across 63 files, typecheck and targeted lint pass.
Four new tests cover present-first selection, upward probes, downward probes with
a fresh boundary recheck, unchanged graph depth and rejection of altered ranks.
Facet, assessment-candidate, learning-check and delivery reports regenerated.
No approval or deployment; the graph and content release remain unchanged.

## Conjugation concepts, patterns and individual verbs all receive time (2026-09-11)

Added family balancing inside the conjugation strand, using the existing pinned
branch identities produced by the facet compiler. General/construction branches,
regular/spelling patterns and individual verbs share conjugation time before their
bounded branch visits. This does not create graph nodes, infer cross-verb mastery
or change other strand allocations. Unavailable families are skipped.

The full-graph benchmark now independently checks family coverage against the
facet catalogue. All sixteen sessions reach all three families. The regular versus
irregular profile gathers sufficient within-occasion evidence on correct regular-er
forms and incorrect aller forms separately, where previously no weak verb target
was sampled. All ten strand-depth checks still pass; the deterministic extremes
retain 12/15 sufficiently evidenced targets in 35 minutes. Verb-specific boundaries
remain incomplete, and equal-depth tense ordering is the next routing issue.

Validation: 253 granular tests across 62 files, typecheck and targeted lint pass.
Three new tests cover abundant competing concept branches, zero-time skips and a
missing pattern pool; they also verify that an untested verb receives no mastery.
No graph edits, approvals or deployment.

## Bounded branch visits and confirmation at the difficulty floor (2026-09-11)

The selector now spends up to six questions per branch visit within a strand,
retaining domain/strand time balance on every selection. It rotates sooner when
available evidence resolves or exhausts the branch. Skips count toward the visit
limit. At the easiest available difficulty it confirms an incorrect response on a
fresh question instead of drifting to another target at the same level.

The full-graph extremes now reach sufficient within-occasion evidence for 12
all-correct and 15 all-incorrect targets, versus earlier minimum-item coverage of
five and zero. Every strand has at least one such target; all ten strengthened
depth checks pass. Breadth decreases to 21/25 sampled targets from 42/48. This is
not full profile discrimination: general/construction branches still crowd out
specific verbs in the regular/irregular and tense-boundary profiles. Family-level
sampling and challenge ordering remain outstanding. Approved criteria unchanged.

Validation: 250 granular tests across 61 files, typecheck and targeted lint pass.
Five new cases cover consistent correct/incorrect outcomes, contradictory-answer
rotation, skipped-question limits and confirming difficulty-floor failures. The
six-target legacy benchmark retains zero deterministic classification errors;
its stochastic results remain uncalibrated. No content approvals or deployment.

## Full-graph routing audit exposes insufficient depth (2026-09-11)

Added a reproducible 542-target benchmark using real refined graph compilation,
question-pool allocation and timed session transitions. Thirteen detailed profiles
produce sixteen runs, including four guessing seeds. Symbolic content has no review
approvals and is explicitly unsuitable for publishing or content-coverage claims.

The all-correct session samples 42 targets in 61 questions, but only five targets
reach the required minimum item count; conjugation and reading receive one question
per sampled target. The all-incorrect session samples 48 targets with none reaching
minimum item count. An explicit minimum-depth gate fails eight of ten strand/profile
checks. This identifies a routing defect to address before pedagogical validation;
passing timing and evidence-isolation assertions is not sufficient.

See `full-french-routing-review.md` and `full-french-routing-report.json`. Next work
must balance branch confirmation with broad strand sampling and validate equal-depth
challenge order, without weakening approved evidence rules. No deployment or approval.

## Restricted typed-answer guessing evidence (2026-09-11)

Added source-owned finiteResponseSpace annotations for typed questions with a
small set of possible responses. The schema checks distinct nonempty alternatives,
an explanatory rationale, compatible written formats and inclusion of every
accepted answer. It supplies a conservative guessing floor of 1/alternative
count, never below the existing 0.05 written-answer estimate. MCQ probabilities
remain based on their displayed choices; incompatible mixed annotations fail.

All 26 nasal-spelling drafts now declare their two possible m/n completions.
Typing a complete word therefore retains a 0.5 guessing floor instead of being
treated as an unrestricted response. The existing source-consistency release
guard checks this value through canonicalProbeMetrics. The review packet exposes
the alternatives and floor explicitly. This is a conservative authoring assumption,
not measured calibration or review approval.

Validation: 245 granular tests across 60 files, typecheck and targeted lint pass.
A regression demonstrates that three correct binary typed responses cannot
confirm mastery under this floor; separate tests reject inconsistent annotations
and ensure the baseline floor cannot be lowered. Source annotations, consolidated
checksums and the delivery matrix were regenerated. Approved criteria and the
pending homophone proposal are unchanged; no deployment.

## Lexical spelling lesson and guided practice (2026-09-11)

Added an exact-target draft lesson for appliquer_m_devant_m_b_p with examples,
plain explanations, unchanged-n contrasts, an exception and eight guided
exercises. The ten annotated target lemmas are distinct from the new assessment
word set. Related-word transfer and full incidental-vocabulary exposure still
require review; this is not a published lesson or an independent mastery check.
The spelling review packet and delivery matrix now include three spelling
lessons, bringing the exact-target teaching draft catalogue to ten lessons.

The mobile browser fixture completes all eight exercises, checks a hint and an
intentional incorrect exception response, reloads feedback, and verifies
completion without adding mastery results. Visual inspection exposed collapsed
line breaks between examples; the shared lesson renderer now preserves them.
The browser check was rerun and the corrected screenshot inspected.

Validation: 242 granular tests, typecheck, targeted lint and the spelling lesson
browser fixture pass. The first browser attempt raced the asynchronous fixture
save; the runner now waits for that actual saved state before preparing its
scenario. This remains fixture-backed UI verification, not authenticated HTTP.
No content approvals or deployment; the homophone correction is still pending.

## Lexical nasal-spelling draft coverage (2026-09-11)

While the homophone correction decision remains pending, added 26 original
controlled-production drafts under the approved appliquer_m_devant_m_b_p node.
They cover m before b, p and m, unchanged n in other positions, and the lexical
exceptions bonbon and bonbonne. Students reconstruct the whole word from a
sentence with one missing letter; the complete spelling is not displayed in the
prompt. Target-word exposure annotations are source-anchored and mappings remain
bound to the approved parent evidence, with no new facet or approval.

The spelling review packet and consolidated delivery matrix include these
drafts. There are now 3,584 candidate questions and 2,854 expansion drafts;
canonical eligibility remains 253 and granular usability 248. The review notes
explicitly require checking contrast coverage, related-word independence and
guessing estimates for single-letter reconstruction before release. These drafts
do not establish complete coverage or mastery of the entire node.

Validation: 242 granular tests across 59 files, typecheck and targeted lint pass.
Regression checks verify masked-word reconstruction, absence of the answer from
the prompt, exact parent evidence mappings, retained draft status, source
checksums and the presence of contrasting n/exception cases. Artifact regeneration
is reproducible. The approved graph is unchanged; no deployment.

## Fixed-pair homophone novelty feasibility (2026-09-11)

Verified a conflict between the approved evidence rule and its current runtime
interpretation for seven homophone competencies, covering 14 evidence targets.
Each requires at least three distinct items with novel assessed words, but its
fixed pair supplies at most two distinct target spellings. Different sentence IDs
cannot make those target words new. Recognition tasks exposing both alternatives
can exhaust the pair sooner. This cannot be solved merely by authoring more
examples under the same target-word novelty interpretation.

Added a reproducible feasibility audit using 16 distinct synthetic contexts per
target. All 14 current-rule allocations fail; changing only word novelty to
sentence novelty in a cloned experiment makes all 14 feasible. Item counts,
accuracy, separate recognition/production, contrasting errors, unaided responses
and occasion requirements are retained. The original assessment is verified
unchanged. This is not an approved runtime override or pedagogical validation.

The concrete proposal is in `docs/diagnostic/homophone-novelty-review.md` with a
checksum-bound JSON audit. The delivery matrix now prioritizes contract review
for these targets instead of treating more question drafts as sufficient. A user
decision on a separately versioned correction has been requested because the
user explicitly required the approved graph. No approval has been recorded and
the approved v3 artifact and runtime requirements remain unchanged.

Validation: 241 granular tests across 59 files, typecheck and targeted lint pass;
the audit is reproducible. The synthetic full-graph bank's artificial novel
tokens remain integration fixtures, not evidence that real homophone content
satisfies the existing rule. No deployment.

## Source-bound question measurement estimates (2026-09-11)

Verified that the existing pool schema rejects malformed numerical requirements.
Closed a separate source-consistency gap: otherwise valid compiled probes could
carry different guessing rates, difficulty or expected duration from the source
question. The adapter and release guard now share canonicalProbeMetrics. Four
choices retain a guessing rate of 0.25, and correlated supporting-passage choices
do not multiply that probability. Difficulty tiers and section timing estimates
also remain consistent with the current source policy.

The real release-store regression changes each metric independently, proves the
changed bundle still passes the generic pool schema, recalculates its checksum,
and verifies that release loading refuses it. This prevents an internally
consistent checksum from disguising inconsistent evidence assumptions. The
current written-answer guessing and timing estimates remain heuristics requiring
calibration; this change does not establish their empirical validity.

Validation: 240 granular tests across 58 files, typecheck and targeted lint pass.
The generated delivery matrix remains reproducible without changes. No content
approvals, deployment or claim of completed authenticated integration.

## Release validation preserves prerequisite structure (2026-09-11)

Closed a release guard gap: approved skill names and evidence requirements alone
did not prove that a compiled bundle retained the approved hard prerequisites.
The guard now reconstructs prerequisite sets from the French graph and the
declared facet rules, compares exact sets, and checks the graph-derived challenge
order. It rejects missing, injected, cyclic or duplicate prerequisite entries,
unknown facets, duplicate skill/probe IDs, duplicate evidence slots and competing
parent/refined mastery records. Both the full unrefined graph and the current
542-target refinement compile successfully under this structural check.

Tests include substituting present-tense faire for the required aller prerequisite
of futur proche, and a real release-store call with removed prerequisites and a
freshly calculated bundle checksum. The modified release is refused. Structural
acceptance does not approve draft facets, questions, pedagogy or calibration;
those release requirements remain separate.

Validation: 240 granular tests across 58 files pass, along with typecheck and
targeted lint. The test-only readonly-array mutations were corrected and the
affected tests rerun. No graph source edits, approval decisions or deployment.

## Complete relational graph and synthetic release fixture (2026-09-11)

The Docker Unix-socket health check still times out. Independent of Docker, the
native disposable database harness now imports the complete approved graph and
synthetic bank: 181 competencies, 257 evidence definitions, all source edges,
question rows, answer choices, taxonomy memberships and bank memberships. The
test publishes taxonomy, bank and assessment bundle through existing guards and
runs the 80-state engine journey against that full release. It verifies every
stored question's prompt, answer, validator configuration, QC metadata, reviewer
identity and choices against its bundle, then exact session round trips and
learning access.

This caught two fixture assumptions: application migrations already seed some
French nodes, and the database publication guard requires multiple prompt
families. The test reconciles seeded nodes within its rollback transaction and
uses two explicit synthetic family labels. No publication guard was weakened.
Temporary SQL contains visibly synthetic prompts and test-only reviewer data,
is confined to the private harness directory, and is removed with the database.
No product content artifact or hosted approval was created.

Validation: full-schema harness passes all 143 migrations, complete release and
session persistence, existing access checks, material tests and concurrency.
Five fixture/environment tests, typecheck and targeted lint pass. This proves a
complete relational test release, not authenticated Next/Supabase HTTP, real
student grading or pedagogical calibration. The real Auth/browser journey and
reviewed production content remain outstanding; no deployment.

## Student-visible spelling strands (2026-09-11)

The public assessment view now includes the optional approved sampling strand.
The detailed results separate lexical spelling as « Orthographe des mots » and
grammatical spelling as « Accords et homophones ». Each skill keeps its own
status, evidence mode and answer count; no strand score or overall French level
is inferred. Unverified skills remain visible after assessed skills. Empty
sections are omitted, while older spelling records without strand metadata remain
in the general « Orthographe » section. Unexpected missing detail metadata no
longer silently drops a result.

Validation: 236 granular tests across 57 files, typecheck and targeted lint pass.
The mobile browser fixture verifies opposite spelling outcomes, unresolved
skills, keyboard expansion, refresh, legacy metadata and absence of overflow or
browser errors. The rendered mobile screenshot was inspected. These fixture
results do not claim pedagogical calibration or authenticated integration. No
content approvals or deployment.

## Separate spelling-strand sampling (2026-09-11)

The adapter now retains each approved strand as a sampling group. Previously
lexical and grammatical spelling shared one domain and competed directly through
their branches, so numerous grammatical refinements could crowd out lexical
spelling. Selection now balances broad domain time, then strand time, then branch
coverage. The spelling domain retains its overall time allocation. Facet
refinements preserve the parent strand; evidence and mastery stay per skill.

Zero-time answers and skips now use observation counts to break equal-time ties,
preventing repeated preference for the same domain. Exhausted strands are skipped
without suppressing other available content. Sampling identities are included in
the pinned release checksum, and the release guard rejects a provided group that
disagrees with its approved parent strand. Older bundles without groups retain
their previous identity and use their domain as the fallback group.

Validation: 234 granular tests across 56 files, typecheck and targeted lint pass.
Tests cover disproportionate branch counts, zero-time skips, exhausted strands,
approved-parent mapping through refinement and release identity. The full-graph
journey samples all five strands in its first 12 observations and passes the
full-schema persistence harness with 143 migrations. Candidate and audit reports
were regenerated. This is routing verification with synthetic answers, not
educator/student calibration, content approval or deployment.

## Regular spelling questions and targeted teaching (2026-09-11)

Added 32 original controlled-production questions under two existing approved
nodes: regular noun plurals and regular feminine adjective forms. Each has 16
distinct target lemmas and contexts, checksum-bound parent/evidence annotations,
and source-anchored target-word exposure metadata. Recognition and independent
writing remain separate requirements. Novel-word and multiple-occasion rules
were not weakened.

Added two exact-parent teaching drafts with eight guided exercises, plain-language
examples, explanations and boundaries for irregular forms. Their annotated target
words do not overlap the new assessment set. Incidental vocabulary annotation,
semantic independence and exposure-map completeness still require review.
The human-readable question and lesson review packet is
`docs/diagnostic/v3-spelling-review.md`.

The consolidated candidate and delivery matrix now include the new expansion:
3,558 total questions, 2,828 added drafts and nine exact-target teaching drafts.
Canonical eligibility remains 253, granular usable questions 248, and allocated
independent pools zero. No draft became approved or published.

Validation: 230 granular tests across 55 files, typecheck and targeted lint pass.
The spelling regression verifies checksums, exact approved production mappings,
distinct target material, guided/assessment target separation and exclusion of
unreviewed items from eligibility. Assembly and matrix generation pass.

## Full-graph engine states persisted through the schema (2026-09-11)

The disposable PostgreSQL harness now builds a synthetic full-graph bank using
the normal validators, runs real session transitions, and persists 80 sequential
states through all 143 application migrations. The journey includes mixed
answers, a skip, an overnight pause, the default 35-minute active-time boundary,
provisional results and priorities, then issuing and answering a fresh independent
check. SQL assertions verify every state round trip, phase-dependent learning
access, preserved evidence and rejection of a stale check retry. The existing
student isolation, publication, material and concurrency checks also pass.

The first serialization attempt exposed a release-binding helper that spread
every field from a structurally compatible bundle into the release identity.
Some callers pass the whole bundle. The helper now returns only taxonomy ID,
bank ID and checksum, preventing content and answer keys from being copied into
session snapshots. A full-graph regression verifies exact identity fields and
bounded serialized state size.

Validation: 229 granular tests across 54 files, typecheck and targeted lint pass;
the disposable database harness passes. The SQL parent-bank rows are still small
synthetic constraint fixtures. This verifies real engine-state persistence, not
complete relational bank publication, authenticated server grading or the full
Next/Supabase browser journey. No pedagogical approvals or hosted changes were
made. Temporary generated states and the database are removed by the harness.

## Full-graph integration fixtures and direct-parent teaching (2026-09-11)

The integration fixture builder now constructs a complete in-memory bank and
activity bundle across all 181 approved competencies and 257 evidence targets.
It uses the real approved graph, canonical schema, evidence requirements,
material/support annotations and disjoint-pool allocator. A test exercises the
normal SupabaseAssessmentStore release path with only database transport replaced;
no pool, bank or teaching validator is mocked. This is still not an authenticated
HTTP/database journey.

The fixture exposes a product limitation that was fixed: teaching content can now
omit a facet key when it targets an approved skill that has not been refined.
Exact node, optional facet and mode matching remain required. Previously the
mandatory facet field prevented direct-parent lessons from being represented.

Synthetic prompts are visibly marked TEST UNIQUEMENT. Their test-only review
fields exist solely in memory to exercise the normal validation path; no product
approval, file export, database seed or publication was created. The first build
caught a reading-evidence/production-modality mismatch, which was corrected in
the fixture without weakening validation.

Validation: 228 granular tests pass. The enhanced fixture/store test also passes
with real release validators; typecheck and targeted lint pass. Persisting local
authenticated fixtures and executing the browser journey remain outstanding while
Docker is unavailable. No deployment.


## Isolated local integration environment prepared (2026-09-11)

Added a source-copy and Supabase startup runner with dedicated ports and a unique
project identity. It excludes implicit dotenv files, linked-project state,
external symlinks and private-key files. Only the installed dependencies are
linked deliberately. The application environment is built from verified loopback
Supabase endpoints and a small host-variable allowlist, excluding inherited
hosted credentials, monitoring/AI keys and Docker/Node overrides.

An actual preparation/start attempt created an isolated workspace and stopped at
the bounded Docker health check. Docker's Unix socket timed out, and an earlier
info request returned HTTP 500. The saved manifest says docker_unavailable,
fixturesSeeded=false and authenticatedJourneyTested=false. No application seed,
production connection or global Docker restart occurred.

Validation: three isolation tests pass, covering hosted/wrong-local endpoints,
secret environment inheritance and actual filesystem-copy exclusions. Typecheck
and targeted lint pass. This is preparation progress, not a completed authenticated
journey; local fixture seeding and the real application test remain outstanding.
See docs/diagnostic/local-integration.md.


## Enforced readiness before dependent teaching (2026-09-11)

Reproduced a pathway defect: when both a foundation and its dependent skill were
weak, the list offered both lessons merely because the prerequisite lesson
existed. Ordering alone did not prevent opening the dependent lesson directly.

Instruction and consolidation now require direct evidence at the approved 0.65
advancement threshold in every required prerequisite mode. This is a teaching
readiness decision, not mastery at 0.85; it does not mutate results or resolve
provisional skills. An unavailable prerequisite activity still blocks downstream
availability. Readiness blocking is separate: independent checks can investigate
advanced skills while a prerequisite is weak, preserving uneven skill discovery.

The teaching service already verifies each requested activity against the current
plan. A new service regression proves that requesting a known dependent lesson ID
cannot bypass the readiness decision or change saved progress. Coverage tests
also distinguish 0.64 from 0.65, reject evidence-free high probabilities and keep
recognition from substituting for a required production mode.

Validation: 223 granular tests pass, followed by seven targeted planner tests
including the additional mode-separation case. Typecheck and targeted lint pass.
No graph change, content approval or deployment. The readiness probability model
still requires pedagogical calibration before publication.


## Guided reading lessons with selectable answers (2026-09-11)

The guided-practice service and renderer now support optional answer choices.
Choice IDs are stable across reloads and bound to the session, lesson and
exercise. The server accepts only a currently offered ID, stores the readable
answer, and reveals correction after the attempt. Choice lists must have one
matching answer, distinct nonempty labels and 2–6 choices. Choices are included
in publication checksums and can be anchored in material-exposure annotations.
Existing typed-answer practice remains supported. Neither format writes mastery
evidence.

Added three draft reading lessons for narrative subject-pronoun reference,
object-pronoun reference and implicit chronology, with 12 guided exercises.
Examples explain the reasoning before naming grammatical terms and distinguish
reading comprehension from producing a grammatical form. The delivery matrix
now includes these alongside the four earlier pronoun-placement lessons. A
checksum-labelled French review packet contains all lesson steps, choices,
hints and explanations. No lesson approval, content binding or live activation
was created; the three lesson bodies remain review candidates.

Validation: 219 granular tests, typecheck and targeted lint pass. Tests cover
exact targets, malformed choices, forged/raw/stale choice IDs, stable reloads,
hints, wrong-answer feedback, completion and unchanged mastery results. Reading
and existing typed-practice browser fixtures both pass through completion,
including reload and conflict/network handling. Mobile screenshot inspected.
Review packet and delivery matrix reproduce with --check. No deployment.


## Pronoun reference and implicit chronology reading drafts (2026-09-11)

Added 24 original micro-passages: eight for subject-pronoun reference, eight for
object-pronoun reference and eight for implicit event order. Each maps to its
approved reading operation and narrative facet, with four answer choices and
source-anchored textual support. Subject-reference cases vary number, gender and
antecedent role; object-reference cases include le, la, les, lui and leur. Time
cases use a prior tense or an already completed result instead of relying on the
order of sentences. An ambiguous subject chain and an unstated agent were repaired
during drafting.

The reading expansion now has 48 distinct passages across six targets; all are
under 60 whitespace-delimited words. Added a readable French review packet with
all passages, options, expected support and mapping rationales. The generator now
supports --check for its JSON and Markdown outputs.

The consolidated candidate has 3,526 questions, including 2,796 added drafts.
Eligibility remains 253 canonical and 248 granular: no new content was approved.
Coverage across other operations and text genres, difficulty calibration and
review remain required. These counts are local artifact evidence, not live data.

Validation: 216 granular tests, typecheck and targeted lint pass. Reading artifact,
consolidated assembly and delivery-matrix reproducibility checks pass. No live
write or deployment.


## Explicit unanswered questions in the initial diagnostic (2026-09-11)

Added “Je ne sais pas” to the initial assessment. A server-validated skip records
exposure and active time, advances to another question, and may guide selection
toward an easier prerequisite. It contributes no success/failure, confidence,
context, occasion or mastery evidence. It cannot be replayed later as a correct
answer to the same question. All-skipped skills remain unknown; available later
reserves allow a provisional transition into learning.

The client handles skip requests during in-flight heartbeats, preserves an
existing draft on network failure or same-question revision conflict, and clears
it only when advancing. The server rejects client grades/answer payloads on skips,
wrong-question requests, paused requests and cross-student access; concurrent
submissions cannot record a second skip. Progress distinguishes submitted answers
from skipped questions, while question numbers count both.

Validation: 216 granular tests pass, typecheck and targeted lint pass. Browser
fixtures cover empty-response skips, network retry, conflict, clearing the old
draft, subsequent numbering and mobile width. The existing diagnostic-through-
results and independent-check browser journey also passes. Mobile screenshot
inspected. These fixtures do not replace full authenticated production validation.
No migration, publication or deployment.


## Construction-aware prerequisite refinements (2026-09-11)

Fixed an incorrect same-verb mapping beneath two approved parent edges. Every
futur-proche production facet now depends on present-tense aller; every
passé-récent production facet depends on present-tense venir. The lexical verb
remains an infinitive in those constructions. Recognition prerequisites and all
approved parent relationships remain present. Missing support-verb refinements
fail explicitly rather than falling back to a different prerequisite.

The draft facet catalogue includes the two explicit rules and their rationales.
Regenerated the candidate, learning-check and delivery artifacts. A new repeatable
prerequisite audit enumerates all 1,335 compiled edges and 745 parent-evidence
mappings. It flags 99 broad expansions affecting 73 targets for scope review;
these are candidates requiring examination, not 99 automatically invalid edges.
No parent graph change or refinement approval was created.

Validation: 212 granular tests pass, including all-facet construction checks,
whole-graph parent-edge preservation, input immutability and missing-prerequisite
rejection. Typecheck and targeted library lint pass. Prerequisite audit and
delivery matrix reproducibility checks pass. No deployment; content eligibility
remains 248 granular questions with no adequate allocated follow-up pools.


## Results that respond to independently demonstrated learning (2026-09-11)

Reproduced two failures: a long history of wrong diagnostic answers prevented a
later adequate correct demonstration from establishing mastery; a long correct
history could still label mastery after three new failures. The latter was a
probability/evidence contradiction, not just an overly conservative result.

Assessment now rejects confirmation when accumulated probability contradicts the
latest consistent outcome. Fresh independent learning checks can supply a new
current demonstration after an outcome change. That demonstration must itself
meet all approved item, context, occasion, feature and other evidence requirements;
it cannot borrow those from the earlier difficulty. Incomplete recent evidence
remains provisional. Source observations remain intact for auditing and exposure
tracking. Learning provenance is server-owned and reconstructed from the saved
refinements collection for older sessions.

Initial diagnostic answers retain accumulated evidence. Applying replacement
there increased false mastery in the synthetic guessing simulation, so that
broader change was discarded. In the final simulation, 64 deterministic profiles
have zero errors. Across 1,536 classifications per stochastic profile, mixed
false mastery changed from 8 to 6 and guessing-only from 16 to 15 versus the prior
report. All-known unresolved results increased from 22 to 64; false missing stayed
at 5. These are limited synthetic routing results, not educator/student calibration
or evidence that the false classifications are acceptable for publication.

Validation: 207 granular tests pass, followed by seven targeted progress tests
including two additional provenance/initial-assessment cases. Final typecheck and
targeted lint pass. The simulation report is regenerated. No content approvals,
migration or production deployment.


## Learning while later confirmation is pending (2026-09-11)

The pathway now uses a separate readiness calculation that relaxes only the
occasion count for planning. Sufficiently evidenced difficulties can lead to
instruction immediately. Strong evidence that only needs another occasion is
not repeatedly checked on the same UTC day; its verification returns on a later
day. Actual results retain the full approved requirements and remain provisional.
No mastery is persisted or inferred from this planning view.

The public view reports postponed confirmations and explains them to the student.
Missing activity coverage remains visible even when other checks are postponed.
Server commands use their supplied clock for consistent planning; a stale request
for a postponed check is rejected before saving or consuming fresh questions.

Validation: the 201-test granular suite passed, followed by all five readiness
tests including an additional server rejection case. Final typecheck and targeted
lint pass. Tests cover next-day restoration, unchanged actual results,
immediate teaching, insufficient and conflicting evidence, aided/duplicate answers
and rejection without evidence consumption. No deployment or content approvals.


## Honest occasions with adaptive within-sitting routing (2026-09-11)

Initial answers now use the same UTC-day occasion namespace as independent
learning checks. Several questions, pause/resume and a same-day learning check
cannot manufacture separate occasions. Undated legacy per-question markers are
treated conservatively as one sitting and do not add a second occasion alongside
a known dated observation.

Selection separately evaluates whether the current evidence is sufficient to
move on today, relaxing only the occasion count for this internal routing
decision. It can step up and stop repeatedly probing a skill awaiting later
confirmation, while the actual skill map continues enforcing the approved
multiple-occasion requirement. Once today's evidence is sufficient, available
follow-up reserves lead into provisional learning rather than false mastery.
This uses the existing UTC-day convention; educator calibration of timing and
retention intervals remains separate.

Validation: all 197 granular tests and targeted lint pass; typecheck passes.
New cases cover step-up without mastery, stopping for later evidence, same-day
learning, later-day confirmation, serialized pause/resume and legacy inflation.
No migration, live result change, approval or deployment.

## Direct mappings to approved evidence targets (2026-09-11)

Draft assembly and adaptation now accept explicit parent-evidence mappings for
competencies with no proposed facets. Mappings bind both node and evidence IDs,
source checksum and context. Wrong evidence, mixed parent/facet mappings and
attempts to bypass existing refinements are rejected. Eligible parent probes
retain their approved skill identity and use the reviewed context. Delivery
counts also match the exact node, preventing unrelated unrefined targets sharing
an evidence key from receiving each other's draft counts.

Used this path to add eight COD/COI-discrimination drafts covering appeler/parler,
écouter/répondre, aider/téléphoner and remercier/écrire. These are separate from
the six pronoun-form facets. The pronoun expansion now contains 56 drafts and the
consolidated candidate 3,502 questions, with 2,772 additions. Eligibility remains
253 canonical and 248 granular; no draft was approved.

Validation: all 193 granular tests, typecheck, targeted lint and reproducible
assembly/matrix checks pass. The new assembly fixture initially duplicated an
existing student surface; it was made explicitly synthetic and distinct without
weakening the duplicate-surface guard. No live changes or deployment.

## Six pronoun-production draft pools (2026-09-11)

Added 48 authored grammar drafts, eight each for le, la, les, elision, lui and
leur, mapped to the existing approved direct/indirect-object production parents
and their proposed construction facets. Each source sentence identifies the
referent; the learner supplies only the missing pronoun. This isolates the target
from spelling errors in copied words. Elision retains the required apostrophe;
the source subject changes from J’ to Je where inserting a pronoun requires it.
No participle agreement or double-pronoun ordering is mixed into these questions.

Integrated the new pronoun expansion into checksum-bound assembly and the
delivery matrix. Candidate totals are now 3,494 questions with 2,764 additional
drafts. Canonical/granular eligibility remains 253/248: no new approval was
created. Parallel frames across facets do not establish independent context
evidence. Verb complement analysis, difficulty, guessing assumptions and content
quality still require review/calibration; these do not prove the separate
COD/COI-discrimination or independent-writing targets.

Validation: all 190 granular tests, typecheck and targeted lint pass. Expansion
canonical validation, assembly and matrix reproducibility checks pass; inspected
representative direct, elided, singular-indirect and plural-indirect generated
questions. No live database changes, approvals or deployment.

## Broader short-passage reading drafts (2026-09-11)

Added sixteen original short passages with four answer choices and three
source-evidence choices: eight informational notices for explicit information
and eight argumentative paragraphs for fact/opinion discrimination. The existing
eight narrative cause-inference drafts remain intact. These now cover three
approved reading targets with eight drafts each. Notices distinguish roles,
places, quantities, procedures and schedules; opinion passages include both
numeric and nonnumeric verifiable claims alongside value judgments.

The expansion generator now binds each draft to its own approved evidence and
genre facet instead of assuming narrative inference. Regenerated the expansion,
consolidated review candidate and delivery matrix: 3,446 total questions, 2,716
additional drafts, 253 canonical eligible and 248 granular usable questions.
No draft gained approval. Eight drafts per target are not proof of adequate
reviewed pools, calibrated difficulty or teaching coverage.

Validation: all 190 granular tests, typecheck and targeted lint pass; consolidated
assembly and delivery-matrix reproducibility checks pass. Validation caught one
non-exact alternative evidence quote, corrected before generation. Updated the
assembly test's obsolete fixed count while preserving its no-approval assertion.
No live content change, approval or deployment. Grammar and other reading targets
still have substantial question and exact-target teaching gaps.

## Explicit spelling rubrics and criterion-bound judgments (2026-09-11)

Added source-owned writing rubrics with stable criteria, target identity and
exclusions. The two maintaining-spelling targets now require explicit scope at
evaluation and release validation. Rubrics remain private item configuration;
they are not word lists displayed to students. Each scored opportunity must map
to a criterion in that exact rubric, which is included in provenance checksums.
Criterion IDs and reasons survive saved evidence.

Four live scoped synthetic cases cover correct/incorrect lexical spelling and
subject-verb agreement with an unrelated lexical error. The first run omitted
criterion IDs in three responses, correctly preventing scoring. Made the scoped
provider schema require an enumerated criterion ID; all four rerun outcomes and
their individual criteria then matched expectations. Evaluator version is v4.
The structural rubric does not itself prove that a lemma or rule is appropriate
for a student: approved task content and learning-history alignment remain needed.

The calibration coverage report now accounts for cases at all 18 writing targets,
but only one has passing correct/incorrect/unresolved categories in the reported
datasets. This is coverage of synthetic cases, not complete calibration or bank
readiness. Validation: all 190 granular tests, typecheck and targeted lint pass.
No content approvals, live database changes, evaluator activation or deployment.

## Distinct texts and expanded writing-target checks (2026-09-11)

Writing samples now use a conservative word-sequence identity for distinctness,
separate from the exact audit checksum. Case, punctuation, spacing and apostrophe
typography alone cannot turn the same text into another sample. Accents and word
order remain significant; semantic paraphrases are not detected by this rule.

Added twelve live synthetic target cases. Ten matched expectations; pronouns and
temporal sequencing failed source anchoring because the model changed apostrophe
typography. Fixed anchoring by matching equivalent apostrophes at unchanged
offsets, then retaining exact submitted source. Short pronouns also cannot match
inside longer words. Frozen captured outputs now pass regression replay with
exact source spans; this is not a fresh live rerun. Bumped evaluator identity to
v2 and included that version in its protocol checksum.

One captured explanation incorrectly called the object of remercier indirect,
despite accepting the correct pronoun. That semantic explanation defect is not
fixed by anchoring and remains a calibration/rubric issue. The new coverage report
accounts for 16/18 writing targets in the adversarial/expanded datasets, but only
one target has passing correct/incorrect/unresolved categories in those datasets.
The two maintaining-spelling targets still need explicit eligible-opportunity
rubrics. Positive examples alone do not constitute complete calibration.

Validation: all 188 granular tests, typecheck and targeted lint pass; frozen
regression and evaluator-version tests also pass. First fixture normalization
test contained a missing accent and was corrected before its successful run.
No content approvals, live database writes or deployment.

## Adversarial writing smoke checks and evaluator provenance (2026-09-11)

Eight additional live synthetic cases matched their expected outcomes with the
configured z-ai/glm-5.2 candidate: unrelated spelling errors did not lower
imparfait judgments; clear subjunctive/imperative errors failed their target;
disconnected forms remained unresolved; retained and newly introduced revision
errors failed; already-correct unchanged text did not prove revision; and grading
instructions embedded in an incorrect response did not change the verdict.
Inspected the returned exact opportunities as well as aggregate outcomes.
Cases and results are in writing/evaluator-adversarial-cases.json and
writing/evaluator-adversarial-report.json. The smoke harness now derives each
target's accuracy threshold from approved evidence instead of a universal 0.75.

Evaluator results can now carry version, model, protocol checksum and the exact
target/task rubric checksum through saved writing evidence. Injected judges are
identified separately; the default provider path identifies its configured model.
Changing a task prompt changes rubric identity without changing protocol identity.

Validation: all 185 granular tests, typecheck and targeted lint pass. These eight
cases plus the earlier four establish a useful synthetic smoke baseline, not
comprehensive calibration across all 18 writing targets, student populations or
model versions. Production actions still do not invoke this candidate evaluator.
No real student responses, content approvals, live database writes or deployment.

## Candidate writing evaluator and live synthetic smoke checks (2026-09-11)

Added a candidate evaluator using the configured provider and approved French
node descriptions/evidence criteria. It distinguishes connected writing, actual
target opportunities and their correctness; requests exact excerpts and short
French reasons; rejects ambiguity, missing excerpts, overlaps and missing
revision comparison. Opportunity reasons now survive evidence persistence.
Valid alternatives that avoid a target yield no opportunities, not false errors.
The evaluator is intentionally not wired into production actions pending broader
calibration and reviewed task rubrics.

Live synthetic checks with z-ai/glm-5.2 initially rejected three of four outputs:
the provider interpreted occurrence as character position. Captured synthetic
output proved the mismatch. Clarified the schema/prompt with explicit occurrence
examples, without relaxing anchoring. The same four cases then matched expected
outcomes: correct imparfait, incorrect imparfait, a valid alternative leaving
passé récent unresolved, and lexical-spelling revision. Reports are in
writing/evaluator-smoke.json and the pre-fix evaluator-smoke-detail.json.

Validation: all 184 granular tests, typecheck and targeted lint passed before the
prompt clarification; evaluator tests and typecheck passed again afterward. Four
synthetic cases are smoke evidence, not educator calibration, model stability or
release approval. Broader adversarial/mixed-profile calibration, source-specific
rubrics, evaluator provenance and content coverage remain required. No student
data was sent, no live database content changed and no deployment occurred.

## Browser verification of writing revision (2026-09-11)

Added a real-component browser fixture for the two-stage writing flow. At a
390-pixel mobile viewport it saves the first draft without changing evidence,
reloads into the revision step with the original text restored, preserves edits
across simulated revision conflicts and network failures, and submits both
versions before returning to results. The inspected mobile screenshot has no
horizontal overflow and the run reports no page errors. The ordinary diagnostic
and learning-check browser regression also passes after the shared UI changes.

Validation: scripts/testing/granular-writing-ui.mts and granular-ui.mts pass;
typecheck passes. These use the real component with fixture actions/localStorage,
not authenticated Supabase or a calibrated writing evaluator. Full production
journey validation, evaluator/rubric review and complete content coverage remain
outstanding. No live changes or content approvals.

## First-draft and revision flow (2026-09-11)

The two approved spelling-revision targets now save an initial draft before
evaluation. That server-owned draft survives serialization and is sent alongside
the second version to the writing evaluator. The UI distinguishes first submission
from revision, restores the saved draft after reload, and offers no corrective
feedback between versions. The final evidence retains both versions. Unchanged
text is permitted: detecting no needed change is not automatically failure.

Revision targets additionally require an explicit revision assessment in their
evidence contract; final-text evidence alone stays unknown. Adaptation and
release-floor validation preserve that requirement. A missing revision judgment
leaves the check open rather than certifying mastery from final spelling alone.
The calibrated evaluator still needs to assess corrections, retained errors and
new errors against reviewed task rubrics; this interface is not that calibration.

Validation: the 178-test granular suite and typecheck passed, followed by new
revision-evidence and draft-recovery regressions. Targeted lint passed. The
delivery matrix was regenerated. Browser rendering and a production evaluator
remain unverified; no live migration, approval or deployment.

## Auditable writing responses and first task drafts (2026-09-11)

Writing evidence now retains the submitted response and per-opportunity spans
with correctness judgments. Reload validation recomputes the response checksum,
counts and source anchoring, rejecting altered sources or inconsistent totals.
The session's existing server-only persistence stores this audit evidence; the
public result DTO does not expose it. Evaluator/rubric provenance and a reviewer
interface still need implementation before production adjudication.

Added 36 unpublished task drafts, two for each of the approved graph's 18
independent-writing targets, in writing/independent-writing-tasks-draft.json.
Each retains its approved parent/evidence criteria and includes target-specific
reviewer guidance. Natural correct alternatives that avoid the target remain
unresolved, not incorrect. These are review candidates, not approved questions
or adequate pools. Two revision targets explicitly require first and revised
versions; the current single-response service cannot establish revision mastery.
This is a concrete remaining flow requirement, not something token scoring fixes.

Validation: 177 granular tests, typecheck and targeted lint pass. Draft coverage
was checked against all 18 approved independent-production parents and all
36 statuses remain draft. No publication, content approval or deployment.

## Writing evidence through saved learning checks (2026-09-11)

The learning-check service now accepts a trusted server-side writing evaluator
dependency for independent-production probes. It supplies the pinned item and
submitted answer, anchors returned assessed spans to that answer, computes the
result from skill-specific token accuracy, and carries the resulting evidence
through the server-owned answer-check event into persisted refinements. The
transition rejects evidence targeting a different skill or production mode.
Serialization retains response checksum, counts and server occasion.

The browser command remains strict and rejects writing judgments. Missing
evaluators, MCQ sources and unassessable responses cannot silently fall through
to generic answer grading; the active check is preserved without saving a false
failure. Malformed evaluator spans also prevent writes. This is an injectable
integration boundary, not a calibrated production evaluator. Actual reviewed
writing tasks/rubrics, evaluator implementation/calibration and an auditable
submission store still remain; the production action supplies no evaluator yet.

Validation: all 176 granular tests and typecheck pass. New service cases cover
serialized evidence, token-derived grading, no-evaluator/unassessable handling,
browser judgment rejection, ownership and invalid evaluator spans. No live
migration, approval or deployment.

## Independent-writing evidence contract (2026-09-11)

Independent-production results now require skill-specific connected-writing
evidence, rather than accepting a generic correct/unaided observation. The
server-side construction helper binds the response checksum and validates
nonempty, nonoverlapping source spans for assessed opportunities. Correct and
eligible opportunity counts drive writing accuracy; the approved
minimumEligibleTokens criterion is carried through adaptation, stored pool
validation and release-floor checks. Repeated identical response checksums do
not establish distinct texts even if context IDs differ.

This does not implement writing adjudication: a trusted evaluator must still
determine connectedness, eligible opportunities, correctness and unaided task
conditions. The helper must never consume browser-supplied judgments. Current
generic question grading does not produce this evidence and therefore cannot
certify independent writing. Remaining work includes actual writing tasks,
validated evaluator/rubric integration, persistence through server-owned events,
and pedagogical calibration. The delivery matrix keeps this criterion partial.

Regression coverage includes generic-answer rejection, insufficient opportunities,
token accuracy, source-span validation, wrong-skill evidence, unaided conditions
and repeated texts. The prior single-occasion writing fixture now supplies
explicit writing evidence, preserving its original occasion-isolation check.
No live content approval or deployment.

## Database-authored lesson annotations (2026-09-11)

Unapplied migration 0144 adds nullable material-exposure annotations to practice
lessons. The practice query loads them into the selected database lesson; static
conjugation/pronoun overrides continue using their own source content and do not
inherit annotations from unused database lessons. A database trigger clears
annotations whenever lesson source fields or the node change, including writes
that attempt to replace content and annotations simultaneously. Re-annotation
must follow the content update. Metadata-only changes preserve annotations.

NULL remains unknown coverage. This migration creates no reviewed annotations,
does not establish historical completeness and makes no approval decisions.
Deployment must apply 0144 before deploying the updated practice query, which
selects the new column even while the granular feature is disabled.

Validation: all 169 granular tests, typecheck and targeted lint pass. A fresh
local database applies all 143 migrations and passes the persistence/access,
exposure, lesson invalidation and concurrent first-exposure checks. The initial
lesson SQL fixture used an unsupported modality; corrected it to the real
schema's reading modality before rerunning successfully. No live changes.

## Legacy practice delivery hook (2026-09-11)

The authenticated practice page now awaits shared-ledger recording before
returning selected practice content when the granular feature is enabled.
Source-anchored item annotations cover prompts, answers, choices and feedback;
the practice lesson type also supports reviewed annotations. Presentation IDs
bind student, source ID and source content checksum, so retries are stable and
changed content receives a new identity. Learner rating/scaffolding changes do
not change material identity. All annotations validate before writes begin;
write failures withhold delivery.

This is an integration hook, not complete exposure capture. Existing static
lessons still need reviewed annotations, and database-authored lesson annotation
storage/loading is not implemented. Unannotated content creates no invented
keys and cannot establish historical completeness. Capture starts only when the
feature is enabled after its migrations; earlier exposures remain unresolved.
Other legacy content delivery surfaces also remain to be connected.

Validation: four delivery tests pass, covering stable retries, answer/feedback
exposure, student/content identity, failures and absent/invalid annotations;
typecheck passes. No live migration or deployment.

## Shared-ledger history in selection (2026-09-11)

Added a service-only known-material lookup to unapplied migration 0143. The store
queries only novelty-relevant assessed targets, in bounded batches, and validates
that returned keys belong to the request. Starts, resumed sessions, assessment
commands, independent checks and teaching views merge this positive ledger
knowledge into their selection state. Earlier-session material can now be avoided
without relying solely on the current session's observation IDs. Saved revisions
remain controlled by the existing compare-and-swap transition; a lookup itself
does not advance the revision or mutate the loaded input object.

Absence from the ledger still means no recorded exposure found, not verified
novelty or complete historical capture. The production history-completeness
assertion remains unavailable pending legacy integration and coverage validation.
No raw material or another student's history is returned to browser callers.

Validation: all 165 granular tests, the full 142-migration SQL harness including
material isolation and observed concurrency, typecheck and targeted lint pass.
New cases cover relevant-target filtering, immutable hydration, earlier-session
selection, empty lookups, unrelated response keys and database errors. No live
migration or deployment. Continue reviewed annotations, legacy capture, history
completeness, independent writing and full authenticated student journeys.

## Exposure-aware selection within the active session (2026-09-11)

Initial selection and independent-check selection now exclude novelty-required
assessed targets already exposed in the active session. Known exposure combines
source annotations from answered/abandoned questions, saved receipt material and
annotated teaching material persisted when a lesson opens. Positive knowledge of
exposure remains valid even when overall history completeness is unknown. Shared
non-target context does not exclude a fresh target, and rules without novelty
requirements continue allowing familiar material.

The public pathway uses the same filter when offering independent-check bindings.
The selector no longer promises later evidence solely because a reserve question
exists if its target is already known to be exposed. This uses available session
and receipt evidence; it does not yet query all cross-session/legacy history during
selection. That broader capture and verified completeness remain required.

Validation: existing 158 granular tests passed after the implementation, then four
selection regressions and five teaching-service tests passed. Typecheck and
targeted lint pass. Cases cover repeated targets under different IDs, shared
context, abandoned checks, incomplete-history receipts, exhausted reserves and
persisted lesson material. No live migration, content approval or deployment.

## Assessed material versus contextual exposure (2026-09-11)

Material annotations now support an explicit assessed subset of word lemmas and
sentences. Every assessed key must also be present in the source-anchored exposure
list. Delivery continues recording all annotated material, including context;
receipts retain that full exposure history. Grading checks freshness of the
assessed subset, so an already-seen contextual word cannot incorrectly disqualify
a genuinely fresh target. Empty target sets never establish novelty. Older
annotations without a subset conservatively treat all exposure as assessed.

Probes carry both sets, verified against canonical source metadata at release.
Pool allocation permits shared non-target context, but rejects an assessed target
that appears anywhere in another selected question's exposure, not merely in its
assessed subset. This closes the opposite error: hiding prior exposure by labeling
a target as context in a different question. Per-student history verification and
review of annotation completeness remain required.

Validation: all 158 granular tests, typecheck and targeted lint pass; delivery
matrix regenerated. Tests cover context recording, invalid assessed subsets,
familiar context with a fresh target, empty/missing targets and cross-question
context disclosure. No content was newly approved and no live deployment occurred.
Continue reviewed material coverage, legacy capture/history completeness, remaining
writing evidence and authenticated end-to-end validation.

## Material-distinct question pools (2026-09-11)

Probes now carry source-validated material identities. For targets requiring new
words or sentences, allocation requires the relevant annotations and distinct
material within and between initial and follow-up pools. A bounded search selects
sufficient subsets and reports excluded question IDs, so redundant inventory does
not invalidate an otherwise adequate bank or become false fresh coverage. It
preserves feature, context, counterexample, text-type and guessing requirements.
Search-limit results remain separate from demonstrated insufficiency.

Stored-pool inspection rejects repeated or missing required material, and release
inspection rejects material identities that differ from the canonical source.
This is per-target pool separation. Exposure from other targets, lessons, legacy
flows and earlier sessions still needs runtime history verification. The current
248 mapped eligible probes are not confirmation-ready coverage; their missing
annotations and all other pool deficiencies remain release blockers.

Validation: all 155 granular tests, typecheck and targeted lint pass. New cases
cover repeated-word IDs, missing annotations, duplicate exclusion with sufficient
remaining material, tampered cross-pool overlap, feature scarcity, bounded search
and learning-only sentence targets. Delivery matrix regenerated. No approvals,
live migration or deployment. Continue material/target annotation coverage,
complete exposure history, remaining evidence rules, content and full journeys.

## Novelty receipts in saved assessment evidence (2026-09-11)

Initial-answer and independent-check grading now read the source-bound material
receipt without creating a new presentation. Saved observations retain receipt
identity, source checksum, first-recorded/previously-seen material keys and whether
history coverage was verified. Browser commands cannot supply these fields; a
receipt-query failure leaves the answer unsaved for retry.

The approved novelWordsRequired and novelSentencesRequired flags are now compiled
and protected against weakening by release validation. The engine only counts
such observations when the appropriate material kind is first recorded, none of
that kind is previously seen, and the server verifies complete history coverage.
Missing receipts or coverage remain unverified. Repeated material does not block
later genuinely fresh evidence permanently; only qualifying evidence contributes
to the relevant confirmation.

IMPORTANT: the production store does not yet provide the history-completeness
assertion. It must not do so until legacy capture and historical coverage are
established. Novelty-required observations therefore remain unverified in that
store. The optional store contract makes this explicit rather than inferring
novelty from an empty ledger. Question-pool freshness, reviewed annotations and
history coverage remain incomplete, so the matrix records novelty as partial.

Validation: all 150 granular tests passed; the four novelty regressions also pass
after making synthetic fresh-word fixtures distinct. Typecheck and targeted lint
pass. Tests cover unknown history, already-seen/wrong-kind material, subsequent
fresh evidence, server receipt persistence, rejected browser claims and receipt
read failure. No live migration or deployment.

## Exposure concurrency and read-only receipts (2026-09-11)

Added a read-only receipt RPC to unapplied migration 0143 and a store method that
validates its result against the expected material keys. Lookup requires the
presentation ID, student and source checksum. Missing records return unknown;
partial, extra, duplicate or malformed receipts are rejected. Reading a receipt
never creates a presentation. This is the future grading input, not yet a novelty
mastery decision or a claim of complete historical coverage.

The full-schema harness now starts two independent database sessions. The first
holds an uncommitted exposure; the test observes the second waiting on a database
lock before either completes. After both commit, exactly one receipt credits
first recorded exposure. This verifies an actual overlap, not merely sequential
calls labeled concurrent. Stable presentation retries remain covered separately.
Additional SQL checks reject mismatched student/source receipts and verify lookup
leaves the presentation count unchanged.

Validation: full 142-migration harness, persistence/access tests, material receipt
SQL tests and observed concurrency pass; two receipt-shape unit tests, typecheck
and targeted lint pass. No live migrations or deployment. Remaining novelty work
includes reviewed annotations, legacy exposure tracking and historical coverage,
plus assessment/learning grading integration using these receipts.

## Material recording at granular delivery boundaries (2026-09-11)

All four granular server actions now await material recording before returning
initial questions, resumed/conflict views, independent-check questions or teaching
content. The recorder resolves the owned session and available release, uses
stable per-session/question or lesson presentation IDs, and sends source-bound
material hashes to the 0143 ledger RPC. A persistence failure prevents that action
from delivering content. Repeated delivery retains the presentation identity.
Lessons conservatively record their full annotated material, including guided
exercises and hints not yet reached.

Added optional materialExposure annotations for bank validator config and teaching
content. Word annotations bind a reviewed lemma to a form in the source; sentence
annotations must occur in the source. Invalid anchors, empty annotations and
oversized lists are rejected. These structural checks do not prove lemma accuracy
or annotation completeness; existing content is not automatically annotated.
Publication validation checks supplied annotations, and teaching review checksums
include them. No annotations or receipts are added to the public learner DTO.

Validation covers source anchoring, lemma identity, repeated initial/follow-up
delivery, lesson recording, persistence failure, ownership, unavailable question
identities and unannotated/error-only responses. Remaining work: populate reviewed
annotations, integrate legacy delivery paths, establish conservative historical
coverage, consume server receipts in novelty evidence and verify the authenticated
browser/database journey. Recording first tracked exposure does not yet establish
novelty-based mastery. No live migration or deployment.

## Live parent checks and material-exposure foundation

The store now rechecks live taxonomy and question-bank publication on every release
load, including the bank's taxonomy relationship. An immutable bundle alone cannot
keep serving content after its parent is withdrawn. Tests isolate these live-row
checks from the separately tested bundle validators and cover withdrawal after a
successful read, missing parents, wrong taxonomy and query failures.

Novelty investigation confirmed that granular exposure currently tracks question
IDs and reviewed teaching overlaps, while legacy practice records sessions and
submitted attempts. Those records do not establish that a word reused under a new
question ID is unseen. Added unapplied migration 0143 for server-owned material
presentations and first recorded exposures, keyed per student by normalized word
or sentence identity. Stable presentation IDs preserve results across retries;
changing the owner, source checksum or material list on a retry is rejected.
Authenticated browsers cannot read or forge the ledger, and the service role has
no update/delete grant for exposure history. Hash identities preserve French
accents while normalizing case, spacing and apostrophe variants. Word identity
requires a reviewed lemma; morphology is not guessed.

The disposable full-schema harness now applies all 142 migrations and tests the
ledger: repeated material across different questions, independent student histories,
idempotent retries, identity substitutions, invalid keys and access privileges.
This is a foundation, not completed novelty enforcement. Next: reviewed material
annotations, transactional recording before delivery in both granular and legacy
question/teaching paths, conservative handling of incomplete historical exposure,
and engine evidence tied to the resulting server receipts. No historical novelty
or mastery is inferred from an empty ledger. No live migration or deployment.

## Full-schema database validation and parent-withdrawal fix

Added scripts/testing/granular-full-schema-db.sh and SQL fixtures. The harness
creates a disposable PostgreSQL 18 cluster with pgvector, applies all 141 current
application migrations unchanged, and uses the real application tables, triggers,
foreign keys and access functions. Only Supabase auth primitives are supplied by
local helpers. The cluster listens on a private Unix socket, is stopped on exit,
and its temporary data is removed. PostgreSQL 18 was installed locally; no service
was enabled and no live database was accessed.

Synthetic fixtures follow the actual bank publication transition, including 48
fixture items across four sections, taxonomy membership, attributed fixture
reviews and the database readiness guard. They are test-only records, not real
pedagogical approvals or a publishable French assessment. Student/profile rows are
created through the actual signup trigger. Checks cover owner versus other-student
access, browser denial of server-owned data, service-role persistence, stale writes,
immutable ownership and publication, stored progress, assessment completion,
authorization revocation and parent-bank withdrawal.

The full-schema test exposed a real gap in unapplied migration 0141: after the
parent bank was withdrawn, the access helper denied learning but the session-write
trigger still accepted updates. The regression failed before the fix. The guard
now requires the linked taxonomy and bank, as well as the granular release, to
remain published. The full-schema harness and existing focused 0141/0142 SQL tests
both pass after the fix.

This validates SQL behavior, not GoTrue JWT verification, PostgREST, the Next.js
actions or the complete authenticated browser journey. Those integration checks,
content coverage/review, remaining evidence rules and deployment remain required.
Migrations 0141/0142 have still not been applied live by this work.

## Grammatical counterexample evidence

The approved negativeExamplesRequired rule now reaches assessment, saved answers,
initial/follow-up pool validation and question selection. Confirmation requires a
counterexample within the current consistent evidence sequence; an earlier failed
counterexample cannot certify mastery after ordinary examples. A counterexample
means absence of the target construction, not simply an incorrect answer option.

Source items may carry negativeExample with an exact prompt excerpt and reviewer
rationale. The adapter validates that structure and derives server-side metadata.
Semantic correctness still requires content review. Release validation rejects
lowering the approved requirement or forging the probe flag. Existing content was
not automatically annotated or approved.

Validation: the existing 130 granular tests passed, then nine counterexample and
release tests passed after adding four regression cases. Typecheck and targeted
lint pass. Regenerated the matrix: 176 targets still need other evidence-rule
implementation or validation, separately from question and activity coverage.
Novel-word/sentence evidence, independent writing, pedagogical review, calibration,
full-schema authenticated journeys and deployment remain unfinished. No live changes.

## Contrasting spelling-error evidence

The approved minimumContrastingErrors criterion is now compiled into runtime
requirements and separate initial/follow-up pool validation. Consistent recent
answers must cover the required number of distinct error families. Several
incorrect options sharing one error family do not count as several contrasts;
an earlier failure on another family cannot certify later mastery.

A new contrastingErrors item annotation ties each errorKey to one actual incorrect
choice. Structural validation rejects nonexistent options, correct options and
multiple annotations on the same choice. Semantic correctness of the family label
still requires content review. The adapter reads these annotations from the
checksum-bound bank, sessions retain them, selection favors missing contrasts and
release inspection rejects invented probe labels or lowered requirements.
No existing content was automatically annotated or approved. Missing annotations
therefore cannot satisfy this criterion. Novel-word evidence, negative examples
and independent writing requirements remain separate unfinished work.

Validation: all 129 granular tests passed, followed by five release-bank tests
including the additional contrast-tampering regression. Typecheck and targeted
lint pass. Regenerated the delivery matrix; 211 targets still carry other unresolved
criteria. No live database or deployment changes.

## Reading text-type evidence enforcement

The approved minimumTextTypes criterion now reaches the adaptive engine and
question-pool checks. Distinct passages in one genre do not count as transfer
across genres. Item sourceTextType supplies normalized server-side genre metadata;
unknown metadata contributes no genre evidence. Session answers retain that
metadata for initial and later checks, and selection prioritizes an unobserved
required genre where available.

A genre-specific refinement requires evidence within its own genre, while retaining
the approved parent's text-type requirement. Parent roll-up checks confirmed
cross-genre coverage before reporting mastery. Facet mapping rejects disagreement
with the item source genre. Release inspection rejects weakened type requirements
and altered probe genre metadata. Both initial and follow-up pools must satisfy
their applicable variety rules independently.

Validation: all 125 granular tests pass, including new tests for multiple passages
of one genre, missing metadata, separate pool variety and genre-specific versus
parent mastery. The delivery matrix was regenerated; 211 targets still have other
unresolved criteria. This does not supply missing questions, approve refinements,
calibrate the model or complete the authenticated deployment journey.

## Consolidated delivery matrix and approved-criteria audit

The delivery-matrix generator now uses the validated draft assembler for all
three expansion sources. Its 542 target rows account for all 2,700 added drafts
exactly once, including the previously omitted 32 agreement questions. It keeps
shared unmapped base candidates separate from exact-target drafts, preserves
source checksums and fails if any expansion question is omitted or counted twice.
All 181 approved competencies and 257 evidence definitions remain represented.
Eligibility remains 253 canonical questions and 248 granular usable probes;
assembly does not create approvals or sufficient initial/follow-up pools.

Each row now retains the complete approved success criteria alongside the
compiled runtime requirements and an explicit implementation audit. This exposes
278 targets with requirements still needing implementation or validation,
including text-type variety, negative examples, novel sentences/words,
contrasting errors, eligible writing tokens, and full transfer/support evidence.
These are additional release gaps, not permission to lower the approved standard.
The audit is deliberately conservative for support and unaided transfer.

Validation: deterministic regeneration followed by read-only --check. No student
runtime behavior, publication status or live database was changed. Next work must
close the exposed evidence-enforcement gaps and content/activity coverage, then
verify full-schema authenticated journeys before activation.

## Consolidated question review candidate

Added a source-bound draft assembler and reproducible
`assemble-v3-review-candidate.mts` command. It combines the unchanged 730-item base
with 2,660 conjugation, eight reading and 32 agreement drafts into one 3,430-item
canonical candidate, plus a combined mapping/review packet. Each added question
must have exactly one valid checksum-bound facet/context annotation and remain
pending human review. Stale source checksums, edited items without remapping,
duplicate sources/items and introduced approvals fail assembly. The base and
separate source artifacts remain unchanged.

Output separates 253 canonical eligible questions from 248 granular usable probes;
the five missing-support items remain excluded. Combining draft files does not
improve readiness by itself or approve the proposed refinements. The consolidated
bank is a review candidate, not the active release bundle. Generated question
artifacts contain answer keys and must stay server-side.

Validation: two assembly/provenance regression tests, generation followed by
read-only `--check`, application typecheck and targeted lint pass. Continue review
and completion across the full target matrix, final pool/activity assembly,
calibration, full-schema authenticated journeys and verified deployment. No live
database mutation or deployment in this change.

## Live rejected-item eligibility and exposure verification

Follow-up exact-count queries found zero competency attempts, zero diagnostic run
assignments and zero diagnostic-bank memberships for each of the six faulty item
IDs. No student identities or answers were retrieved. There is no recorded result
linked to these IDs requiring recalculation; this does not establish whether a
practice question was displayed without submission or copied under another ID.

Source inspection found normal practice selection/submission and non-pilot
diagnostic submission require approved review status. The isolated pilot
intentionally permits needs_human_review when QC gates pass. Therefore the earlier
status downgrade was not a universal quarantine. Moved the six confirmed defective
versions from needs_human_review to rejected with status/answer compare-and-swap
guards, then verified all six statuses and called the LIVE
`diagnostic_pilot_item_is_eligible` RPC for each: all false. Normal approved-item
queries also return false. Stored keys and historical records remain unchanged.

Evidence: `conjugation-rejection-result.json` and updated
`conjugation-quarantine-exposure.json`. The rejection script is scoped to the six
previously inspected versions and does not approve replacements. No application
deployment. Continue the full granular release work: content/teaching completeness,
review, calibration, complete authenticated journeys and deployment verification.

## Simple-past correction and live content quarantine

Corrected -ger/-cer simple-past forms before a/â without altering third-person
plural before è. Full-paradigm tests cover mangeai/mangeâmes/mangèrent and
commençai/commençâmes/commencèrent. The pre-rebuild audit found 36 affected keys
in the unapproved conjugation expansion and none among the baseline's 36 computed
items. Preserved findings in `conjugator-simple-past-repairs.json`, rebuilt the
expansion and delivery matrix, and verified zero subsequent computational
mismatches. All 276 linguistic/generation/granular tests passed before the final
blanchir addition; the 40 conjugation tests pass with that addition.

`audit-live-conjugator.mts` read all 115 current Supabase competency items using
conjugator validators. It found six incorrect automatically approved stored keys
(savois, ouvrissez, dormissais, two dormit-for-present cases, pleuvoissait) and one
valid blanchis unsupported by the new explicit family list. Inspected the actual
prompts, added blanchir to the supported group-two list, then moved ONLY the six
faulty items from auto_approved to needs_human_review with ID/status/answer
compare-and-swap conditions. Verified all six statuses afterward. Keys, QC records
and historical attempts were left intact. This is a live content status change,
not a deployment of the new diagnostic or repaired key publication.

Before-state and verified result are recorded in the conjugation-quarantine JSON
files. The audit excludes exact-answer items and does not prove which application
version or historical session served a question. Remaining work includes reviewed
repairs, checking all serving paths honor review status, affected attempts if any,
broader lexical correctness and the full diagnostic release objective.

## Conjugator family correction and local artifact audit

Corrected the discovered present forms for dormir, courir and découvrir with
explicit paradigms, plus their past participles and courir's future stem.
Découvrir's singular imperative correctly loses s. Célébrer and protéger now
change their accent in present singular/third-person plural while retaining the
correct nous/vous and imperfect stems. Unknown -ir verbs no longer automatically
receive group-two present/participle/future/simple-past behavior: finir-family
membership is explicit. Existing cueillir past-participle support is preserved
through an explicit entry, not a false family assumption.

This is a bounded correction, not a complete French conjugator. Other -er spelling
changes, irregular families, auxiliary ambiguities and simple-past spelling rules
still need the broader linguistic audit. Unsupported forms must be surfaced for
review rather than treating the current implementation as universal coverage.

Validation: 275 tests across linguistic grading, item-generation gates and granular
assessment pass, along with typecheck and targeted lint. The new local artifact
audit recomputes 36 baseline, 2,570 conjugation-expansion and 22 agreement-expansion
computational keys with zero disagreements. Matching generator output is not
independent linguistic validation. The audit did not query or correct live data;
its scope and limitations are recorded in `conjugator-artifact-audit.json`.
No new approvals or deployment. Continue live exposure audit, content completeness,
review, calibration and authenticated release verification.

## Subject–verb agreement draft expansion and conjugator finding

Added 32 original cloze questions in `agreement-drafts.ts`, eight per proposed
adjacent/separated/inverted/coordinated refinement of the approved
`accorder_sujet_verbe_ecrit` production evidence. The taxonomy assigns this to
grammatical spelling; the expansion preserves that domain. Each item records its
actual subject and a reviewer rationale. Coordinated cases currently cover distinct
subjects joined by et, not every coordination exception. The separate generator
and artifact preserve pending review, with zero eligible additions.

Manual inspection of generated answer keys caught false generalizations in the
existing conjugator: célébrer → célébrent, découvrir → découvrissent, courir →
courissent, protéger → protége, dormir → dormissent. The authored expansion now
uses correct explicit exact keys for these cases (célèbrent, découvrent, courent,
protège, dorment), and for unsupported reprendre/attendre/apparaître/surprendre/
cuire forms. These keys are never marked computed. The existing conjugator itself
has NOT been fixed in this change. Next audit its verb-class fallback and existing
bank exposure before relying on it for broader authoring or production grading.

The new test checks four groups, source/annotation checksums, canonical bank
validity, no eligible additions and correct non-computed keys for the five faulty
patterns. The expansion is not merged into the delivery matrix or active bank yet.
No production deployment or live content correction occurred. Full content review,
remaining targets, calibration and authenticated release work remain necessary.

## Question pools aligned with confirmation probability

The allocator and stored-pool guard now use the same guessing function and 0.01
threshold as the evidence engine. Both initial and learning pools must be capable
of reaching that threshold on an all-correct sequence, including each required
distinguishing feature. This fixes a release-readiness mismatch: three four-choice
items passed old pool checks even though their all-correct chance is 0.015625 and
the engine would not confirm mastery. Eight such items now allocate four per pool;
six cannot form two sufficient pools. Extra items without the distinguishing
feature cannot conceal inadequate feature-specific evidence.

The registry reports each pool's guessing capacity and labels numerical question
shortfalls as lower bounds, since contexts/features/guessing may require additional
items. Rebuilt candidate/check registry/delivery matrix. Regression tests verify
that each four-question pool actually reaches mastery when its independent
responses are all correct, while three-question and scarce-feature pools fail.
All 119 granular tests, application typecheck and targeted lint pass.

This aligns existing provisional rules; it does not empirically calibrate them or
guarantee resolution after mistakes. Content coverage, pedagogical review, timing,
occasion policy, real student validation and the full release remain unfinished.
No production changes.

## Original short narrative inference drafts

Added eight original 35–45-word fictional passages in `reading-drafts.ts`, each
assessing `inferer_cause_locale::text_type:narrative`. Situations include a manga
queue, basketball, drawing, dance, rain, gaming, cycling and cinema. Each has four
conclusion choices, three actual passage excerpts and an explicit reviewer
rationale. The intended cause is supported by the situation rather than stated
in the question. The generator validates graph identity, item schema, canonical
bank compatibility and exact excerpt containment; it corrected two capitalized
mid-sentence excerpts during authoring before producing the artifact.

`expand-v3-reading.mts` writes the separate checksum-bound expansion and review
summary. All eight remain `needs_human_review` with no fabricated ensemble or
human approval. The delivery matrix now includes their exact-target draft IDs
and counts alongside conjugation drafts, without increasing eligible coverage.
The content test verifies the artifact against source passages and mappings and
confirms none enters the eligible pool. Typecheck, targeted lint and matrix
reproduction pass. No production changes.

This is one target's draft content, not complete reading coverage. Review must
check plausible distractors, evidence relevance, difficulty and the independence
of contexts. Four-choice guessing also requires sufficient initial/reserve
capacity for the engine's confirmation threshold; current pool minima need that
audit. Continue other reading operations/genres, grammar/spelling, teaching,
review and full authenticated release work.

## Reading support browser verification

Added `scripts/testing/granular-reading-ui.mts` and extended the local fixture
action to exercise the real student answer/support controls. Chrome verifies that
the answer alone does not enable submission, both choices survive revision and
network errors, both IDs are sent, the next item clears both selections, and
refresh restores the next saved item. The test also checks mobile width and page
errors. Viewed `/tmp/granular-reading-support-mobile.png`: the passage, conclusion
and supporting excerpt are separately readable at 390px width without overflow.

All three browser fixtures passed: reading support, the original diagnostic and
independent-check journey, and guided teaching/practice. These remain localStorage
fixtures, not authenticated integration or live pedagogical validation. They add
evidence about the UI without approving or publishing any reading questions.
Next remains reviewed short-passage content across the actual targets, the full
reading-criteria audit, calibrated selection and full-schema authenticated
assessment-to-learning journeys before release.

## Answer plus textual support implementation

Added `textual-support.ts`: a checksum-bound item configuration contains the
displayed passage and two to six distinct excerpt choices, exactly one marked as
supporting the answer. Validation requires every choice to be an actual excerpt
and the passage to appear in the displayed prompt. Public choices have shuffled,
session/item-specific opaque IDs and no correctness flags. Authoring/review must
still establish semantic relevance and plausible distractors; substring checks
alone are not pedagogical validation.

Both assessment and learning-check commands accept an optional support choice,
require it when the item declares support, and grade conclusion AND support as
one response. The engine compiles the graph's `evidenceSpanRequired` criterion;
responses not assessed for support cannot count toward these skills. Session
observations copy this property only from server probe metadata. Guessing rates
are not multiplied because answer and excerpt choices are correlated. The pool
and release guards retain the requirement and reject unsupported probes.

The adapter excludes five canonically eligible inherited questions lacking this
contract from the new granular candidate, preserving their existing review
records. Reports list these exclusions explicitly. Rebuilt output: 248 usable
mapped questions, 542 proposed targets, 365 without a usable probe. None of the
excluded questions was silently repaired or reapproved.

The student screen now displays a separate supporting-passage radio group and
requires a selection before submission. It retains the selection on a same-item
retry and clears it on a new question. This new control still needs dedicated
browser verification. Three new tests cover excerpt validation/hidden keys,
unsupported mastery evidence, and the saved command rejecting a missing selection
and grading a correct conclusion with wrong support as incorrect. The prior full
suite passed 116 tests before the third new test was added; that targeted test
also passes. No publication or production changes.

Next: browser verification for both response parts, draft question authoring and
review against these contracts, remaining genre-transfer criteria, and all full
content/pathway/calibration/authenticated-release work. The textual-support
selection is receptive evidence; it does not by itself demonstrate independently
written justification for controlled-production targets.

## Reading genre scope audit

Replaced the manually maintained reading-genre exception list with the approved
evidence keys (`all`, `literary`, `informational`, `argumentative`). The list had
missed five scoped competencies: informational cause/consequence, comparison and
problem/solution structures, plus argumentative fact/opinion and evidence
relevance. Their ten unsupported genre refinements are removed without changing
any approved competency or evidence definition. The runtime release guard also
rejects reading facets outside those declared scopes.

Regenerated catalogue, candidate and matrix now contain 340 proposed refinements,
542 evidence targets (92 reading targets), 253 eligible mapped questions and 361
targets with none. The lower target count corrects invented scope; it is not new
content coverage. All 181 approved nodes and 257 evidence definitions remain.

The same audit identifies 13 approved reading nodes requiring textual evidence:
five inference skills; fact/opinion; thesis; reason; evidence relevance;
counterargument; locating evidence; linking evidence to interpretation; and
distinguishing text evidence from outside knowledge. The current granular answer
flow does not separately assess that justification. Next implement a reviewed
text-span question contract, server grading of answer plus support, propagation
into the skill evidence contract, and a student support-selection control before
claiming these nodes are release-ready. No approval or deployment performed.

## Reading transfer evidence contract correction

Inspection before short-passage authoring found that v3's approved
`minimumDistinctTexts` criterion was compiled only as a question count. The
adapter now also compiles it as the minimum context count. Eligible reading
questions use their released `sourceTextKey` as the passage context, rather than
a hash of the entire question prompt. Multiple questions about one passage remain
one context, even across different occasions. Reading facet annotations cannot
rename that context, and the runtime bank guard rejects both renamed passage
contexts and lowered distinct-text requirements.

Regression evidence: four correct answers on one text remain unresolved; the
same independent responses across four texts can confirm mastery under the
existing provisional policy. Existing eligible questions on the garden passage
share one context. The source bank currently supplies `sourceTextKey` for all
120 reading items. This identity depends on reviewed passage metadata; auditing
duplicate texts under different keys remains part of content review. Evidence-span
requirements, genre transfer and the other approved reading criteria still need a
full contract audit; this correction does not establish full reading readiness.

Rebuilt the facet catalogue, allocated assessment candidate, check registry and
delivery matrix from source. Coverage remains incomplete and no new item was
approved. No production changes. Continue the approved-contract audit and author
short-passage questions with distinct texts and explicit textual support.

## Student teaching screen integration

`publicTeachingView` is now a separate DTO builder included in the normal saved
assessment response, so page refresh restores a lesson, current exercise or saved
feedback. Activity recommendations carry a content ID when they refer to a bundled
lesson. `GranularDiagnostic` opens those lessons in place through the authenticated
teaching action; unrelated activity destinations remain links. `GuidedTeaching`
renders concrete examples, scope limits, optional hints, sentence entry, feedback,
next exercise, completion and explicit exit. Saved guided responses never appear
as new diagnostic evidence.

Client reconciliation preserves unsent text on a hint response, revision conflict
or interrupted request while the same exercise remains active. It clears text on
feedback, a different exercise or a different lesson. A full page refresh restores
server-saved progress and submitted answers; it does not persist unsent local text.

Validation: typecheck and the 110-test granular suite passed after integration.
The new `granular-teaching-ui.mts` Chrome fixture passed lesson/exercise/feedback
refresh, hint, conflict/network retry with draft retention, wrong-answer feedback,
subsequent exercise, completion, mobile width and no page errors. The existing
diagnostic-to-independent-check browser fixture also passed. Viewed the mobile
practice screenshot at `/tmp/granular-teaching-practice-mobile.png`; layout fits.
These fixtures use localStorage actions, not the authenticated production database.
An additional client reconciliation regression test covers guided draft identity.

Content is still draft and unpublished. Remaining full delivery work includes
reviewed content coverage and exact-target bindings across all domains, complete
semantic exposure review, calibration, full-schema authenticated journeys and
production release. No migrations, approvals or deployments were performed here.

## Saved teaching and guided-practice service

Added authenticated `updateGranularTeaching` and `teaching-service.ts`. A student
can open only a currently recommended published exact-target binding. The saved
session records the lesson/practice phase, current exercise, hint exposure,
submitted responses and completion. Responses return the current exercise without
its answer until an attempt; feedback then contains the expected sentence and
explanation. The sentence matcher tolerates case, whitespace, apostrophe variants
and terminal punctuation while retaining accents and hyphens. This is guided
rewriting feedback, not an independent writing grader.

Published teaching requires a checksum-bound review and explicit reviewed mapping
of any assessment questions semantically exposed by its content. Opening teaching
persists all those mapped exposures before showing content. Independent checks and
teaching cannot run concurrently. Revision conflicts, repeated submissions and
cross-student requests do not duplicate or overwrite progress. Guided correctness
never enters diagnostic observations/refinements. Completing a lesson/practice
sequence redirects its recommendation to fresh independent evidence; a subsequent
failed check clears that target's current teaching completion so instruction can
be revisited. Old session JSON remains compatible through optional fields.

The release loader now rejects missing/stale teaching reviews and mismatched
content bindings. No real approval record was created: publication-shaped fixtures
exist only in tests. Five new service tests cover saved progress, answer hiding,
wrong answers, concurrency, ownership, stale review, non-mastery and the complete
synthetic lesson → practice → fresh check → failed-check instruction sequence.
Application typecheck passes. The student teaching UI is still to be connected;
these are service tests, not authenticated browser or production verification.

Next: render and resume teaching inside the student flow, verify that browser
journey, preserve unsent exercise drafts on retries, then continue content/review,
exposure audits across existing practice, full-schema migration and live release
gates. The four authored lessons remain drafts and are not deployed.

## Exact-target pronoun teaching drafts

Added four placement lessons in `pronoun-teaching.ts`, attached to the v3 parent
`placer_pronom_complement` and its proposed finite, infinitive, negative and
affirmative-imperative refinements. They contain concrete examples, plain French
explanations, explicit construction limits and 13 guided exercises with hints and
explanations. The draft infinitive lesson limits its verb constructions; the
imperative lesson explicitly excludes double-pronoun and y/en patterns. These
boundaries must be reviewed against the full target contract before publication.

`teaching-content.ts` adds a typed draft-content contract and validates exact
node/facet/mode matches. It rejects duplicate exercise identities and identities
shared with assessment probes. This identity check is not a semantic exposure
audit: cloned/reworded content and existing practice exposures still need handling.
The delivery matrix includes these draft IDs, exercise counts, scope boundaries
and a source checksum without treating them as published activity bindings or
independent evidence. No student route or production publication changed.

Validation: two targeting/exposure-identity regression tests and application
typecheck pass. Remaining work includes content review and scope completion,
rendered teaching/practice flow, saved completion/exposure, actual release bindings,
other grammar/spelling/reading content, assessment coverage and complete journeys.

## Consolidated delivery matrix

`scripts/build-v3-delivery-matrix.mts` now recomputes a single target-level work
queue from the approved graph, canonical candidate bank, reviewed-status rules,
draft facet annotations, pool allocator and checksum-bound conjugation expansion.
It writes `v3-delivery-matrix.json` and a readable Markdown table alongside it.
Every approved evidence definition is checked for inclusion. Each row includes
prerequisites, evidence requirements, eligible question IDs/formats, initial and
follow-up allocation, separately identified unreviewed exact-target expansion
drafts, shared parent candidates and missing activity bindings.

Current output covers 181 approved competencies, 257 approved evidence definitions
and 552 proposed targets; 253 eligible questions are mapped and 371 targets have
none. No target has sufficient allocated initial/follow-up pools. All 2,660
expansion drafts map to conjugation targets; they remain ineligible. Shared parent
drafts are deliberately not summed as exact-target coverage. The report neither
approves refinements nor publishes content, and it does not claim the absence of
all existing lessons merely because exact-target bindings are missing.

Validation: generation and a second read-only `--check` reproduction pass.
Application typecheck passes (its config excludes scripts). No runtime or
production behavior changed. Next content work should follow this matrix across
all four reporting domains rather than expanding only conjugation.

The active objective is the full six-phase roadmap: reconcile existing French v3
assets; extend demonstrated granularity gaps; complete and validate question
coverage; integrate adaptive assessment with pause/resume and about 35 active
minutes; connect results to real learning activities and independent refinement;
validate full journeys and deploy. Allotey is outside scope. Do not mark this
objective complete when only the inventory or prototype passes.

## Current evidence

The new `build-diagnostic-v3-coverage.mts --live` is read-only against Supabase and
writes JSON/Markdown matrices under this directory. It covers all 181 v3 nodes,
257 evidence definitions, and prerequisites. It compares competency meaning and
exact evidence contracts before calling v2 questions compatible. Live item text,
choices, answer keys and validators are compared before current approval counts
can be used. It does not copy approvals or modify frozen releases.

The live run found 696 unchanged diagnostic items, 265 eligible under the existing
human/computed eligibility rule, and 1,306 practice items across review statuses.
There are 454 missing approved slots against the existing v3 initial-assessment
minimums; this is not a claim that 454 new questions must be authored. Existing
drafts can fill some slots after review. Reserve/context/occasion requirements
and additional granularity still require investigation.

v3 adds 21 keys and removes `construction_pronom_objet`; the old broad pronoun
node must not be automatically mapped to all new pronoun skills. No changed
contracts were found among the evidence definitions retaining the same node key.
Dedicated independent-production support is checked against the existing runtime
support function. Ordinary practice is classified as receptive or controlled
production by the same helper used by the application.

Validation: five coverage regression tests pass; targeted ESLint and typecheck
pass. Production behavior has not changed.

## Next work

1. Inspect each uncovered slot, prioritize reuse of eligible practice items and
   existing drafts with explicit evidence/semantic validation, and report removed
   node mappings separately.
2. Audit v3's actual granularity across conjugation, grammar, spelling and reading;
   author a versioned extension only for demonstrated missing distinctions. Keep
   approved v3 as the parent baseline rather than replacing it with sample verbs.
3. Adapt the session/selection prototype to v3 evidence definitions (including
   occasion and independent-production requirements), release-pinned database
   persistence, existing grading/actions, and student UI.
4. Complete remaining roadmap phases; calibrate the provisional model, then test
   full student journeys before deploying. The prototype is not a live diagnostic.

## v3 bank candidate progress

`prepare-diagnostic-bank-v3.mts` now constructs a separate reproducible v3
candidate from 690 unchanged v2 items. Six old `construction_pronom_objet` items
are quarantined in `v3-bank-reconciliation.json`, with no automatic fan-out to
new pronoun nodes. The baseline initially lacked nine evidence definitions / 27
minimum question slots, with 18 independent-production definitions deferred to
learning verification.

`inspect-v3-practice-reuse.mts` performed a read-only export of 42 current practice
candidates for these nodes. Six were excluded for insufficient target evidence:
two placement questions supplied the placement, one double-pronoun question only
asked for one pronoun, and three contrast/exception questions did not directly
elicit the target operation. The decisions are saved separately.

`complete-diagnostic-v3-draft.mts` constructs a 730-item draft: the 690 unchanged
items, 36 practice-derived candidates, and four newly authored questions. Every
initial-assessment v3 evidence definition now has its existing minimum number of
authored questions. All 40 additions explicitly require review; skipped judge
calls are recorded as no agreement, and practice approvals are not transferred.
Canonical item contracts and minimum authored coverage pass four regression tests.
The three bank migration tests also pass. This is not a published release and
is not sufficient proof of granular readiness, reserve/context coverage or
pedagogical calibration.

Rebuild order: prepare-diagnostic-bank-v3.mts; optionally inspect-v3-practice-reuse.mts
for a fresh read-only inventory; complete-diagnostic-v3-draft.mts. Candidate
artifacts are under generated/ and must remain server-side (contain answer keys).
Next: granular distinctions tied to existing v3 nodes, then release/evidence-aware
selection and persistence integration; do not stop at the existing coarse-node
minimum coverage.

## Evidence-aware engine integration

`v3-adapter.ts` compiles the approved v3 artifact into 257 evidence targets, each
retaining its parent competency key. It validates the actual taxonomy content
checksum and bank binding, derives prerequisites from the existing hard edges,
and uses the canonical bank validator's eligible-item list. The 730-question
candidate currently yields 263 eligible probes after excluding the removed
broad pronoun node's two eligible items and all unreviewed additions.

The engine now supports per-evidence distinct-item, context, occasion, accuracy,
and unaided-response requirements. Existing initial-diagnostic occasion semantics
are preserved: migration 0064 defines each distinct accepted run item as one
occasion. Resuming or retrying does not create additional evidence. During
learning, a server-owned lesson occasion must accompany evidence; guided answers
cannot establish unaided performance. Independent-production targets are excluded
from initial question selection and explicitly deferred to learning, not reported
as a missing bank. Parent competency rollups never pool receptive and productive
evidence into automatic mastery.

Validation: all 116 diagnostic tests passed before the final deferred-evidence
case; the final targeted 12 adapter/session tests also pass. Typecheck and lint
passed; final typecheck completed successfully.
These changes still need authenticated persistence and application integration.

Remaining fidelity gaps: routing branches currently group by domain and hard-edge
depth; this is an integration baseline, not the final within-domain boundary
search. Add explicit granular facets/challenge relations anchored to v3 (verb
patterns, tenses, constructions, spelling features, reading operations), reviewed
item facet annotations and matching activities. Do not call the full goal complete
based on this compiler or the 730-item draft. No production rollout has occurred.

## Granular facets anchored to v3

Added a draft facet catalogue beneath 67 existing v3 competencies: 325 facets,
compiling to 527 evidence targets when combined with unrefined v3 competencies.
It includes 14 named irregular verbs, four regular/spelling patterns across the
included tenses (excluding the ordinary pouvoir imperative), targeted pronoun,
agreement and spelling distinctions, and reading text-type transfer distinctions.
Existing v3 reading operations already remain separate. This catalogue is a
reviewable extension, not an approved exhaustive French curriculum.

`applyFacetTargets` makes each refinement independently assessed. Unmapped items
are excluded from refined credit, never sent back to certify the broad parent.
Only explicit structured conjugator metadata can auto-map a verb/pattern;
non-computed items need content-checksummed annotations. Regular-pattern mastery
requires multiple verb contexts. Facet metadata is included in session release
binding to prevent resumed runs changing interpretation. Same-dimension/value
prerequisites preserve a matching verb/pattern when one exists rather than adding
unrelated sibling prerequisites.

The draft coverage report identifies 316 facet evidence targets without eligible
questions and 53 eligible questions needing explicit annotations. This is the
additional granularity gap beyond the earlier 730-item broad-v3 draft, not a
regression to hide by removing facets. Five new regression tests cover sibling
independence, broad-parent non-inference, regular-pattern transfer, stale mapping
rejection and release binding. Typecheck and targeted lint pass.

Next implementation action: authenticated, transactional session persistence and
server grading integration, alongside explicit facet annotations and content
coverage work. Still required: reviewed facet progression/coverage, student UI,
real learning activity alignment, calibration, complete journey tests and deploy.
No production data or deployed behavior has changed.

## Authenticated saved sessions and server grading

Migration 0141 adds server-only granular release/session tables, immutable
published release content, published-release guards, immutable session ownership
and release binding, and one-step revisions. The Supabase store scopes every run
read/write by the authenticated student and uses a revision predicate for atomic
compare-and-swap. Concurrent starts converge through a unique student/release key.
The migration has NOT been applied to the live database.

The new `granular-diagnostic.ts` actions resolve student identity and access on the
server. The command service rejects client grades/timestamps, grades only the
currently served item, uses receive time rather than model latency for active
time, handles expected reading-judgment failures, and returns a DTO without answer
keys, validator configuration or correctness flags. Published bundle content is
checksum verified. No UI invokes these actions yet; only reviewed published
release rows can start sessions.

Six server-command tests pass: cross-student isolation, strict input contract,
answer-key withholding, concurrent/stale revision handling, exactly-once evidence,
and release substitution. The migration and SQL behavioral tests passed twice in
a disposable PostgreSQL 17 cluster using minimal parent-table stubs. This verifies
the migration's own guards, not compatibility with the entire production schema.
Use `sh scripts/testing/granular-session-db.sh`; set GRANULAR_PG_BIN for another
PostgreSQL installation. Typecheck and targeted lint pass. Full-schema migration
verification remains required before live application.

Next: student interface using these actions (pause/resume, submitted answer
retention on conflicts, active heartbeats, granular results), plus release assembly
and explicit facet mapping/content completion. Learning refinement persistence,
existing daily-plan integration, calibration, full journeys and deployment remain
part of the full goal. Do not mark complete or deploy the unreviewed draft merely
because the session tests pass.

## Student interface

The existing `/student/diagnostic` route now has a server wrapper. With
`GRANULAR_DIAGNOSTIC_ENABLED=true` it renders the new granular interface; otherwise
it renders the previous component, moved unchanged to `legacy-diagnostic.tsx`.
The flag must remain off until migration, publication, learning-path integration
and full live journey verification are complete.

The interface supports explicit pause/resume, hidden-tab pausing, visible-tab
heartbeats, answer retention on expected errors and same-question conflicts,
revision-order protection, and skill-by-skill results with human-readable labels.
A queued answer is not silently lost if submitted while a heartbeat is pending.
The server now shuffles choices stably and returns opaque choice IDs, retaining
server-only correctness and grading metadata.

Browser fixture verification passed in Chrome at desktop/mobile sizes: start,
hidden-tab pause, resume with draft preserved, conflict/retry with draft preserved,
results, refresh, no horizontal mobile overflow, and no page errors. Screenshots
are `/tmp/granular-ui-results-desktop.png` and `...-mobile.png`. The browser harness
uses fixture actions/local storage, not the real session database; do not describe
it as a full authenticated end-to-end test. Launch Vite with
`npx vite --config e2e/fixtures/granular/vite.config.mts --host 127.0.0.1 --port 4179`
then run `npx tsx scripts/testing/granular-ui.mts`. Ten service/client-state tests,
typecheck and targeted ESLint passed before the queued-answer improvement; the
subsequent browser/lint/typecheck rerun also completed successfully.

Next required implementation: connect completed granular sessions to the existing
student state/access gate and daily learning plan, persist independent learning
refinement through the session service, and assemble/publish only validated
release bundles. Content mapping/coverage, calibration and full-schema/live
journeys are still incomplete. The new UI's “Voir mon parcours” link must be
verified with these integrations before enabling the feature flag.

## Learning access and daily-plan integration

Added `activity-plan.ts`: exact node/facet/mode matching, published-only bindings,
independent checks for uncertainty, instruction for demonstrated gaps, and no
fallback to broad-node exercises. Missing prerequisites without matching content
block dependent activities. The public results DTO and UI now expose actual
matched activity links instead of promising generic activities.

Migration 0142 introduces the guarded `student_granular_learning_ready` RPC and
preserves the old unlock function behind a wrapper. Time-budget completion and
deferred independent evidence can unlock learning from a published v3 release;
coverage failures cannot. Ownership, invitation authorization and release status
remain required. The student-state loader uses this RPC only behind the granular
feature flag; the client assessment gate accepts its separate boolean without
fabricating legacy four-section scores. Server actions refresh authenticated
student state after completion so client navigation sees the new access state.

The daily session-plan action, behind the same flag, loads the latest completed
published granular session and uses its exact activity bindings. It retains one
due reading retrieval activity, bounds the itinerary to 28 estimated minutes, and
never fills missing granular activities with unrelated broad-node exercises.
Activity-duration metadata still needs completion (current targets estimate five
minutes). No activity registry has yet been assembled/published, so this is
integration infrastructure, not proof of a usable production pathway.

Validation: 141 diagnostic/access tests passed before the final daily-plan loader
change; 15 targeted tests passed for activity/service/access behavior. Typecheck
passed after the loader change. Disposable PostgreSQL tests now also exercise
migration 0142, including owner/authorization denial, time-budget/deferred-evidence
unlock, coverage-gap refusal, withdrawn-release refusal and legacy preservation.
Full-schema and authenticated browser journeys are still required. Neither new
migration is applied to production; feature flag remains off.

Next: build the concrete published-activity binding registry and persist learning
refinement using verified server-issued activities; complete reviewed facet/item
coverage and calibrate; run full-schema migration and real API/browser journeys;
then release/commit/push/deploy after the full completion audit.

## Question audit: corrected answer and computed agreement mappings

The unassigned-question audit found an inherited human-approved answer-key error:
`local-conjugation-gap-v1:produire_passe_recent:controlled_production:foundation`
asks for finir in the passé récent with tu but expects `As fini` (passé composé).
The new v3 draft now expects `viens de finir`. A checksum-bound correction record
in `v3-answer-corrections.json` preserves the exact source identity and rationale.
The rebuild removes historical reviewer approval and old accepted alternatives,
reruns structural gates, and leaves the correction pending fresh review. It does
not edit the historical candidate/source or live database. This defect may still
be present in the legacy live bank; a separate current-state check/remediation is
required before claiming it fixed for current students.

Six eligible computed agreement probes now map to their actual elicited facets:
three distinct être-agreement features (feminine, plural, both), and three
preceding-COD agreement probes. Missing metadata does not imply absent/following
COD; masculine-singular answers cannot demonstrate a visible agreement contrast.
Automatic mapping is restricted to the audited verb metadata and target nodes.

Updated draft totals: 730 authored questions; 262 eligible before refinement;
216 mapped eligible probes; 46 eligible probes remain unmapped; 312 refined
evidence targets still have no eligible probe. Counts of mapped questions do not
prove sufficient confirmation, reserve, context or learning-activity coverage.

Validation: all 69 granular tests pass, including corrected-answer exclusion,
stale-source rejection, source immutability and agreement-facet separation.
Typecheck and targeted source ESLint pass. No production changes or deployment.
Continue the full roadmap: remaining semantic mappings/content coverage, actual
learning bindings and persistent independent checks, calibration and full release
verification. The active objective remains incomplete.

## Exact annotation review and reading genre corrections

All 46 currently eligible but unmapped items now have checksum-bound decisions in
`v3-facet-annotations.json`: 37 proposed annotations and nine held items. Each
decision includes a rationale. These annotations remain draft; the catalogue
builder reports their coverage in a separate hypothetical review preview and does
not add them to the baseline eligible-mapping count. Source content/approval
changes, tampered manifests and conflicting decisions fail validation.

The audit found another inherited targeting defect: the core
`resoudre_pronom_objet` question asks about the SUBJECT pronoun `ils`. Other holds
cover a passage typo, explicit sequences mislabeled implicit chronology,
viewpoints supplied by the question rather than extracted from the passage, and
agreement questions with ambiguous or supplied cues. These are excluded from
the refined assessment because they remain unassigned; they still require content
repair and review. They have not been removed or changed in the live legacy bank.

The reading refinement draft now distinguishes argumentative passages. It also
respects explicit scope in the approved v3 descriptions: thesis/reason/counter-
argument nodes have argumentative facets; character motivation and literary
tonality have narrative facets; information-specific inference and summary nodes
have informational facets. General operations retain independent genre targets.
This corrects the earlier blanket narrative/informational split, rather than
modifying the approved graph itself. Passage context IDs are shared across all
questions using that passage, so repeated exposure cannot masquerade as transfer
to a new context.

Current draft catalogue: 350 facets, 552 total evidence targets; baseline 216
mapped eligible probes and 337 uncovered refined targets. If all 37 proposed
annotations are accepted, the preview has 253 mapped probes and 304 uncovered
targets. These counts rose in scope because argumentative transfer is represented
honestly; reducing the count is not the objective. The catalogue and annotations
still need educational review before publication.

Validation: 72 granular tests, typecheck and targeted ESLint passed before the
final exhaustive-decision assertion; the final targeted annotation tests are run
again with that assertion. No migrations, publication or deployment this turn.
Next: repair held questions, build additional exact-target coverage and actual
learning checks; continue calibration, authenticated complete journeys and release.

## Repair of all nine held items

`v3-item-repairs.json` contains full replacement items bound to checksums of the
unchanged source bank. Repairs preserve the approved parent competency and
evidence contract: unambiguous coordinated subjects without resumptive cues;
the archives passage typo; an actual object-pronoun referent; three temporal
inference tasks using indirect clues rather than narrated lists; and two opposing
viewpoints in a short passage instead of viewpoints supplied in the question.
New temporal contexts have distinct source identities; revisions of an existing
passage retain its context identity to avoid claiming artificial transfer.

`repairDraftItems` rejects stale content, duplicate corrections and silent target
changes. It removes old reviews and invalidates old QC results. The bank builder
then reruns structural gates on each replacement, records no independent judge
agreement, and leaves all replacements pending fresh human review. The annotation
holds now bind to the repaired content and retain the original source checksum.
Historical source files and production data are unchanged.

The rebuilt 730-item bank now has 253 eligible items (ten repairs need review:
the earlier passé récent correction plus these nine). Baseline mappings remain
216; the 37 proposed annotations would map all 253 currently eligible items.
The repaired nine remain held, and zero eligible items lack a documented mapping
decision. This resolves mapping triage only, not the much larger missing-question
coverage, pedagogical review, activity registry or calibration requirements.

Validation: all 75 granular tests pass; typecheck and targeted ESLint pass.
Rebuilding the bank and coverage report produces byte-identical artifacts. No
remote migration, publication or deployment. Continue the full objective, including
content review and gap filling, actual learning activity issuance and persistent
independent refinement, calibrated selection, full authenticated journeys and
verified production release.

## Runtime pool and bank guards

The Supabase release loader now validates stored pool assignments rather than
trusting publication status or a `ready` flag. It rejects malformed/unallocated
bundles, changed assignment checksums, duplicate question identities, unknown
targets and insufficient initial/learning pools including feature/context minima.
It does not silently recompute a different allocation while resuming a session.
Bundle taxonomy/bank IDs must also match the selected database row.

`inspectReleaseBank` checks the fixed approved French v3 checksum, canonical bank
validation and bank checksum, eligible-only probe ownership, every approved parent
evidence definition, response modes and minimum item/occasion/accuracy/unaided
requirements. A reduced demonstration graph or weakened criteria cannot pass.
Independent-production definitions must remain deferred to learning. These checks
do not yet constitute the complete publication contract: facet approval/provenance,
full activity coverage, calibration and authenticated journey evidence remain
required, as does full-schema migration testing.

Unapplied migration 0141 now requires a published bank to belong to the selected
published taxonomy. The disposable PostgreSQL harness verifies that a mismatched
pair is refused. Both 0141 and 0142 isolated test suites pass; production remains
untouched and the migration has NOT been applied remotely.

Validation: 103 granular tests, typecheck and targeted lint passed before the final
minimum-evidence guard; the five bank/loader tests and typecheck then passed again.
Tests verify the real draft's bank identity while correctly refusing its incomplete
pool allocation, malformed payloads, envelope changes, reduced graphs, unapproved
or retargeted probes, and weakened evidence minima. Continue the full objective:
review and complete content, exact instruction/practice and exposure integration,
calibration, full release/publication validation and authenticated deployment tests.

## Separate initial and learning question pools

Added deterministic `allocateQuestionPools`. It reserves a disjoint learning pool
only when both pools satisfy item, context and distinguishing-feature minimums.
Targets without capacity retain their initial questions and report insufficiency;
bounded search exhaustion is reported separately, never misrepresented as a
proven content gap. Learning-only stages never become initially assessable.
Assignment checksums join the pinned session release identity.

The selector excludes learning-reserved items; saved-session transitions reject
cross-pool use; learning availability/issuance excludes initial-only questions.
If initial probes are exhausted with unresolved evidence and reserved questions
exist for each unresolved mode, the session proceeds provisionally to learning
instead of consuming the reserve or falsely reporting a missing bank. The check
registry binds only permitted learning questions after allocation.

The builder persists `generated/french-v3-assessment-candidate.json` with actual
assignments and readiness decisions. With only the current 253 eligible questions,
none of the 552 targets can support both pools: pool readiness is false and the
allocated registry has zero usable check bindings. The earlier 181 bindings were
shared-pool candidates, not guaranteed fresh reserves. There are 371 targets with
no eligible probe at all and 552 without an allocated learning check. The 2,660
new conjugation drafts remain outside eligibility. This is a required release-
readiness failure; enforcing the complete release contract in publication and
runtime loading still remains part of the release-integration work.

Validation: all 97 granular tests and typecheck passed before the final mode-aware
handoff refinement; four pool tests then passed again. Targeted source/script lint
passed. Tests cover disjoint sufficient pools, insufficient feature capacity,
search limits, deterministic pinning, protected reserves, provisional handoff and
cross-pool session rejection. No production changes. Continue content review/gap
filling, instruction/practice/exposure integration, calibration and full release
validation rather than weakening the pool requirements.

## Distinguishing-feature evidence for spelling-change verb families

Added feature-level evidence requirements to the engine, probes and saved
observations. The -ger/-cer refinements for present, imperfect, simple past and
imperative now require three consistent distinguishing-form answers across at
least two verb contexts. Person/tense combinations that do not elicit ge/ç changes
receive no such feature tag. Other tenses do not acquire an irrelevant ge/ç gate.
Feature confirmation also checks chance probability and restarts after a
contradictory feature answer; many easy unchanged endings cannot conceal that
contradiction. Neither mastery nor a confirmed missing classification can be
claimed without the required feature evidence.

Initial selection and independent learning checks prioritize missing features
within the chosen target. The server copies feature tags from the pinned probe
when persisting an answer; clients cannot supply them. Explicit annotations may
only use features declared by their facet. Negative-command draft annotations
carry the same feature distinctions. The capacity registry now reports feature
question/context shortfalls separately from overall question counts.

Facet release binding now includes compiled skills and probes, including evidence
requirements/tags. This prevents a rule change from retaining an old checksum
merely because facet names and question texts stayed identical. Catalogue,
learning registry and conjugation draft artifacts were regenerated. The eight
current spelling-change requirements have no eligible feature probes yet; the
new form expansion contains candidates, still pending review. This is an honest
coverage gap, not a reason to loosen the mastery requirement.

Validation: all 93 granular tests and typecheck pass; targeted lint passed before
the final two regression assertions. Tests cover unchanged endings, memorized
single-verb contexts, contradictory feature responses, question prioritization,
person/tense feature tagging, saved server evidence and release binding after
criteria changes. No production changes. The full roadmap remains incomplete:
content review and broader coverage, exact instruction/practice, reserve and
guided-exposure handling, calibration and authenticated release verification.

## Conjugation form-production expansion

`expand-v3-conjugation.mts` builds a separate, reproducible 2,660-question draft
from the same verb/family/tense inventory as the facet catalogue. All 197 declared
conjugation facets receive authored form-production probes beneath their existing
approved parent/evidence definitions. Regular and spelling-change families use
multiple verbs, with one context identity per verb; changing the subject does not
manufacture a new transfer context. Imperatives include affirmative and negative
forms; the ordinary pouvoir imperative remains excluded. Ambiguous compound-tense
subject agreement is explicitly constrained, including plural vous.

Output is `generated/french-v3-conjugation-expansion.json`; summary and limitations
are in `v3-conjugation-expansion.json`. The expansion is separate from the 730-item
baseline draft, which remains unchanged. Every new question is pending review,
even when its key recomputes with the conjugator. Independent-judge agreement is
recorded as absent, and the canonical eligibility check confirms ZERO newly
eligible items. Non-conjugator negative commands have explicit proposed facet
annotations rather than automatic assignment from prompt wording. Existing
student-facing surfaces are deduplicated; source items are not mutated.

This substantially expands authored form coverage, not reviewed readiness. It
does not cover receptive recognition, tense choice in context or connected
independent writing. Uniform draft difficulty requires calibration; rare imperative
uses need review. Pattern mastery still needs constraints requiring the forms
that distinguish a pattern (e.g. a -ger item with an unchanged ending alone must
not establish the spelling change). The broader reading/grammar/spelling gaps,
instruction/practice links, reserve allocation and guided-exposure integration
remain part of the full goal.

Validation: all 88 granular tests, typecheck and targeted lint pass. New cases
verify correct elision, feminine/plural agreement, -ger/-cer changes, exact target
coverage, duplicate prevention and absence of copied approval. No publication,
remote migration or deployment.

## Learning-check registry and capacity inventory

`build-v3-learning-checks.mts` now constructs actual question bindings from the
canonical eligible bank and the draft exact-target annotations. Output:
`generated/french-v3-learning-checks.json`, with a checksum-bound coverage report
at `v3-learning-check-coverage.json`. The builder revalidates bank eligibility,
bank/taxonomy identity, evidence ownership and probe uniqueness. It rejects draft
or repaired questions inserted into the eligible pool and questions retargeted to
another evidence definition. All produced bindings remain DRAFT, not published.

There are 181 check bindings using 253 eligible questions across 552 evidence
targets; 371 targets have no check. The current draft capacity policy budgets each
initial target's existing minimum items plus at least three fresh learning items
(or its higher evidence minimum). Under that policy every target lacks capacity,
and the total eligible-question shortfall is 3,005. This is neither a claim that
3,005 must be newly authored nor a calibrated optimal bank size: existing drafts
may qualify after review, contexts must also be adequate, and initial/learning
reserve allocation remains to implement. All counts include proposed mappings;
no content approval is manufactured by creating a binding.

Bindings carry an estimated per-check duration from the question metadata, and
the daily planner now uses that estimate rather than assigning every check five
minutes. Exhausted checks are omitted using actual student exposure. No instruction
or guided-practice binding has yet been created; the existing broad/fallback lesson
cards cannot automatically count as exact-facet teaching coverage.

Validation: 85 granular tests, typecheck, targeted source/script ESLint pass.
Registry tests exercise eligible-only exact matching, rejection of repaired or
retargeted probes, unpublished defaults, stable identities and exhaustion. No
production changes. Continue content completion and semantic review (including
whether pattern-specific probes actually elicit the distinguishing forms), proper
instruction/practice bindings and exposure integration, reserve allocation,
calibration, full authenticated journeys and the final release audit.

## Rendered learning-check flow

The granular diagnostic/results component now starts server-issued independent
checks directly from the learning plan, using the activity kind in the public
DTO. An active check reuses the existing accessible question controls and accent
input, supports submission and abandonment, and survives refresh through the
saved session. Successful submission returns to the updated skill map with an
accessible confirmation. Revision conflicts and interrupted requests preserve
the draft while its check remains active; advancing clears it. Mobile action
buttons wrap with spacing. Instruction/practice destinations remain normal links.

Validation: 82 granular tests passed. The expanded Chrome browser fixture passed
twice, including initial diagnostic pause/resume and results, starting a learning
check, refresh, injected revision conflict, injected network failure, retained
answer, updated evidence count, refreshed results and mobile width. The second
run also checks the saved-result confirmation. Typecheck and targeted lint pass.
The mobile check screenshot is `/tmp/granular-learning-check-mobile.png`. These
browser actions use fixture storage, not an authenticated production database;
real release bindings and complete authenticated journeys remain required.

No deployment or release activation. Next work includes populating actual
instruction/practice/check bindings with sufficient content, integrating guided
exposure history, completing coverage and review, calibrating and verifying the
entire saved-session-to-learning journey before production release.

## Server-issued independent learning checks

Added `learning-service.ts` and authenticated `updateGranularLearningCheck` action.
The published activity binding can now name release-pinned eligible probe IDs.
Only an independent check proposed by the current exact-target learning plan can
be issued; clients cannot choose the item, supply a grade, assert first-attempt or
unaided status, or manufacture an occasion. Missing/exhausted/mismatched check
bindings are omitted from the public learning plan.

The existing revision-checked session state now optionally stores one active
learning check. Issue/answer/abandon transitions use the same atomic compare-and-
swap persistence. Refresh returns the same active check; answering records a
server-graded refinement and updates results. Abandoning records exposure without
mastery evidence. Initial-diagnostic items and previously exposed learning items
cannot be reused as fresh checks. Concurrent/repeated submissions cannot duplicate
evidence. Multiple learning checks on one UTC date share an occasion ID; this is a
conservative implementation policy pending calibration, not a validated pedagogical
definition of an occasion. The current check flow supplies no hints. Exposure from
other existing guided-practice routes still needs integration before those routes
can safely share this question pool.

The public check DTO withholds answer keys/configuration/correctness, and client
response reconciliation preserves drafts on conflicts only while the same check
remains active. The fixture DTO was updated for the new nullable check field.
This turn has NOT yet wired a rendered check form or populated/published a real
activity registry, so it is backend integration rather than a complete student
learning journey. No production changes.

Validation: 81 granular tests and typecheck passed before the final additional
learning-draft reconciliation test; all five client-state tests then passed.
Targeted ESLint passed. Six new learning-service cases cover server grading,
saved refinement, repeated/concurrent commands, cross-student/client-grade denial,
abandonment, exact-target availability and conservative occasion counting.
Continue with the student check interface and actual activity bindings, guided
exposure integration, content completion/review, calibration, full-schema and
authenticated journey verification, then the production release audit.
