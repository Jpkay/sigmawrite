# Avoid duplicate immutable release validation

For parallel-review releases, the store validated question pools, bank binding, activity bindings and teaching content, then ran `prepareParallelPublication`, which repeats all four checks. It now uses that complete preflight once. Non-parallel releases retain all four explicit checks. The extra content-reference check remains for every release.

This does not cache across requests or skip live availability checks. Each call still fetches and checks the bundle checksum, published parent taxonomy and bank, and exact publication permission. Rejected preflight is not cached. Existing tests cover changed content, withdrawn releases and permissions, invalid parent bindings and revalidation after rejection.

Three direct measurements using the actual published 160-target bundle produced identical preflight reports. Before: 863, 791 and 788 ms. After: 455, 439 and 434 ms. These local timings exclude network, authentication, rendering and other action work; they do not demonstrate a browser speed improvement.

Validation: the existing 489 granular tests passed, TypeScript passed, and the expanded four-test permission suite passed after adding a rejection/retry regression. Source ESLint passed. The change is prepared, not yet deployed. The broader loading-delay investigation remains open.
