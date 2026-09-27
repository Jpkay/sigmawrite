# Coverage workstream: P4.01 to P4.02

Date: 2026-09-13

Scope: approved French graph only. This workstream authors reviewable drafts. It does not publish content, expand the release scope or record owner approval.

## Atomic roadmap status

| Task | Status | Evidence |
| --- | --- | --- |
| P2.02 | validated | The narrow material-history dependency is implemented and passes its tests. This removes the earlier dependency blocker for target-level validation. |
| P4.01 | validated | The frozen revision-41 candidate contains 544 graph targets and 360 assessment-scope targets. The sorted complement contains exactly 184 unique target IDs and matches `remaining-target-goals-2026-09-13.json` with no missing or extra IDs. The registry has 184 unique `C001` to `C184` IDs, 184 unique skill IDs and five tracked tasks per target. The frozen and registry-complement projections share checksum `9c02ca28a1782cdc527fdad0dd1172eb540a340a520f3eaeea1269faf05f78d8`. |
| P4.02 | in_progress | Two bounded families now have questions and lessons implemented locally: C001 to C003 and C081 to C082. All five targets remain outside the 360-target production scope pending the remaining validation, review and release tasks. The full objective remains all 184 registered targets. |
| P4.03 | planned | No production-scope mutation or publication work was performed here. |

## Passé récent modal family

- C001: `produire_passe_recent::writing-controlled-production::verb:vouloir`
- C002: `produire_passe_recent::writing-controlled-production::verb:savoir`
- C003: `produire_passe_recent::writing-controlled-production::verb:devoir`

The family supplies 36 independent questions: six initial and six learning questions for each target, with every grammatical person represented in both pools. It also supplies three lessons with six separate guided exercises each.

Each target keeps its approved production contract and its two frozen prerequisites: `produire_present_indicatif::writing-controlled-production::verb:venir` and `reconnaitre_passe_recent::reading-receptive`. Both prerequisites are in the revision-41 assessment scope.

The claim is limited to controlled production of the requested verb group. A correct answer shows that the learner can build present-tense `venir`, followed by `de` and the supplied infinitive. It does not show that the learner would choose `vouloir`, `savoir` or `devoir` naturally in an unguided context. The draft explicitly notes that `venir d’apprendre que` is often more spontaneous than `venir de savoir que`, while keeping `savoir` as the assessed verb. Naturalness and intended meaning remain owner-review questions.

Files:

- `src/lib/diagnostic/granular/passe-recent-modal-family.ts`
- `src/lib/diagnostic/granular/passe-recent-modal-expansion.ts`
- `src/lib/diagnostic/granular/passe-recent-modal-family.test.ts`
- `scripts/expand-v3-passe-recent-modal-family.mts`
- experimental artifact: `tmp/coverage-passe-recent-modal-family.json`

The test builds the artifact in memory. Its frozen-inventory assertion reads the exact revision-41 evidence workspace and explicitly skips when that workspace is unavailable; it never substitutes the current authoring candidate.

## Cause-relation family

- C081: `relation_cause::reading-analysis`
- C082: `relation_cause::writing-controlled-production`

Neither target has a graph prerequisite. The family uses ordinary situations such as rain, a delayed bus, a flat tire, a sleeping baby and a broken lift.

C081 supplies 12 independent multiple-choice questions: six initial and six learning questions. Each pool has three causal sentences and three genuine counterexamples covering chronology, addition and opposition. The counterexample annotation identifies the full sentence and explains why it does not express cause. Each pool independently retains `negativeExamplesRequired: true`.

C082 supplies 16 independent typed transformations: eight initial and eight learning questions. The learner receives two ideas, must begin with the stated effect and must join it to the supplied reason with `parce que`. Only the target sentence, with or without a final point, is accepted. Reversing the causal direction and merely copying the two source sentences fail. Every item has a unique assessed combined sentence, so each pool independently retains `novelSentencesRequired: true` and `unaidedRequired: true`.

Two lessons provide three teaching steps and six guided exercises each. Their sentences are disjoint from every independent assessment sentence. Recognition and production remain separate targets. The production claim is limited to controlled sentence combination; it does not claim autonomous explanatory writing.

Files:

- `src/lib/diagnostic/granular/cause-relation-family.ts`
- `src/lib/diagnostic/granular/cause-relation-expansion.ts`
- `src/lib/diagnostic/granular/cause-relation-family.test.ts`
- `scripts/expand-v3-cause-relation-family.mts`
- experimental artifact: `tmp/coverage-cause-relation-family.json`

## Revision 42 cause integration

The cause family is wired behind the explicit `--cause-relation-family` option. It requires bank revision 42 and the complete revision-41 refinement chain. Omitting the new option preserves revision 41: the cause expansion and its two lessons are not selected. The option does not add C001 to C003.

