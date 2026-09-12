# Remaining material-history work

The accompanying JSON inventories all 23 `src/app/student/**/page.tsx` routes, plus the demo HTML endpoint and shared layout. It records source hashes at commit `28cb2d7`. This is a manual source audit, not a coverage certificate. A journal call for a lesson payload does not prove that its player messages, controls, errors or old client versions were captured.

Baseline findings: 11 pages with confirmed gaps, six with partial review, five with implemented capture, and the home page with implemented changes awaiting deployment. No page classification proves complete history for a student.

The remaining work is grouped into these bounded batches:

1. Reference pages: verb search, rule headings, curriculum tag formatting and unavailable states. This commit records the verb-index heading, search labels, placeholder, accent controls and unavailable-table navigation using shared copy. Rule and curriculum-tag work remains.
2. Memory, vocabulary and inbox: fixed controls, locally produced feedback/counts, formatted dates and error states. Existing card, word and notification content is already journaled.
3. Practice, production and repair: player introduction, exercise and completion states; counts, feedback wrappers and error text. Existing instructional and answer payloads are not a substitute for these displays.
4. Reading, reading results and dictation: locally constructed corrections/justifications, controls, completion/result summaries and errors. Include child components and audio fallback paths.
5. Recueil and legacy branches: formatted entry text and empty states; legacy diagnostic, frontier and progress. Keep the demo HTML endpoint explicit, including its non-demo forbidden response.
6. Cross-cutting contract: errors, accepted client/build versions, offline replay, owner changes and concurrent/late deliveries. Only after those are verified should atomic covered delivery and a fresh baseline be enabled. Existing students must not receive a backdated assertion of complete history.

The fresh R41 diagnostic is running separately on the unchanged public deployment. That run can prove functional progression into a recommended lesson, but cannot prove complete novelty evidence while the capture contract is disabled. Full graph expansion and owner review remain separate requirements.
