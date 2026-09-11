# Reusing deterministic release validation within an action

A granular answer action loads a release for grading and again before recording the next material delivery. Each load previously repeated the full question-pool, bank, teaching, activity and publication preflight validation for the identical bundle.

SupabaseAssessmentStore now retains one successful deterministic validation result, keyed by the bundle content checksum, for that store instance. A new action creates a new store. Every release call still fetches the actual bundle, recomputes and verifies its checksum, checks parent IDs and their live published checksums, and reads the exact publication permission. Changed content is revalidated; rejected validation is never reused. A withdrawn release or parent and missing or failed permission reads still withhold content.

Four additional regressions verify single-instance reuse, fresh-instance validation, fresh reads on every call, checksum corruption detection, changed-content revalidation, failed-validation recovery and release withdrawal. Existing parent and permission withdrawal tests pass. The full granular suite contains 433 passing tests; TypeScript and source lint pass.

A production-data spot check loaded and validated the 4,574-item release in 4,042 ms on the first call and 1,793 ms on the second call in the same store. Network and warm-up differences make this an observation, not a controlled latency claim. Database content is not cached and further response-time work remains possible.
