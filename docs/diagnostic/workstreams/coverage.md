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

1. After deciding that the cause draft is ready for the review pipeline, place its artifact at the versioned generated path expected by assembly and add `cause-relation-family` to `FRENCH_DRAFT_EXPANSION_SOURCES` in `src/lib/diagnostic/granular/draft-expansion-sources.ts`.
2. Import `CAUSE_RELATION_TEACHING` into `src/lib/diagnostic/granular/draft-teaching-catalogue.ts` and include its two lessons in `FRENCH_TEACHING_DRAFTS`.
3. Add an explicit selection flag in `scripts/lib/granular-authoring-selection.ts` if the new source must remain opt-in for the next revision. The default assembly must keep reproducing revision 41 until the coordinator intentionally advances it.
4. Assemble a review candidate, apply the evidence annotations, allocate pools and verify that C081 retains 6 initial plus 6 learning items and C082 retains 8 initial plus 8 learning items with no repeated assessed sentence.
5. Run independent teacher review for all questions and both lessons. Record approvals only through the normal review workflow, then run P4.03 publication and deployed-path checks before adding C081 or C082 to production scope.

## Remaining limits

The experimental artifacts contain no approval provenance and every new item remains `needs_human_review`. Every lesson remains `draft_requires_review`. The release scope remains 360 of 544 targets. No shared generated bank, candidate file, package file, engine, publication assembly, database or production environment was changed by this workstream.

The homophone family C161 to C174 was investigated but not selected. Its approved contract requires three novel words per target while each fixed homophone pair contains only two target words. Resolving that mismatch would require an approved contract change, so this workstream did not weaken the evidence rule or create placeholder coverage.
