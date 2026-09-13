# Material workstream — P3.01–P3.05

Updated: 2026-09-13 10:49 Africa/Kigali

## Scope and invariants

- Owner: `material`.
- Roadmap items: P3.01 (reconcile remaining delivery gaps), P3.02 (practice-player capture), P3.03 (production-player capture), P3.04 (reading/results capture), and P3.05 (dictation capture).
- Owned implementation: the practice, production, reading, results, and dictation student route/player files, their dedicated display-projection helpers, and focused tests.
- Shared action integration in `src/lib/actions/student.ts` is coordinated with the workstream owner because that file contains unrelated work.
- Guided practice remains guided evidence. None of this work changes its evidence expectation or promotes it to independent mastery.
- Complete history remains off. Migration `20260912130000_atomic_covered_material_delivery.sql` remains unapplied. Existing students are not backdated and this work does not establish complete prior-material history.

## P3.01 reconciliation

The 2026-09-12 route inventory was reconciled against `remediationsAfterBaseline` and the current source. Verb references, rule references, inbox, vocabulary, memory, recueil, repair, and home have subsequent capture work and are no longer the route-level gaps listed in the baseline. Their cross-cutting version/global-error limits remain.

The concrete remaining work after P3.04 is:

| Roadmap | Surface | Current boundary/evidence | Remaining gap |
| --- | --- | --- | --- |
| P3.05 | `student/dictee`, `student/dictee/[dictationId]` | Catalog, selected session, offered audio metadata, and result payloads have delivery boundaries. | Capture catalog/player headings, preparation and playback instructions, buttons, empty states, result formatting, finite error states, and the authoritative audio/transcript relationship. Signed URLs remain excluded from text capture. |
| P3.06 | Legacy diagnostic/result branches and `student/diagnostic/demo-review` | Granular diagnostic/review copy is captured. | Capture legacy diagnostic/result client copy and dynamic corrections; journal authorized saved demo HTML before returning it; record the forbidden response shown to non-demo students. |
| P3.07 | Student layout, settings, offline/cache and all route errors | Shell, settings, and offline fixed copy have partial or subsequent capture. | Bind history to an accepted client/build version; invalidate unsupported cached/offline deliveries; prove owner changes and access transitions; eliminate or capture arbitrary server errors; test late requests and uncovered concurrent delivery. |
| P3.08 | Atomic covered delivery and release | The raw journal records exact text but grants no novelty. | After P3.03–P3.07, apply and verify the atomic migration, create a fresh baseline only, run database concurrency/rollback checks, and complete a deployed diagnostic → guided lesson → fresh independent check. |

## P3.02 implementation status

Implemented in the owned practice route:

- The authenticated server records the existing practice payload and a new `legacy:practice-player` projection before returning `PracticePlayer` props.
- The projection records fixed player copy, shared exercise labels, parsed prompt sections, deterministic hint ladders, worked examples, reading instructions, ordering labels and initial order, rule/source props, start/progress strings, and all valid completion-count/XP variants available in the client bundle.
- The player imports the same copy and formatting functions used by the projection. Infrastructure exception text is mapped to finite recorded learner messages; the explicit seven-minute timeout remains a recorded special case.
- A material or display-journal failure rejects the page before browser props are returned. Earlier idempotent journal writes are safe to retry.
- Runtime validator feedback already uses `legacy:practice-feedback` before the attempt insert. Language coaching uses `legacy:practice-language-tip` and fails closed before returning generated or cached corrections.

Runtime action integration:

- `submitNodePractice` now resolves remediation before the attempt insert and journals `practiceFeedbackDisplay(...)` first. A formatted-display capture failure stores no attempt and changes no mastery. Guided answers retain their existing guided/controlled evidence expectation.
- `completeNodePracticeSession` now journals `practiceCompletionDisplay(result)` before returning the result. Because the current RPC commits before the journal write, capture failure withholds browser delivery but does not roll back the already-completed session. Transactional completion plus capture belongs to P3.08; no atomicity claim is made here.
- `getPracticeLanguageCoaching` now includes `practiceLanguageCoachingDisplay({result, requested})` with generated, cached, unavailable and no-change results, so the client-assembled `before → after` correction is stored exactly before delivery.

