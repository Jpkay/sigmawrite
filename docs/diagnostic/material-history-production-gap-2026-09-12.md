# Production material-history integration gap

The deployed focused QA diagnostic submitted 12 actual answers (4 correct, 8 incorrect) to the written-syllable target. Eight subsequent independent checks were also submitted incorrectly. None became eligible evidence for this novelty-required target. The mobile result page correctly displayed its features as unverified; the pathway continued asking checks instead of reaching instruction.

The persisted observations carry feature annotations and real presentation receipts, but `historyComplete` is false. `SupabaseAssessmentStore` implements presentation capture and receipt reads but does not implement the optional `materialHistoryComplete` contract. `readQuestionMaterialReceipt` therefore returns false. The engine requires complete history for targets demanding previously unseen words or sentences. The in-memory journey stores return true for their synthetic histories; those checks do not establish this production capability.

This invalidates any claim that the existing live journeys prove novelty-required learning or answered feature counts. It does not invalidate the recorded answers, the routes exercised, or the engine's conservative exclusion. Public activation of another candidate will not repair the missing integration.

## Required repair

1. Establish a server-owned coverage record with a defined starting point and capture version. Never infer complete lifetime coverage merely from an empty ledger, a newly recorded presentation, account age, or absence of submitted answers. A page can have exposed content without an answer.
2. Cover every content delivery capable of exposing assessed material: initial and follow-up questions, guided teaching, correct-answer review, legacy practice, reading, vocabulary, dictation and reference content. Existing annotations prove only listed identities; missing or partial annotations must invalidate coverage, or the recorder must conservatively identify all applicable material from delivered content.
3. Create coverage for fresh students only when their entire in-app delivery history is tracked under that contract. Older students need an audited backfill from reconstructible delivered sources; unresolved history remains explicitly incomplete. Preserve all prior receipts and the demo account.
4. Make presentation recording and coverage validation race-safe. Receipt reads must tie the coverage assertion to the same owner, presentation and source version, and account for earlier untracked exposure. A later marker must not retroactively validate old observations.
5. Implement the production store assertion against those records. Test cross-student isolation, incomplete capture, prior exposure, source changes, concurrent/retried delivery, missing backfill, and fresh independent evidence after teaching. Do not replace the engine's novelty checks with a constant true value.
6. Repeat the focused deployed QA with deliberately mixed feature outcomes. Require nonzero eligible answered feature rows, check the displayed correct/incorrect counts, reach instruction, complete guided work and a fresh independent check, and verify persistence. Then rerun the broader released journeys.

The display verifier now has `--require-answered`, which fails when a test only proves rendering of unknown rows. Its report includes each expected feature and count. The failed QA session is retained as evidence, without edited answers or exposure claims.