The reviewable learning-check registry deliberately emits `draft` activity bindings. The scoped candidate preserves those draft states so candidate generation cannot claim publication. Release preparation and the publisher create a separate immutable envelope in which those same exact bindings and probe IDs have `status: published`; `prepareParallelPublication` then validates the published statuses, target mappings, fresh pools and teaching exposure before the database publisher persists the checksum-bound bundle. This is the existing provisional `parallel_review` release mechanism. It records authorization to serve the content while owner review proceeds; it does not record human content approval.

The frozen revision-41 scoped release has 360 supported assessment and teaching targets with published runtime checks. Draft bindings observed in its preparation artifacts are not a deployed runtime defect. The broader unscoped preparation can contain more ready teaching entries, but only the checksum-bound scoped publication bundle defines what students can receive.

The exact generation and preparation chain for the coordinator is:

```zsh
npx tsx scripts/expand-v3-cause-relation-family.mts --output=tmp/coverage-r42-cause-relation-family.json
npx tsx scripts/expand-v3-cause-relation-family.mts --output=tmp/coverage-r42-cause-relation-family.json --check
shasum -a 256 tmp/coverage-r42-cause-relation-family.json
cp tmp/coverage-r42-cause-relation-family.json generated/french-v3-cause-relation-family-expansion.json
R42_FLAGS=(--bank-revision 42 --verb-family-recognition --etre-participle-agreement --question-detail-reading --local-definition-reading --avoir-participle-agreement --causal-reading-genres --cause-relation-family)
npx tsx scripts/assemble-v3-review-candidate.mts "${R42_FLAGS[@]}"
npx tsx scripts/build-parallel-review-candidate.mts "${R42_FLAGS[@]}"
npx tsx scripts/build-scoped-review-candidate.mts "${R42_FLAGS[@]}"
npx tsx scripts/prepare-scoped-publication.mts "${R42_FLAGS[@]}"
npx tsx scripts/verify-scoped-command-journey.mts "${R42_FLAGS[@]}"
node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts export-bank /tmp/french-v3-r42-cause-bank.json "${R42_FLAGS[@]}"
```

Each of the first four builders must then pass again with `--check`. The cause-specific real-service journey uses `npx tsx scripts/verify-orthography-foundation-journeys.mts --cause-relation-family` after the shared R42 scoped artifacts exist. These commands are recorded for coordinator execution; this workstream did not run shared generators, import a bank, publish a release or activate production.

The frozen draft is expected to retain internal checksum `sha256:ead51a8a216702400f6d59600b8b51e919cb3edd47cb79ca26741c3fe01293de` and raw JSON SHA-256 `adf3621a0d992987f91f0e4ff9d0c423f25b8d88bed80edeb81848731a6aded7`. In-memory assembly with the complete R42 option chain yields 8,052 bank items and checksum `sha256:e698c225c1960e608d7a3460491e5441f3e5f0fec1f5e1698a1779277650377a`. A mismatch must stop the chain for investigation rather than silently create a different immutable revision.

The frozen R42 build at source `af6316c` has 362 assessment and teaching targets, 6,610 scoped questions and no instruction or fresh-check gaps.

## Revision 43 modal passé récent integration

C001 to C003 are wired behind `--passe-recent-modal-family`. The option requires bank revision 43 and the complete R42 chain, including `--cause-relation-family`. Omitting it reproduces the R42 bank exactly and excludes all three modal lessons. The approved target requirements remain unchanged: each target retains the two prerequisites recorded above, six independent initial forms, six independent learning forms, six distinct contexts per pool and all six grammatical persons per pool.

The evidence is controlled form production only. The prompt supplies both the tense and the modal infinitive, and `unaidedRequired`, sentence novelty and word novelty are all false in the approved contracts. The integration therefore does not claim that a learner would independently choose a natural modal passé récent in context. The especially delicate `venir de savoir` wording remains explicitly compared with the more spontaneous `venir d’apprendre` during owner review; the target itself is not silently changed to `apprendre`.

