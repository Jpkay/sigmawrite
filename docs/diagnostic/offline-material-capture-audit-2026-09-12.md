# Offline and shared-control exposure audit

The diagnostic fixed-copy payload now includes the same accent-button characters, accessibility label and prompt-section labels rendered by `AccentTextarea` and `ExercisePrompt`. The payload contains no typed draft. A rendered-component test checks the labels against the actual journal fragments. This establishes these controls on the diagnostic route, not every other caller of the shared components.

The server-rendered `/student/offline` information page records its exact headings and paragraphs for the authenticated student before returning. A deferred-write test and failure test verify that this page does not precede recording. This route is distinct from the service-worker fallback.

## Remaining offline contract work

- `public/sw.js` serves its own hardcoded fallback HTML when a navigation cannot reach the network. It does not invoke the server-rendered offline page. That fallback text is not yet covered by an authenticated payload record.
- The home client adds recommendation and plan URLs to `plume-offline-pack-v1`. Those are network fetches, so any implemented server boundaries execute at prefetch time. This observation does not prove every cached page body is captured.
- The worker can replay a pack response without a new server request. A complete contract must retain the original owner, source/version and exposure record across replay; URL-only cache lookup is not evidence of those properties. Sign-out clears private state, but this alone does not prove replay isolation or concurrent cache-write behavior.
- The legacy reading queue saves choices locally and resends them. It is not a ledger of newly displayed words, instructions or feedback.
- Existing installed workers and previously cached pages require explicit version handling before enabling a new capture contract. Do not infer a clean baseline from the current source version.

No complete-history contract is enabled by these changes. No old student history is backfilled or declared complete. The next offline verification must cover fresh online prefetch, offline replay, account switch/sign-out, an old worker/cache version, and reconnection without changing answer ownership or retroactively validating observations.

## Verification

TypeScript and the seven focused checks pass. The broad run passed 1,785 tests and hit the default five-second timeout in three content-validation tests (two files). Both files passed in an isolated single-worker rerun: four tests, unchanged assertions and timeouts. This is not a claim that the initial broad run was all green. No deployment or complete-history activation was performed.
