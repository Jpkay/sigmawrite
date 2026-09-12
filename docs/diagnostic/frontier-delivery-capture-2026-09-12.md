# Frontier delivery capture

The student frontier route loaded graph labels, evidence explanations and pathway rationales without journaling that payload. It now records the complete dynamic graph/report payload under student:frontier before returning the page. Ownership is resolved by the authenticated server boundary; pilot graph access keeps that same student scope. A journal failure withholds the page.

Three tests cover normal payload recording, capture/authentication failure, and pilot access. TypeScript passed. This records delivered dynamic content conservatively, including graph nodes the student might not open. It does not establish attention, mastery, all static UI text capture or complete historical coverage.

The current complete-history contract remains disabled. The production store still calls the ordinary presentation recorder; the covered recorder is not wired into a verified end-to-end capture contract. Raw journal delivery invalidates an active coverage epoch under the current database rules. Therefore enabling the database flag alone would not establish a working complete-history pipeline. A later contract must coordinate complete payload recording and presentation-time receipts atomically, audit all routes, and use only new baselines or justified historical backfill.

Candidate browser verification remains pending. This change does not modify the immutable revision-35 bank.