```zsh
npx tsx scripts/expand-v3-passe-recent-modal-family.mts --output=tmp/coverage-r43-passe-recent-modal-family.json
npx tsx scripts/expand-v3-passe-recent-modal-family.mts --output=tmp/coverage-r43-passe-recent-modal-family.json --check
shasum -a 256 tmp/coverage-r43-passe-recent-modal-family.json
cp tmp/coverage-r43-passe-recent-modal-family.json generated/french-v3-passe-recent-modal-family-expansion.json
R43_FLAGS=(--bank-revision 43 --verb-family-recognition --etre-participle-agreement --question-detail-reading --local-definition-reading --avoir-participle-agreement --causal-reading-genres --cause-relation-family --passe-recent-modal-family)
npx tsx scripts/assemble-v3-review-candidate.mts "${R43_FLAGS[@]}"
npx tsx scripts/build-parallel-review-candidate.mts "${R43_FLAGS[@]}"
npx tsx scripts/build-scoped-review-candidate.mts "${R43_FLAGS[@]}"
npx tsx scripts/prepare-scoped-publication.mts "${R43_FLAGS[@]}"
npx tsx scripts/verify-scoped-command-journey.mts "${R43_FLAGS[@]}"
node --conditions=react-server --import tsx scripts/publish-scoped-diagnostic.mts export-bank /tmp/french-v3-r43-passe-recent-modal-bank.json "${R43_FLAGS[@]}"
```

The first four builders must subsequently pass with `--check`. The isolated service journey command is `npx tsx scripts/verify-orthography-foundation-journeys.mts --passe-recent-modal-family` after the coordinator has built the R43 scoped artifacts.

The modal draft has internal checksum `sha256:344e7fd6d823247b0457f0a5c30431c77227c61fec7e0a9c6722c1190ff68920` and raw JSON SHA-256 `de49a2c2eea081d843267b2a22baeda587211a3fa605268dc99f9985ab70984f`. It contains 36 questions, 36 annotations, 18 authored initial items and 18 authored learning items. In-memory R43 assembly yields 8,088 bank items and checksum `sha256:6639103de03cc7af51f41d1d129f98fddc290f943ddbd2012415dd65448649e0`. Any mismatch must stop integration.

## Exact registry task status

The shared registry currently records the following exact states:

| Targets | Q | L | V | R | O |
| --- | --- | --- | --- | --- | --- |
| C001, C002, C003 | implemented | implemented | planned | planned | awaiting_real_review |
| C081, C082 | implemented | implemented | planned | planned | awaiting_real_review |

`V` remains planned even though narrow local tests pass, because candidate-level integration and validation have not happened. `R` remains planned because no draft was published. `O` remains `awaiting_real_review`; authoring and automated checks do not count as owner review.

## Validation evidence

- `npx vitest run src/lib/diagnostic/granular/passe-recent-modal-family.test.ts src/lib/diagnostic/granular/cause-relation-family.test.ts`: 2 files and 10 tests passed.
- `npx tsx scripts/expand-v3-passe-recent-modal-family.mts` and `--check`: 36 questions, 18 initial and 18 learning, draft status.
- `npx tsx scripts/expand-v3-cause-relation-family.mts` and `--check`: 28 questions, 14 initial and 14 learning, draft status.
- `npx eslint` on both family modules, builders and tests: passed with zero warnings. The `.mts` generator scripts are excluded by the repository lint configuration.
- `npx tsc --noEmit`: passed after replacing an unsafe annotation cast in the portable first-family test with a checked facet guard.
- `git diff --check` on the owned files: passed.

The cause tests verify exact registry requirements, pool sufficiency, three negative examples in each C081 pool, unique assessed sentences across C082, deterministic grading, causal-direction rejection, teaching separation, pending review status and artifact checksum integrity.

## Integration required from the coordinator

1. Generate the cause artifact under `tmp/coverage-*`, verify its internal checksum and raw file checksum, then copy those exact bytes to `generated/french-v3-cause-relation-family-expansion.json`.
2. Run the complete revision-42 command chain above. Do not add the cause source or lessons to the default catalogues; their explicit option preserves revision-41 reproduction.
3. Verify that allocation retains seven initial and six learning probes for C081, including the existing eligible sentence probe, and eight initial plus eight learning probes for C082. The two old C082 probes without assessed sentence material must remain retired from allocation.
4. Verify the scoped candidate keeps exact check bindings as `draft`, while the separately prepared publication envelope contains the same binding IDs and probe IDs as `published`, has no instruction or fresh-check gap, and remains checksum-bound to the `parallel_review` policy.
5. Publish through the existing locked parallel-review mechanism and verify the deployed cause learning paths. Owner review proceeds independently in parallel; publication must preserve pending review metadata and must not fabricate approvals.

## Remaining limits

The experimental modal artifact contains no approval provenance and every new item remains `needs_human_review`. Every modal lesson remains `draft_requires_review`. The current frozen R42 scope remains 362 of 544 targets until the coordinator builds R43. This R43 integration work did not change a shared generated bank, candidate file, package file, engine, database or production environment.

The homophone family C161 to C174 was investigated but not selected. Its approved contract requires three novel words per target while each fixed homophone pair contains only two target words. Resolving that mismatch would require an approved contract change, so this workstream did not weaken the evidence rule or create placeholder coverage.
