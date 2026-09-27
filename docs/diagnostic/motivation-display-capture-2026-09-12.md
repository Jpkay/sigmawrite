# Weekly activity, recap, badges and class goal

These four home components now share their fixed wording and derived text with the server delivery projection. This includes French date descriptions, completed-goal counts, freeze messages, the three displayed skill names and overflow count, new-badge announcements, badge accessibility descriptions and class-goal messages. The assembled home response records the projection before returning to the client. The projection is absent when motivation is absent, matching the dashboard section's visibility condition.

Rendering tests compare the actual cards with the delivery text, including the complete sentence around the recap's skill names. Empty badges, missing motivation and a reached class goal are covered. TypeScript passes; 422 test files and 1,829 tests pass. An existing action assertion was updated for the additional journal field. Returned action data remains unchanged.

Not yet deployed. The separate class league still needs its displayed wording audited. Other uncovered paths and client versions prevent claiming complete material history; no capture contract is enabled. The unrelated local change admitting auto-approved reading versions is excluded from this commit.
