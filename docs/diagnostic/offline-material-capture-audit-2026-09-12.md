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

## Owner-bound cache repair (subsequent implementation)

The URL-only pack described above has been replaced in source. Authenticated student responses now carry a server-derived owner header after role and password-change redirects. Client-supplied owner headers do not establish identity. The home page requests prefetches; only the service worker writes their successful, non-redirected HTML responses into an owner-specific pack.

The worker tracks the client that received the server response, matches the complete URL including its query, and verifies the stored response owner before offline replay. An online navigation for another owner removes the previous pack and client bindings. A generation check rejects prefetches that finish after sign-out; serialized writes ensure clearing runs after any already-started cache write. An unknown client or restarted worker must reconnect before replaying private content. This is an explicit limitation: offline replay is not restored from an unverified persisted owner marker.

Activation removes earlier pack versions. The worker fallback HTML is still a separate exposure-capture gap. The owner header proves account association only; it does not certify complete page-body capture, a material-history baseline, or mastery evidence. Browser deployment/version rollout remains pending.

The real Chromium fixture verified online prefetch, offline replay and reload, rejection after account switching, and rejection after an acknowledged worker sign-out clear. It uses local simulated authenticated responses, not production student accounts. `scripts/verify-offline-owner-cache.mjs` and `offline-owner-browser-2026-09-12.json` preserve the reproducible check and its scope. Unit checks additionally cover late downloads, unknown clients, exact query matching, unsigned/redirected/RSC content, and worker restart. Middleware checks verify validated-owner stamping and redirect exclusions.

After the owner-cache repair, TypeScript passes and the full regression suite passes with two workers: 408 files, 1,795 tests. No timeout thresholds or assertions were relaxed.

## Shared worker fallback and student shell

The worker fallback now imports its HTML from `public/offline-fallback.js`, whose title, heading and message are also imported by the authenticated student layout and recorded before returning the shell. The worker is registered as a module with imported-script HTTP cache bypass on update. The local Chromium verifier upgrades the actual previous classic worker from commit `0e8af48`, then repeats replay, reload, account-switch and sign-out checks; the result is in `offline-shared-copy-browser-2026-09-12.json`.

The layout also records the shared French skip link, quick-navigation label, brand, theme and sign-out controls, loading/retry/error wording, and inactive-invitation text. Those components render the same constants. This does not traverse child page bodies or establish prior-version coverage. It conservatively records possible interface states before they appear.

The rendered-shell/access/loading test and route/worker tests pass (18 tests across four files). The module-worker migration is verified in local Chromium only, not every supported browser or deployed installation. Full-history activation still requires the remaining page/action capture inventory and deployed fresh-student evidence. Metadata, unsupported error states and older cached app code must not be assumed covered.

The shared-copy batch also passes TypeScript and the full two-worker regression suite: 409 files, 1,796 tests. The final layout fixture was rerun after removing unrelated mock properties. Production remains unchanged.