Candidate/public browser verification is bounded by `scripts/.verify-practice-player-capture.mts`. It requires `PLUME_VERIFY_URL` and `PLUME_VERIFY_REPORT`, authenticates the existing non-demo capture QA account without printing credentials, records one deliberately wrong text response, verifies the exact player and feedback journal rows, and does not complete the lesson. The coordinator runs it against candidate and public deployments.

## Validation log

- `npx vitest run src/lib/diagnostic/granular/practice-player-display.test.ts 'src/app/student/practice/[nodeId]/practice-player.test.ts' 'src/app/student/practice/[nodeId]/page.test.ts' src/lib/diagnostic/granular/practice-material-delivery.test.ts src/lib/actions/practice-feedback-delivery.test.ts src/lib/actions/practice-completion-delivery.test.ts src/lib/actions/language-coaching-delivery.test.ts` — passed, 7 files / 27 tests.
- `npx eslint src/lib/diagnostic/granular/practice-player-display.ts src/lib/diagnostic/granular/practice-player-display.test.ts 'src/app/student/practice/[nodeId]/page.tsx' 'src/app/student/practice/[nodeId]/page.test.ts' 'src/app/student/practice/[nodeId]/practice-player.tsx' 'src/app/student/practice/[nodeId]/practice-player.test.ts' src/lib/actions/language-coaching.ts src/lib/actions/language-coaching-delivery.test.ts` — passed.
- `npx eslint --no-ignore scripts/.verify-practice-player-capture.mts` — passed.
- `npm run typecheck` — passed.
- `npx esbuild scripts/.verify-practice-player-capture.mts --bundle --platform=node --packages=external --format=esm --outfile=/tmp/sigmawrite-practice-player-verifier.mjs` — passed (syntax/bundle validation only; no remote run).

Validation covers projection/render parity, deterministic ordering parity, exact feedback/completion formatting, bounded error copy, authorization ordering, both page-capture failure points, and the existing feedback/coaching fail-closed paths. No deployment, migration, live-student mutation, commit, push, or complete-history activation was performed.

Candidate follow-up: the first P3.02 candidate run stored exactly one intended wrong QA attempt and its dynamic feedback, then stopped on a presentation-case assertion. A read-only rerun showed that `innerText` applied the CSS `uppercase` transform (`EXERCICE 1 SUR 6`) while the journal correctly held the delivered text source (`Exercice 1 sur 6`). The verifier now compares `textContent` and reports presentation casing separately through the browser screenshot/UI rather than treating CSS presentation as a second delivered text fragment. No second answer was submitted during diagnosis.

## P3.03 implementation status

Implemented in the production route and action boundary:

- `productionTaskDisplay(...)` projects the player headings, mastery explanation, genre label, textarea placeholder and accent controls, initial word count, target range, range-validation sentence, busy/submit controls, result controls, and the finite learner error vocabulary. The journal payload also retains the task itself, including the database-authored competency label and description, genre labels, prompt, and word bounds.
- `loadIndependentProductionTask` records `{ task, display }` at `legacy:production-task` before returning the initial server-rendered player props or a client-requested genre change. A journal failure withholds the task.
- `productionResultDisplay(...)` constructs the exact recorded/success/revision heading, feedback, joined matched-form sentence, rubric score and dimensions, missing-score glyph, priority sentence, deterministic fallback note, and retry/return controls used by the browser.
- `submitIndependentProduction` includes that projection in `legacy:production-feedback` before inserting the independent production. A feedback-capture failure stores no submission and changes no mastery, so the same text remains retryable. This evidence retains the existing `independent_production` expectation and is not treated as guided practice.
- The browser maps arbitrary infrastructure exceptions to one generic message and passes through only the enumerated range, duplicate, unavailable, unsupported, and no-active-path errors.

The feedback journal is pre-insert, but the whole production action is not transactional. A later mastery, activity, or XP failure can withhold the browser result after the submission already exists. P3.03 therefore establishes exact task/result text capture at its bounded delivery points, not global fail-closed atomicity or complete history. The unapplied `20260912130000` migration remains the P3.08 gate.

P3.03 validation:

