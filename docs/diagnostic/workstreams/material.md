# Material workstream — P3.01–P3.03

Updated: 2026-09-13 09:45 Africa/Kigali

## Scope and invariants

- Owner: `material`.
- Roadmap items: P3.01 (reconcile remaining delivery gaps), P3.02 (practice-player capture), and P3.03 (production-player capture).
- Owned implementation: the practice and production student route/player files, their dedicated display-projection helpers, and focused tests.
- Shared action integration in `src/lib/actions/student.ts` is coordinated with the workstream owner because that file contains unrelated work.
- Guided practice remains guided evidence. None of this work changes its evidence expectation or promotes it to independent mastery.
- Complete history remains off. Migration `20260912130000_atomic_covered_material_delivery.sql` remains unapplied. Existing students are not backdated and this work does not establish complete prior-material history.

## P3.01 reconciliation

The 2026-09-12 route inventory was reconciled against `remediationsAfterBaseline` and the current source. Verb references, rule references, inbox, vocabulary, memory, recueil, repair, and home have subsequent capture work and are no longer the route-level gaps listed in the baseline. Their cross-cutting version/global-error limits remain.

The concrete remaining work after P3.03 is:

| Roadmap | Surface | Current boundary/evidence | Remaining gap |
| --- | --- | --- | --- |
| P3.04 | `student/read/[sessionId]`, `student/results/[sessionId]` | Reading text, next recommendation, and stored result payloads are journaled. | Capture locally assembled correction/justification sentences, result labels and zone wording, controls, formatted counts, and finite error states. Recheck the legacy progress/frontier projections that link to these routes. |
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
