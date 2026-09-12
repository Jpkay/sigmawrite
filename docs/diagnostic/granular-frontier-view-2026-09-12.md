# Current granular results on the student frontier

The frontier page previously read only legacy diagnostic runs, even for a student with a granular assessment. With granular runtime enabled it now resolves the authenticated student's existing, release-pinned session first. That student receives a searchable skill map with separate evidence targets, current statuses, prerequisite links, scope limitations and the same next activities as the diagnostic results. Students without a granular session retain their older graph.

The projection never starts or resumes a session and excludes pending questions, teaching exercises and learning-check prompts. Its delivered summary is journaled under student:granular-frontier before rendering. A failed access check, session read or journal write withholds the granular page rather than silently showing older results. No completeness contract is enabled.

Validation: 381 test files / 1,691 tests passed; TypeScript passed. Nine focused tests cover read-only projection, separate modes, prerequisite identities, exclusion of an actual pending question prompt, owner-scoped selection, legacy fallback, failure behavior, uncertain/unassessed labels and exact activity links. The strengthened pending-question projection test was rerun after the full suite and passed.

Pending: deployed browser checks for search, status filtering, prerequisite navigation, mobile layout and unchanged session state. This is a browsable linked skill list, not the older force-layout visualization. The separate Progrès page still needs an audit for granular-result consistency. No public activation is claimed.