- `npx vitest run src/lib/actions/production-delivery-journal.test.ts src/lib/diagnostic/granular/production-player-display.test.ts 'src/app/student/production/[nodeId]/production-player.test.ts' 'src/app/student/production/[nodeId]/page.test.ts' --reporter=verbose` — passed, 4 files / 13 tests.
- `npx eslint src/lib/diagnostic/granular/production-player-display.ts src/lib/diagnostic/granular/production-player-display.test.ts 'src/app/student/production/[nodeId]/production-player.tsx' 'src/app/student/production/[nodeId]/production-player.test.ts' 'src/app/student/production/[nodeId]/page.test.ts'` — passed.
- `npm run typecheck` — passed.
- `npx eslint --no-ignore scripts/.verify-production-player-capture.mts scripts/.verify-practice-player-capture.mts` — passed.
- `npx esbuild scripts/.verify-production-player-capture.mts --bundle --platform=node --packages=external --format=esm --outfile=/tmp/sigmawrite-production-player-verifier.mjs` — passed (syntax/bundle validation only).

`scripts/.verify-production-player-capture.mts` is the bounded deployed check for P3.03. It requires `PLUME_VERIFY_URL`, `PLUME_VERIFY_REPORT`, and an eligible `PLUME_VERIFY_PRODUCTION_NODE`; `PLUME_VERIFY_QA_FILE` may select a non-demo QA fixture. It renders one authorized task, compares browser source strings and all fixed player copy with `legacy:production-task`, asserts that the independent-submission count does not change, and emits a sanitized failure artifact. It never fills or submits the writing textarea. The existing granular-capture QA fixture currently has no active independent-production path, so no remote production-player verification has been claimed.

The P3.02 public verification also exposed an existing practice validation mismatch: the UI can send three support steps (two hints plus the worked example), while `timedPracticeAttemptSchema` accepted at most two. The public action rejected the request before inserting an attempt and the player showed the finite generic error. The coordinator owns that action/schema fix and the next candidate verification. The verifier now records sanitized main text, nonempty learner alerts, recent session/attempt state on failure, and accepts `PLUME_VERIFY_SUBMIT_RETRIES=0` for a mutation-bounded diagnostic run.

## P3.04 implementation status

Implemented in the reading and results delivery path:

- `readingPlayerDisplay(...)` records the fixed reader controls, paragraph speech labels, displayed difficulty label, joined vocabulary rows, summary/retrieval prompts and controls, accent keyboard, offline and online failure strings, and every question-position/outcome variant. It deterministically records the same shuffled answer order and cited-evidence candidates used by the browser, including the quoted candidates and both correct and corrective justification sentences.
- `loadReadingPagePayload` now journals `{ text, display }` at `legacy:reading-page` before returning route props. A journal failure withholds the page. The client imports the same copy and construction helpers; reading evidence remains receptive, and justification remains a supporting event rather than independent production.
- `readingResultsDisplay(...)` records missing/loading/empty states and the authoritative result rendering: rounded overall and category percentages, learning-zone label, next-action label, selected CTA, schedule sentence, correction heading, and deterministic correction choice order. `legacy:reading-results-page` receives `{ text, nextStep, display }` before the route renders.
- `writingFeedbackDisplay(...)` and `writingEvaluationDisplay(...)` construct the exact annotated-summary score, degraded-mode suffix, non-overlapping correction excerpts, replacement suggestions, teacher score/comment, change heading, rubric dimensions, priority sentence, per-plan counts and links, remaining-revision count, controls, accent keyboard, and finite revision error. `loadWritingFeedback` captures the full history projection before returning it. A newly evaluated revision captures its result projection before the evaluation row is persisted, leaving the same revision retryable when capture fails.
- The linked progress surfaces were rechecked: legacy recent-reading titles, percentages, and next-action labels already share `recentReadingDisplay(...)` with `legacy:student-state`; granular progress/frontier pages already journal `frontierDisplayText(...)`. Other legacy progress/profile copy is a general shell/history concern for P3.07 rather than reading-result material.

The result projection uses the authoritative server state selected during page delivery. Unsupported cached or offline client versions can still show stale local state; client/build version binding remains P3.07. Reading completion itself remains a multi-write claim/finalize workflow, so P3.04 makes no global transactional or complete-history claim. The atomic migration remains unapplied.

P3.04 validation:

