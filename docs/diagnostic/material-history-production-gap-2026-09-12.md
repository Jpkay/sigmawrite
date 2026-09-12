# Production material-history integration gap

The deployed focused QA diagnostic submitted 12 actual answers (4 correct, 8 incorrect) to the written-syllable target. Eight subsequent independent checks were also submitted incorrectly. None became eligible evidence for this novelty-required target. The mobile result page correctly displayed its features as unverified; the pathway continued asking checks instead of reaching instruction.

The persisted observations carry feature annotations and real presentation receipts, but `historyComplete` is false. At the time of that focused run, the store did not implement the optional `materialHistoryComplete` contract. The current store now implements it, but this does not by itself establish complete capture (see the current-state audit below). The engine requires complete history for targets demanding previously unseen words or sentences. The in-memory journey stores return true for their synthetic histories; those checks do not establish this production capability.

This invalidates any claim that the existing live journeys prove novelty-required learning or answered feature counts. It does not invalidate the recorded answers, the routes exercised, or the engine's conservative exclusion. Public activation of another candidate will not repair the missing integration.

## Required repair

1. Establish a server-owned coverage record with a defined starting point and capture version. Never infer complete lifetime coverage merely from an empty ledger, a newly recorded presentation, account age, or absence of submitted answers. A page can have exposed content without an answer.
2. Cover every content delivery capable of exposing assessed material: initial and follow-up questions, guided teaching, correct-answer review, legacy practice, reading, vocabulary, dictation and reference content. Existing annotations prove only listed identities; missing or partial annotations must invalidate coverage, or the recorder must conservatively identify all applicable material from delivered content.
3. Create coverage for fresh students only when their entire in-app delivery history is tracked under that contract. Older students need an audited backfill from reconstructible delivered sources; unresolved history remains explicitly incomplete. Preserve all prior receipts and the demo account.
4. Make presentation recording and coverage validation race-safe. Receipt reads must tie the coverage assertion to the same owner, presentation and source version, and account for earlier untracked exposure. A later marker must not retroactively validate old observations.
5. Implement the production store assertion against those records. Test cross-student isolation, incomplete capture, prior exposure, source changes, concurrent/retried delivery, missing backfill, and fresh independent evidence after teaching. Do not replace the engine's novelty checks with a constant true value.
6. Repeat the focused deployed QA with deliberately mixed feature outcomes. Require nonzero eligible answered feature rows, check the displayed correct/incorrect counts, reach instruction, complete guided work and a fresh independent check, and verify persistence. Then rerun the broader released journeys.

The display verifier now has `--require-answered`, which fails when a test only proves rendering of unknown rows. Its report includes each expected feature and count. The failed QA session is retained as evidence, without edited answers or exposure claims.

## Current-state audit after source 51b456c

The original failure above is retained as historical evidence, not a description of missing methods in the current source.

- `store.ts` now implements `materialHistoryComplete` by reading an immutable presentation-time database assertion. Missing pre-migration support returns false; unexpected responses and database errors fail. It does not infer coverage from account creation.
- `covered-material-delivery.ts` can atomically record both the delivered text and its presentation identities under a trusted capture contract. `actions/granular-diagnostic.ts` calls it without a contract, so it still uses ordinary conservative capture. No runtime caller supplies an enabled contract.
- `20260912130000_atomic_covered_material_delivery.sql` defines the atomic operation. Applying this migration alone cannot enable coverage: its operation requires an enabled contract, and it creates no student baseline.
- `server-delivery-journal.ts` journals authenticated server payloads. It does not traverse rendered React children or capture client-generated strings. The student shell addition at 51b456c records navigation labels and identity supplied by the layout, not all text inside DashboardShell or its children.
- Reference, lesson-list, progress and frontier routes have explicit delivery boundaries. Reading, vocabulary, dictation, feedback and other action payloads also have boundaries. Their presence is evidence for those payloads only, not for every rendered page.
- At 51b456c, `student/settings/page.tsx` supplied static copy without recording it. The subsequent settings change moves fixed headings, reading preferences, password help and daily-goal copy into a server-journaled payload shared with the client. It does not capture password input or claim coverage of arbitrary runtime errors. `student/offline/page.tsx` and other client flows require inspection of their actual content and cached delivery behavior. Route enumeration is not proof of complete capture.

The next integration must define and record the complete delivered material for each surface, including client states and cached/offline content, or invalidate coverage whenever an unsupported surface is exposed. Existing students must retain incomplete historical coverage unless their prior exposure can be reconstructed. Do not activate the contract as a shortcut to obtain green novelty tests.

Production revision 37's completed audit remains the regression case: 14 responses requiring novel material, zero verified, all excluded because history was incomplete. Once integration is complete, repeat a real deployed journey that demonstrates eligible evidence and a lesson transition; a synthetic store returning true does not meet this requirement.
