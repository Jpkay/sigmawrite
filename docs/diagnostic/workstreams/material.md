# Material workstream — P3.01–P3.02

Updated: 2026-09-13 09:20 Africa/Kigali

## Scope and invariants

- Owner: `material`.
- Roadmap items: P3.01 (reconcile remaining delivery gaps) and P3.02 (practice-player capture).
- Owned implementation: `src/app/student/practice/[nodeId]/page.tsx`, `src/app/student/practice/[nodeId]/practice-player.tsx`, the dedicated `practice-player-display` helper, and focused tests.
- Shared action integration in `src/lib/actions/student.ts` is coordinated with the workstream owner because that file contains unrelated work.
- Guided practice remains guided evidence. None of this work changes its evidence expectation or promotes it to independent mastery.
- Complete history remains off. Migration `20260912130000_atomic_covered_material_delivery.sql` remains unapplied. Existing students are not backdated and this work does not establish complete prior-material history.

## P3.01 reconciliation

The 2026-09-12 route inventory was reconciled against `remediationsAfterBaseline` and the current source. Verb references, rule references, inbox, vocabulary, memory, recueil, repair, and home have subsequent capture work and are no longer the route-level gaps listed in the baseline. Their cross-cutting version/global-error limits remain.

The concrete remaining work after P3.02 is:

| Roadmap | Surface | Current boundary/evidence | Remaining gap |
| --- | --- | --- | --- |
| P3.03 | `student/production/[nodeId]` | Task and feedback payloads use `legacy:production-task` and `legacy:production-feedback`. | Audit and capture all player-only headings, controls, word-count sentences, rubric/correction formatting, completion variants, and controlled failures before their browser/action delivery. |
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
- `npm run typecheck` — passed.
- `npx esbuild scripts/.verify-practice-player-capture.mts --bundle --platform=node --packages=external --format=esm --outfile=/tmp/sigmawrite-practice-player-verifier.mjs` — passed (syntax/bundle validation only; no remote run).
- `npm run typecheck` — passed.

Validation covers projection/render parity, deterministic ordering parity, exact feedback/completion formatting, bounded error copy, authorization ordering, both page-capture failure points, and the existing feedback/coaching fail-closed paths. No deployment, migration, live-student mutation, commit, push, or complete-history activation was performed.
