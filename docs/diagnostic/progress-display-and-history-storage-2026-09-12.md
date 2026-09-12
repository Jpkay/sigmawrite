# Progress display capture and repeated history text

The granular progress and frontier routes now record shared interface wording and exact generated detail strings alongside the skill map. The browser uses the same formatters for node status, prerequisite links, answer counts, coverage and activity duration. All possible filtered counts from zero through the map size are recorded conservatively; the student's search input is not recorded. This captures possible interface states, not proof that each state was read.

Recent reading sessions use a shared display projection for the heading, empty state, selected title, next-action label and percentage. Student-state delivery records this projection and returns the original state object. Granular action replies carrying student state also record it. Only selected reading titles are included, not the seed text library. The legacy progress page's other sections still require a separate display audit.

## Measured storage issue

The saved R38 QA history before its most recent presentation contains 82 rows and 4,992,953 aggregate characters, but only 90,410 distinct characters. The old reader charged repeated snapshot text against its five-million-character budget. This account had not crossed the threshold at the measured cutoff, but was close to it.

The reader now retains every source row and every fragment while sharing identical string values. Its character budget counts distinct stored text. No source references, matches, or prior deliveries are discarded. The existing row cap and unique-text cap still return incomplete on truncation; neither absence nor deduplication grants a complete-history assertion.

Verification compared the revised local reader with raw production QA rows, preserving all 82 rows and their checksum. A separate test exceeds five million aggregate characters with repeated snapshots and retains every reference; genuinely excessive distinct text still remains incomplete. This is local-code verification against saved QA data, not a new deployed baseline.

TypeScript passes. The full two-worker suite passes: 415 files, 1,814 tests. The initial run exposed four incomplete test fixtures; those now include the session arrays and map fields their corresponding production readers provide. No runtime fallback or assertion was weakened to pass them. Production remains the previously promoted source 293f49a; this batch is not deployed yet. Complete-history activation and the fresh-student recommended-learning journey remain pending.
