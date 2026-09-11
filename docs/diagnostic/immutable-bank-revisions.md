# Expanding the French diagnostic without changing previous answers

The first published bank remains `french-diagnostic-bank-v3`. Later question or review revisions use a new bank key such as `french-diagnostic-bank-v3-r2`, a new unique bank version, and a new assessment release key. Published questions, answer keys, bundle checksums, and review provenance remain immutable. Correcting or reviewing content does not authorize rewriting the version a student answered.

The publication path accepts only this explicitly numbered French v3 family, still pinned to the approved French taxonomy checksum. Each new bank must pass the same exact relational question/choice checks, scoped instruction and fresh-question checks, and checksum-bound publication permission. Legacy v2 and unrelated bank keys cannot use that permission path.

`GRANULAR_DIAGNOSTIC_RELEASE_KEY` selects the default assessment release for students who have no granular session. Its fallback is `french-granular-diagnostic-v1`. Existing students resume their latest available published session and its original bundle, even when the default changes. A failed database read must fail visibly rather than silently start another assessment.

Migration `20260911095103_granular_bank_revisions.sql` was applied to production after a disposable full-schema test passed 149 application migrations. The SQL fixture publishes both the original bank and a second revision and repeats the answer-key, permission, rollback, idempotency, and approval-preservation checks for the revision. This migration does not expand the currently available question coverage or activate another assessment release.
