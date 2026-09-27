# Avoid duplicate immutable release validation

For parallel-review releases, the store validated question pools, bank binding, activity bindings and teaching content, then ran `prepareParallelPublication`, which repeats all four checks. It now uses that complete preflight once. Non-parallel releases retain all four explicit checks. The extra content-reference check remains for every release.

This does not cache across requests or skip live availability checks. Each call still fetches and checks the bundle checksum, published parent taxonomy and bank, and exact publication permission. Rejected preflight is not cached. Existing tests cover changed content, withdrawn releases and permissions, invalid parent bindings and revalidation after rejection.

Three direct measurements using the actual published 160-target bundle produced identical preflight reports. Before: 863, 791 and 788 ms. After: 455, 439 and 434 ms. These local timings exclude network, authentication, rendering and other action work; they do not demonstrate a browser speed improvement.

Validation: the existing 489 granular tests passed, TypeScript passed, and the expanded four-test permission suite passed after adding a rejection/retry regression. Source ESLint passed. The change was subsequently deployed; see verification below. The broader loading-delay investigation remains open.

Candidate verification: the existing 158-target paused account opened successfully, and doves.demo still redirected to its eleven lessons. A sequential browser sample measured 17,765 ms on the public site and 13,929 ms on the candidate. The completed diagnostic POST measured 9,501 ms and 7,121 ms respectively. This small uncontrolled sample is consistent with an improvement but does not isolate the change or establish a stable latency reduction. The candidate also preserved the 160-target session, opening in 13,142 ms.

Runtime source c76fc80 was promoted as deployment dpl_BpN3i8G98h3GUBvbxzbjV24NsKro. The live bank and assessment release remain v8 / bank revision seven, at 160 supported targets. After promotion, the public 160-target account retained its paused zero-answer session; doves.demo retained eleven lessons. The public sample took 16,287 ms, including a 10,173 ms diagnostic POST. This confirms functionality but leaves the broader delay unresolved; before/after samples use different pinned releases and are not a controlled performance comparison.