- `npx vitest run src/lib/actions/summary-feedback-delivery.test.ts src/lib/diagnostic/granular/reading-display.test.ts src/lib/diagnostic/granular/writing-feedback-display.test.ts src/lib/reading/page-delivery.test.ts 'src/app/student/read/[sessionId]/reading-player.test.ts' 'src/app/student/results/[sessionId]/reading-results.test.ts' --reporter=verbose` — passed, 6 files / 25 tests.
- `npx eslint src/lib/actions/student.ts src/lib/actions/summary-feedback-delivery.test.ts src/lib/diagnostic/granular/reading-display.ts src/lib/diagnostic/granular/reading-display.test.ts src/lib/diagnostic/granular/writing-feedback-display.ts src/lib/diagnostic/granular/writing-feedback-display.test.ts src/lib/reading/page-delivery.ts src/lib/reading/page-delivery.test.ts 'src/app/student/read/[sessionId]/reading-player.tsx' 'src/app/student/read/[sessionId]/reading-player.test.ts' 'src/app/student/results/[sessionId]/reading-results.tsx' 'src/app/student/results/[sessionId]/reading-results.test.ts' src/components/writing-feedback.tsx` — passed.
- `npm run typecheck` — passed.

## P3.05 implementation status

P3.05 is locally ready for coordinator integration:

- `dictationCatalogDisplay(...)` records loading, empty and finite error states plus every delivered row title, focus, kind, grade range, word/time summary, latest score state and start/retry control. The catalog client renders from the same copy and formatters. `loadDictationCatalog` journals `{ rows, display }` before returning; a failed capture withholds the catalog and remains retryable without mutation.
- `dictationSessionDisplay(...)` records preparation, headings, focus/segment summary, instructions, browser-voice disclosure, playback and navigation controls, transcript placeholder, accent controls, template blank labels/choices, replay counter, negotiation controls, result controls and the finite learner-visible failure vocabulary. Arbitrary infrastructure messages are replaced with stage-specific generic copy; only enumerated server-authored failures pass through.
- For immutable server audio, `legacy:dictation-audio-offered` records the validated manifest before `legacy:dictation` records and returns the selected session. The manifest binds ordered source transcripts and speech plans to content-addressed byte checksums. Signed URLs are excluded by the delivery-text extractor, and neither the expected transcript nor manifest enters the player session. Legacy audio remains explicitly playable but uncertified; browser TTS remains development-only and its browser-delivered text is present in the session journal.
- `dictationResultDisplay(...)` records the authoritative expected transcript, score/XP variants, category counts, clean/exact states, omitted/extra replacements, explanations, rule links, negotiation prompts/options and all result controls before the result is exposed. An idempotent saved-result test proves a journal failure withholds that transcript and a mutation-free retry can return it.
- `submitDictationJustifications` journals both fresh and already-saved outcome displays before returning them. If the post-write capture fails, the retry follows the saved idempotent branch, journals the same correct/total result and does not write evidence again. As with the other multi-write legacy actions, this is fail-closed at browser exposure, not a claim of transactional journal-plus-domain mutation; P3.08 retains that atomicity gate.

P3.05 validation:

- `npx vitest run src/lib/diagnostic/granular/dictation-display.test.ts src/app/student/dictee/catalog-client.test.ts 'src/app/student/dictee/[dictationId]/dictation-player.test.ts' src/lib/actions/dictation-audio-delivery.test.ts src/lib/actions/dictation-catalog-delivery.test.ts src/lib/actions/dictation-justification-delivery.test.ts --reporter=verbose` — passed, 6 files / 23 tests.
- `npx eslint src/app/student/dictee/catalog-client.tsx src/app/student/dictee/catalog-client.test.ts 'src/app/student/dictee/[dictationId]/dictation-player.tsx' 'src/app/student/dictee/[dictationId]/dictation-player.test.ts' src/lib/diagnostic/granular/dictation-display.ts src/lib/diagnostic/granular/dictation-display.test.ts src/lib/actions/dictation-audio-delivery.test.ts src/lib/actions/dictation-catalog-delivery.test.ts src/lib/actions/dictation-justification-delivery.test.ts src/lib/actions/student.ts` — passed.
- `npm run typecheck` — passed.
- `git diff --check -- src/app/student/dictee src/lib/diagnostic/granular/dictation-display.ts src/lib/diagnostic/granular/dictation-display.test.ts src/lib/actions/dictation-audio-delivery.test.ts src/lib/actions/dictation-catalog-delivery.test.ts src/lib/actions/dictation-justification-delivery.test.ts src/lib/actions/student.ts docs/diagnostic/workstreams/material.md` — passed.

No deployment, live-student mutation, migration, complete-history activation, commit or push was performed. Candidate/public browser verification and integration remain coordinator-owned.
